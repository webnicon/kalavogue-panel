import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Receipt, 
  Plus, 
  Trash2, 
  Eye, 
  RefreshCw, 
  X, 
  ChevronRight, 
  Download, 
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  CircleSlash,
  Calendar,
  DollarSign,
  User,
  ShoppingBag
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { apiService } from '../services/api.js';
import { WooCommerceOrder, OrderItem } from '../types.js';
import { useSettings } from '../context/SettingsContext.js';

export const Orders: React.FC = () => {
  const { addNotification, settings } = useSettings();

  const [orders, setOrders] = useState<WooCommerceOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Popup Order Detail state
  const [selectedOrder, setSelectedOrder] = useState<WooCommerceOrder | null>(null);

  // Manual Form State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formBillingFirst, setFormBillingFirst] = useState<string>('');
  const [formBillingLast, setFormBillingLast] = useState<string>('');
  const [formBillingEmail, setFormBillingEmail] = useState<string>('');
  const [formBillingPhone, setFormBillingPhone] = useState<string>('');
  const [formAddress1, setFormAddress1] = useState<string>('');
  const [formCity, setFormCity] = useState<string>('');
  const [formState, setFormState] = useState<string>('');
  const [formPostcode, setFormPostcode] = useState<string>('');
  const [formCountry, setFormCountry] = useState<string>('US');
  const [formStatus, setFormStatus] = useState<string>('processing');
  const [formPaymentTitle, setFormPaymentTitle] = useState<string>('Credit Card');

  // Line items inside manual entry form
  const [formItems, setFormItems] = useState<{ name: string; quantity: number; price: number }[]>([
    { name: '', quantity: 1, price: 0 }
  ]);

  const fetchOrders = async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await apiService.getOrders({
        search: searchQuery || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      setOrders(res.data.orders);
    } catch (err) {
      console.error('Failed fetching WooCommerce orders', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchOrders();
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    // We delay slightly to let states clear or trigger fetch natively
    setTimeout(() => {
      fetchOrders();
    }, 50);
  };

  const handleStatusChange = async (id: string, currentNumber: string, status: string) => {
    try {
      await apiService.updateOrder(id, { status });
      addNotification(`Order #${currentNumber} updated to ${status}.`, 'success');
      // If order details popup is active, synchronize it
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder(prev => prev ? { ...prev, status: status as any } : null);
      }
      fetchOrders(true);
    } catch (err) {
      console.error(err);
      addNotification('Could not update order status.', 'error');
    }
  };

  const handleDeleteOrder = async (id: string, number: string) => {
    if (!window.confirm(`Are you sure you want to delete order #${number}?`)) return;
    try {
      await apiService.deleteOrder(id);
      addNotification(`Order #${number} deleted successfully.`, 'warning');
      if (selectedOrder?.id === id) setSelectedOrder(null);
      fetchOrders(true);
    } catch (err) {
      console.error(err);
      addNotification('Could not delete customer order.', 'error');
    }
  };

  const handleAddLineItem = () => {
    setFormItems(prev => [...prev, { name: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveLineItem = (idx: number) => {
    if (formItems.length === 1) return;
    setFormItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLineItemChange = (idx: number, field: 'name' | 'quantity' | 'price', val: any) => {
    setFormItems(prev => prev.map((item, i) => {
      if (i === idx) {
        return {
          ...item,
          [field]: field === 'name' ? val : parseFloat(val) || 0
        };
      }
      return item;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanItems = formItems.filter(item => item.name.trim() !== '');
    if (cleanItems.length === 0) {
      alert('Please include at least one valid line item for the order.');
      return;
    }

    const total = cleanItems.reduce((acc, current) => acc + (current.price * current.quantity), 0);

    const payload = {
      status: formStatus,
      payment_method_title: formPaymentTitle,
      total,
      billing: {
        first_name: formBillingFirst.trim() || 'Walk-in',
        last_name: formBillingLast.trim() || 'Customer',
        email: formBillingEmail.trim() || 'customer@example.com',
        phone: formBillingPhone.trim(),
        address_1: formAddress1.trim() || 'Storefront Walk-in Counter',
        city: formCity.trim() || 'Retail',
        state: formState.trim() || 'Internal',
        postcode: formPostcode.trim() || '00000',
        country: formCountry.trim() || 'US'
      },
      line_items: cleanItems
    };

    try {
      await apiService.createOrder(payload);
      addNotification('New purchase order registered.', 'success');
      setIsFormOpen(false);
      // Reset form states
      setFormBillingFirst('');
      setFormBillingLast('');
      setFormBillingEmail('');
      setFormBillingPhone('');
      setFormAddress1('');
      setFormCity('');
      setFormState('');
      setFormPostcode('');
      setFormItems([{ name: '', quantity: 1, price: 0 }]);
      fetchOrders();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to create Kalavogue purchase order.');
    }
  };

  // ADVANCED LUXURY CLOTHING BRAND CLIENT-SIDE PDF INVOICE GENERATOR (KALAVOGUE EXCLUSIVE)
  const downloadInvoicePDF = (order: WooCommerceOrder) => {
    try {
      const curSymbol = settings?.currency === 'INR' ? 'Rs ' : (settings?.currency === 'EUR' ? 'EUR ' : (settings?.currency === 'GBP' ? 'GBP ' : '$'));
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      // Luxurious color palette definitions
      const colorCharcoal = [26, 26, 26];       // Rich Pitch Black for major headings
      const colorAntiqueGold = [180, 142, 60];   // Luxury Antique Gold for accents
      const colorBodyText = [60, 60, 60];        // Elegant soft dark gray for readability
      const colorSecondary = [115, 115, 115];    // Refined slate gray for secondary metadata
      const colorIvoryZebra = [253, 252, 250];   // Warm ivory for alternating rows
      const colorLightDivider = [234, 231, 224]; // High-end warm-gray thin divider line

      // 1. HEADER SECTION (Minimalist Luxury Aesthetic)
      // High-end fashion houses do not use heavy, bright blue top banners. They use clean negative space with striking text and microline dividers.
      
      // Brand Title spaced for prestige representation
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(colorCharcoal[0], colorCharcoal[1], colorCharcoal[2]);
      doc.text('K A L A V O G U E', 105, 22, { align: 'center' });

      // Fine taglines
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colorAntiqueGold[0], colorAntiqueGold[1], colorAntiqueGold[2]);
      doc.text('HAUTE COUTURE & READY-TO-WEAR', 105, 28, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(colorSecondary[0], colorSecondary[1], colorSecondary[2]);
      doc.text('PARIS  ·  NEW YORK  ·  LONDON  ·  MILAN', 105, 33, { align: 'center' });
      doc.text('Client Concierge: concierge@kalavogue.com  |  www.kalavogue.com', 105, 37, { align: 'center' });

      // Elegant Gold-Bronze divider line
      doc.setDrawColor(colorAntiqueGold[0], colorAntiqueGold[1], colorAntiqueGold[2]);
      doc.setLineWidth(0.35);
      doc.line(15, 43, 195, 43);

      // 2. INVOICE OVERVIEW METADATA (Left / Right split)
      let currentY = 53;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(colorCharcoal[0], colorCharcoal[1], colorCharcoal[2]);
      doc.text('STATEMENT OF ACQUISITION', 15, currentY);

      // Invoice metadata on the top-right formatted elegantly
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(colorBodyText[0], colorBodyText[1], colorBodyText[2]);
      
      const formattedDate = new Date(order.date_created).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      doc.text(`Invoice Ref: KLV-${order.order_number}`, 195, currentY, { align: 'right' });
      doc.text(`Issue Date: ${formattedDate}`, 195, currentY + 5, { align: 'right' });
      doc.text(`Payment: ${order.payment_method_title || 'Secure Payment Link'}`, 195, currentY + 10, { align: 'right' });
      
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(colorAntiqueGold[0], colorAntiqueGold[1], colorAntiqueGold[2]);
      doc.text(`Status: ${order.status.toUpperCase()}`, 195, currentY + 15, { align: 'right' });

      // 3. BILLING & SHIPPING SPECIFICS (Two Elegant Parallel Columns)
      currentY = 78;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(colorCharcoal[0], colorCharcoal[1], colorCharcoal[2]);
      doc.text('BILLING ADDRESS', 15, currentY);
      doc.text('SHIPPING ADDRESS', 110, currentY);

      // Section subtle horizontal rule lines
      doc.setDrawColor(colorLightDivider[0], colorLightDivider[1], colorLightDivider[2]);
      doc.setLineWidth(0.3);
      doc.line(15, currentY + 2.5, 95, currentY + 2.5);
      doc.line(110, currentY + 2.5, 195, currentY + 2.5);

      currentY += 8;
      
      // Setup dynamic addresses
      const bObj = order.billing || {
        first_name: order.customer_name.split(' ')[0] || 'Store',
        last_name: order.customer_name.split(' ').slice(1).join(' ') || 'Customer',
        address_1: 'Walk-In Storefront Boutique',
        city: 'Local',
        state: 'Express',
        postcode: '00000',
        country: 'US',
        phone: 'N/A',
        email: order.customer_email || 'concierge@kalavogue.com'
      };

      const sObj = order.shipping || {
        first_name: bObj.first_name,
        last_name: bObj.last_name,
        address_1: bObj.address_1,
        city: bObj.city,
        state: bObj.state,
        postcode: bObj.postcode,
        country: bObj.country
      };

      // Print left column (Billing info)
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(colorCharcoal[0], colorCharcoal[1], colorCharcoal[2]);
      doc.text(`${bObj.first_name} ${bObj.last_name}`.trim().toUpperCase(), 15, currentY);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(colorBodyText[0], colorBodyText[1], colorBodyText[2]);
      
      let billTextY = currentY + 4.5;
      doc.text(bObj.address_1 || 'No billing address specified.', 15, billTextY);
      if (bObj.address_2) {
        billTextY += 4.5;
        doc.text(bObj.address_2, 15, billTextY);
      }
      billTextY += 4.5;
      doc.text(`${bObj.city || ''}, ${bObj.state || ''} ${bObj.postcode || ''}`, 15, billTextY);
      billTextY += 4.5;
      doc.text(bObj.country || '', 15, billTextY);
      
      billTextY += 5.5;
      doc.setFont('Helvetica', 'bold');
      doc.text('Email:', 15, billTextY);
      doc.setFont('Helvetica', 'normal');
      doc.text(bObj.email || order.customer_email || 'N/A', 26, billTextY);
      
      billTextY += 4.5;
      doc.setFont('Helvetica', 'bold');
      doc.text('Phone:', 15, billTextY);
      doc.setFont('Helvetica', 'normal');
      doc.text(bObj.phone || 'N/A', 27, billTextY);

      // Print right column (Shipping info)
      let shipTextY = currentY;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(colorCharcoal[0], colorCharcoal[1], colorCharcoal[2]);
      doc.text(`${sObj.first_name} ${sObj.last_name}`.trim().toUpperCase(), 110, shipTextY);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(colorBodyText[0], colorBodyText[1], colorBodyText[2]);
      
      shipTextY += 4.5;
      doc.text(sObj.address_1 || bObj.address_1 || 'Standard complimentary boutique delivery.', 110, shipTextY);
      if (sObj.address_2) {
        shipTextY += 4.5;
        doc.text(sObj.address_2, 110, shipTextY);
      }
      shipTextY += 4.5;
      doc.text(`${sObj.city || bObj.city || ''}, ${sObj.state || bObj.state || ''} ${sObj.postcode || bObj.postcode || ''}`, 110, shipTextY);
      shipTextY += 4.5;
      doc.text(sObj.country || bObj.country || '', 110, shipTextY);

      shipTextY += 5.5;
      doc.setFont('Helvetica', 'bold');
      doc.text('Delivery Method:', 110, shipTextY);
      doc.setFont('Helvetica', 'normal');
      doc.text('Complimentary Premium Courier', 137, shipTextY);

      shipTextY += 4.5;
      doc.setFont('Helvetica', 'bold');
      doc.text('Signature Verification:', 110, shipTextY);
      doc.setFont('Helvetica', 'normal');
      doc.text('Required Upon Delivery', 145, shipTextY);

      currentY = Math.max(billTextY, shipTextY) + 12;

      // 4. TRANSACTION LINE ITEMS TABLE
      // Premium warm ivory header bar
      doc.setFillColor(colorIvoryZebra[0], colorIvoryZebra[1], colorIvoryZebra[2]);
      doc.rect(15, currentY, 180, 8.5, 'F');

      // Thin outline for table header
      doc.setDrawColor(colorLightDivider[0], colorLightDivider[1], colorLightDivider[2]);
      doc.setLineWidth(0.3);
      doc.line(15, currentY, 195, currentY);
      doc.line(15, currentY + 8.5, 195, currentY + 8.5);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(colorCharcoal[0], colorCharcoal[1], colorCharcoal[2]);
      
      doc.text('REF', 18, currentY + 5.5);
      doc.text('EXCLUSIVE MERCHANDISE SELECTION', 30, currentY + 5.5);
      doc.text('QTY', 130, currentY + 5.5, { align: 'center' });
      doc.text('UNIT VAL', 158, currentY + 5.5, { align: 'right' });
      doc.text('ACQUISITION NET', 190, currentY + 5.5, { align: 'right' });

      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(colorBodyText[0], colorBodyText[1], colorBodyText[2]);

      currentY += 8.5;
      
      order.items.forEach((item, index) => {
        // Subtle row backgrounds
        if (index % 2 === 1) {
          doc.setFillColor(colorIvoryZebra[0], colorIvoryZebra[1], colorIvoryZebra[2]);
          doc.rect(15, currentY, 180, 8.5, 'F');
        }

        const subtotal = item.quantity * item.price;
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8.25);
        doc.text(String(index + 1).padStart(2, '0'), 18, currentY + 5.5);
        
        // Clean high-end product naming representation
        const maxChar = 54;
        const mappedName = item.name.length > maxChar ? item.name.substring(0, maxChar - 3).toUpperCase() + '...' : item.name.toUpperCase();
        
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(colorCharcoal[0], colorCharcoal[1], colorCharcoal[2]);
        doc.text(mappedName, 30, currentY + 5.5);

        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(colorBodyText[0], colorBodyText[1], colorBodyText[2]);
        doc.text(String(item.quantity), 130, currentY + 5.5, { align: 'center' });
        doc.text(`${curSymbol}${item.price.toFixed(2)}`, 158, currentY + 5.5, { align: 'right' });
        doc.text(`${curSymbol}${subtotal.toFixed(2)}`, 190, currentY + 5.5, { align: 'right' });

        // Fine elegant rule divider line under row
        doc.setDrawColor(colorLightDivider[0], colorLightDivider[1], colorLightDivider[2]);
        doc.setLineWidth(0.25);
        doc.line(15, currentY + 8.5, 195, currentY + 8.5);

        currentY += 8.5;
      });

      // 5. PRICING RATIO & CONVERTED TOTALS
      currentY += 5;
      doc.setDrawColor(colorAntiqueGold[0], colorAntiqueGold[1], colorAntiqueGold[2]);
      doc.setLineWidth(0.4);
      doc.line(125, currentY, 195, currentY); // Premium brand golden line anchor

      currentY += 6;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(colorSecondary[0], colorSecondary[1], colorSecondary[2]);
      
      doc.text('Subtotal:', 152, currentY, { align: 'right' });
      doc.setTextColor(colorCharcoal[0], colorCharcoal[1], colorCharcoal[2]);
      doc.text(`${curSymbol}${order.total.toFixed(2)}`, 190, currentY, { align: 'right' });

      currentY += 5;
      doc.setTextColor(colorSecondary[0], colorSecondary[1], colorSecondary[2]);
      doc.text('Value Added Tax (Complimentary):', 152, currentY, { align: 'right' });
      doc.setTextColor(colorCharcoal[0], colorCharcoal[1], colorCharcoal[2]);
      doc.text(`${curSymbol}0.00`, 190, currentY, { align: 'right' });

      currentY += 5;
      doc.setTextColor(colorSecondary[0], colorSecondary[1], colorSecondary[2]);
      doc.text('Boutique Shipping (Complimentary):', 152, currentY, { align: 'right' });
      doc.setTextColor(colorCharcoal[0], colorCharcoal[1], colorCharcoal[2]);
      doc.text(`${curSymbol}0.00`, 190, currentY, { align: 'right' });

      // Premium Grand Total border and ribbon style (Luxury White Grid block with Gold text highlights)
      currentY += 5;
      doc.setDrawColor(colorCharcoal[0], colorCharcoal[1], colorCharcoal[2]);
      doc.setLineWidth(0.5);
      doc.line(125, currentY, 195, currentY);

      currentY += 6;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(colorAntiqueGold[0], colorAntiqueGold[1], colorAntiqueGold[2]);
      doc.text('GRAND TOTAL NET:', 152, currentY, { align: 'right' });
      
      doc.setFontSize(11);
      doc.setTextColor(colorCharcoal[0], colorCharcoal[1], colorCharcoal[2]);
      doc.text(`${curSymbol}${order.total.toFixed(2)}`, 190, currentY, { align: 'right' });

      // Double-line brand stamp under final total
      currentY += 2;
      doc.setDrawColor(colorCharcoal[0], colorCharcoal[1], colorCharcoal[2]);
      doc.setLineWidth(0.2);
      doc.line(125, currentY, 195, currentY);
      doc.line(125, currentY + 0.6, 195, currentY + 0.6);

      // 6. HEARTFELT EXCLUSIVE BRAND GREETING & REGULATORY POLISHED METADATA
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(colorSecondary[0], colorSecondary[1], colorSecondary[2]);
      doc.setFontSize(8);
      doc.text('Thank you for choosing Kalavogue. Your selection represents the pinnacle of premium design and craftsmanship.', 15, 266);
      doc.text('Boutique Exchange: Complimentary returns and sizing exchanges are accommodated via our concierge platform inside 14 days.', 15, 270.5);
      
      // Fine bottom line
      doc.setDrawColor(colorLightDivider[0], colorLightDivider[1], colorLightDivider[2]);
      doc.setLineWidth(0.3);
      doc.line(15, 274.5, 195, 274.5);

      const generatedOn = new Date().toLocaleString('en-US', { hour12: true });
      doc.text(`Kalavogue Authorized Original  ·  Generated: ${generatedOn}  ·  Verification Code: KLV-OK-SEC`, 15, 280);
      doc.text('Page 1 of 1', 195, 280, { align: 'right' });

      // Save as automated file
      doc.save(`Kalavogue_Invoice_${order.order_number}.pdf`);
      addNotification(`Boutique Invoice for order #${order.order_number} exported.`, 'success');
    } catch (e: any) {
      console.error(e);
      addNotification('Failed to generate high fashion invoice PDF. Contact tech group.', 'error');
    }
  };

  const getStatusBadgeStyles = (status: WooCommerceOrder['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'processing':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'on-hold':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'pending':
        return 'bg-slate-500/15 text-slate-350 border border-slate-500/20';
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-450 border border-rose-500/20';
      case 'refunded':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-50/10';
    }
  };

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
      {/* Header Info Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Receipt className="h-6 w-6 text-amber-500" />
            Kalavogue Couture Archives
          </h2>
          <p className="text-xs text-slate-550 mt-1">
            Secure luxury receipt archives, private order intake interfaces, and gold-level boutique invoice presentation for Kalavogue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-extrabold text-slate-950 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Initiate Private Sale Intake
          </button>

          <button
            onClick={() => fetchOrders()}
            disabled={loading || refreshing}
            className="flex items-center justify-center h-10 w-10 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Sync live records"
          >
            <RefreshCw className={`h-4 w-4 ${loading || refreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Control Panel Grid (Search & Filter) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 outline-none">
        
        {/* Search Parameter */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search order number, buyer credentials or email... (Press Enter)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
          />
        </div>

        {/* Status Dropdown */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-sky-500 text-xs text-slate-200 outline-none transition-all"
          >
            <option value="all">📁 Filter: All Statuses</option>
            <option value="completed">🟢 Status: Completed</option>
            <option value="processing">🔵 Status: Processing</option>
            <option value="on-hold">🟡 Status: On Hold</option>
            <option value="pending">⚪ Status: Pending Payment</option>
            <option value="cancelled">🔴 Status: Cancelled</option>
            <option value="refunded">🟣 Status: Refunded</option>
          </select>
        </div>

        {/* Clear Actions */}
        <div className="flex gap-2.5">
          <button
            onClick={() => fetchOrders()}
            className="flex-1 rounded-lg bg-slate-900 hover:bg-slate-850 text-xs font-semibold text-slate-350 border border-slate-80 border-slate-800 transition-colors cursor-pointer"
          >
            Query Apply
          </button>
          
          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={clearFilters}
              className="px-3 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 text-xs font-semibold text-rose-400 border border-rose-900/35 transition-colors cursor-pointer"
              title="Clear all active parameters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Table Segment */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-4 animate-pulse">
            <div className="h-10 w-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold font-mono tracking-wider">Acquiring WooCommerce orders database streams...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Receipt className="h-12 w-12 text-slate-700 mx-auto" />
            <h3 className="text-sm font-extrabold text-slate-300">No Purchase Records Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your WooCommerce site doesn't have any purchase records matching details. Double check credentials or register a manual transaction logic override.
            </p>
            <button
              onClick={clearFilters}
              className="mt-2 text-xs font-semibold text-sky-450 hover:underline"
            >
              Flush filtering constraints
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800/80">
                  <th className="py-4 px-4 w-12">No.</th>
                  <th className="py-4 px-4">Order Ref</th>
                  <th className="py-4 px-4">Buyer Persona</th>
                  <th className="py-4 px-4">Purchase Date</th>
                  <th className="py-4 px-4">Financial Total</th>
                  <th className="py-4 px-4">Dispatch Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-[11px] font-medium text-slate-300">
                {orders.map((order, idx) => (
                  <tr key={order.id} className="hover:bg-slate-900/35 transition-colors group">
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-100 font-mono">
                      #{order.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-slate-200 group-hover:text-white transition-colors">{order.customer_name}</span>
                        <span className="text-[10px] text-slate-550 font-mono mt-0.5">{order.customer_email || 'No email associated'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {new Date(order.date_created).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-sky-450 font-bold font-mono">
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-bold text-[9px] uppercase tracking-wider ${getStatusBadgeStyles(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-85 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 cursor-pointer"
                          title="View order details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        
                        <button
                          onClick={() => downloadInvoicePDF(order)}
                          className="p-1.5 rounded bg-sky-950/20 hover:bg-sky-500 hover:text-slate-950 text-sky-450 border border-sky-900/30 hover:border-transparent transition-all cursor-pointer"
                          title="Generate Invoice PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteOrder(order.id, order.order_number)}
                          className="p-1.5 rounded bg-rose-950/20 hover:bg-rose-600 hover:text-slate-950 text-rose-400 border border-rose-900/30 hover:border-transparent transition-all cursor-pointer"
                          title="Void / Delete record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL WINDOW 1: ORDER LOGICAL DETAILS ACCORDION & PDF HANDLER */}
      {selectedOrder && (
        <div id="order-details-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-950 shadow-2xl p-6 text-slate-100 overflow-y-auto max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold tracking-wider text-amber-500 uppercase">Kalavogue Private Order Archive</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${getStatusBadgeStyles(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-mono tracking-tight text-white mt-1">
                  Sales Receipt: #{selectedOrder.order_number}
                </h3>
                <p className="text-[10px] text-amber-500/80 font-mono mt-0.5">Boutique Clearance Token: {selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Buyer Persona & Addresses */}
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    <User className="h-3.5 w-3.5 text-amber-500" />
                    Client Luxury Profile
                  </h4>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Full Name</span>
                      <span className="font-semibold text-slate-200">{selectedOrder.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contact Email</span>
                      <span className="font-semibold text-sky-405 text-slate-305">{selectedOrder.customer_email || 'No email given'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone Reference</span>
                      <span className="font-semibold text-slate-200">{selectedOrder.billing?.phone || 'No phone verified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Preferred Payment Mode</span>
                      <span className="font-mono text-[10px] text-amber-500 font-bold">{selectedOrder.payment_method_title || 'Direct Checkout'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800/80 space-y-3.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-1.5">
                    🗺️ Boutique Delivery Specs
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-350">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider font-bold text-amber-500/80 mb-1">Billing Target</span>
                      <p className="font-medium text-slate-355 leading-relaxed">
                        {selectedOrder.billing?.first_name ? (
                          <>
                            {selectedOrder.billing.address_1}<br />
                            {selectedOrder.billing.address_2 && <>{selectedOrder.billing.address_2}<br /></>}
                            {selectedOrder.billing.city}, {selectedOrder.billing.state} {selectedOrder.billing.postcode}<br />
                            {selectedOrder.billing.country}
                          </>
                        ) : (
                          'Complimentary In-Store Collection'
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider font-bold text-amber-500/80 mb-1">Destination Courier Target</span>
                      <p className="font-medium text-slate-355 leading-relaxed">
                        {selectedOrder.shipping?.first_name ? (
                          <>
                            {selectedOrder.shipping.address_1}<br />
                            {selectedOrder.shipping.address_2 && <>{selectedOrder.shipping.address_2}<br /></>}
                            {selectedOrder.shipping.city}, {selectedOrder.shipping.state} {selectedOrder.shipping.postcode}<br />
                            {selectedOrder.shipping.country}
                          </>
                        ) : (
                          'Same as verified checkout billing coordinates.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Line items and actions */}
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    <ShoppingBag className="h-3.5 w-3.5 text-amber-500" />
                    Acquisition Details ({selectedOrder.items.length})
                  </h4>
                  
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={item.id || idx} className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800/60 text-xs">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-extrabold text-slate-200 truncate">{item.name.toUpperCase()}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{formatPrice(item.price)} each</p>
                        </div>
                        <div className="text-right flex-shrink-0 font-mono">
                          <span className="text-slate-450 mr-2.5 font-bold">Qty {item.quantity}</span>
                          <span className="font-black text-amber-500">{formatPrice(item.quantity * item.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800/40">
                    <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Total Purchase Worth:</span>
                    <span className="text-lg font-black font-mono text-amber-500">{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-1.5">
                    🔒 Boutique Status Verification
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, selectedOrder.order_number, 'processing')}
                      className={`py-1.5 rounded text-[10px] font-bold text-sky-400 hover:bg-sky-550/20 border transition-all cursor-pointer ${selectedOrder.status === 'processing' ? 'bg-sky-500/15 border-sky-500' : 'bg-slate-950 border-slate-800'}`}
                    >
                      Processing
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, selectedOrder.order_number, 'completed')}
                      className={`py-1.5 rounded text-[10px] font-bold text-emerald-400 hover:bg-emerald-550/20 border transition-all cursor-pointer ${selectedOrder.status === 'completed' ? 'bg-emerald-500/15 border-emerald-500' : 'bg-slate-950 border-slate-800'}`}
                    >
                      Completed
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, selectedOrder.order_number, 'on-hold')}
                      className={`py-1.5 rounded text-[10px] font-bold text-amber-400 hover:bg-amber-550/20 border transition-all cursor-pointer ${selectedOrder.status === 'on-hold' ? 'bg-amber-500/15 border-amber-500' : 'bg-slate-950 border-slate-800'}`}
                    >
                      On Hold
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer triggers */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-slate-800 justify-between">
              <button
                onClick={() => {
                  if (window.confirm("Do you want to delete this order file?")) {
                    handleDeleteOrder(selectedOrder.id, selectedOrder.order_number);
                  }
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-600 hover:text-slate-950 px-4 py-2 border border-rose-900/35 text-rose-450 hover:border-transparent text-xs font-extrabold cursor-pointer transition-all"
              >
                <Trash2 className="h-4 w-4" />
                Void Reception Record
              </button>

              <div className="flex gap-2.5">
                <button
                  onClick={() => downloadInvoicePDF(selectedOrder)}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 px-5 py-2 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all animate-pulse"
                >
                  <Download className="h-4 w-4" />
                  Print Luxury Invoice
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-lg bg-slate-900 hover:bg-slate-850 px-5 py-2 text-slate-300 font-bold border border-slate-800 text-xs cursor-pointer transition-colors"
                >
                  Close Archive
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL WINDOW 2: CREATION DISPATCH FORM */}
      {isFormOpen && (
        <div id="create-order-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-950 shadow-2xl p-6 text-slate-100 overflow-y-auto max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                  <Receipt className="h-5 w-5 text-sky-400" />
                  Manual Override: Register Guest Purchase Order
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Creates orders inside WooCommerce live database parameters (or local system files index).</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Part 1: Billing metadata */}
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">👤 Buyer Identity Info</h4>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">First Name</label>
                    <input
                      type="text"
                      placeholder="Jane"
                      value={formBillingFirst}
                      onChange={(e) => setFormBillingFirst(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-sky-500 text-xs outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Last Name</label>
                    <input
                      type="text"
                      placeholder="Doe"
                      value={formBillingLast}
                      onChange={(e) => setFormBillingLast(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-sky-500 text-xs outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Contact Email</label>
                    <input
                      type="email"
                      placeholder="buyer@domain.com"
                      value={formBillingEmail}
                      onChange={(e) => setFormBillingEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-sky-500 text-xs outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 019-2834"
                      value={formBillingPhone}
                      onChange={(e) => setFormBillingPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-sky-500 text-xs outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Part 2: Address components */}
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">🗺️ Shipping & Billing Address Coordinates</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Street Address</label>
                    <input
                      type="text"
                      placeholder="Avenue / Blvd, Apt/Suite"
                      value={formAddress1}
                      onChange={(e) => setFormAddress1(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-sky-500 text-xs outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">City</label>
                    <input
                      type="text"
                      placeholder="Chicago"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-sky-500 text-xs outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">State / Prov</label>
                    <input
                      type="text"
                      placeholder="IL"
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-sky-500 text-xs outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Postcode</label>
                    <input
                      type="text"
                      placeholder="60601"
                      value={formPostcode}
                      onChange={(e) => setFormPostcode(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-sky-500 text-xs outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Part 3: Line items detail list */}
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">🛒 Register Product Lines</h4>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="flex items-center gap-1 rounded bg-sky-500 hover:bg-sky-600 text-slate-955 px-2 py-1 text-[10px] font-extrabold cursor-pointer transition-colors"
                  >
                    + Add Item Row
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2.5 items-center">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Product Name / Title"
                          value={item.name}
                          onChange={(e) => handleLineItemChange(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 focus:border-sky-500 text-xs outline-none transition-all"
                          required
                        />
                      </div>
                      <div className="w-16">
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-800 focus:border-sky-500 text-xs font-mono text-center outline-none transition-all"
                          required
                        />
                      </div>
                      <div className="w-24 relative">
                        <span className="absolute left-2.5 top-1.5 text-slate-500 text-[11px] font-mono">
                          {settings?.currency === 'INR' ? '₹' : (settings?.currency === 'EUR' ? '€' : (settings?.currency === 'GBP' ? '£' : '$'))}
                        </span>
                        <input
                          type="number"
                          placeholder="Price"
                          step="0.01"
                          min="0"
                          value={item.price || ''}
                          onChange={(e) => handleLineItemChange(idx, 'price', e.target.value)}
                          className="w-full pl-6 pr-2 py-1.5 rounded bg-slate-950 border border-slate-800 focus:border-sky-500 text-xs font-mono outline-none transition-all"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(idx)}
                        disabled={formItems.length === 1}
                        className="p-1.5 rounded hover:bg-rose-950 text-rose-500 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Part 4: Technical Parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Order Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none transition-all"
                  >
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                    <option value="pending">Pending Payment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Gate / Payment Method</label>
                  <select
                    value={formPaymentTitle}
                    onChange={(e) => setFormPaymentTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none transition-all"
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="PayPal Gateway">PayPal Gateway</option>
                    <option value="Stripe Terminal">Stripe Terminal</option>
                    <option value="Bank Wire">Bank Wire Transfer</option>
                    <option value="Cash on Delivery">Cash on Delivery</option>
                  </select>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg bg-slate-900 hover:bg-slate-850 px-4 py-2 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-500 hover:bg-sky-600 px-5 py-2 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all"
                >
                  Confirm Purchase Order
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
