// Icons
import { useState } from 'react';
import SpinnerIcon from '../assets/icons/spinner.svg?react';

export function Loader() {
  const [progress, setProgress] = useState(0);

  window.electronAPI.onProgressUpdate((value) => setProgress(value));

  return (
    <div className="fixed inset-0 z-90 flex items-center justify-center bg-transparent backdrop-blur-sm backdrop-brightness-75">
      <div className="flex w-32 flex-col items-center gap-2">
        <SpinnerIcon className="text-brand-dark-blue size-18" />
        {progress > 0 && <span className="text-brand-dark-blue text-center text-2xl font-semibold">{progress}%</span>}
      </div>
    </div>
  );
}
