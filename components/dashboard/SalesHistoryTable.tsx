"use client";

import { Trash2, AlertCircle } from "lucide-react";
import { useState } from "react";

interface Sale {
    id: number;
    total_amount: number;
    created_at: string;
    payment_method: string;
}

interface SalesHistoryTableProps {
    sales: Sale[];
    onDeleteSale: (id: number) => void;
    canEdit?: boolean;
}

export function SalesHistoryTable({ sales, onDeleteSale, canEdit = true }: SalesHistoryTableProps) {
    // Keep props accessible for checking inside map if needed, or just use destrutured canEdit
    const props = { canEdit };
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleDeleteClick = async (id: number) => {
        if (!confirm("Are you sure you want to delete this sale? Stock will be restored.")) return;

        setDeletingId(id);
        try {
            const res = await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                onDeleteSale(id);
            } else {
                alert("Failed to delete sale");
            }
        } catch (e) {
            alert("Error deleting sale");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="w-full h-full flex flex-col gap-4">
            {/* Table Header */}
            <div className="flex flex-row items-center w-full h-[42px] rounded-[13px] bg-[#F8FAFC] px-4">
                <div className="flex-[2] text-[#60758D] font-inter font-medium text-[12px] uppercase tracking-wider">Date & Time</div>
                <div className="flex-1 text-[#60758D] font-inter font-medium text-[12px] uppercase tracking-wider">Amount</div>
                <div className="flex-1 text-[#60758D] font-inter font-medium text-[12px] uppercase tracking-wider">Method</div>
                <div className="w-[60px] text-right text-[#60758D] font-inter font-medium text-[12px] uppercase tracking-wider">Action</div>
            </div>

            {/* Table Body */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
                {sales.length > 0 ? (
                    sales.map((sale) => (
                        <div key={sale.id} className="flex flex-row items-center border-b border-[#F2F4F5] last:border-0 py-3 px-4 hover:bg-gray-50 transition-colors">
                            <div className="flex-[2] flex flex-col">
                                <span className="text-[#0C1829] font-inter font-medium text-[14px]">{new Date(sale.created_at).toLocaleDateString()}</span>
                                <span className="text-[#9AA3B0] font-inter text-[12px]">{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex-1 font-bold text-[#0067FD] text-[14px]">
                                ৳{sale.total_amount}
                            </div>
                            <div className="flex-1 text-[#495564] font-inter text-[14px] capitalize">
                                {sale.payment_method}
                            </div>
                            <div className="w-[60px] flex justify-end">
                                {onDeleteSale && (!('canEdit' in props) || props.canEdit) ? (
                                    <button
                                        onClick={() => handleDeleteClick(sale.id)}
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
