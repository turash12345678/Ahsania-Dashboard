"use client";

import { Trash2, AlertCircle } from "lucide-react";
import { useState } from "react";

interface Sale {
    id: number;
    total_amount: number;
    created_at: string;
    payment_method: string;
    items?: {
        name: string;
        quantity: number;
        price: number;
        type: string;
    }[];
}

interface SalesHistoryTableProps {
    sales: Sale[];
    onDeleteSale: (id: number) => void;
    canEdit?: boolean;
}

export function SalesHistoryTable({ sales, onDeleteSale, canEdit = true }: SalesHistoryTableProps) {
    const props = { canEdit };
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const toggleExpand = (id: number) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    const handleDeleteClick = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation(); // Prevent row click expansion
        if (!confirm("Are you sure you want to delete this sale? Stock will be restored.")) return;

        setDeletingId(id);
        try {
            const res = await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                onDeleteSale(id);
            } else {
                const errorData = await res.json();
                alert(`Failed to delete sale: ${errorData.error || errorData.message || 'Unknown error'}`);
            }
        } catch (e) {
            alert(`Error deleting sale: ${e instanceof Error ? e.message : 'Network error'}`);
        } finally {
            setDeletingId(null);
        }
    };

    // Helper to format time correctly (assuming server UTC, client Local)
    const formatTime = (dateStr: string) => {
        try {
            // Ensure strict ISO parsing by appending Z if missing (Fix for Timezone issue)
            const isoString = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
            return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return "Invalid Date";
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            // Ensure strict ISO parsing by appending Z if missing
            const isoString = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
            return new Date(isoString).toLocaleDateString();
        } catch (e) {
            return "Invalid Date";
        }
    }


    return (
        <div className="w-full h-full flex flex-col gap-4">
            {/* Table Header */}
            <div className="flex flex-row items-center w-full h-[42px] rounded-[13px] bg-[#F8FAFC] px-3 gap-2">
                <div className="flex-[2] text-[#60758D] font-inter font-medium text-[10px] sm:text-[12px] uppercase tracking-wider truncate">Date & Time</div>
                <div className="flex-1 text-[#60758D] font-inter font-medium text-[10px] sm:text-[12px] uppercase tracking-wider truncate">Amount</div>
                <div className="hidden sm:block flex-1 text-[#60758D] font-inter font-medium text-[12px] uppercase tracking-wider">Method</div>
                <div className="w-[30px] sm:w-[60px] text-right text-[#60758D] font-inter font-medium text-[10px] sm:text-[12px] uppercase tracking-wider">Action</div>
            </div>

            {/* Table Body */}
            <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0 pr-1 custom-scrollbar">
                {sales.length > 0 ? (
                    sales.map((sale) => (
                        <div key={sale.id} className="flex flex-col border-b border-[#F2F4F5] last:border-0">
                            {/* Main Row */}
                            <div
                                onClick={() => toggleExpand(sale.id)}
                                className="flex flex-row items-center py-3 px-3 gap-2 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                <div className="flex-[2] flex flex-col min-w-0">
                                    <span className="text-[#0C1829] font-inter font-medium text-[12px] sm:text-[14px] truncate">{formatDate(sale.created_at)}</span>
                                    <span className="text-[#9AA3B0] font-inter text-[10px] sm:text-[12px] truncate">{formatTime(sale.created_at)}</span>
                                </div>
                                <div className="flex-1 font-bold text-[#0067FD] text-[12px] sm:text-[14px] truncate">
                                    ৳{sale.total_amount}
                                </div>
                                <div className="hidden sm:block flex-1 text-[#495564] font-inter text-[14px] capitalize truncate">
                                    {sale.payment_method}
                                </div>
                                <div className="w-[30px] sm:w-[60px] flex justify-end">
                                    {onDeleteSale && (!('canEdit' in props) || props.canEdit) ? (
                                        <button
                                            onClick={(e) => handleDeleteClick(e, sale.id)}
                                            disabled={deletingId === sale.id}
                                            className="p-2 rounded-full hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors"
                                        >
                                            {deletingId === sale.id ? (
                                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent animate-spin rounded-full" />
                                            ) : (
                                                <Trash2 size={18} />
                                            )}
                                        </button>
                                    ) : null}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedId === sale.id && (
                                <div className="bg-[#F8FAFC] px-4 py-3 rounded-b-[12px] mb-2 mx-2">
                                    <div className="grid grid-cols-12 gap-2 mb-2 pb-1 border-b border-gray-200 text-[11px] font-bold text-[#64748B] uppercase">
                                        <div className="col-span-6">Item</div>
                                        <div className="col-span-2 text-center">Qty</div>
                                        <div className="col-span-2 text-right">Price</div>
                                        <div className="col-span-2 text-right">Total</div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {sale.items && sale.items.length > 0 ? (
                                            sale.items.map((item, idx) => (
                                                <div key={idx} className="grid grid-cols-12 gap-2 text-[12px] text-[#334155] py-0.5">
                                                    <div className="col-span-6 truncate font-medium">{item.name || 'Unknown Item'}</div>
                                                    <div className="col-span-2 text-center">{item.quantity}</div>
                                                    <div className="col-span-2 text-right">৳{item.price}</div>
                                                    <div className="col-span-2 text-right font-semibold">৳{(item.quantity * item.price).toFixed(2)}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center text-[#94A3B8] text-[12px] py-1">No items details available</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 h-full">
                        <div className="w-10 h-10 rounded-full border-2 border-[#9AA3B0] flex items-center justify-center opacity-30 mb-2">
                            <AlertCircle size={20} className="text-[#9AA3B0]" />
                        </div>
                        <span className="text-[#9AA3B0] font-inter text-[15px]">No sales found in this period</span>
                    </div>
                )}
            </div>
        </div>
    );
}
