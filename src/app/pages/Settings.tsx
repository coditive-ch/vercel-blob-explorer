import { useNavigate } from 'react-router';
import { useFileStore } from '../stores/FileStore';

export function Settings() {
  const fileStore = useFileStore();
  const navigate = useNavigate();

  function logout() {
    fileStore.reset();
    return navigate('/connect', { replace: true, state: {} });
  }

  return (
    <div className="flex w-[calc(100vw-9rem)] flex-col gap-4 p-14">
      <div className="grid grid-cols-2">
        <div className="flex flex-col justify-between">
          <h1 className="text-brand-dark-blue text-4xl uppercase">Settings</h1>
          <div className="flex flex-row gap-2"></div>
        </div>
        <div className="h-32 w-full"></div>
      </div>
      <button
        className={`text-brand-dark-blue flex cursor-pointer flex-row items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-2 px-3 shadow hover:brightness-90`}
        onClick={logout}>
        <span className="mx-2 text-xl font-semibold uppercase">Logout</span>
      </button>
    </div>
  );
}
