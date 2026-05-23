import { FileExplorerList } from './FileExplorerList';
import { useFileStore } from '../stores/FileStore';
import { useEffect, useState } from 'react';
import { useModalStore } from '../stores/ModalStore';

// Icons
import DownloadIcon from '../assets/icons/download.svg?react';
import FileUploadIcon from '../assets/icons/file-upload.svg?react';
import FolderUploadIcon from '../assets/icons/folder-upload.svg?react';
import SearchIcon from '../assets/icons/search.svg?react';
import TrashIcon from '../assets/icons/trash.svg?react';
import ViewGridIcon from '../assets/icons/view-grid.svg?react';
import ViewListIcon from '../assets/icons/view-list.svg?react';

export function FileExplorer() {
  const fileStore = useFileStore();
  const modalStore = useModalStore();
  const [isListView, setIsListView] = useState(true);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    setSearchEnabled(false);
    setSearchValue('');
  }, [fileStore.files, fileStore.folders]);

  async function handleFileUpload() {
    fileStore.uploadFile(fileStore.folderPath);
  }

  async function handleFolderUpload() {
    fileStore.uploadFolder(fileStore.folderPath);
  }

  async function handleFolderDownload() {
    fileStore.downloadFolder(fileStore.folderPath);
  }

  function handleFolderCreate() {
    modalStore.openModal({
      title: 'Create New Folder',
      content: <div className="flex flex-col gap-4"></div>,
      onConfirm: (inputValue) => createFolder(inputValue),
      onClose: () => {},
      showInput: true,
      inputLabel: 'Folder Name',
    });
  }

  function handleDeleteFolder() {
    modalStore.openModal({
      title: `Confirm Deletion of ${fileStore.folderPath} and all files and subfolders?`,
      content: <div className="flex flex-col gap-4"></div>,
      onConfirm: () => fileStore.deleteFolder(fileStore.folderPath),
      onClose: () => {},
      showInput: false,
      inputLabel: '',
    });
  }

  function createFolder(folderName?: string) {
    if (folderName && folderName.trim() !== '' && !folderName.includes('/')) {
      fileStore.createFolder(folderName);
    }
  }

  return (
    <div className="text-brand-dark-blue flex h-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
      <div className="flex flex-row">
        <div className="flex grow flex-row-reverse gap-2 border-r-2 border-slate-200 px-4 py-2">
          <ExplorerButton clickHandler={() => setSearchEnabled(!searchEnabled)} icon={SearchIcon} />
          {searchEnabled && (
            <input
              type="text"
              id="Search"
              className="focus:outline-brand-light-blue text-brand-dark-blue h-12 w-full rounded-lg border-2 border-slate-200 p-2 text-lg shadow"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          )}
        </div>
        <div className="flex flex-row gap-4 border-r-2 border-slate-200 px-4 py-2">
          <ExplorerButton clickHandler={handleFolderDownload} icon={DownloadIcon} />
          {fileStore.folderPath !== '' && <ExplorerButton clickHandler={handleDeleteFolder} icon={TrashIcon} />}
        </div>
        <div className="flex flex-row gap-4 border-r-2 border-slate-200 px-4 py-2">
          <button
            className={`flex cursor-pointer flex-row items-center justify-center gap-2 rounded-lg border-2 ${isListView ? 'border-brand-dark-blue text-brand-dark-blue' : 'border-slate-200 text-slate-400'} bg-white px-2 shadow hover:brightness-90`}
            onClick={() => setIsListView(true)}>
            <ViewListIcon className="mx-2 size-8" />
          </button>
          <button
            className={`flex cursor-pointer flex-row items-center justify-center gap-2 rounded-lg border-2 ${!isListView ? 'border-brand-dark-blue text-brand-dark-blue' : 'border-slate-200 text-slate-400'} bg-white px-2 shadow hover:brightness-90`}
            onClick={() => setIsListView(false)}>
            <ViewGridIcon className="mx-2 size-8" />
          </button>
        </div>
        <div className="flex flex-row gap-4 px-4 py-2">
          <ExplorerButton clickHandler={handleFolderCreate} label="+ New Folder" />
          <ExplorerButton clickHandler={handleFileUpload} icon={FileUploadIcon} isWhite={false} />
          <ExplorerButton clickHandler={handleFolderUpload} icon={FolderUploadIcon} isWhite={false} />
        </div>
      </div>
      <FileExplorerList isList={isListView} searchValue={searchValue} />
    </div>
  );
}

function ExplorerButton({
  clickHandler,
  icon: Icon,
  label,
  isWhite = true,
}: {
  clickHandler: () => void;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  label?: string;
  isWhite?: boolean;
}) {
  return (
    <button
      className={`flex cursor-pointer flex-row items-center justify-center gap-2 rounded-lg p-2 px-3 shadow hover:brightness-90 ${isWhite ? 'text-brand-dark-blue border border-slate-200 bg-white' : 'bg-brand-dark-blue text-white'}`}
      onClick={clickHandler}>
      {Icon && <Icon className="mx-2 size-6" />}
      {label && <span className="mx-2 text-lg font-semibold uppercase">{label}</span>}
    </button>
  );
}
