import React, { useEffect, useState, useRef } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Users2, 
  Percent, 
  AlertTriangle, 
  TrendingUp, 
  RefreshCw, 
  ShieldCheck, 
  FileText,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis,
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { apiService } from '../services/api.js';
import { DashboardStats, WooCommerceOrder, SystemLog } from '../types.js';
import { useSettings } from '../context/SettingsContext.js';

interface LowStockAlert {
  id: string;
  name: string;
  stock: number;
  sku: string;
}

export const Dashboard: React.FC<{ onTabChange: (tab: string) => void }> = ({ onTabChange }) => {
  const { addNotification, theme, settings } = useSettings();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<WooCommerceOrder[]>([]);
  const [recentActivities, setRecentActivities] = useState<SystemLog[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic states representing WooCommerce sales and category distributions
  const [revenueChartData, setRevenueChartData] = useState<{ name: string; Sales: number }[]>([
    { name: 'Monday', Sales: 420 },
    { name: 'Tuesday', Sales: 550 },
    { name: 'Wednesday', Sales: 780 },
    { name: 'Thursday', Sales: 620 },
    { name: 'Friday', Sales: 890 },
    { name: 'Saturday', Sales: 1250 },
    { name: 'Sunday', Sales: 1040 }
  ]);

  const [categoriesChartData, setCategoriesChartData] = useState<{ name: string; count: number; color: string }[]>([
    { name: 'Electronics', count: 18, color: '#38bdf8' },
    { name: 'Wearables', count: 7, color: '#f59e0b' },
    { name: 'Home Office', count: 12, color: '#10b981' },
    { name: 'Furniture', count: 15, color: '#ef4444' },
    { name: 'Accessories', count: 24, color: '#0ea5e9' }
  ]);

  // Scratchpad Notes State and Debouncing
  const [adminNotes, setAdminNotes] = useState('');
  const [notesStatus, setNotesStatus] = useState<'idle' | 'typing' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const statsRes = await apiService.getDashboardStats();
      const s = statsRes.data;
      setStats(s.stats);
      setRecentOrders(s.recentOrders);
      setRecentActivities(s.recentActivities);
      setLowStockAlerts(s.lowStockAlerts);
      
      if (s.revenueChartData && s.revenueChartData.length > 0) {
        setRevenueChartData(s.revenueChartData);
      }
      if (s.categoriesChartData && s.categoriesChartData.length > 0) {
        setCategoriesChartData(s.categoriesChartData);
      }

      // Fetch Notepad
      const notesRes = await apiService.getNotes();
      if (notesRes.data.notes && notesRes.data.notes.length > 0) {
        setAdminNotes(notesRes.data.notes[0].content);
      }
    } catch (err) {
      console.error('Failed fetching core analytics datasets:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setAdminNotes(text);
    setNotesStatus('typing');

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setNotesStatus('saving');
      try {
        await apiService.saveNotes(text);
        setNotesStatus('saved');
        setTimeout(() => setNotesStatus('idle'), 2000);
      } catch (err) {
        console.error('Failed auto-saving scratchnote content:', err);
        setNotesStatus('idle');
      }
    }, 1200); // 1.2 second debounce
  };

  const executeManualRefresh = () => {
    fetchDashboardData(true);
    addNotification('Dashboard analytics datasets updated live.', 'info');
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  // Format helper for dynamic prices based on store settings
  const formatPrice = (val: number) => {
    const currency = settings?.currency || 'INR';
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Visual greeting and triggers */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Store Metrics Analytics Overview
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time analytics and metrics synced dynamically with your WooCommerce store configuration.
          </p>
        </div>
        
        <button
          onClick={executeManualRefresh}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-600 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Pull Live Stats'}
        </button>
      </div>

      {/* Stats Cards Dashboard grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-550">
              WooCommerce Revenue
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-white">
              {stats ? formatPrice(stats.totalRevenue) : '$0.00'}
            </h3>
            <div className={`flex items-center gap-1.5 mt-2 text-[10px] font-semibold ${stats && stats.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              <TrendingUp className={`h-3 w-3 ${stats && stats.revenueGrowth >= 0 ? '' : 'transform rotate-180'}`} />
              <span>{stats && stats.revenueGrowth >= 0 ? '+' : ''}{stats ? stats.revenueGrowth.toFixed(1) : '18.4'}% growth comparison</span>
            </div>
          </div>
        </div>

        {/* Total Products */}
        <button
          onClick={() => onTabChange('products')}
          className="text-left block w-full rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-lg hover:border-slate-705 transition-all duration-150 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-550">
              Active Products
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-white">
              {stats ? stats.totalProducts : 0}
            </h3>
            <p className="text-[10px] font-semibold text-slate-500 mt-2">
              Syncing with custom local listings
            </p>
          </div>
        </button>

        {/* Total Users */}
        <button
          onClick={() => onTabChange('users')}
          className="text-left block w-full rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-lg hover:border-slate-705 transition-all duration-150 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-550">
              Customers Base
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Users2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-white">
              {stats ? stats.totalUsers : 0}
            </h3>
            <p className="text-[10px] font-semibold text-sky-400 mt-2">
              2 vendors, {stats ? stats.totalUsers - 2 : 0} customers
            </p>
          </div>
        </button>

        {/* Coupons Active */}
        <button
          onClick={() => onTabChange('coupons')}
          className="text-left block w-full rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-lg hover:border-slate-705 transition-all duration-150 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-550">
              Active Promo Coupons
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-white">
              {stats ? stats.totalCoupons : 0}
            </h3>
            <p className="text-[10px] font-semibold text-slate-500 mt-2">
              Discount campaigns configured
            </p>
          </div>
        </button>
      </div>

      {/* Sales Charts + Distribution Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales curves area */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white">
                Weekly Revenue Curves
              </h4>
              <p className="text-[10px] text-slate-500">
                Daily completed/processing transaction value trend timeline.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold text-sky-400 border border-sky-500/20">
              USD Trend
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '8px',
                    border: '1px solid #1e293b',
                    fontSize: '11px',
                    color: '#f1f5f9'
                  }} 
                />
                <Area type="monotone" dataKey="Sales" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories breakdown circular-ish Bar charts */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-lg">
          <h4 className="text-sm font-bold text-white mb-1">
            Product Category Density
          </h4>
          <p className="text-[10px] text-slate-500 mb-4">
            Inventory metrics breakdown.
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoriesChartData} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', 
                    borderRadius: '8px',
                    border: theme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {categoriesChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/40 grid grid-cols-2 gap-2 text-[10px] font-semibold">
            {categoriesChartData.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 text-slate-400 font-mono">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                <span>{c.name}: {c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Note scratchpad auto save, Recent activities and product alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent orders table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white">
                Recent Orders Stream
              </h4>
              <p className="text-[10px] text-slate-500">
                Latest transactions imported safely.
              </p>
            </div>
            
            <button
              onClick={() => onTabChange('users')}
              className="text-xs font-bold text-sky-450 hover:text-sky-400 flex items-center gap-0.5 cursor-pointer"
            >
              <span>Audit customers</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 pb-2">
                  <th className="py-2.5 font-bold uppercase tracking-wider text-[10px]">Order No</th>
                  <th className="py-2.5 font-bold uppercase tracking-wider text-[10px]">Customer</th>
                  <th className="py-2.5 font-bold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="py-2.5 font-bold uppercase tracking-wider text-[10px] text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-805/40 font-semibold text-slate-350">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500">
                      No matching records.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-950/40">
                      <td className="py-3 font-mono text-sky-400 text-xs">
                        {ord.order_number}
                      </td>
                      <td className="py-3 text-slate-300">
                        {ord.customer_name}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide
                          ${ord.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : ''}
                          ${ord.status === 'processing' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : ''}
                          ${ord.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : ''}
                        `}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-slate-200">
                        {formatPrice(ord.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Auto Saving Scratchpad */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-sky-400" />
                <h4 className="text-sm font-bold text-white">
                  Global Scratchpad
                </h4>
              </div>

              {/* Little status indicator */}
              <div className="text-[10px] font-medium font-mono text-slate-500">
                {notesStatus === 'typing' && <span className="text-amber-400">Typing...</span>}
                {notesStatus === 'saving' && <span className="text-sky-405 animate-pulse">Saving draft...</span>}
                {notesStatus === 'saved' && <span className="text-emerald-400">Auto-saved</span>}
                {notesStatus === 'idle' && <span>Connected</span>}
              </div>
            </div>
            
            <p className="text-[10px] text-slate-550 mb-3">
              Jotted text auto-saves securely to local server disk storage. Perfect for quick admin notices and updates.
            </p>
          </div>

          <textarea
            value={adminNotes}
            onChange={handleNotesChange}
            placeholder="Type your notes here...
For example:
- Review coupon usage
- Call apparel warehouse
- Revise SKU names on Tuesday"
            className="w-full flex-1 rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300 font-medium placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none min-h-[160px]"
          />
        </div>
      </div>

      {/* Grid: Low Stock Alert Warning Panel + Recent Activities Streams */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Low Stock alerting */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4.5 w-4.5 text-rose-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-display">
              Low Stock Alerts
            </h4>
          </div>
          <p className="text-[10px] text-slate-500 mb-4">
            Products falling below minimum count (15 units).
          </p>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {lowStockAlerts.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                All catalog items are stocked up!
              </div>
            ) : (
              lowStockAlerts.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/10"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs font-bold text-slate-300 truncate">
                      {item.name}
                    </p>
                    <span className="text-[9px] font-mono text-slate-500">
                      SKU: {item.sku}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 flex-shrink-0">
                    {item.stock} left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Audit Activities Stream */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-sky-450" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                Security & Audit Trail
              </h4>
            </div>
            
            <button
              onClick={() => onTabChange('logs')}
              className="text-xs font-bold text-sky-400 hover:text-sky-305 cursor-pointer"
            >
              Full trail
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1 text-xs">
            {recentActivities.length === 0 ? (
              <p className="text-center py-6 text-slate-500">
                No audited logs yet.
              </p>
            ) : (
              recentActivities.slice(0, 4).map((log) => (
                <div key={log.id} className="flex gap-3 items-start border-l-2 border-slate-800 pl-3 py-1">
                  <Clock className="h-3.5 w-3.5 text-slate-500 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 font-semibold leading-relaxed">
                      {log.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-slate-500">
                      <span>Admin: {log.admin}</span>
                      {log.ip && <span>• IP: {log.ip}</span>}
                      <span>• {new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest border
                    ${log.severity === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : ''}
                    ${log.severity === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : ''}
                    ${log.severity === 'info' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : ''}
                  `}>
                    {log.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
