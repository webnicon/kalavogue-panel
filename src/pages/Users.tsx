import React, { useEffect, useState } from 'react';
import { 
  Users2, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Trash2, 
  Download, 
  History, 
  Wallet, 
  Eye, 
  X,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { apiService } from '../services/api.js';
import { WooCommerceUser } from '../types.js';
import { useSettings } from '../context/SettingsContext.js';
import { useAuth } from '../context/AuthContext.js';

export const Users: React.FC = () => {
  const { addNotification, settings } = useSettings();
  const { user: loggedInAdmin } = useAuth();

  const formatPrice = (val: number) => {
    const currency = settings?.currency || 'INR';
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(val);
  };

  const [usersList, setUsersList] = useState<WooCommerceUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals state
  const [activeUserDetail, setActiveUserDetail] = useState<WooCommerceUser | null>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [formMobile, setFormMobile] = useState('');
  const [formWallet, setFormWallet] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiService.getUsers({
        search: searchTerm,
        role: selectedRole,
        status: selectedStatus
      });
      setUsersList(res.data.users);
    } catch (err) {
      console.error('Failed fetching users list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, selectedRole, selectedStatus]);

  // Handle Ban / Unban triggers
  const handleToggleBan = async (u: WooCommerceUser) => {
    const targetStatus = u.status === 'banned' ? 'active' : 'banned';
    const confirmAction = window.confirm(`Change account status of "${u.username}" to ${targetStatus.toUpperCase()}?`);
    if (!confirmAction) return;

    try {
      const res = await apiService.updateUser(u.id, { status: targetStatus });
      setUsersList(prev => prev.map(usr => usr.id === u.id ? res.data : usr));
      if (activeUserDetail && activeUserDetail.id === u.id) {
        setActiveUserDetail(res.data);
      }
      addNotification(`User "${u.username}" has been successfully ${targetStatus === 'banned' ? 'banned' : 'activated'}.`, targetStatus === 'banned' ? 'warning' : 'success');
    } catch (err: any) {
      console.error('Failed updating account status', err);
      alert(err.response?.data?.error || 'Failed updating status.');
    }
  };

  // Handle address/billing edit
  const handleOpenEditAddress = (u: WooCommerceUser) => {
    setFormMobile(u.mobile);
    setFormWallet(u.wallet_balance.toString());
    setIsEditingAddress(true);
  };

  const handleEditSubmitAddress = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    try {
      const res = await apiService.updateUser(id, {
        mobile: formMobile,
        wallet_balance: parseFloat(formWallet) || 0
      });
      setUsersList(prev => prev.map(usr => usr.id === id ? res.data : usr));
      setActiveUserDetail(res.data);
      setIsEditingAddress(false);
      addNotification(`Customer parameters saved.`, 'success');
    } catch (err) {
      console.error('Failed saving billing metrics:', err);
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async (id: string, name: string) => {
    if (loggedInAdmin?.role !== 'Super Admin') {
      alert('Forbidden. Only Super Admins are privileged to delete registered customer metadata.');
      return;
    }

    if (!window.confirm(`Are you absolutely sure you want to completely PURGE customer "${name}"? This deletes order associations.`)) return;
    try {
      await apiService.deleteUser(id);
      addNotification(`Purged customer registration for "${name}".`, 'warning');
      setSelectedStatus('');
      fetchUsers();
    } catch (err) {
      console.error('Failed deleting customer:', err);
    }
  };

  // EXPORT CLIENT-SIDE CSV PROCESS (REAL-INTEGRATION - NO PLACEHOLDER MOCKS!)
  const exportUsersToCSV = () => {
    if (usersList.length === 0) return;

    // Headings values
    const headings = ['User ID', 'Username', 'Email', 'Mobile Line', 'Account Type', 'Registration Date', 'Total Orders Placed', `Wallet Balance (${settings?.currency || 'INR'})`, 'Status'];
    
    // Rows mapping
    const rows = usersList.map((usr) => [
      usr.id,
      usr.username,
      usr.email,
      `"${usr.mobile}"`,
      usr.role,
      new Date(usr.registration_date).toLocaleDateString(),
      usr.total_orders,
      usr.wallet_balance.toFixed(2),
      usr.status
    ]);

    // Comma joins
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headings.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `woocommerce_customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); // Required for FF
    
    link.click();
    document.body.removeChild(link);
    addNotification('CSV downloaded with customer profiles.', 'success');
  };

  const mapRoleColors = (role: string) => {
    switch (role) {
      case 'vendor':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'subscriber':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      default:
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Registered WooCommerce Users
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Perform administrative customer reviews, activate or block billing privileges, and audit order histories.
          </p>
        </div>

        <button
          onClick={exportUsersToCSV}
          disabled={usersList.length === 0}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-850 px-4 py-2.5 text-xs font-bold text-slate-300 cursor-pointer transition-colors"
        >
          <Download className="h-4 w-4 text-slate-550" />
          <span>Export Customers Base (CSV)</span>
        </button>
      </div>

      {/* Query filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-slate-305 focus:outline-none focus:ring-1 focus:ring-sky-500 font-bold"
        >
          <option value="">All Account Roles</option>
          <option value="customer">Customer</option>
          <option value="subscriber">Subscriber</option>
          <option value="vendor">Vendor</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-slate-305 focus:outline-none focus:ring-1 focus:ring-sky-500 font-bold"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>

        <div className="flex h-9 items-center justify-end rounded-lg px-2 bg-slate-950/40 border border-slate-800 text-xs font-semibold text-slate-400">
          <span>Users cached: {usersList.length}</span>
        </div>
      </div>

      {/* Main Table of WooCommerce customers */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-955/20 text-slate-500">
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">User Name</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">Email & Mobile</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">Role Type</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">Registered</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px] text-center">Orders</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px] text-right">Wallet Balance</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px] text-center">Status</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-semibold text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs font-medium animate-pulse">
                    Loading directory files...
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs font-medium">
                    No registry rows match selectors.
                  </td>
                </tr>
              ) : (
                usersList.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-950/45 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-slate-850 flex items-center justify-center font-bold text-slate-300 border border-slate-800">
                          {usr.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-bold">{usr.username}</span>
                      </div>
                    </td>

                    <td className="py-4 px-3">
                      <p className="font-semibold text-slate-300 leading-tight">
                        {usr.email}
                      </p>
                      <p className="text-[10px] font-mono text-slate-550 font-medium leading-none mt-1">
                        {usr.mobile}
                      </p>
                    </td>

                    <td className="py-4 px-3">
                      <span className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-tight border ${mapRoleColors(usr.role)}`}>
                        {usr.role}
                      </span>
                    </td>

                    <td className="py-4 px-3 text-slate-500 text-[11px] font-semibold">
                      {new Date(usr.registration_date).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-3 text-center font-mono">
                      {usr.total_orders}
                    </td>

                    <td className="py-4 px-3 text-right font-mono font-bold text-sky-450">
                      {formatPrice(usr.wallet_balance)}
                    </td>

                    <td className="py-4 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 leading-none rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide border
                        ${usr.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}
                      `}>
                        {usr.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-1.5 font-sans">
                        <button
                          onClick={() => setActiveUserDetail(usr)}
                          className="p-1 px-1.5 border border-slate-800 bg-slate-950/40 rounded-lg text-slate-400 hover:text-sky-400 hover:border-sky-500/30 transition-colors shadow-sm cursor-pointer"
                          title="View Order Logs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        
                        <button
                          onClick={() => handleToggleBan(usr)}
                          className={`p-1 px-1.5 border rounded-lg shadow-sm bg-slate-950/40 cursor-pointer transition-all
                            ${usr.status === 'banned'
                              ? 'border-emerald-500/20 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                              : 'border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                            }
                          `}
                          title={usr.status === 'banned' ? 'Restore Privileges' : 'Revoke Settings access'}
                        >
                          {usr.status === 'banned' ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                        </button>

                        {loggedInAdmin?.role === 'Super Admin' && (
                          <button
                            onClick={() => handleDeleteCustomer(usr.id, usr.username)}
                            className="p-1 px-1.5 border border-slate-800 bg-slate-950/45 rounded-lg text-slate-400 hover:text-rose-400 hover:border-rose-500/20 shadow-sm cursor-pointer transition-colors"
                            title="Purge completely"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DYNAMIC USER DETAIL POPUP (Contains histories, logging activity coordinates) */}
      {activeUserDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 shadow-2xl rounded-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-800">
            {/* Modal Header */}
            <div className="flex h-14 items-center justify-between px-5 border-b border-slate-800 bg-slate-955/45">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Auditing user: {activeUserDetail.username}
              </span>
              <button
                onClick={() => {
                  setActiveUserDetail(null);
                  setIsEditingAddress(false);
                }}
                className="rounded-lg h-7 w-7 text-slate-500 hover:text-slate-300 hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Scrollable specs */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs text-slate-300">
              
              {/* Wallet and line summary parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-sky-500/10 bg-sky-500/5 flex items-center gap-3">
                  <Wallet className="h-6 w-6 text-sky-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Wallet balance</span>
                    <span className="text-base font-extrabold text-sky-300 font-mono mt-1 block">
                      {formatPrice(activeUserDetail.wallet_balance)}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-850 bg-slate-955/20 flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Status Level</span>
                    <span className="text-xs font-extrabold text-slate-200 mt-1 block uppercase">
                      {activeUserDetail.status} Subscriber
                    </span>
                  </div>
                </div>
              </div>

              {/* Editing address attributes */}
              {isEditingAddress ? (
                <form onSubmit={(e) => handleEditSubmitAddress(e, activeUserDetail.id)} className="p-4 rounded-xl border border-slate-800 space-y-3 bg-slate-950/40">
                  <span className="font-bold text-white">Set mobile and balance values:</span>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2 font-sans">
                    <div className="space-y-1">
                      <span>Customer Mobile</span>
                      <input
                        type="text"
                        value={formMobile}
                        onChange={(e) => setFormMobile(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    <div className="space-y-1">
                      <span>Adsorb Balance ({settings?.currency === 'INR' ? '₹' : (settings?.currency === 'EUR' ? '€' : (settings?.currency === 'GBP' ? '£' : '$'))})</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formWallet}
                        onChange={(e) => setFormWallet(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(false)}
                      className="px-3 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 rounded text-[11px] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1 bg-sky-500 text-slate-955 hover:bg-sky-600 rounded text-[11px] font-extrabold cursor-pointer transition-colors"
                    >
                      Save parameters
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-center p-3 rounded-xl border border-dashed border-slate-800 bg-slate-950/30">
                  <div className="font-semibold">
                    <span className="text-slate-400 mr-2 font-sans">Mobile:</span>
                    <span className="text-slate-200 font-mono">{activeUserDetail.mobile}</span>
                  </div>
                  
                  <button
                    onClick={() => handleOpenEditAddress(activeUserDetail)}
                    className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-bold cursor-pointer transition-colors"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Change billing parameters</span>
                  </button>
                </div>
              )}

              {/* Order Histories list */}
              <div className="space-y-2.5">
                <span className="font-bold text-slate-400 uppercase tracking-tight text-[10px] block">WooCommerce transaction volumes</span>
                
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {activeUserDetail.order_history.length === 0 ? (
                    <p className="text-slate-500 py-2">No preceding purchases found.</p>
                  ) : (
                    activeUserDetail.order_history.map((order) => (
                      <div key={order.orderId} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-850 bg-slate-950/20">
                        <div className="font-semibold">
                          <span className="text-sky-400 font-mono text-xs block">{order.orderId}</span>
                          <span className="text-[10px] text-slate-500">{new Date(order.date).toLocaleDateString()}</span>
                        </div>

                        <div className="text-right font-semibold">
                          <span className="text-xs font-bold block font-mono text-white">{formatPrice(order.total)}</span>
                          <span className="text-[9px] uppercase tracking-wider text-emerald-450 font-extrabold">{order.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Login trail tracking logs */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <History className="h-4 w-4 text-emerald-400" />
                  <span className="font-bold text-slate-400 uppercase tracking-tight text-[10px]">Access validation trail (Security logs)</span>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1 font-mono text-[10px]">
                  {activeUserDetail.login_logs.length === 0 ? (
                    <p className="text-slate-500 py-2">No audits cached.</p>
                  ) : (
                    activeUserDetail.login_logs.map((log, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-950/40 border border-slate-850 p-2 rounded">
                        <div>
                          <span className="text-slate-300 font-bold">{log.ip}</span>
                          <span className="text-[9px] text-slate-500 block font-sans">{log.userAgent}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 block">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span className={`text-[8px] font-extrabold uppercase ${log.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>{log.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
