import React, { useEffect, useState } from 'react';
import { 
  History, 
  Search, 
  Trash2, 
  ShieldAlert, 
  Terminal, 
  Info, 
  AlertTriangle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { apiService } from '../services/api.js';
import { SystemLog } from '../types.js';
import { useSettings } from '../context/SettingsContext.js';
import { useAuth } from '../context/AuthContext.js';

export const Logs: React.FC = () => {
  const { addNotification } = useSettings();
  const { user } = useAuth();

  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiService.getLogs();
      setLogs(res.data.logs);
    } catch (err) {
      console.error('Failed fetching audits logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    if (user?.role !== 'Super Admin') {
      alert('Forbidden. Only Super Admins hold clearing logs permissions.');
      return;
    }

    if (!window.confirm('Clear all secure audit logs? This cannot be undone.')) return;
    try {
      const res = await apiService.clearLogs();
      setLogs(res.data.logs);
      addNotification('Audit trails cleared successfully.', 'warning');
    } catch (err) {
      console.error('Failed clearing log records:', err);
    }
  };

  // Filter logs logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.admin.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === '' || log.type === typeFilter;
    const matchesSeverity = severityFilter === '' || log.severity === severityFilter;
    return matchesSearch && matchesType && matchesSeverity;
  });

  const getLogIcon = (type: string, severity: string) => {
    if (severity === 'error') {
      return <ShieldAlert className="h-4 w-4 text-rose-400 animate-pulse" />;
    }
    if (severity === 'warning') {
      return <AlertTriangle className="h-4 w-4 text-amber-455" />;
    }
    return <Info className="h-4 w-4 text-sky-450" />;
  };

  return (
    <div className="space-y-6 text-xs text-slate-300 font-semibold font-sans">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Security Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse and monitor API handshakes, administrator activities, login attempts and stock alerts.
          </p>
        </div>

        {user?.role === 'Super Admin' && (
          <button
            onClick={handleClearLogs}
            disabled={logs.length <= 1}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 cursor-pointer disabled:opacity-40 transition-all font-sans"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear secure activity logs</span>
          </button>
        )}
      </div>

      {/* Filter items bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search action logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 font-bold"
        >
          <option value="">All Category Logs</option>
          <option value="auth">Auth & Session</option>
          <option value="product">Product Catalog</option>
          <option value="user">Customers Base</option>
          <option value="coupon">Discount Promos</option>
          <option value="settings">System settings</option>
          <option value="api">API Handshake</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 font-bold"
        >
          <option value="">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 text-slate-400 hover:text-white hover:bg-slate-900/60 cursor-pointer transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync logs trail</span>
        </button>
      </div>

      {/* Logs timeline list container */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-lg overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-800 p-4 bg-slate-950/30">
          <Terminal className="h-4.5 w-4.5 text-sky-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Terminal security log trail</span>
        </div>

        <div className="p-5 space-y-4 max-h-[640px] overflow-y-auto">
          {loading ? (
            <p className="text-center py-6 text-slate-500 animate-pulse">Recalibrating security audits...</p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-center py-6 text-slate-500">No audit trail logs match specifications.</p>
          ) : (
            filteredLogs.map((log) => {
              return (
                <div key={log.id} className="flex gap-4 items-start pl-2 transition-colors py-2 rounded-lg hover:bg-slate-955/30 border border-transparent hover:border-slate-805/10">
                  <div className="mt-1 flex-shrink-0">
                    {getLogIcon(log.type, log.severity)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 font-bold leading-normal">
                      {log.message}
                    </p>
                    
                    <div className="flex items-center flex-wrap gap-2.5 mt-1.5 text-[10px] text-slate-500 font-mono leading-none">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </span>
                      <span>• Admin user: {log.admin}</span>
                      {log.ip && <span>• IP: {log.ip}</span>}
                    </div>
                  </div>

                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-tight flex-shrink-0 border
                    ${log.severity === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/25' : ''}
                    ${log.severity === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' : ''}
                    ${log.severity === 'info' ? 'bg-sky-500/10 text-sky-400 border-sky-500/25' : ''}
                  `}>
                    {log.type}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
