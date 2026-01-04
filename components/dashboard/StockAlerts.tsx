import { AlertTriangle } from "lucide-react";

interface AlertItem {
    name: string;
    stock_quantity: number;
}

export function StockAlerts({ items }: { items: AlertItem[] }) {
    return (
        <div className="w-full flex flex-col gap-6">
            {/* Table Header */}
            <div className="flex flex-row items-start w-full h-[42px] rounded-[13px] overflow-hidden">
                <div className="flex-1 bg-[#F8FAFC] p-3 px-4 flex items-center">
                    <span className="text-[#60758D] font-inter font-medium text-[12px] uppercase tracking-wider">Product name</span>
                </div>
                <div className="w-[95px] bg-[#F8FAFC] p-3 px-4 flex items-center justify-end">
                    <span className="text-[#60758D] font-inter font-medium text-[12px] uppercase tracking-wider text-right">stock</span>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                {items.length > 0 ? (
                    items.map((item, idx) => (
                        <div key={idx} className="flex flex-row items-center border-b border-[#F2F4F5] last:border-0 py-3 px-2 bg-red-50/50 hover:bg-red-50 transition-colors rounded-lg mb-1">
                            <div className="flex-1 flex items-center gap-2">
                                <AlertTriangle size={16} className="text-red-500" />
                                <span className="text-[#0C1829] font-inter font-medium text-[14px]">{item.name}</span>
                            </div>
                            <div className="w-[95px] text-right font-bold text-red-500 text-[14px]">
                                {item.stock_quantity}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <div className="w-8 h-8 rounded-full border-2 border-[#9AA3B0] flex items-center justify-center opacity-50 mb-2">
                            <span className="text-[#9AA3B0] text-lg">!</span>
                        </div>
                        <span className="text-[#9AA3B0] font-inter text-[15px]">No stock alerts.</span>
                    </div>
                )}
            </div>
        </div>
    );
}
