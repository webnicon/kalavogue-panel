import React, { useState } from 'react';
import { 
  Settings2, 
  Globe, 
  Key, 
  Sliders, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  RefreshCw,
  SlidersHorizontal,
  PlusCircle,
  Lock
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext.js';
import { useAuth } from '../context/AuthContext.js';

export const Settings: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    connectionStatus, 
    testingConnection, 
    testConnection,
    addNotification 
  } = useSettings();

  const { user } = useAuth();

  // Settings Section State Mapping
  const [siteUrl, setSiteUrl] = useState(settings?.siteUrl || 'https://myshop.com');
  const [consumerKey, setConsumerKey] = useState(settings?.consumerKey || '');
  const [consumerSecret, setConsumerSecret] = useState(settings?.consumerSecret || '');
  const [apiEndpoint, setApiEndpoint] = useState(settings?.apiEndpoint || '/wp-json/wc/v3');
  const [apiTimeout, setApiTimeout] = useState(settings?.apiTimeout?.toString() || '5000');
  const [apiHeaders, setApiHeaders] = useState(settings?.apiHeaders || 'Content-Type: application/json');

  // Panel settings customizer state
  const [logoName, setLogoName] = useState(settings?.logo || '✨ Kalavogue Portal');
  const [sessionTimeout, setSessionTimeout] = useState(settings?.sessionTimeout?.toString() || '60');
  const [selectedLang, setSelectedLang] = useState(settings?.language || 'English');
  const [currency, setCurrency] = useState(settings?.currency || 'INR');
  const [notifState, setNotifState] = useState(settings?.notificationsEnabled ?? true);
  const [emailNotifState, setEmailNotifState] = useState(settings?.emailNotifications ?? true);

  // Security variables
  const [ipWhitelist, setIpWhitelist] = useState(settings?.ipWhitelist || '127.0.0.1, 192.168.1.100');
  const [rateLimiting, setRateLimiting] = useState(settings?.rateLimiting ?? true);
  const [loginAttempts, setLoginAttempts] = useState(settings?.loginAttemptsLimit?.toString() || '5');
  const [twoFactor, setTwoFactor] = useState(settings?.twoFactorEnabled ?? false);

  const [savingSection, setSavingSection] = useState<'api' | 'panel' | 'security' | null>(null);

  // Save handles section-by-section
  const handleSaveApiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSection('api');
    const success = await updateSettings({
      siteUrl,
      consumerKey,
      consumerSecret,
      apiEndpoint,
      apiTimeout: parseInt(apiTimeout) || 5000,
      apiHeaders
    });
    setSavingSection(null);
    if (success) {
      addNotification('WordPress + WooCommerce REST API parameters updated.', 'success');
      // trigger secondary testing check
      testConnection();
    } else {
      alert('Failed saving changes.');
    }
  };

  const handleSavePanelSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSection('panel');
    const success = await updateSettings({
      logo: logoName,
      sessionTimeout: parseInt(sessionTimeout) || 60,
      language: selectedLang,
      currency: currency as any,
      notificationsEnabled: notifState,
      emailNotifications: emailNotifState
    });
    setSavingSection(null);
    if (success) {
      addNotification('Interface customizations applied.', 'success');
    }
  };

  const handleSaveSecuritySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role === 'Staff Admin') {
      alert('Insufficient settings scopes. Action blocked.');
      return;
    }

    setSavingSection('security');
    const success = await updateSettings({
      ipWhitelist,
      rateLimiting,
      loginAttemptsLimit: parseInt(loginAttempts) || 5,
      twoFactorEnabled: twoFactor
    });
    setSavingSection(null);
    if (success) {
      addNotification('Security rules whitelists updated.', 'success');
    }
  };

  // Connection Indicator Visual helpers
  const getBoxStatusColor = () => {
    if (!connectionStatus) return 'border-amber-500/10 bg-amber-500/5';
    if (connectionStatus.statusLabel === 'Connected') return 'border-emerald-500/20 bg-emerald-500/5';
    if (connectionStatus.statusLabel === 'Warning') return 'border-amber-500/20 bg-amber-500/5';
    return 'border-rose-500/20 bg-rose-500/5';
  };

  return (
    <div className="space-y-6 text-xs text-slate-300 font-semibold font-sans">
      
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white animate-fade-in">
          Kalavogue Portal Configurations
        </h2>
        <p className="text-xs text-slate-505 mt-1">
          Adjust REST API handshakes, credentials whitelisting, rate restriction and UI layouts.
        </p>
      </div>

      {/* Grid: Columns dividing configs parameters */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN: API Handshake configuration and Test Connection checkers */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECTION A: WooCommerce endpoint fields */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4.5 w-4.5 text-sky-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">WordPress & WooCommerce Api Credentials</h3>
            </div>

            <form onSubmit={handleSaveApiSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <span className="text-slate-400">WordPress Site Home URL *</span>
                  <input
                    type="url"
                    required
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="https://mywoocommercestore.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-slate-400">WooCommerce Consumer Key *</span>
                  <input
                    type="text"
                    required
                    value={consumerKey}
                    onChange={(e) => setConsumerKey(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="ck_abc123..."
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-slate-400">WooCommerce Consumer Secret *</span>
                  <input
                    type="password"
                    required
                    value={consumerSecret}
                    onChange={(e) => setConsumerSecret(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="cs_xyz890..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <span className="text-slate-400">REST API Endpoint</span>
                  <input
                    type="text"
                    required
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="/wp-json/wc/v3"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-slate-400">Connection Timeout (ms)</span>
                  <input
                    type="number"
                    required
                    value={apiTimeout}
                    onChange={(e) => setApiTimeout(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="5000"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-slate-400">API Headers payload</span>
                  <input
                    type="text"
                    value={apiHeaders}
                    onChange={(e) => setApiHeaders(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="Content-Type: application/json"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingSection === 'api'}
                  className="rounded-lg bg-sky-500 hover:bg-sky-600 px-4.5 py-2 font-extrabold text-slate-955 shadow cursor-pointer transition-colors disabled:opacity-50"
                >
                  {savingSection === 'api' ? 'Saving API Parameters...' : 'Save API Parameters'}
                </button>
              </div>
            </form>
          </div>

          {/* SECTION B: Custom live connection diagnostic tools */}
          <div className={`rounded-xl border p-5 shadow-lg transition-colors backdrop-blur-md ${getBoxStatusColor()}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4.5 w-4.5 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">API Handshake Diagnostic Logs</h3>
              </div>

              <button
                onClick={testConnection}
                disabled={testingConnection}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-[11px] font-extrabold text-slate-300 hover:text-white hover:bg-slate-900 cursor-pointer transition-colors"
              >
                <RefreshCw className={`h-3 w-3 ${testingConnection ? 'animate-spin' : ''}`} />
                <span>Verify handshakes live</span>
              </button>
            </div>

            {/* Checker matrix row details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mt-2.5">
              
              {/* Reachability */}
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold leading-none mb-2">Endpoint ping</span>
                {connectionStatus?.reachable ? (
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-black">
                    <CheckCircle className="h-4 w-4" />
                    <span>HEALTHY</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 text-rose-400 font-black">
                    <XCircle className="h-4 w-4" />
                    <span>FAILED</span>
                  </div>
                )}
              </div>

              {/* WC API validation */}
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold leading-none mb-2">Woo Valid</span>
                {connectionStatus?.wooValid ? (
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-extrabold font-mono">
                    <CheckCircle className="h-4 w-4" />
                    <span>AUTHORIZED</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 text-rose-450 font-black">
                    <XCircle className="h-4 w-4" />
                    <span>REFUSED</span>
                  </div>
                )}
              </div>

              {/* JWT verification */}
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold leading-none mb-2">Security Keys</span>
                {connectionStatus?.authValid ? (
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle className="h-4 w-4" />
                    <span>VALID</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 text-rose-455 font-bold">
                    <XCircle className="h-4 w-4" />
                    <span>REJECTED</span>
                  </div>
                )}
              </div>

              {/* Response latency */}
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold leading-none mb-2">Latency</span>
                <span className="text-sm font-black text-slate-200 font-mono">
                  {connectionStatus?.responseTime ? `${connectionStatus.responseTime} ms` : 'N/A'}
                </span>
              </div>
            </div>

            {correlationCheckInfoMsg(connectionStatus)}
          </div>

        </div>

        {/* RIGHT COLUMN: Customizers and Whitelist panel security settings */}
        <div className="space-y-6">
          
          {/* SECTION C: Panel Look Customizations */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="h-4.5 w-4.5 text-sky-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">Portal Customization</h3>
            </div>

            <form onSubmit={handleSavePanelSettings} className="space-y-4 font-semibold text-xs">
              <div className="space-y-1.5">
                <span className="text-slate-400">Manage Logo Title Header</span>
                <input
                  type="text"
                  required
                  value={logoName}
                  onChange={(e) => setLogoName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-400">Active Language Translation</span>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="English">English (US)</option>
                  <option value="Hindi">Hindi (In)</option>
                  <option value="Spanish">Español (Es)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-400">Primary Store Currency</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="INR">₹ Indian Rupee (INR)</option>
                  <option value="USD">$ US Dollar (USD)</option>
                  <option value="EUR">€ Euro (EUR)</option>
                  <option value="GBP">£ British Pound (GBP)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-400">Secure Session timeout (Mins)</span>
                <input
                  type="number"
                  required
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="60"
                />
              </div>

              {/* Switch states inputs */}
              <div className="space-y-3 pt-1 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-slate-200">Live UI Alerts Bubble Logs</span>
                    <span className="text-[10px] text-slate-500 font-medium font-sans">Blink alerts on WooCommerce actions</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifState}
                    onChange={(e) => setNotifState(e.target.checked)}
                    className="h-4.5 w-4.5 accent-sky-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-slate-200">Email system notifications</span>
                    <span className="text-[10px] text-slate-500 font-medium font-sans">Mail critical stock outages weekly</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifState}
                    onChange={(e) => setEmailNotifState(e.target.checked)}
                    className="h-4.5 w-4.5 accent-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSection === 'panel'}
                className="w-full mt-2 rounded-lg bg-sky-500 border border-transparent px-4 py-2 font-extrabold text-slate-955 shadow hover:bg-sky-600 disabled:opacity-40 cursor-pointer transition-colors"
              >
                {savingSection === 'panel' ? 'Applying...' : 'Apply customizations'}
              </button>
            </form>
          </div>

          {/* SECTION D: Critical Whitelist and Security settings */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-4.5 w-4.5 text-sky-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">Security Access Control</h3>
            </div>

            <form onSubmit={handleSaveSecuritySettings} className="space-y-4 font-semibold text-xs">
              <div className="space-y-1.5">
                <span className="text-slate-400">Allowed Admin IPs (Comma separated)</span>
                <input
                  type="text"
                  required
                  value={ipWhitelist}
                  onChange={(e) => setIpWhitelist(e.target.value)}
                  disabled={user?.role === 'Staff Admin'}
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
                  placeholder="127.0.0.1, 192.168.1.100"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-400">Maximum Allowed Password Attempts</span>
                <input
                  type="number"
                  required
                  value={loginAttempts}
                  onChange={(e) => setLoginAttempts(e.target.value)}
                  disabled={user?.role === 'Staff Admin'}
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
                  placeholder="5"
                />
              </div>

              <div className="space-y-3 pt-1 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-slate-200">Enforce Rate Limiting</span>
                    <span className="text-[10px] text-slate-500 font-medium font-sans font-sans">Auto-block rapid system pings</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={rateLimiting}
                    onChange={(e) => setRateLimiting(e.target.checked)}
                    disabled={user?.role === 'Staff Admin'}
                    className="h-4.5 w-4.5 accent-sky-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-slate-200">Enable Two Factor Authentication</span>
                    <span className="text-[10px] text-slate-500 font-medium font-sans">Protect panel login with mobile OTP</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={twoFactor}
                    onChange={(e) => setTwoFactor(e.target.checked)}
                    disabled={user?.role === 'Staff Admin'}
                    className="h-4.5 w-4.5 accent-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSection === 'security' || user?.role === 'Staff Admin'}
                className="w-full mt-2 rounded-lg border px-4 py-2 font-extrabold focus:outline-none bg-sky-500 text-slate-955 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed border-transparent cursor-pointer transition-colors"
              >
                {user?.role === 'Staff Admin' ? 'Scope Access Locked' : (savingSection === 'security' ? 'Saving security...' : 'Apply security locks')}
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};

// Help helper
function correlationCheckInfoMsg(status: any) {
  if (!status) return null;
  if (status.statusLabel === 'Connected') {
    return (
      <div className="mt-4 flex gap-2 items-start py-2.5 px-3 rounded-lg bg-emerald-500/10 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20 leading-normal">
        <CheckCircle className="h-4 w-4 text-emerald-450 flex-shrink-0 mt-0.5" />
        <p>Excellent! stand-alone connection completed automatically with WooCommerce endpoints.</p>
      </div>
    );
  } else if (status.statusLabel === 'Warning') {
    return (
      <div className="mt-4 flex gap-2 items-start py-2.5 px-3 rounded-lg bg-amber-500/10 text-[11px] font-semibold text-amber-400 border border-amber-500/20 leading-normal">
        <ShieldAlert className="h-4 w-4 text-amber-450 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Caution: SSL Warning reported.</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{status.reason}</p>
        </div>
      </div>
    );
  } else {
    return (
      <div className="mt-4 flex gap-2 items-start py-2.5 px-3 rounded-lg bg-rose-500/10 text-[11px] font-semibold text-rose-400 border border-rose-500/20 leading-normal">
        <XCircle className="h-4 w-4 text-rose-450 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Handshake Timeout error.</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{status.reason}</p>
        </div>
      </div>
    );
  }
}
