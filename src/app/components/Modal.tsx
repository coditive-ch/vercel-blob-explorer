import { useEffect, useRef, useState } from 'react';
import { useModalStore } from '../stores/ModalStore';

export function Modal() {
  const modalRef = useRef<HTMLDivElement>(null);
  const modalStore = useModalStore();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (modalStore.isOpen && modalRef.current) {
      const modalElement = modalRef.current;
      //add any focusable HTML element you want to include to this string
      const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKeyPress = (event: KeyboardEvent) => {
        if (event.key === 'Tab') {
          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      };

      const handleEscapeKeyPress = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          modalStore.closeModal();
        }
      };

      modalElement.addEventListener('keydown', handleTabKeyPress);
      modalElement.addEventListener('keydown', handleEscapeKeyPress);

      return () => {
        modalElement.removeEventListener('keydown', handleTabKeyPress);
        modalElement.removeEventListener('keydown', handleEscapeKeyPress);
      };
    }
  }, [modalStore.isOpen, modalStore.closeModal]);

  function handleClose() {
    modalStore.onClose();
    modalStore.closeModal();

    // Reset input value after closing modal
    setInputValue('');
  }

  function handleConfirm() {
    modalStore.onConfirm(inputValue);
    modalStore.closeModal();

    // Reset input value after closing modal
    setInputValue('');
  }

  if (!modalStore.isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 grid place-content-center bg-transparent backdrop-blur-sm backdrop-brightness-75"
      role="dialog"
      aria-modal="true">
      <div
        id="modal"
        ref={modalRef}
        tabIndex={0}
        className="flex w-2xl flex-col rounded-lg bg-white p-6 shadow brightness-100">
        <div id="modalHeader" className="flex items-start justify-between">
          <h2 id="modalTitle" className="text-xl font-bold text-gray-900">
            {modalStore.title}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="-me-4 -mt-4 rounded-full p-2 text-5xl text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 focus:outline-0"
            aria-label="Close">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div id="modalBody" className="mt-4">
          {modalStore.content}
          {modalStore.showInput && (
            <div className="flex flex-col gap-4">
              <label htmlFor="modal-input">
                <span className="text-sm font-medium text-gray-700"> {modalStore.inputLabel} </span>
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  type="text"
                  id="modal-input"
                  className="focus:outline-brand-light-blue text-brand-dark-blue mt-0.5 h-12 w-full rounded border border-gray-300 p-2 text-lg shadow"
                />
              </label>
            </div>
          )}
        </div>

        <footer id="modalFooter" className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={modalStore.showInput && inputValue.trim() === ''}
            className="bg-brand-dark-blue rounded px-4 py-2 text-white hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed">
            Confirm
          </button>
        </footer>
      </div>
    </div>
  );
}
