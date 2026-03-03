import { AlertTriangle, ShoppingCart, Info } from "lucide-react";
import Link from "next/link";

interface AlertItem {
    id?: number;
    name: string;
    stock_quantity: number;
    buy_price?: number;
    sell_price?: number;
}

export function StockAlerts({ items }: { items: AlertItem[] }) {
    return (
        <div className="w-full flex flex-col">
            <div className="flex flex-col gap-3">
                {items.length > 0 ? (
                    items.map((item, idx) => {
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
                                        <span className="text-[#0C1829] font-medium text-[15px] line-clamp-1">
                                            {item.name}
                                        </span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1 bg-white border rounded-full font-bold text-[12px] shadow-sm whitespace-nowrap ${isOut ? 'border-red-100 text-red-600' : 'border-orange-100 text-orange-500'
                                        }`}>
                                        {isOut ? 'Out of Stock' : `${item.stock_quantity} Left`}
                                    </div>
                                </div>

                                {/* Action Row */}
                                <div className="flex justify-between items-center pl-11 pr-1 mt-1">
                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                                        <Info size={12} />
                                        {estimateCost > 0 ? `Est. ৳${estimateCost.toLocaleString()} for 10 pcs` : 'No buy price set'}
                                    </div>
                                    <Link
                                        href="/inventory/shipments"
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isOut
                                                ? 'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-200'
                                                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                            }`}
                                    >
                                        <ShoppingCart size={13} />
                                        Restock
                                    </Link>
                                </div>
                            </div>
                        )
                    })
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
