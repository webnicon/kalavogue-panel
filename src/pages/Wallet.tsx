import React, { useEffect, useState } from 'react';
import {
  Wallet,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  User,
  Activity,
  Plus,
  ArrowUpDown,
  History,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  Mail,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { apiService } from '../services/api.js';
import { WooCommerceUser, WalletTransaction } from '../types.js';
import { useSettings } from '../context/SettingsContext.js';

export const WalletPage: React.FC = () => {
  const { addNotification, settings, connectionStatus } = useSettings();

  const formatPrice = (val: number) => {
    const currency = settings?.currency || 'INR';
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(val);
  };

  const [usersList, setUsersList] = useState<WooCommerceUser[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [stats, setStats] = useState({
    totalWallets: 0,
    activeWallets: 0,
    totalBalance: 0,
    averageBalance: 0
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters Schema
  const [searchTerm, setSearchTerm] = useState('');
  const [txSearchTerm, setTxSearchTerm] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all-wallets' | 'transactions'>('all-wallets');

  // Adjust Balance Form State
  const [selectedUserId, setSelectedUserId] = useState('');
  const [actionType, setActionType] = useState<'credit' | 'debit'>('credit');
  const [txAmount, setTxAmount] = useState('');
  const [txDetails, setTxDetails] = useState('');

  // Selected User helper
  const selectedUserObj = usersList.find(u => u.id === selectedUserId);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [usersRes, txRes, statsRes] = await Promise.all([
        apiService.getUsers(),
        apiService.getWalletTransactions(),
        apiService.getWalletStats()
      ]);

      setUsersList(usersRes.data.users);
      setTransactions(txRes.data.transactions);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed fetching Tera Wallet workspace properties:', err);
      addNotification('Could not read Tera Wallet properties. Operating in local safety cache mode.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      addNotification('Please choose a boutique client card first.', 'warning');
      return;
    }
    const parsedAmount = parseFloat(txAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      addNotification('Please enter a valid positive numeric balance amount.', 'warning');
      return;
    }
    if (!txDetails.trim()) {
      addNotification('Please write standard ledger audit remarks.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const targetUser = usersList.find(u => u.id === selectedUserId);
      if (actionType === 'debit' && targetUser && (targetUser.wallet_balance || 0) < parsedAmount) {
        addNotification(`Debit failure: Client has insufficient credits (${formatPrice(targetUser.wallet_balance)})`, 'error');
        setSubmitting(false);
        return;
      }

      const res = await apiService.createWalletTransaction({
        userId: selectedUserId,
        amount: parsedAmount,
        type: actionType,
        details: txDetails
      });

      if (res.data.success) {
        addNotification(`Successfully adjusted wallet balance for ${res.data.customer?.username}!`, 'success');
        
        // Reset Adjustment Form properties
        setTxAmount('');
        setTxDetails('');
        setSelectedUserId('');

        // Reload data properties
        await fetchWalletData();
      }
    } catch (err: any) {
      console.error('Wallet balance adjustment transaction failure:', err);
      addNotification(err.response?.data?.error || 'Failed to submit wallet balance adjustments.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickPreFill = (userId: string, type: 'credit' | 'debit') => {
    setSelectedUserId(userId);
    setActionType(type);
    // Find item top coordinate and scroll window smoothly
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  // Filter lists properties
  const filteredUsers = usersList.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.mobile.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.username.toLowerCase().includes(txSearchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(txSearchTerm.toLowerCase()) ||
      t.details.toLowerCase().includes(txSearchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(txSearchTerm.toLowerCase());
    const matchesType = !txTypeFilter || t.type === txTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Title Header Block */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Wallet className="h-6 w-6 text-amber-500" />
            Tera Wallet Ledger Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyze client-side dynamic wallets, deploy luxury credit adjustments, monitor WooCommerce microtransactions, and audit real-time database registers.
          </p>
        </div>

        <button
          onClick={fetchWalletData}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 font-bold px-4 py-2 text-xs text-slate-300 transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          Force Sync Database
        </button>
      </div>

      {/* Integration Banner Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-4 rounded-xl bg-amber-950/20 border border-amber-900/30 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-extrabold text-amber-400">WooCommerce Tera Wallet Plug Hook Registered</p>
            <p className="text-slate-400 leading-relaxed">
              When a luxury client checkout occurs, they can use credits in their portfolio balance. Balances modified inside the Kalavogue Master Panel sync in real-time with WooCommerce user meta keys <code className="bg-slate-950 px-1 text-amber-400 rounded">_uw_balance</code> and <code className="bg-slate-950 px-1 text-amber-400 rounded">wallet_balance</code>.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-start gap-3">
          <Info className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-slate-200">Handshake Pipeline Status</p>
            <p className="text-slate-400 leading-relaxed">
              Domain Connection: <span className="font-mono text-[9px] font-black uppercase text-amber-500">{connectionStatus?.statusLabel || 'Verifying'}</span>
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Latency Register: {connectionStatus?.responseTime ? `${connectionStatus.responseTime}ms` : '--'}
            </p>
          </div>
        </div>
      </div>

      {/* Key Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Pooled Balance */}
        <div className="rounded-xl border border-slate-850 bg-slate-900/40 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Pooled Credit</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-white">
            {loading ? '---' : formatPrice(stats.totalBalance)}
          </div>
          <p className="text-[9px] font-mono font-bold text-slate-500 uppercase mt-1">Sum of all customer wallets</p>
        </div>

        {/* Active Wallets */}
        <div className="rounded-xl border border-slate-850 bg-slate-900/40 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Wallets</span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-white">
            {loading ? '---' : `${stats.activeWallets} / ${stats.totalWallets}`}
          </div>
          <p className="text-[9px] font-mono font-bold text-slate-500 uppercase mt-1">Profiles with positive credit assets</p>
        </div>

        {/* Average Customer Balance */}
        <div className="rounded-xl border border-slate-850 bg-slate-900/40 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Average Asset Balance</span>
            <div className="rounded-lg bg-sky-500/10 p-2 text-sky-400">
              <ArrowUpDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-white">
            {loading ? '---' : formatPrice(stats.averageBalance)}
          </div>
          <p className="text-[9px] font-mono font-bold text-slate-500 uppercase mt-1">Average portfolio holdings ratio</p>
        </div>

        {/* Transaction Counter */}
        <div className="rounded-xl border border-slate-850 bg-slate-900/40 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ledger Logs Count</span>
            <div className="rounded-lg bg-rose-500/10 p-2 text-rose-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-white">
            {loading ? '---' : filteredTransactions.length}
          </div>
          <p className="text-[9px] font-mono font-bold text-slate-500 uppercase mt-1">Total audited micro-transactions</p>
        </div>
      </div>

      {/* Main Grid View: Left Adjust Balance Form, Right Live List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ADJUST BALANCES */}
        <div className="lg:col-span-4 h-fit">
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-500" />
                Adjust Luxury Credit
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">
                Configure direct adjustments to a specific boutique account database.
              </p>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-4">
              {/* Select Client Row */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select Boutique Client</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-805 rounded-lg text-xs p-2.5 text-slate-200 focus:border-amber-500 focus:outline-none"
                  required
                >
                  <option value="">-- Click to choose client --</option>
                  {usersList.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username.toUpperCase()} ({user.email}) — Bal: {formatPrice(user.wallet_balance || 0)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedUserObj && (
                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Selected Profile:</span>
                    <span className="font-extrabold text-white">{selectedUserObj.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact Reference:</span>
                    <span className="text-slate-350">{selectedUserObj.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mobile Reference:</span>
                    <span className="text-slate-350">{selectedUserObj.mobile || 'None provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Balance:</span>
                    <span className="font-bold text-amber-500 font-mono">{formatPrice(selectedUserObj.wallet_balance || 0)}</span>
                  </div>
                </div>
              )}

              {/* Action Toggle Selection */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActionType('credit')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-extrabold cursor-pointer transition-all
                    ${actionType === 'credit'
                      ? 'bg-emerald-950/30 border-emerald-500 text-emerald-400 shadow-md'
                      : 'bg-slate-950/50 border-slate-805 text-slate-500 hover:text-slate-300'
                    }
                  `}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Credit Account
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('debit')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-extrabold cursor-pointer transition-all
                    ${actionType === 'debit'
                      ? 'bg-rose-950/30 border-rose-500 text-rose-400 shadow-md'
                      : 'bg-slate-950/50 border-slate-805 text-slate-500 hover:text-slate-300'
                    }
                  `}
                >
                  <ArrowDownLeft className="h-4 w-4" />
                  Debit Account
                </button>
              </div>

              {/* Balance Amount Form */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Adjustment Amount ({settings?.currency || 'INR'})</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono text-slate-500 text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-805 rounded-lg text-xs p-2.5 pl-7 text-slate-200 focus:border-amber-500 focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              {/* Remarks Box */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Audit Remarks / Justification</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Compensation for order mismatch, VIP credit allocation, influencer topup offset..."
                  value={txDetails}
                  onChange={(e) => setTxDetails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-805 rounded-lg text-xs p-2.5 text-slate-200 focus:border-amber-500 focus:outline-none placeholder-slate-600 leading-relaxed"
                  required
                />
              </div>

              {/* Submit Trigger */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-3 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Registering adjustment ledger...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    Apply Wallet Adjustment
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: WALLETS GRID / TRANSACTIONS CHRONOLOGY */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Navigation Tab Selector */}
          <div className="flex border-b border-slate-800 gap-6">
            <button
              onClick={() => setActiveTab('all-wallets')}
              className={`pb-3 text-xs uppercase font-extrabold tracking-wider transition-all cursor-pointer relative
                ${activeTab === 'all-wallets' 
                  ? 'text-white border-b-2 border-amber-500' 
                  : 'text-slate-500 hover:text-slate-350'
                }
              `}
            >
              All Customer Wallets ({usersList.length})
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`pb-3 text-xs uppercase font-extrabold tracking-wider transition-all cursor-pointer relative
                ${activeTab === 'transactions' 
                  ? 'text-white border-b-2 border-amber-500' 
                  : 'text-slate-500 hover:text-slate-350'
                }
              `}
            >
              Auditable Transaction logs ({transactions.length})
            </button>
          </div>

          {/* ACTIVE TAB IS: ALL WALLETS */}
          {activeTab === 'all-wallets' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden flex flex-col">
              
              {/* Search Rails */}
              <div className="p-4 border-b border-slate-800/80 bg-slate-950/30 flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-550" />
                  <input
                    type="text"
                    placeholder="Search wallets by client username, email support..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 pl-10 pr-4 text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                  Returned {filteredUsers.length} profile entries
                </div>
              </div>

              {/* Wallets Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="px-6 py-4">Client Username</th>
                      <th className="px-6 py-4">Email Contact</th>
                      <th className="px-6 py-4">Total Orders</th>
                      <th className="px-6 py-4 text-right">Pocket Balance</th>
                      <th className="px-6 py-4 text-center">Fast Adjustments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-805/60">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10">
                          <div className="flex flex-col items-center gap-2">
                            <RefreshCw className="h-5 w-5 animate-spin text-amber-500" />
                            <span className="text-slate-500">Retrieving boutique client profiles...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-500">
                          No customer profiles exist matching search coordinates.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((client) => (
                        <tr key={client.id} className="hover:bg-slate-900/10 transition-colors">
                          <td className="px-6 py-3.5 font-bold text-white flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-black">
                              {client.username[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span>{client.username}</span>
                              <span className="text-[10px] text-slate-500 font-normal capitalize">Client Access Role: {client.role}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-slate-350">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3 text-slate-500" />
                              <span>{client.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 font-mono text-slate-400">
                            {client.total_orders || 0} purchases
                          </td>
                          <td className="px-6 py-3.5 text-right font-black font-mono text-amber-500 text-sm">
                            {formatPrice(client.wallet_balance || 0)}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleQuickPreFill(client.id, 'credit')}
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/20 border border-emerald-900/35 hover:bg-emerald-600 hover:text-slate-950 text-emerald-400 text-[10px] font-black cursor-pointer transition-all"
                                title="Credit Funds"
                              >
                                <ArrowUpRight className="h-3 w-3" />
                                Credit
                              </button>
                              <button
                                onClick={() => handleQuickPreFill(client.id, 'debit')}
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/20 border border-rose-900/35 hover:bg-rose-600 hover:text-slate-950 text-rose-450 text-[10px] font-black cursor-pointer transition-all"
                                title="Debit Funds"
                              >
                                <ArrowDownLeft className="h-3 w-3" />
                                Debit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ACTIVE TAB IS: TRANSACTIONS LOG CHRONOLOGY */}
          {activeTab === 'transactions' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden flex flex-col">
              
              {/* Filter controls */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/40 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter transaction logs by name, email, remarks, ID..."
                      value={txSearchTerm}
                      onChange={(e) => setTxSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-805 rounded-lg text-xs py-2 pl-9 pr-4 text-slate-200 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <select
                    value={txTypeFilter}
                    onChange={(e) => setTxTypeFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-805 rounded-lg text-xs px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">All Action Types</option>
                    <option value="credit">Credits Only (+)</option>
                    <option value="debit">Debits Only (-)</option>
                  </select>
                </div>
              </div>

              {/* Transactions Ledger log list */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="px-6 py-4">Transaction Details</th>
                      <th className="px-6 py-4">Associated Client</th>
                      <th className="px-6 py-4">Date & Time</th>
                      <th className="px-6 py-4">Amount Action</th>
                      <th className="px-6 py-4">Authorized By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-805/60">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10">
                          <div className="flex flex-col items-center gap-2">
                            <RefreshCw className="h-5 w-5 animate-spin text-amber-500" />
                            <span className="text-slate-500">Retrieving audit transaction log...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-500 font-medium">
                          No audit entries exist matching coordinates.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-900/10 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-0.5 max-w-sm">
                              <span className="font-extrabold text-white text-xs lowercase truncate bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 w-fit font-mono">
                                ID: #{tx.id}
                              </span>
                              <span className="text-slate-350 line-clamp-2 mt-1">{tx.details}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-250 hover:text-white transition-colors capitalize">{tx.username}</span>
                              <span className="text-[10px] text-slate-500 font-mono mt-0.5">{tx.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-550" />
                              <span>{new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <span className="text-[10px] text-slate-550">{new Date(tx.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono font-black text-right pr-12 text-sm">
                            {tx.type === 'credit' ? (
                              <span className="text-emerald-400 inline-flex items-center gap-0.5 bg-emerald-950/25 border border-emerald-900/40 px-2.5 py-1 rounded">
                                + {formatPrice(tx.amount)}
                              </span>
                            ) : (
                              <span className="text-rose-400 inline-flex items-center gap-0.5 bg-rose-950/25 border border-rose-900/40 px-2.5 py-1 rounded">
                                - {formatPrice(tx.amount)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col text-[11px]">
                              <span className="font-semibold text-slate-300 capitalize">{tx.admin}</span>
                              <span className="text-[9px] text-slate-550 tracking-widest font-mono uppercase font-black">Authorized Unit</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
