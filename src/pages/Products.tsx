import React, { useEffect, useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  SlidersHorizontal, 
  Tag, 
  Boxes, 
  AlertCircle, 
  Image, 
  Check, 
  ChevronsUpDown, 
  X,
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import { apiService } from '../services/api.js';
import { Product, ProductVariation } from '../types.js';
import { useSettings } from '../context/SettingsContext.js';
import { useAuth } from '../context/AuthContext.js';

export const Products: React.FC = () => {
  const { addNotification, settings } = useSettings();
  const { user } = useAuth();

  const formatPrice = (val: number) => {
    const currency = settings?.currency || 'INR';
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(val);
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Checklist items mapping for Bulk selection
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkPayloadVal, setBulkPayloadVal] = useState('');

  // Modals state management
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Drag & drop file simulation states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states specifically
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formSalePrice, setFormSalePrice] = useState('');
  const [formStock, setFormStock] = useState('10');
  const [formStatus, setFormStatus] = useState<'publish' | 'draft' | 'pending'>('publish');
  const [formVisibility, setFormVisibility] = useState<'visible' | 'hidden' | 'catalog'>('visible');
  const [formCategories, setFormCategories] = useState<string[]>(['Uncategorized']);
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formDescription, setFormDescription] = useState('');
  const [formShortDescription, setFormShortDescription] = useState('');
  const [formFeaturedImage, setFormFeaturedImage] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formSeoTitle, setFormSeoTitle] = useState('');
  const [formSeoDesc, setFormSeoDesc] = useState('');
  
  // Dynamic variations list
  const [formVariations, setFormVariations] = useState<ProductVariation[]>([]);
  const [newVarName, setNewVarName] = useState('');
  const [newVarPrice, setNewVarPrice] = useState('');
  const [newVarStock, setNewVarStock] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await apiService.getProducts({
        search: searchTerm,
        category: selectedCategory,
        status: selectedStatus
      });
      setProducts(res.data.products);
    } catch (err) {
      console.error('Failed reading product logs from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategory, selectedStatus]);

  // Bulk action triggers
  const executeBulkAction = async () => {
    if (selectedProductIds.length === 0) return;
    if (!bulkAction) return;

    try {
      if (bulkAction === 'delete') {
        const confirmBulk = window.confirm(`Proceed with deleting ${selectedProductIds.length} items? This cannot be undone.`);
        if (!confirmBulk) return;
      }

      await apiService.bulkProducts({
        ids: selectedProductIds,
        action: bulkAction as any,
        payload: {
          status: bulkPayloadVal,
          value: bulkPayloadVal
        }
      });

      addNotification(`Performed bulk operation "${bulkAction}" on ${selectedProductIds.length} products.`, 'success');
      setSelectedProductIds([]);
      setBulkAction('');
      setBulkPayloadVal('');
      fetchProducts();
    } catch (err) {
      console.error('Failed bulk editing products:', err);
    }
  };

  const handleCheckboxToggle = (prodId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
    );
  };

  const handleSelectAllToggle = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map(p => p.id));
    }
  };

  // Open Form either for Editing or Creating new Item
  const openEditor = (productToEdit: Product | null = null) => {
    if (productToEdit) {
      setEditingId(productToEdit.id);
      setFormName(productToEdit.name);
      setFormSku(productToEdit.sku);
      setFormPrice(productToEdit.price.toString());
      setFormSalePrice(productToEdit.sale_price !== null ? productToEdit.sale_price.toString() : '');
      setFormStock(productToEdit.stock.toString());
      setFormStatus(productToEdit.status);
      setFormVisibility(productToEdit.visibility);
      setFormCategories(productToEdit.categories);
      setFormTags(productToEdit.tags);
      setFormDescription(productToEdit.description);
      setFormShortDescription(productToEdit.short_description);
      setFormFeaturedImage(productToEdit.featured_image);
      setFormImages(productToEdit.images);
      setFormSeoTitle(productToEdit.seo_title);
      setFormSeoDesc(productToEdit.seo_desc);
      setFormVariations(productToEdit.variations || []);
    } else {
      // Create empty template
      setEditingId(null);
      setFormName('');
      setFormSku('SKU-' + Math.floor(Math.random() * 900000 + 100000));
      setFormPrice('');
      setFormSalePrice('');
      setFormStock('10');
      setFormStatus('publish');
      setFormVisibility('visible');
      setFormCategories(['Electronics']);
      setFormTags(['SaaS', 'Woo']);
      setFormDescription('');
      setFormShortDescription('');
      setFormFeaturedImage('https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80');
      setFormImages([]);
      setFormSeoTitle('');
      setFormSeoDesc('');
      setFormVariations([]);
    }
    setIsEditorOpen(true);
  };

  // Submit Product Form Editor (POST or PUT)
  const handleEditorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice.trim()) {
      alert('Product Name and Base Price are required.');
      return;
    }

    const payload = {
      name: formName,
      sku: formSku || 'SKU-GEN-' + Math.floor(Math.random() * 99999),
      price: parseFloat(formPrice),
      sale_price: formSalePrice ? parseFloat(formSalePrice) : null,
      stock: parseInt(formStock) || 0,
      status: formStatus,
      visibility: formVisibility,
      categories: formCategories,
      tags: formTags,
      description: formDescription,
      short_description: formShortDescription,
      featured_image: formFeaturedImage,
      images: formImages,
      seo_title: formSeoTitle || `${formName} | WooCommerce Premium`,
      seo_desc: formSeoDesc || `Buy ${formName} online. Express shipping available.`,
      variations: formVariations
    };

    try {
      if (editingId) {
        await apiService.updateProduct(editingId, payload);
        addNotification(`Product "${formName}" updated successfully.`, 'success');
      } else {
        await apiService.createProduct(payload);
        addNotification(`New catalog product "${formName}" created.`, 'success');
      }
      setIsEditorOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error('Failed submitting form fields:', err);
      alert(err.response?.data?.error || 'Failed saving product database properties.');
    }
  };

  // Single Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${name}"?`)) return;
    try {
      await apiService.deleteProduct(id);
      addNotification(`Deleted product "${name}" from stock indexing.`, 'warning');
      fetchProducts();
    } catch (err) {
      console.error('Failed deleting product:', err);
    }
  };

  // Drag and drop image simulation
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const simulateImageUpload = (fileObj: File | null = null) => {
    setUploadingImage(true);
    setUploadProgress(10);
    
    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setUploadingImage(false);
          
          // Seed a beautiful random stock image depending on file name
          const mockImages = [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80'
          ];
          const chosenImage = mockImages[Math.floor(Math.random() * mockImages.length)];
          setFormFeaturedImage(chosenImage);
          setFormImages(prev => [...prev, chosenImage]);
          addNotification('Featured Image compressed and uploaded successfully.', 'success');
          return 100;
        }
        return p + 30;
      });
    }, 250);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      simulateImageUpload(e.target.files[0]);
    }
  };

  // Add Variation to form array
  const addVariation = () => {
    if (!newVarName.trim() || !newVarPrice.trim()) {
      alert('Variation Name or Price cannot be empty.');
      return;
    }
    const newVar: ProductVariation = {
      id: 'var-' + Math.random().toString(36).substr(2, 5),
      name: newVarName,
      price: parseFloat(newVarPrice),
      stock: parseInt(newVarStock) || 5,
      sku: `${formSku || 'SKU'}-${newVarName.replaceAll(' ', '').toUpperCase()}`
    };
    setFormVariations(prev => [...prev, newVar]);
    setNewVarName('');
    setNewVarPrice('');
    setNewVarStock('');
  };

  const removeVariation = (varId: string) => {
    setFormVariations(prev => prev.filter(v => v.id !== varId));
  };

  // Helper values
  const categoryOptions = ['Electronics', 'Wearables', 'Home Office', 'Furniture', 'Accessories', 'Fashion'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            WooCommerce Products Catalog
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Create, manage, and batch-update listed WooCommerce products syncing with local metadata.
          </p>
        </div>

        <button
          onClick={() => openEditor(null)}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 px-4 py-2.5 text-xs font-extrabold text-slate-955 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Custom Product</span>
        </button>
      </div>

      {/* Searching filters and search bars */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-950 text-slate-200"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 focus:outline-none bg-slate-950 text-slate-300 font-semibold"
        >
          <option value="">All Categories</option>
          {categoryOptions.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 focus:outline-none bg-slate-950 text-slate-300 font-semibold"
        >
          <option value="">All Statuses</option>
          <option value="publish">Published</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
        </select>

        <div className="flex h-9 items-center justify-end rounded-lg px-2 bg-slate-950/40 border border-slate-800 text-xs font-semibold text-slate-400">
          <span>Active listings: {products.length}</span>
        </div>
      </div>

      {/* Bulk action commands */}
      {selectedProductIds.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-3.5 rounded-xl border border-sky-500/15 bg-sky-500/5">
          <div className="text-xs font-bold text-sky-400">
            🛡️ {selectedProductIds.length} products checked for bulk operation
          </div>

          <div className="flex items-center gap-2">
            <select
              value={bulkAction}
              onChange={(e) => {
                setBulkAction(e.target.value);
                setBulkPayloadVal('');
              }}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-800 focus:outline-none bg-slate-950 text-slate-300 font-semibold"
            >
              <option value="">Choose bulk action</option>
              {user?.role !== 'Product Manager' && <option value="delete">Bulk Delete</option>}
              <option value="status">Set visibility status</option>
              <option value="stock">Override stock quantity</option>
            </select>

            {bulkAction === 'status' && (
              <select
                value={bulkPayloadVal}
                onChange={(e) => setBulkPayloadVal(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-800 focus:outline-none bg-slate-950 text-slate-300 font-semibold"
              >
                <option value="">Select status</option>
                <option value="publish">Published</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
              </select>
            )}

            {bulkAction === 'stock' && (
              <input
                type="number"
                placeholder="Stock count"
                value={bulkPayloadVal}
                onChange={(e) => setBulkPayloadVal(e.target.value)}
                className="w-24 px-3 py-1 text-xs rounded-lg border border-slate-800 focus:outline-none bg-slate-950 text-slate-300"
              />
            )}

            <button
              onClick={executeBulkAction}
              disabled={!bulkAction || (bulkAction !== 'delete' && !bulkPayloadVal)}
              className="rounded-lg bg-sky-500 hover:bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-slate-950 disabled:bg-slate-800 transition-colors cursor-pointer"
            >
              Apply Action
            </button>
          </div>
        </div>
      )}

      {/* Main products table listing */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/20 text-slate-550">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedProductIds.length === products.length}
                    onChange={handleSelectAllToggle}
                    className="rounded border border-slate-800 bg-slate-950 accent-sky-500"
                  />
                </th>
                <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px]">Product Image</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">Name & SKU</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">Categories</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">Price</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">Stock Status</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">Post Status</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-semibold text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-550">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Boxes className="h-8 w-8 text-sky-450 animate-bounce" />
                      <span className="text-xs font-medium">Re-indexing WooCommerce endpoint properties...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <AlertCircle className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                      <span className="text-xs font-semibold">No products matches local catalog constraints.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const hasSale = p.sale_price !== null;
                  const isLow = p.stock <= 15;
                  return (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-slate-950/45 transition-colors
                        ${selectedProductIds.includes(p.id) ? 'bg-sky-500/5' : ''}
                      `}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(p.id)}
                          onChange={() => handleCheckboxToggle(p.id)}
                          className="rounded border border-slate-800 bg-slate-950 accent-sky-500"
                        />
                      </td>
                      
                      <td className="py-3.5 px-2">
                        <img
                          src={p.featured_image}
                          alt={p.name}
                          className="h-10 w-10 object-cover rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100"
                          referrerPolicy="no-referrer"
                        />
                      </td>

                      <td className="py-3.5 px-3 min-w-[200px] max-w-[280px]">
                        <p className="text-slate-800 font-bold dark:text-slate-100 truncate" title={p.name}>
                          {p.name}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5 leading-none">
                          SKU: {p.sku}
                        </p>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {p.categories.map((cat, i) => (
                            <span key={i} className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              <Tag className="h-2 w-2 text-slate-400" />
                              {cat}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono">
                        {hasSale ? (
                          <div className="flex flex-col">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">{formatPrice(Number(p.sale_price))}</span>
                            <span className="text-[10px] text-slate-400 line-through font-medium">{formatPrice(p.price)}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{formatPrice(p.price)}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold 
                            ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}
                          `}>
                            {p.stock} units
                          </span>
                          <span className={`text-[9px] font-semibold mt-0.5 uppercase tracking-wide
                            ${p.stock > 0 ? 'text-emerald-500' : 'text-rose-500'}
                          `}>
                            {p.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide
                          ${p.status === 'publish' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : ''}
                          ${p.status === 'draft' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' : ''}
                          ${p.status === 'pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                        `}>
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openEditor(p)}
                            className="p-1 px-1.5 border border-slate-800 bg-slate-950/45 rounded-lg text-slate-400 hover:text-sky-400 hover:border-sky-500/30 transition-colors shadow-sm cursor-pointer"
                            title="Edit Core Specs"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          
                          {user?.role !== 'Product Manager' && (
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-1 px-1.5 border border-slate-800 bg-slate-950/45 rounded-lg text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors shadow-sm cursor-pointer"
                              title="Delete catalog entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPREHENSIVE EDITOR MODAL (Slideover card) */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full border-l border-slate-250 dark:border-slate-800">
            {/* Header section card */}
            <div className="flex h-16 items-center justify-between px-6 border-b border-slate-150 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/45">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                {editingId ? 'Edit WooCommerce Product Detail' : 'Create WooCommerce Product Listing'}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="rounded-lg h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-500 dark:hover:text-slate-300 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form scroll section */}
            <form onSubmit={handleEditorSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
              
              {/* Product Basic Name and SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/20 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 font-medium"
                    placeholder="e.g., Wireless Headset Pro"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400">SKU Code</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/20 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 font-medium font-mono"
                    placeholder="WNC-HP-001"
                  />
                </div>
              </div>

              {/* Pricing details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Base Price ({settings?.currency === 'INR' ? '₹' : (settings?.currency === 'EUR' ? '€' : (settings?.currency === 'GBP' ? '£' : '$'))}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/20 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 font-medium font-mono"
                    placeholder="199.99"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Sale Price ({settings?.currency === 'INR' ? '₹' : (settings?.currency === 'EUR' ? '€' : (settings?.currency === 'GBP' ? '£' : '$'))})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/20 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 font-medium font-mono"
                    placeholder="149.99"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Stock Limit Units</label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/20 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 font-medium font-mono"
                    placeholder="10"
                  />
                </div>
              </div>

              {/* Status and Visibility dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Publishing Status</label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/20 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 font-semibold"
                  >
                    <option value="publish">Published</option>
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Visibility Catalog Rule</label>
                  <select
                    value={formVisibility}
                    onChange={(e: any) => setFormVisibility(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/20 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 font-semibold"
                  >
                    <option value="visible">Visible</option>
                    <option value="hidden">Hidden</option>
                    <option value="catalog">Catalog</option>
                  </select>
                </div>
              </div>

              {/* Descriptions & Rich Text simulation */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 dark:text-slate-400">Short Summary description</label>
                <textarea
                  value={formShortDescription}
                  onChange={(e) => setFormShortDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/20 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 font-medium"
                  placeholder="Summarize product key metrics..."
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Rich Specification Description</label>
                  <span className="text-[10px] bg-indigo-50 text-indigo-500 rounded px-1.5 font-bold dark:bg-indigo-950/30">Rich editor template active</span>
                </div>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/20 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 font-medium min-h-[90px]"
                  placeholder="Detail parameters, construction, guarantees..."
                  rows={4}
                />
              </div>

              {/* Multi-category tags section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Select Categories Range</label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-slate-150 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-950/25">
                    {categoryOptions.map(cat => {
                      const isChecked = formCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setFormCategories(prev => 
                              isChecked ? prev.filter(c => c !== cat) : [...prev, cat]
                            );
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-bold tracking-tight border transition-colors
                            ${isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                            }
                          `}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tags array */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400">SEO Keyword Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={formTags.join(', ')}
                    onChange={(e) => setFormTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/20 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 font-medium font-mono"
                    placeholder="e.g. smart, leather, black"
                  />
                </div>
              </div>

              {/* Drag n Drop Upload Area */}
              <div className="space-y-2">
                <label className="font-bold text-slate-600 dark:text-slate-400">Gallery Image Loader</label>
                
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-500 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors bg-slate-50/10 cursor-pointer flex flex-col items-center justify-center min-h-[140px]"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />

                  {uploadingImage ? (
                    <div className="w-full max-w-[200px] text-center">
                      <p className="text-xs font-bold text-indigo-500 mb-1.5">Compressing Image & uploading... ({uploadProgress}%)</p>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Image className="h-8 w-8 text-slate-400 mb-2" />
                      <p className="font-bold text-slate-700 dark:text-slate-300">Drag & Drop Image or Click to Browse</p>
                      <p className="text-[10px] text-slate-400 mt-1">Supports PNG, JPG, WEBP formats up to 5MB. Automatic lossless compression applied.</p>
                    </>
                  )}
                </div>

                {/* Uploaded Gallery Thumbnails */}
                {formFeaturedImage && (
                  <div className="space-y-1.5 mt-2">
                    <span className="text-[10px] font-bold text-slate-430">Thumbnails (Click to set primary / remove):</span>
                    <div className="flex flex-wrap gap-2.5">
                      <div className="relative group border border-indigo-400 p-0.5 rounded-lg">
                        <img 
                          src={formFeaturedImage} 
                          alt="Primary upload" 
                          className="h-12 w-12 object-cover rounded-md" 
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute top-0.5 left-0.5 bg-indigo-650 text-white font-bold text-[8px] px-1 rounded select-none z-10">Primary</span>
                      </div>

                      {formImages.filter(img => img !== formFeaturedImage).map((img, i) => (
                        <div key={i} className="relative group border border-slate-200 dark:border-slate-800 p-0.5 rounded-lg hover:border-indigo-300">
                          <img 
                            src={img} 
                            alt={`Gallery ${i}`} 
                            className="h-12 w-12 object-cover rounded-md cursor-pointer" 
                            onClick={() => setFormFeaturedImage(img)}
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setFormImages(prev => prev.filter(p => p !== img))}
                            className="absolute -top-1.5 -right-1.5 bg-rose-500 rounded-full h-4.5 w-4.5 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Variations listing container */}
              <div className="rounded-xl border border-slate-150 p-4 space-y-3 dark:border-slate-800 bg-slate-50/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Boxes className="h-4 w-4 text-indigo-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">Product Variations Matrix</span>
                  </div>
                  <span className="text-[10px] text-slate-420 font-semibold">{formVariations.length} total variants</span>
                </div>

                <div className="space-y-2">
                  {formVariations.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-850">
                      <div className="min-w-0 flex-1 grid grid-cols-3 gap-2 py-0.5 font-semibold text-[11px]">
                        <span className="text-slate-800 dark:text-slate-200 truncate">{v.name}</span>
                        <span className="font-mono text-slate-400">SKU: {v.sku}</span>
                        <span className="text-slate-500 dark:text-slate-400 flex justify-end gap-3 px-3">
                          <span>{formatPrice(v.price)}</span>
                          <span className="font-bold text-indigo-500 font-mono">[{v.stock} units]</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariation(v.id)}
                        className="text-rose-500 hover:text-rose-700 text-xs px-1.5 font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add dynamic variation forms */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end pt-2 border-t border-slate-150 dark:border-slate-850">
                  <div className="space-y-1 col-span-2">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Variant Specs (e.g. Size: XL, Color: Obsidian)</span>
                    <input
                      type="text"
                      placeholder="Size: L Black"
                      value={newVarName}
                      onChange={(e) => setNewVarName(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs rounded border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Price ({settings?.currency === 'INR' ? '₹' : (settings?.currency === 'EUR' ? '€' : (settings?.currency === 'GBP' ? '£' : '$'))})</span>
                    <input
                      type="number"
                      placeholder="189"
                      value={newVarPrice}
                      onChange={(e) => setNewVarPrice(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs rounded border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 font-mono"
                    />
                  </div>

                  <div className="flex gap-1.5 items-center">
                    <div className="space-y-1 flex-1">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Stock</span>
                      <input
                        type="number"
                        placeholder="10"
                        value={newVarStock}
                        onChange={(e) => setNewVarStock(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs rounded border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 font-mono"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={addVariation}
                      className="rounded bg-slate-900/10 hover:bg-slate-900/20 dark:bg-slate-800 text-slate-880 dark:text-slate-200 p-1.5 mt-5 font-bold flex items-center justify-center"
                      title="Append Variant rule"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced SEO fields */}
              <div className="rounded-xl border border-slate-150 p-4 space-y-3 dark:border-slate-800 bg-slate-50/20">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
                  <span className="font-bold text-slate-700 dark:text-slate-300">WooCommerce SEO Fields (Yoast Compatible)</span>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-600 dark:text-slate-400">Custom SEO Title</span>
                    <input
                      type="text"
                      value={formSeoTitle}
                      onChange={(e) => setFormSeoTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 font-medium"
                      placeholder="e.g. Premium Noise-Canceling Headphones | Shop Best Audio Deals"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-slate-600 dark:text-slate-400">Custom SEO Meta Description</span>
                    <textarea
                      value={formSeoDesc}
                      onChange={(e) => setFormSeoDesc(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 font-medium"
                      placeholder="Provide custom Google search-listing abstract details summary..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Action submission row button */}
              <div className="pt-4 border-t border-slate-150 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 p-4 rounded-xl dark:bg-slate-950/20">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-bold ring-1 ring-slate-250 rounded-lg hover:bg-slate-50 text-slate-600 dark:ring-slate-800 dark:text-slate-450 dark:hover:bg-slate-850"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow dark:bg-indigo-500"
                >
                  Save Stock Meta
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
