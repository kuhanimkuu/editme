import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Protected } from './components/Protected';
import { Discover } from './pages/Discover';
import { NotFound } from './pages/NotFound';

// Discover is the start page and loads with the app. Every other page is
// fetched the first time it's opened, so the charts library (Analytics) and
// the rest don't slow down the first load.
const auth = () => import('./pages/Auth');

export const router = createBrowserRouter([
  { path: '/sign-in', lazy: () => auth().then((m) => ({ Component: m.SignIn })) },
  { path: '/sign-up', lazy: () => auth().then((m) => ({ Component: m.SignUp })) },
  { path: '/forgot-password', lazy: () => auth().then((m) => ({ Component: m.ForgotPassword })) },
  { path: '/reset-password', lazy: () => auth().then((m) => ({ Component: m.ResetPassword })) },
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Discover },
      {
        path: 'editors/:id',
        lazy: () => import('./pages/EditorPage').then((m) => ({ Component: m.EditorPage })),
      },
      {
        // Everything below needs a sign-in.
        Component: Protected,
        children: [
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
        ],
      },
      { path: '*', Component: NotFound },
    ],
  },
]);
