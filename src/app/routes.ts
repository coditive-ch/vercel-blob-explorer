import { createBrowserRouter, redirect } from 'react-router';
import { App } from './App';
import { Bucket } from './pages/Bucket';
import { Connect } from './pages/Connect';
import { Settings } from './pages/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: App,
    children: [
      {
        index: true,
        Component: Bucket,
      },
      {
        path: 'settings',
        Component: Settings,
      },
    ],
  },
  {
    path: '/connect',
    index: true,
    Component: Connect,
  },
  {
    path: '/*',
    loader: () => redirect('/'),
  },
]);
