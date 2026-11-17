import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Discover } from './pages/Discover';
import { NotFound } from './pages/NotFound';

// Discover is the start page and loads with the app. Every other page is
// fetched the first time it's opened, so the charts library (Analytics) and
// the rest don't slow down the first load.
export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Discover },
      {
        path: 'projects',
        lazy: () => import('./pages/Projects').then((m) => ({ Component: m.Projects })),
      },
      {
        path: 'wallet',
        lazy: () => import('./pages/Wallet').then((m) => ({ Component: m.Wallet })),
      },
      {
        path: 'analytics',
        lazy: () => import('./pages/Analytics').then((m) => ({ Component: m.Analytics })),
      },
      {
        path: 'chat',
        lazy: () => import('./pages/Chat').then((m) => ({ Component: m.Chat })),
      },
      {
        path: 'profile',
        lazy: () => import('./pages/Profile').then((m) => ({ Component: m.Profile })),
      },
      {
        path: 'settings',
        lazy: () => import('./pages/Settings').then((m) => ({ Component: m.Settings })),
      },
      { path: '*', Component: NotFound },
    ],
  },
]);
