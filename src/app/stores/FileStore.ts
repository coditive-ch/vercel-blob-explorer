import { create } from 'zustand/react';
import { persist } from 'zustand/middleware';
import { FolderInfo } from '../../types/folder-info.type';
import { FileItem } from '../../types/file-item.type';
import { FolderItem } from '../../types/folder-item.type';

interface FileStore {
  isLoading: boolean;
  folders: FolderInfo[];
  files: FileItem[];
  detailViewItem: FileItem | null;
  folderPath: string;
  token: string;
  testToken: (token: string) => Promise<boolean>;
  setToken: (token: string) => void;
  setFolderPath: (folderPath: string) => void;
  setDetailViewItem: (item: FileItem | null) => void;
  listFiles: () => Promise<void>;
  uploadFile: (folderPath: string) => Promise<void>;
  uploadFolder: (folderPath: string) => Promise<void>;
  downloadFile: (fileUrl: string) => Promise<void>;
  downloadFolder: (folderPath: string) => Promise<void>;
  createFolder: (folderName: string) => Promise<FolderInfo | null>;
  deleteFile: (filePath: string) => Promise<void>;
  deleteFolder: (folderPath: string) => Promise<void>;
  getMetadata: (fileName: string) => Promise<FileItem | null>;
  getStorageStats: () => Promise<{ filesCount: number; totalSize: string }>;
  reset: () => void;
}

const initialState = {
  isLoading: false,
  folders: [] as FolderInfo[],
  files: [] as FileItem[],
  folderPath: '',
  token: '',
  detailViewItem: null,
};

export const useFileStore = create<FileStore>()(
  persist(
    (set, get) => ({
      // State
      ...initialState,

      // Actions
      testToken: async (token: string) => window.electronAPI.fileService.testToken(token),
      setToken: (token: string) => set(() => ({ token })),
      setFolderPath: (folderPath: string) => set(() => ({ folderPath })),
      setDetailViewItem: (item: FileItem | null) => set(() => ({ detailViewItem: item })),
      listFiles: async () => {
        set(() => ({ isLoading: true }));
        const res: FolderItem = await window.electronAPI.fileService.listFiles(get().token, get().folderPath);
        set(() => ({ folders: res.folders || [], files: res.files || [], isLoading: false }));
      },
      uploadFile: async (folderPath: string) => {
        set(() => ({ isLoading: true }));
        await window.electronAPI.fileService.uploadFile(get().token, folderPath);

        // Refresh the file list if the uploaded file is in the current folder
        if (folderPath == get().folderPath) {
          get().listFiles();
        } else {
          set(() => ({ isLoading: false }));
        }
      },
      uploadFolder: async (folderPath: string) => {
        set(() => ({ isLoading: true }));
        await window.electronAPI.fileService.uploadFolder(get().token, folderPath);

        // Refresh the file list if the uploaded file is in the current folder
        if (folderPath == get().folderPath) {
          get().listFiles();
        } else {
          set(() => ({ isLoading: false }));
        }
      },
      downloadFile: async (fileUrl: string) => {
        set(() => ({ isLoading: true }));
        await window.electronAPI.fileService.downloadFile(get().token, fileUrl);
        set(() => ({ isLoading: false }));
      },
      downloadFolder: async (folderPath: string) => {
        set(() => ({ isLoading: true }));
        await window.electronAPI.fileService.downloadFolder(get().token, folderPath);
        set(() => ({ isLoading: false }));
      },
      createFolder: async (folderName: string) => {
        set(() => ({ isLoading: true }));
        const token = get().token;
        const folderPathItems = get().folderPath.split('/');
        folderPathItems.push(folderName);
        const pathName = folderPathItems.filter((item) => item.trim() !== '').join('/') + '/';
        console.log('Creating folder with path:', pathName);
        const res = await window.electronAPI.fileService.createFolder(token, pathName);
        get().listFiles();

        return res;
      },
      deleteFile: async (filePath: string) => {
        set(() => ({ isLoading: true }));
        await window.electronAPI.fileService.deleteFile(get().token, filePath);

        // Remove the deleted file from the current list without refetching
        const currentFiles = get().files;
        if (currentFiles.some((file) => file.pathname === filePath)) {
          const updatedFiles = currentFiles.filter((file) => file.pathname !== filePath);
          set(() => ({ files: updatedFiles }));
        }
        set(() => ({ isLoading: false }));
      },
      deleteFolder: async (folderPath: string) => {
        set(() => ({ isLoading: true }));

        if (folderPath === '') {
          console.warn('Cannot delete root folder');
          set(() => ({ isLoading: false }));
          return;
        }

        await window.electronAPI.fileService.deleteFolder(get().token, folderPath);

        // After deletion, navigate to the parent folder and refresh the file list
        const parentFolderPath = folderPath.split('/').slice(0, -1).join('/') || '';
        set(() => ({ folderPath: parentFolderPath }));
        get().listFiles();
      },
      getMetadata: async (filePath: string) => {
        set(() => ({ isLoading: true }));
        const res = await window.electronAPI.fileService.getMetadata(get().token, filePath);
        set(() => ({ isLoading: false }));
        return res;
      },
      getStorageStats: async () => {
        set(() => ({ isLoading: true }));
        const res = await window.electronAPI.fileService.getStorageStats(get().token);
        set(() => ({ isLoading: false }));
        return res;
      },
      reset: () => set(() => initialState),
    }),
    { name: 'file-store-storage' }, // localStorage key
  ),
);
