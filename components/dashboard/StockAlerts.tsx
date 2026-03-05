import { useState } from 'react';
import { AlertTriangle, ShoppingCart, Info, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { Ripple } from "@/components/ui/ripple";
import { Button } from "@/components/ui/button";

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
                                <div key={idx} className={`relative flex flex-col p-4 rounded-xl transition-colors border overflow-hidden gap-2 ${isOut ? 'border-error/20 bg-error-container/30 hover:bg-error-container/50' : 'border-outline-variant hover:bg-surface-variant/30 bg-surface'
                                    }`}>
                                    <Ripple />
                                    <div className="flex flex-row items-center justify-between relative z-10 pointer-events-none">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isOut ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'
                                                }`}>
                                                <AlertTriangle size={20} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-foreground font-medium text-[16px] line-clamp-1">
                                                    {item.name}
                                                </span>
                                                <span className={`text-[13px] font-bold ${isOut ? 'text-error' : 'text-on-surface-variant'}`}>
                                                    {isOut ? 'Out of Stock' : `${item.stock_quantity} Left`}
                                                </span>
                                            </div>
                                        </div>

                                        <Button asChild variant="tonal" size="icon" className={`pointer-events-auto rounded-full w-10 h-10 ${isOut ? 'text-error' : ''}`}>
                                            <Link href="/inventory/shipments" title="Restock">
                                                <ShoppingCart size={18} />
                                            </Link>
                                        </Button>
                                    </div>

                                    {/* Additional Info Row */}
                                    {estimateCost > 0 && (
                                        <div className="flex items-center gap-1.5 pl-[56px] text-[12px] font-medium text-muted-foreground mt-0.5 relative z-10 pointer-events-none">
                                            <Info size={14} />
                                            Est. ৳{estimateCost.toLocaleString()} for 10 pcs
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {sortedItems.length > 4 && (
                            <Button
                                variant="text"
                                onClick={() => setExpanded(!expanded)}
                                className="mt-2 w-full text-muted-foreground flex items-center justify-center gap-2"
                            >
                                {expanded ? (
                                    <><ChevronUp size={18} /> Hide Alerts</>
                                ) : (
                                    <><ChevronDown size={18} /> View {sortedItems.length - 4} More Alerts</>
                                )}
                            </Button>
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
