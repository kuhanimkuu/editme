import { RouterProvider } from 'react-router';
import { router } from './routes';
import { UserProvider } from './context/UserContext';
import { SavedProvider } from './context/SavedContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <UserProvider>
      <SavedProvider>
        <RouterProvider router={router} />
        <Toaster />
      </SavedProvider>
    </UserProvider>
  );
}
