import { Outlet, useNavigate, useNavigation } from 'react-router';
import { Sidebar } from './components/Sidebar';
import { Loader } from './components/Loader';
import { useFileStore } from './stores/FileStore';
import { useEffect, useState } from 'react';
import { Modal } from './components/Modal';

export function App() {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const fileStore = useFileStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = fileStore.token;
    if (token == '') {
      console.log('No token found or invalid token, redirecting to connect page');
      fileStore.setToken('');
      fileStore.setFolderPath('');
      navigate('/connect', { replace: true, state: {} });
    }
  }, []);

  useEffect(() => {
    setIsLoading(Boolean(navigation.location) || fileStore.isLoading);
  }, [navigation, fileStore.isLoading]);

  return (
    <div className="relative flex min-h-screen w-screen flex-row">
      {isLoading && <Loader />}
      <Modal />
      <Sidebar />
      <Outlet />
    </div>
  );
}
