import { create } from 'zustand/react';

interface ModalCreateOptions {
  title: string;
  content: React.ReactNode;
  onConfirm: (inputValue: string) => void;
  onClose: () => void;
  showInput?: boolean;
  inputLabel?: string;
}

interface ModalStore {
  title: string;
  content: React.ReactNode;
  isOpen: boolean;
  showInput: boolean;
  inputLabel: string;
  onClose: () => void;
  onConfirm: (inputValue: string) => void;
  openModal: (options: ModalCreateOptions) => void;
  closeModal: () => void;
}

const initialState = {
  title: '',
  content: null as React.ReactNode,
  isOpen: false,
  showInput: false,
  inputLabel: '',
};

export const useModalStore = create<ModalStore>()((set) => ({
  ...initialState,
  onClose: () => {}, // Set when opening modal
  onConfirm: () => {}, // Set when opening modal
  openModal: (options: ModalCreateOptions) =>
    set(() => ({
      ...options,
      isOpen: true,
      showInput: options.showInput || false,
      inputLabel: options.inputLabel || '',
    })),
  closeModal: () => set(() => ({ isOpen: false, showInput: false, inputLabel: '' })),
}));
