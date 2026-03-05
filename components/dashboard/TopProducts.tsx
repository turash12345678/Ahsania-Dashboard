
interface ProductStat {
    name: string;
    sold_qty: number;
}

import { Trophy, TrendingUp, Package } from 'lucide-react';
import { Ripple } from "@/components/ui/ripple";

export function TopProducts({ products }: { products: ProductStat[] }) {
    return (
        <div className="w-full flex flex-col">
            <div className="flex flex-col gap-3">
                {products.length > 0 ? (
                    products.map((product, idx) => (
                        <div key={idx} className="relative flex flex-row items-center justify-between p-4 rounded-2xl bg-surface hover:bg-surface-variant/30 transition-colors border border-outline-variant overflow-hidden group">
                            <Ripple />
                            <div className="flex items-center gap-4 relative z-10 pointer-events-none">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-primary-container text-on-primary-container' :
                                    idx === 1 ? 'bg-secondary-container text-on-secondary-container' :
                                        idx === 2 ? 'bg-tertiary-container text-on-tertiary-container' :
                                            'bg-surface-variant text-on-surface-variant'
                                    }`}>
                                    {idx + 1}
                                </div>
                                <span className="text-foreground font-medium text-[16px]">
                                    {product.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-high text-on-surface rounded-full font-bold text-[13px] relative z-10 pointer-events-none">
                                <TrendingUp size={14} className="text-primary" />
                                {product.sold_qty} Sold
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <div className="w-12 h-12 rounded-full border border-outline-variant bg-surface-variant flex items-center justify-center mb-2">
                            <Package size={20} className="text-muted-foreground" />
                        </div>
                        <span className="text-muted-foreground font-medium text-sm">No sales data yet based on current filters.</span>
                    </div>
                )}
            </div>
        </div>
    );
}
