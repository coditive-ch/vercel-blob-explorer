import SpinnerIcon from '../assets/icons/spinner.svg?react';

export function Loader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm backdrop-brightness-75">
      <SpinnerIcon className="text-brand-dark-blue size-16" />
    </div>
  );
}
