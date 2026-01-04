'use strict';
import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Check, XCircle } from 'lucide-react';

export default function CategoryManagerModal({ isOpen, onClose, type, onUpdate }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen, type]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/inventory/categories?type=${type}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setCategories(data);
            }
        } catch (error) {
            console.error('Failed to load categories', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (cat) => {
        setEditingId(cat.id);
        setEditName(cat.name);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setError('');
    };

    const handleSaveEdit = async (id) => {
        if (!editName.trim()) return;

        try {
            const res = await fetch('/api/inventory/categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name: editName })
            });

            if (res.ok) {
                setCategories(categories.map(c => c.id === id ? { ...c, name: editName } : c));
                setEditingId(null);
                if (onUpdate) onUpdate(); // Refresh parent list
            } else {
                const err = await res.json();
                setError(err.error || 'Failed to update');
            }
        } catch (error) {
            setError('Failed to update');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure? Products in this category will become Uncategorized.')) return;

        try {
            const res = await fetch(`/api/inventory/categories?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setCategories(categories.filter(c => c.id !== id));
                if (onUpdate) onUpdate();
            } else {
                const err = await res.json();
                setError(err.error || 'Failed to delete');
            }
        } catch (error) {
            setError('Failed to delete');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Manage Categories</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <p className="text-center text-gray-500 py-4">Loading...</p>
                    ) : categories.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No categories found.</p>
                    ) : (
                        <ul className="space-y-2">
                            {categories.map((cat) => (
                                <li key={cat.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border border-gray-100">
                                    {editingId === cat.id ? (
                                        <div className="flex items-center flex-1 gap-2">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="flex-1 border rounded px-2 py-1 text-sm"
                                                autoFocus
                                            />
                                            <button onClick={() => handleSaveEdit(cat.id)} className="text-green-600 hover:text-green-800 p-1">
                                                <Check size={18} />
                                            </button>
                                            <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700 p-1">
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="font-medium text-gray-700">{cat.name}</span>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleEditClick(cat)} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50" title="Edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50" title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                    Deleting a category will remove it from all assigned products.
                </div>
            </div>
        </div>
    );
}
