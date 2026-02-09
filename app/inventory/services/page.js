'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Pencil, Trash2, Plus, X, Settings } from 'lucide-react';
import CategoryManagerModal from '@/components/CategoryManagerModal';

export default function ServicesPage() {
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
        price: ''
    });

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const [user, setUser] = useState(null);

    useEffect(() => {
        // Fetch User Session
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) setUser(data.user);
            })
            .catch(err => console.error(err));

        fetchServices();
        fetchCategories();
    }, []);

    const fetchServices = async () => {
        const res = await fetch('/api/inventory/services');
        const data = await res.json();
        setServices(data);
    };

    const fetchCategories = async () => {
        const res = await fetch('/api/inventory/categories?type=service');
        const data = await res.json();
        setCategories(data);
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        const res = await fetch('/api/inventory/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newCategoryName, type: 'service' }),
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = '/api/inventory/services';
        const method = isEditMode ? 'PUT' : 'POST';
        const body = isEditMode ? { ...formData, id: editId } : formData;

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (res.ok) {
            setShowModal(false);
            setFormData({ name: '', category_id: '', price: '' });
            setIsEditMode(false);
            setEditId(null);
            fetchServices();
        } else {
            const result = await res.json();
            alert(`Failed to ${isEditMode ? 'update' : 'add'} service: ${result.error || result.message || 'Unknown error'}`);
        }
    };

    const startEdit = (service) => {
        setFormData({
            name: service.name,
            category_id: service.category_id || '',
            price: service.price
        });
        setEditId(service.id);
        setIsEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this service?")) return;

        const res = await fetch(`/api/inventory/services?id=${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            fetchServices();
        } else {
            alert("Failed to delete service");
        }
    };

    const openAddModal = () => {
        setFormData({ name: '', category_id: '', price: '' });
        setIsEditMode(false);
        setEditId(null);
        setShowModal(true);
    };

    // Search State
    const [searchQuery, setSearchQuery] = useState('');

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.category_name && service.category_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="layout-container bg-[#F9FAFB]">
            <Sidebar />

            <main className="main-content p-3 md:p-6 lg:p-8 overflow-y-auto h-[100dvh] lg:ml-[260px]">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div className="pl-12 lg:pl-0">
                        <h1 className="text-2xl font-bold text-[#111827]">Services</h1>
                        <p className="text-[#6B7280] text-sm">Manage service offerings.</p>
                    </div>
                    <div className="flex gap-2 items-center flex-wrap w-full md:w-auto">
                        {/* Search Box */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search services..."
                                className="pl-4 pr-10 py-2 rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#0065F4] w-64"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-[#0065F4] text-white rounded-xl font-semibold shadow hover:bg-[#0052cc] transition-colors"
                            onClick={openAddModal}
                        >
                            <Plus size={18} /> Add Service
                        </button>
                    </div>
                </header>

                <div className="bg-white rounded-3xl shadow-sm border border-[#E5E7EB] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                    <th className="p-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Service Name</th>
                                    <th className="p-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Category</th>
                                    <th className="p-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Price</th>
                                    <th className="p-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB]">
                                {filteredServices.map(service => (
                                    <tr key={service.id} className="hover:bg-[#F9FAFB] transition-colors">
                                        <td className="p-4 text-sm font-medium text-[#111827]">{service.name}</td>
                                        <td className="p-4 text-sm text-[#4B5563]">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-800">
                                                {service.category_name || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-[#10B981]">৳{service.price}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => startEdit(service)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(service.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredServices.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-[#6B7280]">
                                            {services.length === 0 ? 'No services found.' : 'No filtered services found.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-[#111827]">
                                    {isEditMode ? 'Edit Service' : 'Add New Service'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="text-[#9CA3AF] hover:text-[#4B5563]">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1">Service Name</label>
                                    <input
                                        className="w-full px-4 py-2 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#0065F4] focus:border-transparent transition-shadow"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Haircut"
                                    />
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
                                        >
                                            <Plus size={20} />
                                        </button>
                                        <button
                                            type="button"
                                            className="px-3 py-2 bg-[#F3F4F6] text-[#4B5563] rounded-xl hover:bg-[#E5E7EB] transition-colors"
                                            onClick={() => setShowCategoryManager(true)}
                                            title="Manage Categories (Edit/Delete)"
                                        >
                                            <Settings size={20} />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1">Price</label>
                                    <input type="number" className="w-full px-4 py-2 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#0065F4] transition-shadow" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
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
                                        {isEditMode ? 'Update Service' : 'Save Service'}
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
                                        placeholder="e.g. Services"
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
                    type="service"
                    onUpdate={fetchCategories}
                />
            </main>
        </div>
    );
}
