import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams, Outlet } from 'react-router';
import {
  Home, Briefcase, Wallet, BarChart3, MessageSquare, User, Heart, Bell,
  Settings, Menu, Plus, RefreshCw, Search, LogOut, LogIn, ChevronDown, Compass, LifeBuoy,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../context/UserContext';
import { UserAvatar } from './common';
import { NotificationsMenu, useNotifications } from './Notifications';
import { useSaved } from '../context/SavedContext';
import { categories, categoryLabels } from '../../lib/format';

const workNav = [
  { path: '/saved', icon: Heart, label: 'Saved' },
  { path: '/projects', icon: Briefcase, label: 'Projects' },
  { path: '/chat', icon: MessageSquare, label: 'Messages' },
  { path: '/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
];

const exploreNav = [
  { path: '/how-it-works', icon: Compass, label: 'How it works' },
  { path: '/help', icon: LifeBuoy, label: 'Help & FAQ' },
];

const accountNav = [
  { path: '/notifications', icon: Bell, label: 'Notifications' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const pageTitles: Record<string, string> = {
  '/': 'Discover',
  '/projects': 'Projects',
  '/chat': 'Messages',
  '/wallet': 'Wallet',
  '/analytics': 'Analytics',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/saved': 'Saved editors',
  '/notifications': 'Notifications',
  '/how-it-works': 'How it works',
  '/help': 'Help & FAQ',
};

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, profile, mode, setMode, editorProfile, signOut } = useAuth();
  const notifications = useNotifications(user?.id ?? null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { ids: savedIds } = useSaved();
  const onDiscover = location.pathname === '/';
  const activeCategory = onDiscover ? params.get('category') : null;
  // Open on Discover, folded elsewhere (keeps the sidebar short).
  const [categoriesOpen, setCategoriesOpen] = useState(location.pathname === '/');
  const [query, setQuery] = useState(location.pathname === '/' ? params.get('q') ?? '' : '');

  const pageTitle = pageTitles[location.pathname] ?? (location.pathname.startsWith('/editors/') ? 'Editor' : 'EditMe');
  const close = () => setSidebarOpen(false);

  const switchMode = () => {
    const next = mode === 'client' ? 'editor' : 'client';
    setMode(next);
    // Becoming an editor starts with setting up the editor profile.
    if (next === 'editor' && !editorProfile) navigate('/profile');
  };

  const search = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/');
  };

  const doSignOut = async () => {
    await signOut();
    navigate('/');
  };

  /** muted: a count shown in grey (e.g. how many saved), not an alert. */
  const navLink = (path: string, Icon: typeof Home, label: string, badge?: number, muted = false) => {
    // Discover is "active" only without a category picked (those highlight below it).
    const isActive = location.pathname === path && !(path === '/' && activeCategory);
    return (
      <Link
        key={path}
        to={path}
        onClick={close}
        aria-current={isActive ? 'page' : undefined}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
          isActive ? 'bg-[#2979FF] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
        <span className="font-medium text-[13.5px] flex-1">{label}</span>
        {!!badge && badge > 0 && !isActive && (
          <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center ${
            muted ? 'bg-gray-100 text-gray-500' : 'bg-[#2979FF] text-white'}`}>
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100
        flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Link to="/" onClick={close} className="flex items-center gap-3 px-5 h-16 border-b border-gray-100 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#9333ea] via-[#ec4899] to-[#f97316] flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-bold text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>E</span>
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>EditMe</span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 pt-5 pb-2 space-y-0.5" aria-label="Main">
          {/* Discover, with its categories folded underneath */}
          <div className="flex items-center gap-1">
            <div className="flex-1">{navLink('/', Home, 'Discover')}</div>
            <button onClick={() => setCategoriesOpen((o) => !o)} aria-expanded={categoriesOpen} aria-controls="nav-categories"
              aria-label={categoriesOpen ? 'Hide categories' : 'Show categories'}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50">
              <ChevronDown className={`w-4 h-4 transition-transform ${categoriesOpen ? '' : '-rotate-90'}`} />
            </button>
          </div>
          {categoriesOpen && (
            <div id="nav-categories" className="ml-5 pl-3 border-l border-gray-100 space-y-0.5 py-1">
              {categories.map((c) => {
                const active = activeCategory === c;
                return (
                  <Link key={c} to={`/?category=${c}`} onClick={close} aria-current={active ? 'page' : undefined}
                    className={`block px-3 py-1.5 rounded-lg text-[12.5px] transition-colors ${
                      active ? 'bg-[#EFF6FF] text-[#2979FF] font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                    {categoryLabels[c]}
                  </Link>
                );
              })}
            </div>
          )}

          {user && (
            <div className="pt-3 mt-2 border-t border-gray-100 space-y-0.5">
              {workNav.map(({ path, icon, label }) =>
                navLink(path, icon, label,
                  path === '/chat' ? notifications.unreadChats : path === '/saved' ? savedIds.size : undefined,
                  path === '/saved'))}
            </div>
          )}

          <div className="pt-4 mt-3 border-t border-gray-100">
            <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Explore</p>
            {exploreNav.map(({ path, icon, label }) => navLink(path, icon, label))}
          </div>

          {user && (
            <div className="pt-4 mt-3 border-t border-gray-100">
              <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Account</p>
              {accountNav.map(({ path, icon, label }) =>
                navLink(path, icon, label, path === '/notifications' ? notifications.unreadCount - notifications.unreadChats : undefined))}
            </div>
          )}
        </nav>

        <div className="flex-shrink-0 px-3 pb-4 pt-2 border-t border-gray-100 space-y-2">
          {user ? (
            <>
              <button
                onClick={switchMode}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                  mode === 'client' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  {mode === 'client' ? '👔' : '🎨'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-800 leading-tight">
                    {mode === 'client' ? 'Client Mode' : 'Editor Mode'}
                  </p>
                  <p className="text-[12px] text-[#2979FF] leading-tight mt-0.5">
                    Switch to {mode === 'client' ? 'Editor' : 'Client'}
                  </p>
                </div>
                <RefreshCw className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              </button>

              <div className="flex items-center gap-1">
                <Link to="/profile" onClick={close} className="flex-1 min-w-0 flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                  <UserAvatar name={profile?.display_name} url={profile?.avatar_url} className="h-8 w-8 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">{profile?.display_name ?? '...'}</p>
                    <p className="text-[12px] text-gray-500 truncate leading-tight mt-0.5">{user.email}</p>
                  </div>
                </Link>
                <button onClick={doSignOut} className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-50" aria-label="Sign out" title="Sign out">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 px-1">
              <p className="text-xs text-gray-500 px-2">Hire an editor, or offer your skills.</p>
              <Button asChild className="w-full rounded-xl bg-[#2979FF] hover:bg-[#1565C0]">
                <Link to="/sign-up" onClick={close}>Create account</Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-xl border-gray-200">
                <Link to={`/sign-in?next=${encodeURIComponent(location.pathname + location.search)}`} onClick={close}>Sign in</Link>
              </Button>
            </div>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={close} />
      )}

      {/* ── Main area ── */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center gap-4 px-5 flex-shrink-0">
          <button className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-gray-100 transition-colors" onClick={() => setSidebarOpen(true)} aria-label="Menu">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <h1 className="text-[15px] font-semibold text-gray-900 hidden sm:block flex-shrink-0">{pageTitle}</h1>

          <form onSubmit={search} className="flex-1 max-w-sm sm:ml-4" role="search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search editors or skills..."
                aria-label="Search editors"
                className="pl-9 bg-gray-50 border-transparent h-9 rounded-xl focus:bg-white focus:border-gray-200 text-sm placeholder:text-gray-400"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {user ? (
              <>
                {mode === 'client' && (
                  <Button
                    size="sm"
                    onClick={() => navigate('/')}
                    className="bg-[#2979FF] hover:bg-[#1565C0] rounded-xl h-9 px-4 text-sm font-medium hidden md:flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Project
                  </Button>
                )}
                <NotificationsMenu {...notifications} />
                <Link to="/profile" aria-label="Your profile">
                  <UserAvatar name={profile?.display_name} url={profile?.avatar_url}
                    className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-[#2979FF] transition-all" />
                </Link>
              </>
            ) : (
              <Button asChild size="sm" variant="outline" className="rounded-xl h-9 border-gray-200 gap-1.5">
                <Link to={`/sign-in?next=${encodeURIComponent(location.pathname + location.search)}`}><LogIn className="w-3.5 h-3.5" />Sign in</Link>
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
