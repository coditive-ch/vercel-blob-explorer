import { FileItem } from './file-item.type';
import { FolderInfo } from './folder-info.type';

export type FolderItem = {
  folders: FolderInfo[];
  files: FileItem[];
};
