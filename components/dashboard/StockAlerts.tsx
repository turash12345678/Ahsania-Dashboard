import { useState } from 'react';
import { AlertTriangle, ShoppingCart, Info, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface AlertItem {
    id?: number;
    name: string;
    stock_quantity: number;
    buy_price?: number;
    sell_price?: number;
}

export function StockAlerts({ items }: { items: AlertItem[] }) {
    const [expanded, setExpanded] = useState(false);

    // Sort items so lowest stock is at the top
    const sortedItems = [...items].sort((a, b) => a.stock_quantity - b.stock_quantity);
    const displayItems = expanded ? sortedItems : sortedItems.slice(0, 4);

    return (
        <div className="w-full flex flex-col">
            <div className="flex flex-col gap-3">
                {displayItems.length > 0 ? (
                    <>
                        {displayItems.map((item, idx) => {
                            const isOut = item.stock_quantity === 0;
                            const restockQty = 10; // predefined estimate quantity
                            const estimateCost = item.buy_price ? item.buy_price * restockQty : 0;

                            return (
                                <div key={idx} className={`flex flex-col p-3 rounded-2xl transition-colors border group gap-2 ${isOut ? 'border-red-100 hover:bg-red-50/30' : 'border-orange-100 hover:bg-orange-50/30'
                                    }`}>
                                    <div className="flex flex-row items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isOut ? 'bg-red-50' : 'bg-orange-50'
                                                }`}>
                                                <AlertTriangle size={16} className={isOut ? "text-red-500" : "text-orange-500"} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[#0C1829] font-medium text-[15px] line-clamp-1">
                                                    {item.name}
                                                </span>
                                                <span className={`text-[12px] font-bold ${isOut ? 'text-red-500' : 'text-orange-500'}`}>
                                                    {isOut ? 'Out of Stock' : `${item.stock_quantity} Left`}
                                                </span>
                                            </div>
                                        </div>

                                        <Link
                                            href="/inventory/shipments"
                                            className={`flex flex-shrink-0 items-center justify-center w-8 h-8 rounded-full transition-all ${isOut
                                                    ? 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700'
                                                    : 'bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700'
                                                }`}
                                            title="Restock"
                                        >
                                            <ShoppingCart size={15} />
                                        </Link>
                                    </div>

                                    {/* Additional Info Row */}
                                    {estimateCost > 0 && (
                                        <div className="flex items-center gap-1.5 pl-11 text-[11px] font-medium text-gray-400 mt-0.5">
                                            <Info size={12} />
                                            Est. ৳{estimateCost.toLocaleString()} for 10 pcs
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {sortedItems.length > 4 && (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="mt-1 w-full flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                            >
                                {expanded ? (
                                    <><ChevronUp size={16} /> Hide Alerts</>
                                ) : (
                                    <><ChevronDown size={16} /> View {sortedItems.length - 4} More Alerts</>
                                )}
                            </button>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 p-6 bg-green-50/50 rounded-3xl border border-green-100">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                            <span className="text-green-600 text-xl font-bold">✓</span>
                        </div>
                        <span className="text-green-700 font-medium text-sm">All products are well stocked.</span>
                    </div>
                )}
            </div>
        </div>
    );
}
