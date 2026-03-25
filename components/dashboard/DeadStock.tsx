import { AlertCircle, Tag } from "lucide-react";
import Link from "next/link";

interface DeadStockItem {
    id: number;
    name: string;
    stock_quantity: number;
    buy_price: number;
    blocked_capital: number;
}

export function DeadStock({ items }: { items: DeadStockItem[] }) {
    return (
        <div className="w-full flex flex-col">
            <div className="flex flex-col gap-3">
                {items && items.length > 0 ? (
                    items.map((item, idx) => (
                        <div key={idx} className="flex flex-col p-3 rounded-2xl transition-colors border border-purple-100 hover:bg-purple-50/30 group gap-2">
                            <div className="flex flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                                        <AlertCircle size={16} className="text-purple-500" />
                                    </div>
                                    <span className="text-[#0C1829] font-medium text-[15px] line-clamp-1">
                                        {item.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-purple-100 text-purple-600 rounded-full font-bold text-[12px] shadow-sm whitespace-nowrap">
                                    {item.stock_quantity} Blocked
                                </div>
                            </div>

                            {/* Action & Finance Row */}
                            <div className="flex justify-between items-center pl-11 pr-1 mt-1">
                                <div className="flex items-center gap-1.5 text-[12px] font-bold text-gray-500">
                                    <span className="font-medium text-[11px] text-gray-400">Blocked Cap:</span>
                                    ৳{item.blocked_capital.toLocaleString()}
                                </div>
                                <Link
                                    href="/inventory/products"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-purple-100 text-purple-700 hover:bg-purple-200 shadow-sm shadow-purple-200/50"
                                >
                                    <Tag size={13} />
                                    Review Price
                                </Link>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 p-6 bg-green-50/50 rounded-3xl border border-green-100">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                            <span className="text-green-600 text-xl font-bold">✓</span>
                        </div>
                        <span className="text-green-700 font-medium text-sm">Excellent! No dead stock detected.</span>
                        <span className="text-gray-400 text-xs text-center">Every product has had at least one sale in the selected period.</span>
                    </div>
                )}
            </div>
        </div>
    );
}
