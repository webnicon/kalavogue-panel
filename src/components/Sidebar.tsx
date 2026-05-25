import React from 'react';
import { 
  Tv, 
  ShoppingBag, 
  Users2, 
  Percent, 
  Settings2, 
  History, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  Globe2,
  Receipt,
  Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useSettings } from '../context/SettingsContext.js';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onTabChange, 
  mobileOpen, 
  onMobileClose 
}) => {
  const { user, logout } = useAuth();
  const { sidebarCollapsed, toggleSidebar, connectionStatus } = useSettings();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Tv },
    { id: 'orders', label: 'Orders', icon: Receipt },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'users', label: 'Customers', icon: Users2 },
    { id: 'wallet', label: 'Tera Wallet', icon: Wallet },
    { id: 'coupons', label: 'Coupons', icon: Percent },
    { id: 'settings', label: 'Settings', icon: Settings2 },
    { id: 'logs', label: 'Audit Logs', icon: History }
  ];

  const handleNavClick = (tabId: string) => {
    onTabChange(tabId);
    onMobileClose(); // auto close on mobile overlay clicked
  };

  const getStatusColor = () => {
    if (!connectionStatus) return 'bg-amber-400 animate-pulse';
    if (connectionStatus.statusLabel === 'Connected') return 'bg-emerald-500';
    if (connectionStatus.statusLabel === 'Warning') return 'bg-amber-500 animate-pulse';
    return 'bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse';
  };

  return (
    <>
      {/* Mobile Drawer Backdrop overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}

      {/* Primary Navigation Shell */}
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur-md transition-all duration-300 lg:sticky
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Branch Title Area */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-slate-950 shadow-md">
              <Globe2 className="h-5 w-5 stroke-[2.5]" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-white uppercase">
                  Kalavogue
                </span>
                <span className="text-[10px] font-mono text-slate-550 tracking-wider">
                  Master Panel
                </span>
              </div>
            )}
          </div>
          
          {/* Collapse toggle button for Desktop */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex h-6 w-6 items-center justify-center rounded-md border border-slate-800 bg-slate-950 text-slate-400 shadow-sm hover:text-white transition-colors cursor-pointer"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Live System API Status Banner */}
        {!sidebarCollapsed && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold tracking-wider text-slate-550 uppercase">
                API Handshake
              </span>
              <span className="flex h-2 w-2 relative">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusColor()}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${getStatusColor()}`} />
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-350">
              <span>{connectionStatus?.statusLabel || 'Checking...'}</span>
              <span className="font-mono text-[10px] text-slate-500">
                {connectionStatus?.responseTime ? `${connectionStatus.responseTime}ms` : '--'}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Item Scroll Rails */}
        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto w-full">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 relative cursor-pointer
                  ${isActive 
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.05)]' 
                    : 'text-slate-400 hover:bg-slate-900/40 hover:text-white transition-colors border border-transparent'
                  }
                `}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`h-4.5 w-4.5 flex-shrink-0 transition-transform group-hover:scale-105 duration-150
                  ${isActive ? 'text-amber-500' : 'text-slate-500 group-hover:text-slate-300'}
                `} />
                
                {!sidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}

                {/* Left Active highlight border */}
                {isActive && (
                  <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-amber-500 rounded-r-md" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Logged in Admin Avatar profile card */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 p-1.5 rounded-lg bg-slate-950/40">
            <div className="relative flex-shrink-0">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={user?.username}
                className="h-9 w-9 rounded-full object-cover border border-slate-800 shadow-inner"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>
            
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-805 truncate leading-tight">
                  {user?.username}
                </p>
                <p className="text-[10px] text-amber-500 font-bold tracking-tight truncate uppercase mt-0.5">
                  {user?.role}
                </p>
              </div>
            )}
          </div>

          <button
            id="sidebar-signout-btn"
            onClick={logout}
            className={`mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-rose-450 hover:bg-rose-950/20 transition-all duration-150 cursor-pointer
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
            title="Secure Sign Out"
          >
            <LogOut className="h-4 w-4" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
