import { Outlet } from 'react-router';
import { RequireAuth } from './common';

/** Route wrapper: its child pages need a sign-in. */
export function Protected() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  );
}
