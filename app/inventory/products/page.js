'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { Pencil, Trash2, Plus, X, Settings, ExternalLink } from 'lucide-react';
import CategoryManagerModal from '@/components/CategoryManagerModal';
import ProductDetailsSidebar from '@/components/ProductDetailsSidebar';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [stickyDate, setStickyDate] = useState(new Date().toISOString().split('T')[0]);

    // Layer 2: Smart Detection & Restock
    const [existingProduct, setExistingProduct] = useState(null); // If typed name matches existing

    // Layer 3: Sidebar
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
        buy_price: '',
        sell_price: '',
        stock_quantity: '',
        created_at: stickyDate
    });

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Filter & Sort State
    const [filterCategory, setFilterCategory] = useState('');
    const [sortOption, setSortOption] = useState('date_desc'); // date_desc, date_asc, sales_desc
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [filterBySellPrice, setFilterBySellPrice] = useState(false);
    const [monthFilter, setMonthFilter] = useState(''); // New State for Month Filter



    const [user, setUser] = useState(null);

    useEffect(() => {
        // Fetch User Session
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) setUser(data.user);
            })
            .catch(err => console.error(err));

        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        const res = await fetch('/api/inventory/products');
        const data = await res.json();
        setProducts(data);
    };

    const fetchCategories = async () => {
        const res = await fetch('/api/inventory/categories?type=product');
        const data = await res.json();
        setCategories(data);
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        const res = await fetch('/api/inventory/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newCategoryName, type: 'product' }),
        });

        if (res.ok) {
            const newCategory = await res.json();
            setCategories([...categories, newCategory]);
            setFormData({ ...formData, category_id: newCategory.id });
            setShowCategoryModal(false);
            setNewCategoryName('');
        } else {
            alert('Failed to add category');
        }
    };

    // Helper: Normalize Bangla numbers to English
    const normalizeNumber = (str) => {
        const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return str.toString().split('').map(char => {
            const idx = banglaDigits.indexOf(char);
            return idx > -1 ? idx : char;
        }).join('');
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            // Use e.code for layout-independent key detection (works with Bangla keyboard)
            if (e.shiftKey && e.code === 'KeyN' && !showModal) {
                e.preventDefault();
                openAddModal();
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [showModal, stickyDate]); // Add stickyDate dep to ensure openAddModal uses latest

    // Form Navigation
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                // Shift + Enter -> Submit
                e.preventDefault();
                handleSubmit(e);
            } else {
                // Enter -> Next Field
                e.preventDefault();
                const form = e.target.form;
                const index = Array.prototype.indexOf.call(form, e.target);
                if (form.elements[index + 1]) {
                    form.elements[index + 1].focus();
                }
            }
        }
    };

    // Smart Detection Logic
    useEffect(() => {
        if (!showModal || isEditMode) {
            setExistingProduct(null);
            return;
        }

        const trimmedName = formData.name.trim().toLowerCase();
        if (!trimmedName) {
            setExistingProduct(null);
            return;
        }

        const match = products.find(p => p.name.toLowerCase() === trimmedName);
        if (match) {
            setExistingProduct(match);
            // Auto-fill category if not set
            if (!formData.category_id) setFormData(prev => ({ ...prev, category_id: match.category_id }));
        } else {
            setExistingProduct(null);
        }
    }, [formData.name, showModal, isEditMode, products]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        // Branch: Restock vs Create/Update
        if (existingProduct && !isEditMode) {
            await handleRestock();
            return;
        }

        const url = '/api/inventory/products';
        const method = isEditMode ? 'PUT' : 'POST';

        // Normalize numbers before submit
        const cleanData = {
            ...formData,
            buy_price: normalizeNumber(formData.buy_price),
            sell_price: normalizeNumber(formData.sell_price),
            stock_quantity: normalizeNumber(formData.stock_quantity)
        };

        const body = isEditMode ? { ...cleanData, id: editId } : cleanData;

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (res.ok) {
            // Update sticky date from the submitted form
            if (formData.created_at) setStickyDate(formData.created_at);

            setShowModal(false);
            // Reset form but keep sticky date AND category
            setFormData({
                name: '',
                category_id: formData.category_id || '', // Keep Category
                buy_price: '',
                sell_price: '',
                stock_quantity: '',
                created_at: formData.created_at || stickyDate // Keep Date
            });
            setIsEditMode(false);
            setEditId(null);
            fetchProducts();
        } else {
            const result = await res.json();
            alert(`Failed to ${isEditMode ? 'update' : 'add'} product: ${result.error || result.message || 'Unknown error'}\n${result.details ? result.details.join('\n') : ''}`);
        }
    };

    const startEdit = (product) => {
        setFormData({
            name: product.name,
            category_id: product.category_id || '',
            buy_price: product.buy_price,
            sell_price: product.sell_price,
            stock_quantity: product.stock_quantity,
            created_at: product.created_at ? product.created_at.split('T')[0] : stickyDate
        });
        setEditId(product.id);
        setIsEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        const res = await fetch(`/api/inventory/products?id=${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            fetchProducts();
        } else {
            alert("Failed to delete product");
        }
    };

    const openAddModal = () => {
        setFormData({
            name: '',
            category_id: formData.category_id || '', // Use existing category if available (sticky)
            buy_price: '',
            sell_price: '',
            stock_quantity: '',
            created_at: stickyDate
        });
        setIsEditMode(false);
        setEditId(null);
        setShowModal(true);
    };



    // Search State
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.category_name && product.category_name.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = filterCategory ? product.category_id == filterCategory : true;

        const price = filterBySellPrice ? product.sell_price : product.buy_price;
        const min = priceMin ? parseFloat(priceMin) : 0;
        const max = priceMax ? parseFloat(priceMax) : Infinity;
        const matchesPrice = price >= min && price <= max;

        // Month Filter Logic
        const matchesMonth = monthFilter
            ? (product.created_at || '').startsWith(monthFilter)
            : true;

        return matchesSearch && matchesCategory && matchesPrice && matchesMonth;
    }).sort((a, b) => {
        if (sortOption === 'date_desc') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        if (sortOption === 'date_asc') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        if (sortOption === 'sales_desc') return (b.sales_count || 0) - (a.sales_count || 0);
        return 0;
    });

    const handleRestock = async () => {
        const cleanData = {
            product_id: existingProduct.id,
            quantity: normalizeNumber(formData.stock_quantity),
            buy_price: normalizeNumber(formData.buy_price),
            sell_price: normalizeNumber(formData.sell_price),
            created_at: formData.created_at || stickyDate
        };

        const res = await fetch('/api/inventory/restock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanData),
        });

        if (res.ok) {
            if (formData.created_at) setStickyDate(formData.created_at);
            setShowModal(false);
            setFormData({
                name: '',
                category_id: formData.category_id || '',
                buy_price: '',
                sell_price: '',
                stock_quantity: '',
                created_at: formData.created_at || stickyDate
            });
            setExistingProduct(null);
            fetchProducts();
            alert('Stock added successfully!');
        } else {
            const result = await res.json();
            alert('Failed to restock: ' + (result.error || result.message));
        }
    };

    return (
        <div className="layout-container bg-[#F9FAFB]">
            <Sidebar />

            <main className="main-content p-3 md:p-6 lg:p-8 overflow-y-auto h-[100dvh] lg:ml-[260px]">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div className="pl-12 lg:pl-0">
                        <h1 className="text-2xl font-bold text-[#111827]">Products Inventory</h1>
                        <p className="text-[#6B7280] text-sm">Manage your product catalog and stock.</p>
                        {/* Layer 3 Sidebar */}
                        <ProductDetailsSidebar product={selectedProduct} onClose={() => setSelectedProduct(null)} />
                    </div>
                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        <div className="flex gap-2 items-center flex-wrap justify-end">
                            {/* Search Box */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="pl-4 pr-10 py-2 rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#0065F4] w-64"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>


                            <button
                                className="flex items-center gap-2 px-4 py-2 bg-[#0065F4] text-white rounded-xl font-semibold shadow hover:bg-[#0052cc] transition-colors"
                                onClick={openAddModal}
                                title="Shortcut: Shift + N"
                            >
                                <Plus size={18} /> Add Product
                            </button>
                        </div>

                        {/* Filters & Sorting Toolbar */}
                        <div className="flex flex-wrap items-center gap-2 justify-end bg-white p-2 rounded-xl border border-[#E5E7EB] shadow-sm">
                            {/* Sort */}
                            <select
                                className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#0065F4]"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                            >
                                <option value="date_desc">Newest First</option>
                                <option value="date_asc">Oldest First</option>
                                <option value="sales_desc">Most Sold</option>
                            </select>

                            {/* Category Filter */}
                            <select
                                className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#0065F4]"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            {/* Month Filter */}
                            <div className="flex items-center gap-1 border border-[#E5E7EB] rounded-lg px-2 py-1.5 bg-white">
                                <span className="text-xs font-medium text-gray-500">Entry Month:</span>
                                <input
                                    type="month"
                                    className="text-sm focus:outline-none"
                                    value={monthFilter}
                                    onChange={(e) => setMonthFilter(e.target.value)}
                                />
                            </div>

                            {/* Price Range */}
                            <div className="flex items-center gap-1 border-l border-r border-[#E5E7EB] px-2">
                                <span className="text-xs font-medium text-gray-500">Price:</span>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    className="w-16 px-2 py-1 rounded-md border border-[#E5E7EB] text-sm focus:outline-none focus:ring-1 focus:ring-[#0065F4]"
                                    value={priceMin}
                                    onChange={(e) => setPriceMin(e.target.value)}
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    className="w-16 px-2 py-1 rounded-md border border-[#E5E7EB] text-sm focus:outline-none focus:ring-1 focus:ring-[#0065F4]"
                                    value={priceMax}
                                    onChange={(e) => setPriceMax(e.target.value)}
                                />
                            </div>

                            {/* Sell Price Toggle */}
                            <label className="flex items-center gap-2 cursor-pointer px-2">
                                <input
                                    type="checkbox"
                                    checked={filterBySellPrice}
                                    onChange={(e) => setFilterBySellPrice(e.target.checked)}
                                    className="rounded border-gray-300 text-[#0065F4] focus:ring-[#0065F4]"
                                />
                                <span className="text-sm text-gray-700">Filter by Sell Price</span>
                            </label>
                        </div>
                    </div>
                </header>

                <div className="bg-white rounded-3xl shadow-sm border border-[#E5E7EB] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                    <th className="p-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Product Name</th>
                                    <th className="p-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Category</th>
                                    <th className="p-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Buy Price</th>
                                    <th className="p-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Sell Price</th>
                                    <th className="p-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Stock</th>
                                    <th className="p-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB]">
                                {filteredProducts.map(product => (
                                    <tr key={product.id} className="hover:bg-[#F9FAFB] transition-colors">
                                        <td
                                            className="p-4 text-sm font-medium text-[#111827] cursor-pointer hover:text-[#0065F4] transition-colors"
                                            onClick={() => setSelectedProduct(product)}
                                        >
                                            {product.name}
                                        </td>
                                        <td className="p-4 text-sm text-[#4B5563]">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                                                {product.category_name || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-[#4B5563]">
                                            <span className="font-extrabold mr-1">৳</span>{product.buy_price}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-[#10B981]">
                                            <span className="font-extrabold mr-1">৳</span>{product.sell_price}
                                        </td>
                                        <td className="p-4 text-sm text-[#4B5563]">
                                            {product.stock_quantity < 10 ? (
                                                <span className="text-red-600 font-bold flex items-center gap-1">
                                                    {product.stock_quantity} (Low)
                                                </span>
                                            ) : (
                                                product.stock_quantity
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => startEdit(product)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-[#6B7280]">
                                            {products.length === 0 ? 'No products found.' : 'No filtered products found.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Product Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-[#111827]">
                                    {isEditMode ? 'Edit Product' : 'Add Product'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="text-[#9CA3AF] hover:text-[#4B5563]">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Added onKeyDown to form to catch Enter keys */}
                            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1">Product Name</label>
                                    <input
                                        className="w-full px-4 py-2 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#0065F4] focus:border-transparent transition-shadow"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Premium Scarf"
                                        autoFocus // Focus on name when modal opens
                                        disabled={isEditMode && existingProduct} // Can't rename in restock mode effectively? Actually standard edit mode handles this.
                                    />

                                    {/* Layer 2: Smart Restock Info Box */}
                                    {existingProduct && !isEditMode && (
                                        <div
                                            className="mt-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-indigo-100 transition-all shadow-sm group"
                                            onClick={() => setSelectedProduct(existingProduct)}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                                                    📦 Stock Overview
                                                </span>
                                                <div className="text-base font-bold text-indigo-900 flex items-center gap-2">
                                                    <span className="bg-indigo-200 text-indigo-800 text-xs px-2 py-0.5 rounded-md">
                                                        {new Date(existingProduct.created_at || new Date()).toLocaleString('default', { month: 'short' })} - {new Date().toLocaleString('default', { month: 'short' })}
                                                    </span>
                                                    <span>|</span>
                                                    <span>Total: {existingProduct.stock_quantity} In Stock</span>
                                                </div>
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                                                <ExternalLink size={16} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1">Category</label>
                                    <div className="flex gap-2">
                                        <select
                                            className="w-full px-4 py-2 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#0065F4] transition-shadow bg-white"
                                            value={formData.category_id}
                                            onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                        >
                                            <option value="">Select Category</option>
                                            {(Array.isArray(categories) ? categories : []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <button
                                            type="button"
                                            className="px-3 py-2 bg-[#F3F4F6] text-[#4B5563] rounded-xl hover:bg-[#E5E7EB] transition-colors"
                                            onClick={() => setShowCategoryModal(true)}
                                            title="Add New Category"
                                            tabIndex={-1} // Skip tab index
                                        >
                                            <Plus size={20} />
                                        </button>
                                        <button
                                            type="button"
                                            className="px-3 py-2 bg-[#F3F4F6] text-[#4B5563] rounded-xl hover:bg-[#E5E7EB] transition-colors"
                                            onClick={() => setShowCategoryManager(true)}
                                            title="Manage Categories (Edit/Delete)"
                                            tabIndex={-1} // Skip tab index
                                        >
                                            <Settings size={20} />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#374151] mb-1">Buy Price (Cost)</label>
                                        <input
                                            type="text" // Changed to text to allow Bangla digits initially
                                            inputMode="decimal"
                                            className="w-full px-4 py-2 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#0065F4] transition-shadow"
                                            required
                                            value={formData.buy_price}
                                            onChange={e => {
                                                const val = normalizeNumber(e.target.value);
                                                setFormData({ ...formData, buy_price: val });
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#374151] mb-1">Sell Price</label>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            className="w-full px-4 py-2 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#0065F4] transition-shadow"
                                            required
                                            value={formData.sell_price}
                                            onChange={e => setFormData({ ...formData, sell_price: normalizeNumber(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1">Stock Quantity</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        className="w-full px-4 py-2 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#0065F4] transition-shadow"
                                        value={formData.stock_quantity}
                                        onChange={e => setFormData({ ...formData, stock_quantity: normalizeNumber(e.target.value) })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1">Entry Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#0065F4] transition-shadow"
                                        value={formData.created_at || ''}
                                        onChange={e => setFormData({ ...formData, created_at: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        className="flex-1 px-4 py-2 bg-white border border-[#D1D5DB] text-[#374151] rounded-xl font-medium hover:bg-[#F9FAFB] transition-colors"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-[#0065F4] text-white rounded-xl font-bold shadow hover:bg-[#0052cc] transition-colors"
                                    >
                                        {isEditMode ? 'Update Product' : 'Save Product'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {/* Category Modal */}
                {showCategoryModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                            <h2 className="text-lg font-bold text-[#111827] mb-4">Add New Category</h2>
                            <form onSubmit={handleAddCategory} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1">Category Name</label>
                                    <input
                                        className="w-full px-4 py-2 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#0065F4] transition-shadow"
                                        required
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        autoFocus
                                        placeholder="e.g. Clothing"
                                    />
                                </div>
                                <div className="flex gap-3 justify-end pt-2">
                                    <button type="button" className="px-4 py-2 bg-white border border-[#D1D5DB] text-[#374151] rounded-xl font-medium hover:bg-[#F9FAFB] transition-colors" onClick={() => setShowCategoryModal(false)}>Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-[#0065F4] text-white rounded-xl font-bold shadow hover:bg-[#0052cc] transition-colors">Add</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                <CategoryManagerModal
                    isOpen={showCategoryManager}
                    onClose={() => setShowCategoryManager(false)}
                    type="product"
                    onUpdate={fetchCategories}
                />
            </main>
        </div>
    );
}
