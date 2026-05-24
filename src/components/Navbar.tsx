import React, { useState } from 'react';
import { 
  Menu, 
  Sun, 
  Moon, 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X,
  Globe,
  Settings,
  XSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useSettings } from '../context/SettingsContext.js';

interface NavbarProps {
  onMobileMenuToggle: () => void;
  onTabChange: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMobileMenuToggle, onTabChange }) => {
  const { user } = useAuth();
  const { 
    theme, 
    toggleTheme, 
    notifications, 
    markNotificationRead, 
    clearNotifications,
    connectionStatus 
  } = useSettings();

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-sky-500" />;
    }
  };

  const formatNotifTime = (timestamp: string) => {
    const elapsedSecs = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));
    if (elapsedSecs < 60) return 'Just now';
    const elapsedMins = Math.floor(elapsedSecs / 60);
    if (elapsedMins < 60) return `${elapsedMins}m ago`;
    const elapsedHours = Math.floor(elapsedMins / 60);
    if (elapsedHours < 24) return `${elapsedHours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/30 px-4 backdrop-blur-md">
      {/* Mobile Drawer Trigger Menu */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-sidebar-toggle"
          onClick={onMobileMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-900 transition-colors cursor-pointer lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        {/* Dynamic Context Header */}
        <h1 className="text-sm font-extrabold uppercase tracking-wider text-slate-200 hidden sm:block">
          Kalavogue Panel
        </h1>
      </div>

      {/* Utilities Action Panel */}
      <div className="flex items-center gap-3">
        {/* Rapid Status Widget */}
        {connectionStatus && (
          <div className="hidden md:flex items-center gap-2 border border-slate-800 px-3 py-1 bg-slate-950/40 rounded-full">
            <Globe className={`h-3 w-3 ${connectionStatus.statusLabel === 'Connected' ? 'text-emerald-400' : 'text-rose-500 animate-pulse'}`} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              API STATUS:
            </span>
            <span className={`text-[10px] font-extrabold tracking-wide uppercase ${connectionStatus.statusLabel === 'Connected' ? 'text-emerald-400' : 'text-rose-500'}`}>
              {connectionStatus.statusLabel}
            </span>
          </div>
        )}

        {/* Theme Toggler Button (Forced / Kept for UI uniformity) */}
        <button
          id="theme-toggler-btn"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 bg-slate-950 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer"
          title="Toggle Day/Night Aesthetics"
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Real-time Notifications Bell Dropdown */}
        <div className="relative">
          <button
            id="navbar-alert-bell"
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 bg-slate-950 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer"
            title="System Alert Logs"
          >
            <Bell className="h-4.5 w-4.5" />
            
            {/* Red Dot Badge */}
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
            )}
          </button>

          {/* Alert Dropdown Modal drawer overlay */}
          {notifDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setNotifDropdownOpen(false)} 
              />
              <div className="absolute right-0 mt-2 z-40 w-80 rounded-xl border border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-md max-h-[480px] flex flex-col overflow-hidden">
                <div className="flex h-11 items-center justify-between border-b border-slate-800 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      Live system updates
                    </span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-400 border border-rose-500/20">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearNotifications}
                    className="text-[10px] font-bold text-slate-500 hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                {/* Notifications items rail list */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <CheckCircle className="h-8 w-8 text-slate-700 mb-2" />
                      <p className="text-xs font-medium text-slate-400">
                        No pending logs or alerts.
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        System modules are humming along perfectly.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`flex gap-3 p-3.5 hover:bg-slate-950/40 transition-colors items-start relative
                          ${!notif.read ? 'bg-sky-500/5' : ''}
                        `}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {getNotifIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-slate-300 leading-normal">
                            {notif.message}
                          </p>
                          <span className="text-[9px] font-mono text-slate-500 block mt-1">
                            {formatNotifTime(notif.timestamp)}
                          </span>
                        </div>
                        
                        {!notif.read && (
                          <button
                            onClick={() => markNotificationRead(notif.id)}
                            className="text-[10px] font-bold text-sky-400 hover:text-sky-305 ml-1.5 self-center cursor-pointer"
                            title="Acknowledge alert"
                          >
                            Mark
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-slate-950 p-2.5 text-center border-t border-slate-800">
                  <button
                    onClick={() => {
                      onTabChange('logs');
                      setNotifDropdownOpen(false);
                    }}
                    className="flex w-full justify-center items-center gap-1.5 rounded-lg py-1.5 text-center text-xs font-bold text-sky-400 hover:bg-slate-900/40 transition-all duration-150 cursor-pointer"
                  >
                    <Settings className="h-3 w-3" />
                    <span>Manage Audit Trail</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Small avatar block */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 overflow-hidden border border-slate-200 dark:border-slate-800">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80'}
            alt="Profile Avatar"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
};
