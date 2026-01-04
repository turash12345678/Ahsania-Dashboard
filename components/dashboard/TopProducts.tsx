
interface ProductStat {
    name: string;
    sold_qty: number;
}

import { Component } from 'lucide-react'; // Placeholder if needed

export function TopProducts({ products }: { products: ProductStat[] }) {
    return (
        <div className="w-full flex flex-col gap-6">
            {/* Table Header */}
            <div className="flex flex-row items-start w-full h-[42px] rounded-[13px] overflow-hidden">
                <div className="flex-1 bg-[#F8FAFC] p-3 px-4 flex items-center">
                    <span className="text-[#60758D] font-inter font-medium text-[12px] uppercase tracking-wider">Product name</span>
                </div>
                <div className="w-[95px] bg-[#F8FAFC] p-3 px-4 flex items-center justify-end">
                    <span className="text-[#60758D] font-inter font-medium text-[12px] uppercase tracking-wider text-right">quantity</span>
                </div>
            </div>

            {/* Table Body */}
            <div className="flex flex-col gap-2">
                {products.length > 0 ? (
                    products.map((product, idx) => (
                        <div key={idx} className="flex flex-row items-center border-b border-[#F2F4F5] last:border-0 py-3 px-2 hover:bg-gray-50 transition-colors">
                            <div className="flex-1 text-[#0C1829] font-inter font-medium text-[14px]">
                                {product.name}
                            </div>
                            <div className="w-[95px] text-right font-bold text-[#0C1829] text-[14px]">
                                {product.sold_qty}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                        {/* Placeholder Icon from CSS (Vector squares) - simplified */}
                        <div className="w-8 h-8 rounded-full border-2 border-[#9AA3B0] flex items-center justify-center opacity-50 mb-2">
                            <span className="text-[#9AA3B0] text-lg">!</span>
                        </div>
                        <span className="text-[#9AA3B0] font-inter text-[15px]">No product found.</span>
                    </div>
                )}
            </div>
        </div>
    );
}
