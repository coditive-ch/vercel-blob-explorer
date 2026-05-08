// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { FolderInfo } from './types/folder-info.type';

contextBridge.exposeInMainWorld('electronAPI', {
  onProgressUpdate: (callback: (value: number) => void) =>
    ipcRenderer.on('PROGRESS_UPDATE', (_event, value) => callback(value)),
  fileService: {
    testToken: (token: string) => ipcRenderer.invoke('FILE_SERVICE_TEST_TOKEN', token).then((res: boolean) => res),
    listFiles: (token: string, folderPath: string) =>
      ipcRenderer.invoke('FILE_SERVICE_LIST_FILES', token, folderPath).then((res: FolderInfo) => res),
    uploadFile: (token: string, folderPath: string) =>
      ipcRenderer.invoke('FILE_SERVICE_UPLOAD_FILE', token, folderPath).then(() => {}),
    uploadFolder: (token: string, folderPath: string) =>
      ipcRenderer.invoke('FILE_SERVICE_UPLOAD_FOLDER', token, folderPath).then(() => {}),
    downloadFile: (token: string, fileUrl: string) =>
      ipcRenderer.invoke('FILE_SERVICE_DOWNLOAD_FILE', token, fileUrl).then(() => {}),
    downloadFolder: (token: string, folderPath: string) =>
      ipcRenderer.invoke('FILE_SERVICE_DOWNLOAD_FOLDER', token, folderPath).then(() => {}),
    deleteFile: (token: string, filePath: string) =>
      ipcRenderer.invoke('FILE_SERVICE_DELETE_FILE', token, filePath).then(() => {}),
    deleteFolder: (token: string, folderPath: string) =>
      ipcRenderer.invoke('FILE_SERVICE_DELETE_FOLDER', token, folderPath).then(() => {}),
    createFolder: (token: string, folderPath: string) =>
      ipcRenderer.invoke('FILE_SERVICE_CREATE_FOLDER', token, folderPath).then((res) => res),
    getMetadata: (token: string, folderPath: string) =>
      ipcRenderer.invoke('FILE_SERVICE_METADATA', token, folderPath).then((res) => res),
    getStorageStats: (token: string) => ipcRenderer.invoke('FILE_SERVICE_STORAGE_STATS', token).then((res) => res),
  },
});
