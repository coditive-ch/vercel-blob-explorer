import { Outlet, useNavigate, useNavigation } from 'react-router';
import { Sidebar } from './components/Sidebar';
import { Loader } from './components/Loader';
import { useFileStore } from './stores/FileStore';
import { useEffect } from 'react';
import { Modal } from './components/Modal';

export function App() {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const fileStore = useFileStore();
  let isLoading: boolean = false;

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
    isLoading = Boolean(navigation.location) || fileStore.isLoading;
    console.log(`IsLoading Effect: ${isLoading}`);
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
