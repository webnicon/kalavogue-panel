import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { 
  Key, 
  User, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles,
  Info,
  CheckCircle,
  Clock,
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext.js';

export const Login: React.FC = () => {
  const { login, error: authError, clearError } = useAuth();
  const { addNotification } = useSettings();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Custom states
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  
  // Toggle password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Preset autofills
  const presetAccounts = [
    { label: 'Super Admin', user: 'admin', pass: 'password123', scope: 'All access' },
    { label: 'Staff Admin', user: 'staff', pass: 'password123', scope: 'Inventory + coupons' },
    { label: 'Product Manager', user: 'manager', pass: 'password123', scope: 'Inventory only' }
  ];

  const handleAutofill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    clearError();
    addNotification(`Preset loaded: ${user}`, 'info');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    const success = await login(username, password);
    setLoading(false);
    
    if (success) {
      addNotification(`Welcome back, ${username}! Handshake authorized.`, 'success');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setLoading(true);
    setForgotSuccess('');
    try {
      // simulate recovery dispatcher
      setForgotSuccess(`Security code dispatched to ${forgotEmail}. [For development sandbox, secure mock dispatched successfully.]`);
      addNotification(`Forgot password dispatch trigger sent to ${forgotEmail}`, 'warning');
    } catch {
      alert('Network failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans select-none text-xs text-slate-300">
      
      {/* Background radial overlays typical of SaaS login aesthetics */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 bg-sky-500/5 rounded-full filter blur-[100px] pointer-events-none select-none" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 bg-slate-900/40 rounded-full filter blur-[120px] pointer-events-none select-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative z-10">
        
        {/* LEFT COLUMN: Premium login form */}
        <div className="p-8 sm:p-10 flex flex-col justify-between bg-slate-900">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-9 w-9 bg-sky-500 rounded-xl flex items-center justify-center font-bold text-slate-950 shadow-lg shrink-0">
                <ShieldCheck className="h-5.5 w-5.5" />
              </div>
              <span className="text-sm font-extrabold tracking-tight text-white uppercase">
                Kalavogue Panel
              </span>
            </div>

            {/* Sub headers */}
            {!isForgotPassword ? (
              <div className="mb-6">
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Admin Gate Authorization</h2>
                <p className="text-slate-500 font-semibold mt-1">Provide secure administrator parameters to sign in.</p>
              </div>
            ) : (
              <div className="mb-6">
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Forgot password?</h2>
                <p className="text-slate-500 font-semibold mt-1 font-sans">Provide email address to dispatch reset instructions.</p>
              </div>
            )}

            {/* Auth error notices */}
            {authError && !isForgotPassword && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-[11px] font-bold text-rose-400 animate-slide-in">
                <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Reset password successes */}
            {forgotSuccess && isForgotPassword && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-[11px] font-bold text-emerald-400">
                <CheckCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* FORM */}
            {!isForgotPassword ? (
              <form onSubmit={handleFormSubmit} className="space-y-4 font-semibold">
                
                {/* Username field */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400">Username/Core Admin Email</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl focus:outline-none border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-700 focus:ring-1 focus:ring-sky-500"
                      placeholder="e.g. admin"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-400">Security Access Key Password</label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-[10px] font-extrabold text-sky-450 hover:text-sky-400 cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
                  
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 rounded-xl focus:outline-none border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-700 focus:ring-1 focus:ring-sky-500"
                      placeholder="••••••••••••"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-sky-400 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember me and login attempt flags */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded-md border-slate-800 bg-slate-950 accent-sky-500"
                    />
                    <span>Remember criteria details</span>
                  </label>
                  
                  <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    <span>Session: 60m expiry</span>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-sky-500 hover:bg-sky-600 py-3 text-slate-950 font-extrabold text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 shadow-lg hover:shadow-sky-500/10 transition-all cursor-pointer disabled:bg-slate-800 disabled:text-slate-650 mt-2"
                >
                  {loading ? 'Authorizing handshakes...' : 'Verify Admin Account'}
                </button>
              </form>
            ) : (
              // FORGOT PASSWORD SUBMIT
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-400">Security Registered Email</span>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-705 focus:ring-1 focus:ring-sky-500"
                    placeholder="admin@woo-admin.com"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setForgotSuccess('');
                    }}
                    className="flex-1 rounded-xl border py-2.5 font-bold hover:bg-slate-800 text-slate-350 border-slate-805 cursor-pointer hover:text-white transition-colors"
                  >
                    Back to login
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-xl bg-sky-500 hover:bg-sky-600 py-2.5 text-slate-950 font-extrabold cursor-pointer transition-colors disabled:bg-slate-800"
                  >
                    {loading ? 'Processing...' : 'Discharge mail'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="text-center mt-6 text-slate-500 flex items-center justify-center gap-1 font-medium select-none text-[10px]">
            <Unlock className="h-3 w-3" />
            <span>Standalone full-stack cryptographic endpoint</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Preset Accounts testing playground */}
        <div className="p-8 bg-slate-950 border-l border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-sky-400 mb-3.5 font-bold">
              <Sparkles className="h-4.5 w-4.5" />
              <span className="uppercase tracking-wider text-[10px]">Playground Preset Credentials</span>
            </div>
            
            <p className="font-semibold text-slate-450 mb-4">
              The application seeds standard roles securely during initial setup. Select one to automatically fill testing details:
            </p>

            <div className="space-y-3 font-semibold">
              {presetAccounts.map((account) => (
                <button
                  key={account.user}
                  type="button"
                  onClick={() => handleAutofill(account.user, account.pass)}
                  className="w-full text-left p-3.5 rounded-xl border border-slate-800 bg-slate-900 shadow-xs hover:border-sky-500/50 hover:bg-slate-900/80 transition-all duration-150 flex justify-between items-center cursor-pointer group"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-slate-200 font-black block group-hover:text-sky-400 transition-colors">
                      {account.label}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                      User: {account.user} • Pass: {account.pass}
                    </span>
                  </div>

                  <span className="text-[9px] font-black uppercase tracking-wider text-sky-400 border border-sky-500/15 bg-sky-500/5 px-2 py-0.5 rounded-full flex-shrink-0">
                    {account.scope}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-800 pt-4 text-[10px] font-medium text-slate-500 leading-normal flex gap-2 items-start">
            <Info className="h-4.5 w-4.5 text-slate-500 flex-shrink-0 mt-0.5" />
            <p>Stand-alone mode enables fully operational SQLite-simulated WordPress API endpoints. Seamless connection of WooCommerce sites in settings tab!</p>
          </div>
        </div>

      </div>

    </div>
  );
};
