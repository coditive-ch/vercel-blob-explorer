import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import { existsSync, realpathSync } from 'node:fs';
import { FileService } from './server/services/FileService';
import log from 'electron-log/main';
import AdmZip from 'adm-zip';
import { tmpdir } from 'node:os';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

log.initialize();
let mainWindow: BrowserWindow;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window hidden to avoid flicker.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    titleBarStyle: 'default',
    ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Maximize and show once renderer is ready
  mainWindow.once('ready-to-show', () => {
    try {
      mainWindow.maximize();
    } catch {
      // ignore if maximize fails on some platforms
    }
    mainWindow.show();
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  ipcMain.handle('FILE_SERVICE_TEST_TOKEN', (event, token) => FileService.testToken(token));
  ipcMain.handle('FILE_SERVICE_LIST_FILES', (event, token, folderPath) =>
    new FileService().listFiles(token, folderPath),
  );
  ipcMain.handle('FILE_SERVICE_UPLOAD_FILE', (event, token, folderPath) =>
    handleFileServiceFileUpload(token, folderPath),
  );
  ipcMain.handle('FILE_SERVICE_UPLOAD_FOLDER', (event, token, folderPath) =>
    handleFileServiceFolderUpload(token, folderPath),
  );
  ipcMain.handle('FILE_SERVICE_DOWNLOAD_FILE', (event, token, fileUrl) =>
    handleFileServiceFileDownload(token, fileUrl),
  );
  ipcMain.handle('FILE_SERVICE_DOWNLOAD_FOLDER', (event, token, folderPath) =>
    handleFileServiceFolderDownload(token, folderPath),
  );
  ipcMain.handle('FILE_SERVICE_DELETE_FILE', (event, token, filePath) => new FileService().deleteFile(token, filePath));
  ipcMain.handle('FILE_SERVICE_DELETE_FOLDER', (event, token, folderPath) =>
    new FileService().deleteFolder(token, folderPath),
  );
  ipcMain.handle('FILE_SERVICE_CREATE_FOLDER', (event, token, folderPath) =>
    new FileService().createFolder(token, folderPath),
  );
  ipcMain.handle('FILE_SERVICE_METADATA', (event, token, folderPath) =>
    new FileService().getMetadata(token, folderPath),
  );
  ipcMain.handle('FILE_SERVICE_STORAGE_STATS', (event, token) => new FileService().getStorageStats(token));

  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

async function handleFileServiceFileUpload(token: string, folderPath: string) {
  const fileService = new FileService();

  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
    });

    filePaths.forEach((filePath) => log.info(`Selected file: ${filePath}`));

    if (!canceled) {
      const filesWithPath: { localFilePath: string; size: number }[] = [];

      // Get all selected files with their sizes
      for (const filePath of filePaths) {
        if (existsSync(filePath)) {
          const filePathStats = await stat(filePath);
          filesWithPath.push({
            localFilePath: filePath,
            size: filePathStats.size,
          });
        } else {
          log.warn(`File does not exist: ${filePath}`);
        }
      }

      const totalSize = filesWithPath.reduce((acc, file) => acc + file.size, 0);
      let totalUploadedSize = 0;
      let uploadPercentage = 0;

      // Progress function to track upload progress across multiple files
      const progressUpdate = (percentage: number, fileSize: number, uploadedSize: number) => {
        const totalPercentage = Math.round(((totalUploadedSize + uploadedSize) / (totalSize || 1)) * 100);
        log.info(`File Upload Progress: ${totalPercentage}% (${totalUploadedSize + uploadedSize} of ${totalSize})`);

        // Update progress only if percentage has changed
        if (totalPercentage !== uploadPercentage) {
          uploadPercentage = totalPercentage;
          mainWindow.setProgressBar(totalPercentage / 100);
          mainWindow.webContents.send('PROGRESS_UPDATE', totalPercentage);
        }
      };

      for (const uploadFile of filesWithPath) {
        await fileService.uploadFile(token, folderPath, uploadFile.localFilePath, progressUpdate);
        totalUploadedSize += uploadFile.size;
      }
    }
  } catch (error) {
    log.error('Error uploading file:', error);
    throw new Error('Failed to upload file', { cause: error });
  } finally {
    // Clear progress bar in case of error
    mainWindow.setProgressBar(-1);
    mainWindow.webContents.send('PROGRESS_UPDATE', 0);
  }
}

async function handleFileServiceFolderUpload(token: string, folderPath: string) {
  const fileService = new FileService();

  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });

    if (!canceled && existsSync(filePaths[0])) {
      const filesWithPath: { remoteFolderPath: string; localFilePath: string; size: number }[] = [];

      // Recursively gather all files from the selected folder, including subdirectories
      log.info(`Selected folder for upload: ${filePaths[0]}`);

      const subDirFiles = await readdir(filePaths[0], { recursive: true });

      for (const subFile of subDirFiles) {
        const subFilePath = path.join(filePaths[0], subFile);
        const subFileStats = await stat(subFilePath);

        if (subFileStats.isFile()) {
          filesWithPath.push({
            remoteFolderPath: path.join(
              folderPath,
              filePaths[0].split('/').pop() || '',
              subFilePath.replace(filePaths[0], ''),
            ),
            localFilePath: subFilePath,
            size: subFileStats.size,
          });
        }
      }

      const progressUpdate = (percentage: number, totalSize: number, uploadedSize: number) => {
        log.info(`Folder Upload Progress: ${percentage}% (${uploadedSize} of ${totalSize})`);
        mainWindow.setProgressBar(percentage / 100);
        mainWindow.webContents.send('PROGRESS_UPDATE', percentage);
      };

      await fileService.uploadFolder(token, filesWithPath, progressUpdate);
      log.info(`Folder uploaded successfully to ${folderPath}`);
    }
  } catch (error) {
    log.error('Error uploading folder:', error);
    throw new Error('Failed to upload folder', { cause: error });
  } finally {
    // Clear progress bar in case of error
    mainWindow.setProgressBar(-1);
    mainWindow.webContents.send('PROGRESS_UPDATE', 0);
  }
}

async function handleFileServiceFileDownload(token: string, fileUrl: string) {
  const fileService = new FileService();

  try {
    const fileName = path.basename(fileUrl);
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: fileName,
    });

    if (!canceled && filePath) {
      const progressUpdate = (percentage: number, totalSize: number, downloadedSize: number) => {
        log.info(`File Download Progress: ${percentage}% (${downloadedSize} of ${totalSize})`);
        mainWindow.setProgressBar(percentage / 100);
        mainWindow.webContents.send('PROGRESS_UPDATE', percentage);
      };
      await fileService.downloadFile(token, fileUrl, filePath, progressUpdate);
      log.info(`File downloaded successfully to ${filePath}`);
    }
  } catch (error) {
    log.error('Error downloading file:', error);
  } finally {
    // Clear progress bar in case of error
    mainWindow.setProgressBar(-1);
    mainWindow.webContents.send('PROGRESS_UPDATE', 0);
  }
}

async function handleFileServiceFolderDownload(token: string, folderPath: string) {
  const fileService = new FileService();

  // Determine the top-level folder name for the downloaded content
  let folderParts = folderPath.split('/');
  folderParts = folderParts.filter((part) => part !== '');
  const topLevelFolder = folderParts.pop() ?? 'root';

  // Create temporary folder
  const tmpFolder = path.join(realpathSync(tmpdir()), `tmp-vercel-blob-explorer-${Date.now()}`);
  await mkdir(tmpFolder);

  try {
    const progressUpdate = (percentage: number, totalSize: number, downloadedSize: number) => {
      log.info(`Folder Download Progress: ${percentage}% (${downloadedSize} of ${totalSize})`);
      mainWindow.setProgressBar(percentage / 100);
      mainWindow.webContents.send('PROGRESS_UPDATE', percentage);
    };

    await fileService.downloadFolder(token, folderPath, path.join(tmpFolder, topLevelFolder), progressUpdate);
    log.info(`Folder downloaded successfully to ${tmpFolder}`);

    // Zip file Name
    const fileName = `${topLevelFolder}-vbe-${Date.now()}.zip`;

    // Select Download Location
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: fileName,
    });

    if (!canceled && filePath) {
      // Create a zip file from the downloaded folder
      const zipFile = new AdmZip();
      zipFile.addLocalFolder(tmpFolder);
      await zipFile.writeZip(filePath);
      log.info(`Folder zipped successfully to ${filePath}`);
    }
  } catch (error) {
    log.error('Error downloading folder:', error);
  } finally {
    await rm(tmpFolder, { recursive: true, force: true });

    // Clear progress bar after upload is complete
    mainWindow.setProgressBar(-1);
    mainWindow.webContents.send('PROGRESS_UPDATE', 0);
  }
}
