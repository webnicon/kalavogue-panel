import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api.js';
import { PanelSettings } from '../types.js';
import { useAuth } from './AuthContext.js';

interface ConnectionStatus {
  reachable: boolean;
  wooValid: boolean;
  authValid: boolean;
  ssl: 'healthy' | 'warning' | 'failed' | string;
  responseTime: number;
  statusLabel: 'Connected' | 'Warning' | 'Failed' | string;
  reason?: string;
}

interface SettingsContextType {
  settings: PanelSettings | null;
  connectionStatus: ConnectionStatus | null;
  loadingSettings: boolean;
  testingConnection: boolean;
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  notifications: Array<{ id: string; message: string; timestamp: string; read: boolean; type: string }>;
  addNotification: (message: string, type?: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  refreshSettings: () => Promise<void>;
  updateSettings: (payload: Partial<PanelSettings>) => Promise<boolean>;
  testConnection: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<PanelSettings | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  
  // Layout and theme local state synced with DB
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  
  // Live Notifications feed
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; timestamp: string; read: boolean; type: string }>>([
    { id: 'notif-1', message: 'Kalavogue Portal connection completed automatically.', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), read: false, type: 'success' },
    { id: 'notif-2', message: 'Heads up! Product item "Vapor-Infused Walnut Wood Desk Organizer Studio" dropped below threshold (3 remaining).', timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(), read: false, type: 'warning' }
  ]);

  const refreshSettings = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiService.getSettings();
      const s = res.data.settings;
      setSettings(s);
      setTheme(s.theme || 'dark');
      setSidebarCollapsed(s.sidebarCollapsed || false);
    } catch (err) {
      console.error('Failed to load Panel settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshSettings().then(() => {
        // Run an initial connection test in the background
        testConnection();
      });
    } else {
      setLoadingSettings(false);
    }
  }, [isAuthenticated]);

  // Sync Class modifiers on HTML for elegant Dark/Light rendering
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const testConnection = async () => {
    if (!isAuthenticated) return;
    setTestingConnection(true);
    try {
      const res = await apiService.testWordPressConnection();
      setConnectionStatus(res.data.checks);
    } catch (err) {
      console.error('Failed checking API loop connection:', err);
      setConnectionStatus({
        reachable: false,
        wooValid: false,
        authValid: false,
        ssl: 'failed',
        responseTime: 0,
        statusLabel: 'Failed',
        reason: 'Backend node experienced a network error trying to fetch WordPress REST headers.'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const updateSettings = async (payload: Partial<PanelSettings>): Promise<boolean> => {
    try {
      const res = await apiService.updateSettings(payload);
      if (res.data.success) {
        setSettings(res.data.settings);
        if (payload.theme) setTheme(payload.theme);
        if (payload.sidebarCollapsed !== undefined) setSidebarCollapsed(payload.sidebarCollapsed);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed editing database custom variables:', err);
      return false;
    }
  };

  const toggleTheme = () => {
    const targetTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(targetTheme);
    updateSettings({ theme: targetTheme });
  };

  const toggleSidebar = () => {
    const targetState = !sidebarCollapsed;
    setSidebarCollapsed(targetState);
    updateSettings({ sidebarCollapsed: targetState });
  };

  const addNotification = (message: string, type: string = 'info') => {
    const newNotif = {
      id: 'notif-' + Math.random().toString(36).substr(2, 9),
      message,
      timestamp: new Date().toISOString(),
      read: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Set up background auto-refresh interval for the Connection Status
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      testConnection();
    }, 60000); // refresh every minute

    return () => clearInterval(interval);
  }, [isAuthenticated, settings?.siteUrl]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        connectionStatus,
        loadingSettings,
        testingConnection,
        theme,
        sidebarCollapsed,
        notifications,
        addNotification,
        markNotificationRead,
        clearNotifications,
        toggleTheme,
        toggleSidebar,
        refreshSettings,
        updateSettings,
        testConnection
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be called inside a SettingsProvider wrapper');
  }
  return context;
};
