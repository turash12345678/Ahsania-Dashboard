'use client';
import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Check, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
        } catch (err) {
            console.error('Failed to load categories', err);
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
                if (onUpdate) onUpdate();
            } else {
                const err = await res.json();
                setError(err.error || 'Failed to update');
            }
        } catch {
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
        } catch {
            setError('Failed to delete');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col shadow-m3-3">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-foreground">Manage Categories</h2>
                    <Button variant="text" size="icon" onClick={onClose} className="rounded-full">
                        <X size={20} />
                    </Button>
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
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="flex-1"
                                                autoFocus
                                            />
                                            <Button variant="text" size="icon" onClick={() => handleSaveEdit(cat.id)} className="text-primary hover:text-primary/80">
                                                <Check size={18} />
                                            </Button>
                                            <Button variant="text" size="icon" onClick={handleCancelEdit} className="text-muted-foreground hover:text-foreground">
                                                <XCircle size={18} />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="font-medium text-foreground">{cat.name}</span>
                                            <div className="flex items-center gap-1">
                                                <Button variant="text" size="icon" onClick={() => handleEditClick(cat)} className="text-primary" title="Edit">
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button variant="text" size="icon" onClick={() => handleDelete(cat.id)} className="text-error hover:bg-error-container hover:text-on-error-container" title="Delete">
                                                    <Trash2 size={16} />
                                                </Button>
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
