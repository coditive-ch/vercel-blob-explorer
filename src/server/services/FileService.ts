import {
  del,
  get,
  GetBlobResult,
  head,
  list,
  ListBlobResult,
  ListBlobResultBlob,
  ListFoldedBlobResult,
  put,
} from '@vercel/blob';
import mime from 'mime';
import axios from 'axios';
import Stream from 'node:stream';
import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import { FolderInfo } from '../../types/folder-info.type';
import { FileItem } from '../../types/file-item.type';
import { FolderItem } from '../../types/folder-item.type';
import path from 'node:path';
import { mkdir, stat } from 'node:fs/promises';
import log from 'electron-log/main';

export class FileService {
  static async testToken(token: string): Promise<boolean> {
    try {
      await list({ limit: 1, token: token });
      return true;
    } catch {
      return false;
    }
  }

  async listFiles(token = '', folderPath = '', foldedMode: boolean = true): Promise<FolderItem> {
    let mappedFolders: FolderInfo[] = [];
    let filesList: ListBlobResultBlob[];

    if (foldedMode) {
      const res: ListFoldedBlobResult = await list({ mode: 'folded', prefix: folderPath, token });

      // Map folders and files to a unified structure
      mappedFolders = res.folders.map((folder: string) => FileService.mapFolderResult(folder)) || [];

      // Remove folders from files list in folded mode, as they are returned separately
      filesList = res.blobs.filter((blob) => !blob.pathname.endsWith('/')) || [];
    } else {
      const res: ListBlobResult = await list({ mode: 'expanded', prefix: folderPath, token });

      // Remove folders from files list, as we only want a list of files
      filesList = res.blobs.filter((blob) => !blob.pathname.endsWith('/')) || [];
    }

    // Map Files to custom structure
    const mappedFiles: FileItem[] = filesList.map((file) => ({
      url: file.url,
      downloadUrl: file.downloadUrl,
      pathname: file.pathname,
      fileName: path.basename(file.pathname),
      size: file.size,
      sizeFormatted: FileService.convertBytes(file.size),
      uploadedAt: file.uploadedAt,
      contentType: mime.getType(file.pathname) || 'Unknown',
    }));

    return { folders: mappedFolders, files: mappedFiles };
  }

  async uploadFile(
    token: string,
    uploadFolder: string,
    localFilePath: string,
    progressFN: (percentage: number, fileSize: number, uploadedSize: number) => void,
  ): Promise<FileItem> {
    // Combine FileName with FolderPath of blob storage to create the full path for the uploaded file.
    // Normalize to POSIX-style paths so uploads work correctly across OSes (Windows uses backslashes).
    const fileName = path.basename(localFilePath);
    const normalizedUploadFolder = uploadFolder ? uploadFolder.replace(/\\/g, '/').replace(/\/+$/, '') : '';
    const filePath = path.posix.join(normalizedUploadFolder, fileName);
    const fileStats = await stat(localFilePath);
    const fileSize = fileStats.size;
    let downloadedPercentage = 0;

    // Create a read stream from the local file and upload it to the blob storage
    // Using streams allows us to handle large files efficiently without loading the entire file into memory
    const fileReader = createReadStream(localFilePath);

    log.info('Starting File Upload into blob storage', { filePath, fileSize });

    // Upload the file stream to the blob storage with @vercel/blob
    const res = await put(filePath, fileReader, {
      access: 'public',
      token,
      multipart: true,
      allowOverwrite: true,
      onUploadProgress: (progress) => {
        const percentage = Math.round((progress.loaded / fileSize) * 100);

        // Update progress only if percentage has changed
        if (percentage !== downloadedPercentage) {
          downloadedPercentage = percentage;
          progressFN(percentage, fileSize, progress.loaded);
        }
      },
    });

    // Map the response to custom FileItem structure
    const mappedFile: FileItem = {
      url: res.url,
      downloadUrl: res.downloadUrl,
      pathname: res.pathname,
      fileName: path.basename(res.pathname),
      size: fileSize,
      sizeFormatted: FileService.convertBytes(fileSize),
      uploadedAt: new Date(),
      contentType: res.contentType,
    };

    return mappedFile;
  }

  async uploadFolder(
    token: string,
    filesWithPath: { remoteFolderPath: string; localFilePath: string; size: number }[],
    progressFN: (percentage: number, totalSize: number, downloadedSize: number) => void,
  ): Promise<void> {
    const totalSize = filesWithPath.reduce((acc, file) => acc + file.size, 0);
    let totalUploadedSize = 0;
    let uploadPercentage = 0;

    for (const uploadFile of filesWithPath) {
      await this.uploadFile(
        token,
        uploadFile.remoteFolderPath,
        uploadFile.localFilePath,
        (progress, fileSize, uploadedSize) => {
          const totalPercentage = Math.round(((totalUploadedSize + uploadedSize) / (totalSize || 1)) * 100);

          // Update progress only if percentage has changed
          if (totalPercentage !== uploadPercentage) {
            uploadPercentage = totalPercentage;
            progressFN(totalPercentage, totalSize, totalUploadedSize + uploadedSize);
          }
        },
      );
      // After upload completion, update total uploaded size
      totalUploadedSize += uploadFile.size;
    }
  }

  async createFolder(token: string, pathname: string): Promise<FolderInfo | null> {
    try {
      // Normalize to POSIX and ensure trailing slash to represent a folder in blob storage
      const normalizedPath = (pathname || '').replace(/\\/g, '/').replace(/\/+$/, '') + '/';
      await put(normalizedPath, new Blob([], { type: 'application/octet-stream' }), { access: 'public', token });
      return {
        name:
          normalizedPath
            .split('/')
            .filter((part) => part !== '')
            .pop() ?? '',
        path: normalizedPath,
      };
    } catch (error) {
      log.error(`Failed to create folder at ${pathname}:`, error);
      throw new Error(`Failed to create folder: ${(error as Error).message}`, { cause: error });
    }
  }

  async getFile(token: string, pathname: string): Promise<GetBlobResult | null> {
    const res = await get(pathname, { access: 'public', token });
    return res;
  }

  async downloadFile(
    token: string,
    url: string,
    savePath: string,
    progressFN: (percentage: number, fileSize: number, downloadedSize: number) => void,
  ): Promise<void> {
    const fileData = await head(url, { token });
    const saveDir = path.dirname(savePath);

    let downloadedSize = 0;
    let downloadedPercentage = 0;

    const fileResponse = await axios.get<Stream>(url, {
      responseType: 'stream',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fileResponse.data.on('data', (chunk) => {
      downloadedSize += chunk.length;
      const percentage = Math.round((downloadedSize / (fileData.size || 1)) * 100);

      // Update progress only if percentage has changed
      if (percentage !== downloadedPercentage) {
        downloadedPercentage = percentage;
        progressFN(percentage, fileData.size || 0, downloadedSize);
      }
    });

    if (fileResponse.status !== 200) {
      log.error(`Failed to fetch file from ${url}:`, fileResponse.statusText);
      throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
    }

    if (!existsSync(saveDir)) {
      log.info(`Creating directory for file download at ${saveDir}`);
      await mkdir(saveDir, { recursive: true });
    }

    const fileWriter = createWriteStream(savePath);

    fileResponse.data.pipe(fileWriter);

    await new Promise((resolve, reject) => {
      fileWriter.on('finish', resolve);
      fileWriter.on('error', reject);
    });
  }

  async downloadFolder(
    token: string,
    folderPath: string,
    savePath: string,
    progressFN: (percentage: number, totalSize: number, downloadedSize: number) => void,
  ): Promise<void> {
    // Get all files in the folder (including subfolders) using listFiles with expanded mode
    const folderData = await this.listFiles(token, folderPath, false);

    // Create a flat list of all files with their download URLs and paths
    const filesWithPath: { downloadUrl: string; fileName: string; savePath: string; size: number }[] =
      folderData.files.map((file) => ({
        downloadUrl: file.url,
        fileName: path.basename(file.pathname),
        savePath: path.join(savePath, file.pathname.replace(folderPath, '')), // Preserve folder structure in save path
        size: file.size,
      }));

    const folderSize = filesWithPath.reduce((acc, file) => acc + file.size, 0);
    let totalDownloadedSize = 0;
    let downloadedPercentage = 0;

    for (const file of filesWithPath) {
      await this.downloadFile(token, file.downloadUrl, file.savePath, (progress, fileSize, downloadedSize) => {
        const totalPercentage = Math.round(((totalDownloadedSize + downloadedSize) / (folderSize || 1)) * 100);

        // Update progress only if percentage has changed
        if (totalPercentage !== downloadedPercentage) {
          downloadedPercentage = totalPercentage;
          progressFN(totalPercentage, folderSize, totalDownloadedSize + downloadedSize);
        }
      });
      // After download completion, update total downloaded size
      totalDownloadedSize += file.size;
    }
  }

  async deleteFile(token: string, pathname: string): Promise<void> {
    await del(pathname, { token });
  }

  async deleteFolder(token: string, folderPath: string): Promise<void> {
    if (folderPath === '') {
      log.warn('Cannot delete root folder');
      return;
    }

    // List all files in the folder (including subfolders) using listFiles with expanded mode
    const folderData = await this.listFiles(token, folderPath, false);

    // Delete each file in the folder
    for (const file of folderData.files) {
      await del(file.pathname, { token });
    }
  }

  async getMetadata(token: string, folderName: string): Promise<FileItem> {
    const res = await head(folderName, { token });

    const metaResult = {
      url: res.url,
      downloadUrl: res.downloadUrl,
      pathname: res.pathname,
      fileName: path.basename(res.pathname),
      size: res.size,
      sizeFormatted: FileService.convertBytes(res.size),
      uploadedAt: res.uploadedAt,
      contentType: res.contentType,
    } as FileItem;

    return metaResult;
  }

  async getStorageStats(token?: string): Promise<{ filesCount: number; totalSize: string }> {
    // If no token provided and no environment token is configured, return empty stats
    const effectiveToken = token && token.length > 0 ? token : process.env.BLOB_READ_WRITE_TOKEN;
    if (!effectiveToken) {
      return {
        filesCount: 0,
        totalSize: FileService.convertBytes(0),
      };
    }

    const resultList: ListBlobResult = await list({ mode: 'expanded', prefix: '', token: effectiveToken });

    const files = resultList.blobs.filter((blob) => !blob.pathname.endsWith('/')) || [];
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    const totalSizeFormatted = FileService.convertBytes(totalSize);

    return {
      filesCount: files.length,
      totalSize: totalSizeFormatted,
    };
  }

  private static convertBytes(bytes: number) {
    const SIZE_UNITS_DECIMAL = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const exponent = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1000));
    const value = (bytes / 1000 ** exponent).toFixed(2);
    const unit = SIZE_UNITS_DECIMAL[exponent];

    return `${value} ${unit}`;
  }

  private static mapFolderResult(folder: string): FolderInfo {
    let folderParts = folder.split('/');
    folderParts = folderParts.filter((part) => part !== '');
    const topLevelFolder = folderParts.pop() ?? '';
    return { name: topLevelFolder, path: folder };
  }
}
