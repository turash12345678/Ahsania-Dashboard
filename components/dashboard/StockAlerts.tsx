import { AlertTriangle } from "lucide-react";

interface AlertItem {
    name: string;
    stock_quantity: number;
}

export function StockAlerts({ items }: { items: AlertItem[] }) {
    return (
        <div className="w-full flex flex-col">
            <div className="flex flex-col gap-3">
                {items.length > 0 ? (
                    items.map((item, idx) => (
                        <div key={idx} className="flex flex-row items-center justify-between p-3 rounded-2xl hover:bg-red-50/30 transition-colors border border-gray-100 group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle size={16} className="text-red-500" />
                                </div>
                                <span className="text-[#0C1829] font-medium text-[15px] line-clamp-1">
                                    {item.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-red-100 text-red-600 rounded-full font-bold text-[13px] shadow-sm">
                                {item.stock_quantity === 0 ? 'Out of Stock' : `${item.stock_quantity} Left`}
                            </div>
                        </div>
                    ))
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
