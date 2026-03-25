
interface ProductStat {
    name: string;
    sold_qty: number;
}

import { Trophy, TrendingUp, Package } from 'lucide-react';

export function TopProducts({ products }: { products: ProductStat[] }) {
    return (
        <div className="w-full flex flex-col">
            <div className="flex flex-col gap-3">
                {products.length > 0 ? (
                    products.map((product, idx) => (
                        <div key={idx} className="flex flex-row items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-600' :
                                        idx === 1 ? 'bg-gray-200 text-gray-600' :
                                            idx === 2 ? 'bg-orange-100 text-orange-600' :
                                                'bg-gray-50 text-gray-400 group-hover:bg-white'
                                    }`}>
                                    {idx + 1}
                                </div>
                                <span className="text-[#0C1829] font-medium text-[15px]">
                                    {product.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50/50 text-blue-600 rounded-full font-bold text-[13px]">
                                <TrendingUp size={14} />
                                {product.sold_qty} Sold
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <div className="w-12 h-12 rounded-full border border-gray-100 bg-gray-50 flex items-center justify-center mb-2">
                            <Package size={20} className="text-gray-300" />
                        </div>
                        <span className="text-gray-400 font-medium text-sm">No sales data yet based on current filters.</span>
                    </div>
                )}
            </div>
        </div>
    );
}
