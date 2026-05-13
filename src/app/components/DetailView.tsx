import { useFileStore } from '../stores/FileStore';
import { useState } from 'react';

// Icons
import CopyIcon from '../assets/icons/copy.svg?react';
import DownloadIcon from '../assets/icons/download.svg?react';
import TrashIcon from '../assets/icons/trash.svg?react';
import { useModalStore } from '../stores/ModalStore';

export function DetailView() {
  const fileStore = useFileStore();
  const modalStore = useModalStore();
  const [buttonEffect, setButtonEffect] = useState(false);

  function getDate(date: Date) {
    if (!date || !(date instanceof Date)) return '';
    return (
      date.toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) || ''
    );
  }

  function handleCopy() {
    setButtonEffect(true);
    navigator.clipboard.writeText(fileStore.detailViewItem?.url || '');
    setTimeout(() => setButtonEffect(false), 200);
  }

  function handleDelete() {
    const file = fileStore.detailViewItem;

    if (!file) return;

    modalStore.openModal({
      title: `Confirm Deletion of ${file.fileName}`,
      content: '',
      onConfirm: () => fileStore.deleteFile(file.pathname),
      onClose: () => {},
      showInput: false,
      inputLabel: '',
    });
  }

  function handleDownload() {
    const file = fileStore.detailViewItem;

    if (!file) return;

    fileStore.downloadFile(file.url);
  }

  if (fileStore.detailViewItem === null) return null;

  return (
    <div
      className="fixed inset-0 z-20 grid bg-transparent backdrop-blur-sm backdrop-brightness-75"
      onClick={() => fileStore.setDetailViewItem(null)}>
      <div
        className="ml-auto flex w-1/3 flex-col gap-6 overflow-y-auto bg-white p-8 shadow"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-2">
          <div className="text-brand-dark-blue text-4xl uppercase">Detail View</div>
          <div className="text-2xl text-slate-400">{fileStore.detailViewItem.fileName}</div>
        </div>
        {fileStore.detailViewItem.contentType.startsWith('image/') && (
          <div>
            <img
              src={fileStore.detailViewItem.url}
              alt="File Thumbnail"
              className="max-h-128 w-full rounded object-contain object-center"
            />
          </div>
        )}
        <div className="mt-auto flex flex-col">
          <div className="text-xl font-medium text-slate-400 uppercase">Content Type</div>
          <div className="text-brand-dark-blue text-xl">{fileStore.detailViewItem.contentType}</div>
        </div>
        <div className="flex flex-col">
          <div className="text-xl font-medium text-slate-400 uppercase">File Size</div>
          <div className="text-brand-dark-blue text-xl">{fileStore.detailViewItem.sizeFormatted}</div>
        </div>
        <div className="flex flex-col">
          <div className="text-xl font-medium text-slate-400 uppercase">Uploaded At</div>
          <div className="text-brand-dark-blue text-xl">{getDate(fileStore.detailViewItem.uploadedAt)}</div>
        </div>
        <span className="w-full rounded border border-slate-400" />
        <div className="flex flex-row gap-2">
          <label htmlFor="URL" className="w-full">
            <span className="text-xl font-medium text-slate-400 uppercase"> URL </span>
            <input
              value={fileStore.detailViewItem.url}
              readOnly={true}
              type="text"
              id="URL"
              className="text-brand-dark-blue pointer-events-none mt-0.5 h-14 w-full rounded border border-gray-300 p-2 text-lg shadow select-none focus:outline-none"
            />
          </label>
          <button
            className={`${buttonEffect && 'scale-90'} bg-brand-dark-blue mt-auto flex size-14 cursor-pointer place-content-center rounded transition-transform duration-100 ease-in-out hover:brightness-90`}
            onClick={handleCopy}>
            <CopyIcon className="w-8 text-white" />
          </button>
        </div>
        <span className="w-full rounded border border-slate-400" />
        <div className="flex flex-col gap-4">
          <button
            className={`bg-brand-dark-blue flex h-16 cursor-pointer flex-row place-items-center justify-center rounded-lg shadow hover:brightness-90`}
            onClick={handleDownload}>
            <DownloadIcon className="size-10 text-white" />
          </button>
          <button
            className={`flex h-16 cursor-pointer flex-row place-items-center justify-center rounded-lg border-2 border-gray-300 bg-white shadow hover:brightness-90`}
            onClick={handleDelete}>
            <TrashIcon className="text-brand-dark-blue size-10" />
          </button>
        </div>
      </div>
    </div>
  );
}
