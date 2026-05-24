import React, { useEffect, useState } from 'react';
import { 
  Percent, 
  Plus, 
  Trash2, 
  Calendar, 
  AlertCircle, 
  ChevronRight, 
  RefreshCw,
  X,
  Sparkles,
  Ticket
} from 'lucide-react';
import { apiService } from '../services/api.js';
import { WooCommerceCoupon } from '../types.js';
import { useSettings } from '../context/SettingsContext.js';

export const Coupons: React.FC = () => {
  const { addNotification, settings } = useSettings();

  const formatPrice = (val: number) => {
    const currency = settings?.currency || 'INR';
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(val);
  };

  const [coupons, setCoupons] = useState<WooCommerceCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  // States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Field states
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<'percent' | 'fixed'>('percent');
  const [formAmount, setFormAmount] = useState('');
  const [formExpiry, setFormExpiry] = useState('');
  const [formUsageLimit, setFormUsageLimit] = useState('100');
  const [formMinAmount, setFormMinAmount] = useState('0');
  const [formStatus, setFormStatus] = useState<'active' | 'expired' | 'disabled'>('active');

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await apiService.getCoupons();
      setCoupons(res.data.coupons);
    } catch (err) {
      console.error('Failed fetching WooCommerce discount coupons', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openForm = (coupon: WooCommerceCoupon | null = null) => {
    if (coupon) {
      setEditingId(coupon.id);
      setFormCode(coupon.code);
      setFormType(coupon.discount_type);
      setFormAmount(coupon.amount.toString());
      setFormExpiry(coupon.expiry_date);
      setFormUsageLimit(coupon.usage_limit.toString());
      setFormMinAmount(coupon.min_amount.toString());
      setFormStatus(coupon.status);
    } else {
      setEditingId(null);
      setFormCode('');
      setFormType('percent');
      setFormAmount('');
      const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFormExpiry(defaultExpiry);
      setFormUsageLimit('100');
      setFormMinAmount('0');
      setFormStatus('active');
    }
    setIsFormOpen(true);
  };

  // Generate automated code snippet (REAL-INTEGRATION - NO MOCKS)
  const generateRandomCouponCode = () => {
    const campaigns = ['SUMMER', 'VIP', 'CLEARANCE', 'LOYAL', 'WINTER', 'SAVE'];
    const prefix = campaigns[Math.floor(Math.random() * campaigns.length)];
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const percentValues = ['10', '15', '20', '25', '50'];
    const chosenPercent = percentValues[Math.floor(Math.random() * percentValues.length)];
    
    setFormCode(`${prefix}${chosenPercent}-${randomHex}`);
    setFormAmount(chosenPercent);
    setFormType('percent');
    addNotification('Automated coupon code created.', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formAmount.trim()) {
      alert('Coupon code and discount value are required.');
      return;
    }

    const payload = {
      code: formCode.trim().toUpperCase(),
      discount_type: formType,
      amount: parseFloat(formAmount),
      expiry_date: formExpiry,
      usage_limit: parseInt(formUsageLimit) || 100,
      min_amount: parseFloat(formMinAmount) || 0,
      status: formStatus
    };

    try {
      if (editingId) {
        await apiService.updateCoupon(editingId, payload);
        addNotification(`Coupon "${formCode.toUpperCase()}" updated successfully.`, 'success');
      } else {
        await apiService.createCoupon(payload);
        addNotification(`New active coupon campaign "${formCode.toUpperCase()}" launched.`, 'success');
      }
      setIsFormOpen(false);
      fetchCoupons();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed saving coupon codes.');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete WooCommerce coupon "${code}"?`)) return;
    try {
      await apiService.deleteCoupon(id);
      addNotification(`Deleted coupon campaign "${code}".`, 'warning');
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            WooCommerce Coupon Campaigns
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Build, edit and delete discounts parameters, usage constraints limits, and set targeted WooCommerce checkouts.
          </p>
        </div>

        <button
          onClick={() => openForm(null)}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 px-4 py-2.5 text-xs font-extrabold text-slate-955 transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Launch coupon campaign</span>
        </button>
      </div>

      {/* Grid of coupons cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs font-semibold animate-pulse">
            Loading active campaigns logs...
          </div>
        ) : coupons.length === 0 ? (
          <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-slate-800 p-8 flex flex-col items-center justify-center gap-2">
            <Ticket className="h-10 w-10 text-slate-700" />
            <span className="text-xs font-bold text-slate-500">No promo codes registered.</span>
          </div>
        ) : (
          coupons.map((c) => {
            const isExpired = c.status === 'expired' || new Date(c.expiry_date).getTime() < Date.now();
            const usagePercent = Math.min(100, Math.floor((c.usage_count / c.usage_limit) * 100));

            return (
              <div 
                key={c.id} 
                className={`relative rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg flex flex-col justify-between h-48 overflow-hidden backdrop-blur-md transition-all hover:border-slate-700
                  ${isExpired ? 'opacity-50' : ''}
                `}
              >
                {/* Visual dash separator simulation typical of coupon tickets */}
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-2 bg-slate-955 border border-slate-800 border-l-0 rounded-r-full" />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-2 bg-slate-955 border border-slate-800 border-r-0 rounded-l-full" />

                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-extrabold text-xs text-sky-400 tracking-wider bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 uppercase">
                      {c.code}
                    </span>
                    
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border
                      ${c.status === 'active' && !isExpired ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                      ${c.status === 'expired' || isExpired ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : ''}
                      ${c.status === 'disabled' ? 'bg-slate-850 text-slate-400 border-slate-800' : ''}
                    `}>
                      {isExpired ? 'Expired' : c.status}
                    </span>
                  </div>

                  <div className="mt-3.5">
                    <p className="text-lg font-bold text-white leading-none">
                      {c.discount_type === 'percent' ? `${c.amount}% Percent discount` : `${formatPrice(c.amount)} Flat discount`}
                    </p>
                    
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 mt-2 font-mono">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Expires {new Date(c.expiry_date).toLocaleDateString()} • Minimum cart: {formatPrice(c.min_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar and delete buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1">
                      <span>Usages: {c.usage_count}/{c.usage_limit}</span>
                      <span>{usagePercent}% utilized</span>
                    </div>

                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                      <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${usagePercent}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openForm(c)}
                      className="text-[10px] font-bold text-sky-400 hover:text-white bg-sky-500/10 px-2 py-1.5 rounded cursor-pointer transition-colors border border-sky-500/15"
                    >
                      Alter Settings
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.code)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded hover:bg-slate-950/40 cursor-pointer transition-colors"
                      title="Expire code"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Campaign Form Container */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 shadow-2xl rounded-2xl flex flex-col overflow-hidden border border-slate-800">
            {/* Modal Heading */}
            <div className="flex h-14 items-center justify-between px-5 border-b border-slate-800 bg-slate-950/45">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {editingId ? 'Modify Coupon Campaign parameters' : 'Create Coupon Campaign'}
              </span>
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg h-7 w-7 text-slate-500 hover:text-slate-300 hover:bg-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-300">
              
              {/* Promo code triggering generation */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-400">Coupon Code *</label>
                  {!editingId && (
                    <button
                      type="button"
                      onClick={generateRandomCouponCode}
                      className="text-[10px] font-extrabold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Auto-Generate Code</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  disabled={!!editingId} // cannot change active URL promo parameters
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 uppercase font-black tracking-widest focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-200"
                  placeholder="e.g. SAVE30NOW"
                />
              </div>

              {/* Discount selection and numbers */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Discount Type</label>
                  <select
                    value={formType}
                    onChange={(e: any) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 font-bold"
                  >
                    <option value="percent">Percentage Off (%)</option>
                    <option value="fixed">Fixed Cart Amount ({settings?.currency === 'INR' ? '₹' : (settings?.currency === 'EUR' ? '€' : (settings?.currency === 'GBP' ? '£' : '$'))})</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Discount Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-200 font-bold font-mono"
                    placeholder="e.g. 20"
                  />
                </div>
              </div>

              {/* Usage thresholds constraint configs */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={formExpiry}
                    onChange={(e) => setFormExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-250 font-medium font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Maximum Usage Counts</label>
                  <input
                    type="number"
                    required
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-200 font-semibold font-mono"
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Minimum Cart Total ({settings?.currency === 'INR' ? '₹' : (settings?.currency === 'EUR' ? '€' : (settings?.currency === 'GBP' ? '£' : '$'))})</label>
                  <input
                    type="number"
                    value={formMinAmount}
                    onChange={(e) => setFormMinAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-200 font-semibold font-mono"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Coupon Status</label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-slate-350 focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
                  >
                    <option value="active">Active campaign</option>
                    <option value="expired">Mark Expired</option>
                    <option value="disabled">Disabled / Paused</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-800 rounded-lg hover:bg-slate-850 font-bold text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 text-slate-955 rounded-lg hover:bg-sky-600 font-extrabold cursor-pointer transition-colors"
                >
                  Save discount rules
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
