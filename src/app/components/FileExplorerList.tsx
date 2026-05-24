import { FolderInfo } from '../../types/folder-info.type';
import { useFileStore } from '../stores/FileStore';
import { useModalStore } from '../stores/ModalStore';
import { FileItem } from '../../types/file-item.type';
import { useEffect, useState } from 'react';

// Icons
import DownloadIcon from '../assets/icons/download.svg?react';
import FileAudioIcon from '../assets/icons/file-audio.svg?react';
import FileConfigIcon from '../assets/icons/file-config.svg?react';
import FileDocumentIcon from '../assets/icons/file-document.svg?react';
import FileImageIcon from '../assets/icons/file-image.svg?react';
import FileUnknownIcon from '../assets/icons/file-unknown.svg?react';
import FileVideoIcon from '../assets/icons/file-video.svg?react';
import FolderIcon from '../assets/icons/folder.svg?react';
import TrashIcon from '../assets/icons/trash.svg?react';

export function FileExplorerList({ isList, searchValue }: { isList: boolean; searchValue: string }) {
  const fileStore = useFileStore();
  const modalStore = useModalStore();

  const [filteredFiles, setFilteredFiles] = useState(fileStore.files);
  const [filteredFolders, setFilteredFolders] = useState(fileStore.folders);

  useEffect(() => {
    if (searchValue.trim() === '') {
      setFilteredFiles(fileStore.files);
      setFilteredFolders(fileStore.folders);
    } else {
      const lowerSearch = searchValue.toLowerCase() || '';
      setFilteredFiles(fileStore.files.filter((file) => file.fileName.toLowerCase().includes(lowerSearch)));
      setFilteredFolders(fileStore.folders.filter((folder) => folder.name.toLowerCase().includes(lowerSearch)));
    }
  }, [searchValue, fileStore.files, fileStore.folders]);

  function handleFolderClick(folder: FolderInfo) {
    fileStore.setFolderPath(folder.path);
    fileStore.listFiles();
  }

  function getDate(date: Date) {
    if (!date || !(date instanceof Date)) return '';
    return date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }) || '';
  }

  function handleDeleteFile(file: FileItem) {
    modalStore.openModal({
      title: `Confirm Deletion of ${file.fileName}?`,
      content: '',
      onConfirm: () => fileStore.deleteFile(file.pathname),
      onClose: () => {},
      showInput: false,
      inputLabel: '',
    });
  }

  function handleDeleteFolder(folder: FolderInfo) {
    modalStore.openModal({
      title: `Confirm Deletion of ${folder.name}?`,
      content: '',
      onConfirm: () => fileStore.deleteFolder(folder.path),
      onClose: () => {},
      showInput: false,
      inputLabel: '',
    });
  }

  function handleDownloadFile(fileUrl: string) {
    fileStore.downloadFile(fileUrl);
  }

  function handleDownloadFolder(folderPath: string) {
    fileStore.downloadFolder(folderPath);
  }

  function getIconForFileType(fileType: string, large: boolean) {
    const configTypes = ['application/json', 'application/yaml', 'application/xml'];
    const iconSizeClass = large ? 'size-28' : 'size-8';

    if (fileType.startsWith('image/')) return <FileImageIcon className={iconSizeClass} />;
    if (fileType.startsWith('audio/')) return <FileAudioIcon className={iconSizeClass} />;
    if (fileType.startsWith('video/')) return <FileVideoIcon className={iconSizeClass} />;
    if (configTypes.includes(fileType) || fileType.startsWith('text/'))
      return <FileConfigIcon className={iconSizeClass} />;
    if (fileType.startsWith('application/')) return <FileDocumentIcon className={iconSizeClass} />;

    // If Unknown file type, show generic file icon
    return <FileUnknownIcon className={iconSizeClass} />;
  }

  if (isList) {
    return (
      <div className="overflow-x-hide max-h-[calc(100vh-380px)] overflow-y-auto">
        <table className="min-w-full divide-y-2 divide-gray-200">
          <thead className="sticky top-0 bg-white ltr:text-left rtl:text-right">
            <tr className="*:font-medium *:text-gray-300">
              <th className="px-3 py-2 whitespace-nowrap uppercase">Preview</th>
              <th className="px-3 py-2 whitespace-nowrap uppercase">Name</th>
              <th className="px-3 py-2 whitespace-nowrap uppercase">Type</th>
              <th className="px-3 py-2 whitespace-nowrap uppercase">Size</th>
              <th className="px-3 py-2 whitespace-nowrap uppercase">Modified</th>
              <th className="px-3 py-2 whitespace-nowrap uppercase">Actions</th>
            </tr>
          </thead>

          <tbody className="w-full divide-y divide-gray-200">
            {filteredFolders.map((folder) => (
              <tr key={folder.path} className="font-semibold even:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap">
                  <FolderIcon className="size-8" />
                </td>
                <td className="cursor-pointer px-3 py-2 whitespace-nowrap" onClick={() => handleFolderClick(folder)}>
                  {folder.name}
                </td>
                <td className="px-3 py-2 whitespace-nowrap"></td>
                <td className="px-3 py-2 whitespace-nowrap"></td>
                <td className="px-3 py-2 whitespace-nowrap"></td>
                <td className="flex flex-row gap-4 px-3 py-2 whitespace-nowrap">
                  <TrashIcon
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder);
                    }}
                  />
                  <DownloadIcon
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadFolder(folder.path);
                    }}
                  />
                </td>
              </tr>
            ))}
            {filteredFiles.map((file) => (
              <tr key={file.pathname} className="font-semibold even:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap">{getIconForFileType(file.contentType, false)}</td>
                <td
                  className="cursor-pointer overflow-hidden px-3 py-2 whitespace-nowrap"
                  onClick={() => fileStore.setDetailViewItem(file)}>
                  {file.fileName}
                </td>
                <td className="px-3 py-2 whitespace-nowrap uppercase">{file.contentType}</td>
                <td className="px-3 py-2 whitespace-nowrap">{file.sizeFormatted}</td>
                <td className="px-3 py-2 whitespace-nowrap">{getDate(file.uploadedAt)}</td>
                <td className="flex flex-row gap-4 px-3 py-2 whitespace-nowrap">
                  <TrashIcon
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file);
                    }}
                  />
                  <DownloadIcon
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadFile(file.url);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } else {
    return (
      <div className="overflow-x-hide grid max-h-[calc(100vh-380px)] grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4 overflow-y-auto">
        {filteredFolders.map((folder) => (
          <div
            key={folder.path}
            className="flex size-48 cursor-pointer flex-col items-center justify-between gap-2 rounded border-2 border-slate-200 bg-white p-4 shadow hover:brightness-90"
            onClick={() => handleFolderClick(folder)}>
            <FolderIcon className="size-28" />
            <span className="max-w-42 text-center text-sm wrap-break-word">{folder.name}</span>
          </div>
        ))}
        {filteredFiles.map((file) => (
          <div
            key={file.pathname}
            className="flex size-48 cursor-pointer flex-col items-center justify-between gap-2 rounded border-2 border-slate-200 bg-white p-4 shadow hover:brightness-90"
            onClick={() => fileStore.setDetailViewItem(file)}>
            {getIconForFileType(file.contentType, true)}
            <span className="max-w-42 text-center text-sm wrap-break-word">{file.fileName}</span>
          </div>
        ))}
      </div>
    );
  }
}
