import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '../context/UserContext';
import { initials } from '../../lib/format';
import { publicUrl } from '../../lib/storage';

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`w-5 h-5 animate-spin text-[#2979FF] ${className}`} />;
}

export function PageLoading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-gray-500" role="status">
      <Spinner />
      {label}...
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4" role="alert">
      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-3">
        <AlertCircle className="w-7 h-7 text-red-500" />
      </div>
      <p className="text-sm text-gray-700 mb-4 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" className="rounded-xl" onClick={onRetry}>Try again</Button>
      )}
    </div>
  );
}

export function EmptyState({
  icon, title, text, action,
}: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {text && <p className="text-sm text-gray-500 mb-5 max-w-sm">{text}</p>}
      {action}
    </div>
  );
}

/** A person's picture, or their initials. avatar_url may be a full URL or a path in the avatars bucket. */
export function UserAvatar({
  name, url, className = 'h-9 w-9',
}: { name: string | null | undefined; url?: string | null; className?: string }) {
  return (
    <Avatar className={className}>
      {url && <AvatarImage src={publicUrl('avatars', url)} alt="" />}
      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-[#2979FF] font-semibold text-xs">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

/** Pages that need a sign-in send signed-out visitors to /sign-in and back. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, user, mfaPending } = useAuth();
  const location = useLocation();
  if (!ready) return <PageLoading />;
  if (!user || mfaPending) {
    const next = location.pathname + location.search;
    return <Navigate to={`/sign-in?next=${encodeURIComponent(next)}`} replace />;
  }
  return <>{children}</>;
}

/** Only same-site paths: "/projects" yes; "//evil.com", "/\evil.com", "https://..." no. */
export function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/';
  return next;
}
