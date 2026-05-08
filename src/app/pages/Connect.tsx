import CoditiveLogo from '../assets/images/coditive-logo.svg?react';
import S3Bucket from '../assets/icons/s3-bucket.svg?react';
import ChevronDown from '../assets/icons/chevron-down.svg?react';
import { useState } from 'react';
import { useFileStore } from '../stores/FileStore';
import { useNavigate } from 'react-router';

export function Connect() {
  return (
    <div className="from-brand-gradient-start to-brand-gradient-end relative flex h-screen w-full flex-col items-center justify-center bg-linear-to-t">
      <div className="absolute top-0 left-0 mt-12 ml-12">
        <CoditiveLogo className="h-14" />
      </div>

      <div className="absolute top-0 right-0 mt-8 mr-8">
        <S3Bucket className="text-brand-light-blue size-48" />
      </div>

      <ConnectForm />

      <div className="divide-brand-light-blue text-brand-light-blue grid w-3xl grid-cols-3 flex-row divide-x-2">
        <div className="flex flex-col px-8 pb-2">
          <span className="mb-4 text-3xl font-semibold uppercase">Token</span>
          <span className="text-lg">Find your tokens in VERCEL DOCS</span>
        </div>

        <div className="flex flex-col px-8 pb-2">
          <span className="mb-4 text-3xl font-semibold uppercase">Security</span>
          <span className="text-lg">Tokens are only stored locally in your browser&apos;s session storage.</span>
        </div>

        <div className="flex flex-col px-8 pb-2">
          <span className="mb-4 text-3xl font-semibold uppercase">Capabilities</span>
          <span className="text-lg">Browse files, upload assets, and manage bucket metadata instantly.</span>
        </div>
      </div>
    </div>
  );
}

function ConnectForm() {
  const [formStatus, setFormStatus] = useState<'empty' | 'loading' | 'error' | 'success'>('empty');
  const [token, setToken] = useState('');
  const fileStore = useFileStore();
  const navigate = useNavigate();

  async function handleConnect() {
    // Test if the token works
    console.log(`Testing token: ${token}`);
    const isValid = await fileStore.testToken(token);
    if (!isValid) {
      setFormStatus('error');
      return;
    }

    console.log('Saving Token and Redirect');
    fileStore.setToken(token);
    fileStore.setFolderPath('');
    fileStore.listFiles();
    navigate('/');
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleConnect();
      }}
      className="relative flex w-3xl flex-col gap-4 py-24">
      <h1 className="text-4xl font-bold text-white">Connect to</h1>
      <input
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="focus:outline-brand-light-blue h-18 w-full border-3 border-white p-2 text-2xl text-white"
      />
      <button
        type="submit"
        className="bg-brand-dark-blue relative flex h-24 w-full cursor-pointer flex-row items-center justify-center rounded-lg p-2 text-4xl text-white shadow select-none hover:brightness-90">
        <span className="uppercase">Connect</span>
        <ChevronDown className="absolute right-5 size-10 -rotate-90 text-white" />
      </button>

      {formStatus === 'error' && (
        <div className="absolute bottom-5 flex h-16 w-full transform items-center justify-center rounded-lg bg-red-200 shadow transition-transform duration-300 ease-in-out">
          <span className="text-xl font-semibold text-red-800">
            Failed to connect. Please check your credentials and try again.
          </span>
        </div>
      )}
    </form>
  );
}
