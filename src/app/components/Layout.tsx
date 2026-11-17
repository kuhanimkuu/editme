import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router';
import { toast } from 'sonner';
import {
  Home, Briefcase, Wallet, BarChart3, MessageSquare, User,
  Bell, Settings, Menu, Plus, RefreshCw, Search,
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { useUser } from '../context/UserContext';

const mainNav = [
  { path: '/', icon: Home, label: 'Discover' },
  { path: '/projects', icon: Briefcase, label: 'Projects' },
  { path: '/chat', icon: MessageSquare, label: 'Messages', badge: 2 },
  { path: '/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
];

const accountNav = [
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
};

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, toggleRole } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = pageTitles[location.pathname] || 'EditMe';

  return (
    <div className="min-h-screen bg-[#F7F8FA]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100
        flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-100 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#9333ea] via-[#ec4899] to-[#f97316] flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-bold text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>E</span>
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>EditMe</span>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto px-3 pt-5 pb-2 space-y-0.5">
          {mainNav.map(({ path, icon: Icon, label, badge }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group
                  ${isActive
                    ? 'bg-[#2979FF] text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="font-medium text-[13.5px] flex-1">{label}</span>
                {badge && !isActive && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#2979FF] text-white text-[11px] font-semibold flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-4 mt-3 border-t border-gray-100">
            <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Account</p>
            {accountNav.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150
                    ${isActive
                      ? 'bg-[#2979FF] text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span className="font-medium text-[13.5px]">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Role switcher + user */}
        <div className="flex-shrink-0 px-3 pb-4 pt-2 border-t border-gray-100 space-y-2">
          <button
            onClick={toggleRole}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
              userRole === 'client' ? 'bg-blue-100' : 'bg-purple-100'
            }`}>
              {userRole === 'client' ? '👔' : '🎨'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-800 leading-tight">
                {userRole === 'client' ? 'Client Mode' : 'Editor Mode'}
              </p>
              <p className="text-[12px] text-[#2979FF] leading-tight mt-0.5">
                Switch to {userRole === 'client' ? 'Editor' : 'Client'}
              </p>
            </div>
            <RefreshCw className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          </button>

          <Link
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop" />
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
                {userRole === 'client' ? 'Tech Corp' : 'Sarah Chen'}
              </p>
              <p className="text-[12px] text-gray-500 truncate leading-tight mt-0.5">
                {userRole === 'client' ? 'client@techcorp.com' : 'sarah@editme.io'}
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main area ── */}
      <div className="lg:ml-64 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center gap-4 px-5 flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Page title */}
          <h1 className="text-[15px] font-semibold text-gray-900 hidden sm:block flex-shrink-0">
            {pageTitle}
          </h1>

          {/* Search */}
          <div className="flex-1 max-w-sm sm:ml-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <Input
                placeholder="Search editors, projects..."
                className="pl-9 bg-gray-50 border-transparent h-9 rounded-xl focus:bg-white focus:border-gray-200 text-sm placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {/* A project starts by hiring an editor: go and pick one. */}
            <Button
              size="sm"
              onClick={() => {
                navigate('/');
                toast.info('Pick an editor and tap Hire to start a project');
              }}
              className="bg-[#2979FF] hover:bg-[#1565C0] rounded-xl h-9 px-4 text-sm font-medium hidden md:flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New Project
            </Button>

            <button className="relative p-2 rounded-xl hover:bg-gray-50 transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            <Link to="/profile" onClick={() => setSidebarOpen(false)}>
              <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-[#2979FF] transition-all">
                <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop" />
                <AvatarFallback>SC</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
