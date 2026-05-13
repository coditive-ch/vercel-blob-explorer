import { useEffect, useState } from 'react';
import FolderIcon from '../assets/icons/folder.svg?react';
import FilesIcon from '../assets/icons/files.svg?react';
import { FileExplorer } from '../components/FileExplorer';
import { useFileStore } from '../stores/FileStore';
import { DetailView } from '../components/DetailView';

export function Bucket() {
  const fileStore = useFileStore();

  const [storageStats, setStorageStats] = useState({ filesCount: 0, totalSize: '0 B' });

  async function fetchStorageStats() {
    const stats = await fileStore.getStorageStats();
    setStorageStats(stats);
  }

  useEffect(() => {
    fetchStorageStats();
  }, []);

  function getBreadcrumb() {
    const paths = fileStore.folderPath.split('/').filter((path) => path);
    const breadcrumbs = [
      { name: 'Root', path: '' },
      ...paths.map((path, index) => ({ name: path, path: paths.slice(0, index + 1).join('/') + '/' })),
    ];

    return (
      <div className="flex flex-row items-center gap-2 text-lg whitespace-nowrap text-slate-400">
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.path}>
            <span
              className={`cursor-pointer uppercase ${index === breadcrumbs.length - 1 ? 'text-brand-dark-blue underline underline-offset-4' : ''}`}
              onClick={() => {
                fileStore.setFolderPath(crumb.path);
                fileStore.listFiles();
              }}>
              {crumb.name}
            </span>
            {index < breadcrumbs.length - 1 && <span> &gt; </span>}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex w-[calc(100vw-9rem)] flex-col gap-4 p-14">
      <div className="flex flex-row gap-6">
        <div className="flex grow flex-col justify-between">
          <h1 className="text-brand-dark-blue text-4xl uppercase">Buckets</h1>
          <div className="flex flex-row gap-2 overflow-x-hidden">
            <FolderIcon className="text-brand-dark-blue size-8" />
            {getBreadcrumb()}
          </div>
        </div>
        <div className="from-brand-gradient-start to-brand-gradient-end my-4 flex h-24 flex-row gap-8 rounded-lg bg-linear-to-r px-8 text-white shadow">
          <div className="flex flex-row items-center justify-center gap-2 text-center text-4xl">
            <FilesIcon className="size-8" />
            {storageStats.filesCount}
          </div>
          <div className="flex items-center justify-center text-4xl">{storageStats.totalSize}</div>
        </div>
      </div>
      <FileExplorer />
      <DetailView />
    </div>
  );
}
