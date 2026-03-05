import { AlertCircle, Tag } from "lucide-react";
import Link from "next/link";
import { Ripple } from "@/components/ui/ripple";
import { Button } from "@/components/ui/button";

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
                        <div key={idx} className="relative flex flex-col p-4 rounded-2xl transition-colors bg-surface-container-lowest border border-border hover:bg-surface-variant/30 overflow-hidden gap-2">
                            <Ripple />
                            <div className="flex flex-row items-center justify-between relative z-10 pointer-events-none">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center flex-shrink-0">
                                        <AlertCircle size={20} className="text-on-error-container" />
                                    </div>
                                    <span className="text-foreground font-medium text-[16px] line-clamp-1">
                                        {item.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-surface border border-outline-variant text-on-surface-variant rounded-full font-bold text-[12px] shadow-sm whitespace-nowrap">
                                    {item.stock_quantity} Blocked
                                </div>
                            </div>

                            {/* Action & Finance Row */}
                            <div className="flex justify-between items-center pl-[52px] pr-1 mt-1 relative z-10">
                                <div className="flex items-center gap-1.5 text-[14px] font-bold text-on-surface-variant">
                                    <span className="font-medium text-[12px] text-muted-foreground">Blocked Cap:</span>
                                    ৳{item.blocked_capital.toLocaleString()}
                                </div>
                                <Button asChild variant="tonal" size="sm" className="pointer-events-auto">
                                    <Link href="/inventory/products" className="gap-1.5">
                                        <Tag size={14} />
                                        Review Price
                                    </Link>
                                </Button>
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
