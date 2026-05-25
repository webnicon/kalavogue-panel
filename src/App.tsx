import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { SettingsProvider, useSettings } from './context/SettingsContext.js';
import { Sidebar } from './components/Sidebar.js';
import { Navbar } from './components/Navbar.js';
import { Login } from './pages/Login.js';
import { Dashboard } from './pages/Dashboard.js';
import { Products } from './pages/Products.js';
import { Users } from './pages/Users.js';
import { Coupons } from './pages/Coupons.js';
import { Settings } from './pages/Settings.js';
import { Logs } from './pages/Logs.js';
import { Orders } from './pages/Orders.js';
import { WalletPage } from './pages/Wallet.js';

// Inside InnerApp we have access to useContext values
function InnerApp() {
  const { isAuthenticated, loading } = useAuth();
  const { theme } = useSettings();
  
  // Tab-based navigation state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 border-t border-indigo-505 select-none text-xs text-slate-400 font-bold">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="h-9 w-9 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <span>Restoring Kalavogue Admin session...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated screen
  if (!isAuthenticated) {
    return <Login />;
  }

  // Render correct visual tab depending on Sidebar selection
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onTabChange={setCurrentTab} />;
      case 'products':
        return <Products />;
      case 'orders':
        return <Orders />;
      case 'users':
        return <Users />;
      case 'wallet':
        return <WalletPage />;
      case 'coupons':
        return <Coupons />;
      case 'settings':
        return <Settings />;
      case 'logs':
        return <Logs />;
      default:
        return <Dashboard onTabChange={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen flex text-slate-100 bg-slate-950 select-none antialiased">
      
      {/* Sidebar navigation rails */}
      <Sidebar 
        currentTab={currentTab} 
        onTabChange={setCurrentTab} 
        mobileOpen={mobileSidebarOpen} 
        onMobileClose={() => setMobileSidebarOpen(false)} 
      />

      {/* Main body viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Navbar */}
        <Navbar 
          onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} 
          onTabChange={setCurrentTab} 
        />

        {/* Scrollable Contents grid */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

// Global wrap and mounting points
export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <InnerApp />
      </SettingsProvider>
    </AuthProvider>
  );
}
