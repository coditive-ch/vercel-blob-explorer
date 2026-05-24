import { FolderInfo } from './types/folder-info.type';
import { FolderItem } from './types/folder-item.type';

export interface IElectronAPI {
  onProgressUpdate: (callback: (value: number) => void) => void;
  fileService: IFileService;
}

export interface IFileService {
  testToken: (token: string) => Promise<boolean>;
  listFiles: (token: string, folderPath: string) => Promise<FolderItem>;
  uploadFile: (token: string, folderPath: string) => Promise<void>;
  uploadFolder: (token: string, folderPath: string) => Promise<void>;
  downloadFile: (token: string, fileUrl: string) => Promise<void>;
  downloadFolder: (token: string, folderPath: string) => Promise<void>;
  deleteFile: (token: string, filePath: string) => Promise<void>;
  deleteFolder: (token: string, folderPath: string) => Promise<void>;
  createFolder: (token: string, folderPath: string) => Promise<FolderInfo | null>;
  getMetadata: (token: string, folderPath: string) => Promise<FileItem | null>;
  getStorageStats: (token: string) => Promise<{ filesCount: number; totalSize: string }>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
