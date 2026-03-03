'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Search, Plus, Trash2, ArrowRight, DollarSign, ArrowDown, PackageCheck } from 'lucide-react';

export default function ShipmentsPage() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const searchRef = useRef(null);

    // Global Shipment Variables
    const [transportCost, setTransportCost] = useState(0);
    const [targetMargin, setTargetMargin] = useState(40); // 40%
    const [shipmentItems, setShipmentItems] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetch('/api/inventory/products')
            .then(r => r.json())
            .then(data => setProducts(data))
            .catch(console.error);

        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !shipmentItems.some(item => item.id === p.id)
    ).slice(0, 10);

    const addProductToShipment = (product) => {
        setShipmentItems([
            ...shipmentItems,
            {
                id: product.id,
                name: product.name,
                qty: 1,
                rawBuyPrice: product.buy_price || 0,
                customSRP: null // If null, we use Suggested SRP
            }
        ]);
        setSearchQuery('');
        setIsDropdownOpen(false);
    };

    const removeItem = (id) => {
        setShipmentItems(shipmentItems.filter(item => item.id !== id));
    };

    const updateItem = (id, field, value) => {
        setShipmentItems(shipmentItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    // --- SMART CALCULATIONS ---
    const calculatedItems = useMemo(() => {
        const totalPurchaseValue = shipmentItems.reduce((sum, item) => sum + (item.qty * item.rawBuyPrice), 0);

        return shipmentItems.map(item => {
            const itemPurchaseValue = item.qty * item.rawBuyPrice;
            let itemTransport = 0;

            if (totalPurchaseValue > 0 && item.qty > 0) {
                // Proportional Distribution
                const weight = itemPurchaseValue / totalPurchaseValue;
                itemTransport = (weight * transportCost) / item.qty;
            }

            const adjustedBuyPrice = item.rawBuyPrice + itemTransport;
            let suggestedSRP = adjustedBuyPrice;

            if (targetMargin > 0 && targetMargin < 100) {
                suggestedSRP = adjustedBuyPrice / (1 - (targetMargin / 100));
            } else if (targetMargin >= 100 && targetMargin <= 500) {
                // Markup logic if someone types 150%
                suggestedSRP = adjustedBuyPrice * (1 + (targetMargin / 100));
            }

            // Psychological Rounding (Nearest 5, always round up slightly to protect margin)
            let roundedSRP = Math.ceil(suggestedSRP / 5) * 5;

            return {
                ...item,
                adjustedBuyPrice,
                suggestedSRP: roundedSRP,
                finalSRP: item.customSRP !== null ? item.customSRP : roundedSRP
            };
        });
    }, [shipmentItems, transportCost, targetMargin]);

    // Financial Summary
    const summary = useMemo(() => {
        let totalRawInvestment = 0;
        let totalInvestment = 0;
        let expectedRevenue = 0;

        calculatedItems.forEach(item => {
            totalRawInvestment += (item.rawBuyPrice * item.qty);
            totalInvestment += (item.adjustedBuyPrice * item.qty);
            expectedRevenue += (item.finalSRP * item.qty);
        });

        return {
            totalRawInvestment,
            totalInvestment,
            expectedRevenue,
            totalProfit: expectedRevenue - totalInvestment,
            margin: expectedRevenue > 0 ? ((expectedRevenue - totalInvestment) / expectedRevenue) * 100 : 0
        };
    }, [calculatedItems]);

    const handleSubmit = async () => {
        if (calculatedItems.length === 0) return alert('Add at least one product.');

        setIsSubmitting(true);
        try {
            const payload = {
                transportCost,
                items: calculatedItems.map(item => ({
                    id: item.id,
                    qty: item.qty,
                    adjustedBuyPrice: item.adjustedBuyPrice,
                    suggestedSRP: item.finalSRP
                }))
            };

            const res = await fetch('/api/inventory/shipments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Shipment batch successfully processed and logged!');
                router.push('/inventory/products');
            } else {
                const err = await res.json();
                alert('Error: ' + err.message);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to process shipment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="layout-container bg-[#F9FAFB]">
            <Sidebar />

            <main className="main-content p-3 md:p-6 lg:p-8 overflow-y-auto h-[100dvh] lg:ml-[260px]">
                {/* HEADERS */}
                <header className="mb-6 pl-12 lg:pl-0">
                    <h1 className="text-2xl font-bold text-[#111827]">New Shipment Ledger</h1>
                    <p className="text-[#6B7280] text-sm">Automate your capital deployment, landing costs, and profit scaling.</p>
                </header>

                <div className="flex flex-col xl:flex-row gap-6">

                    {/* LEFT COLUMN: Configuration & Table */}
                    <div className="flex-1 flex flex-col gap-6 w-full">

                        {/* Top Config Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E7EB]">
                                <label className="text-sm font-semibold text-gray-600 block mb-2 uppercase tracking-wide">Total Transport / Extra Cost (৳)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-gray-400 font-bold">৳</span>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xl text-gray-800 focus:outline-[#0065F4]"
                                        value={transportCost === 0 ? '' : transportCost}
                                        onChange={(e) => setTransportCost(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                        placeholder="0"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-2">This will be proportionally distributed across all products below.</p>
                            </div>

                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E7EB]">
                                <label className="text-sm font-semibold text-gray-600 block mb-2 uppercase tracking-wide">Target Profit Margin (%)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-gray-400 font-bold">%</span>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xl text-gray-800 focus:outline-[#0065F4]"
                                        value={targetMargin === 0 ? '' : targetMargin}
                                        onChange={(e) => setTargetMargin(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                        placeholder="0"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Used to auto-generate the Suggested Retail Price (SRP).</p>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E7EB]" ref={searchRef}>
                            <div className="relative">
                                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-md text-gray-800 focus:outline-[#0065F4]"
                                    placeholder="Search products to add to this shipment..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                />

                                {/* Dropdown */}
                                {isDropdownOpen && searchQuery && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map(p => (
                                                <div
                                                    key={p.id}
                                                    className="flex justify-between items-center p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                                                    onClick={() => addProductToShipment(p)}
                                                >
                                                    <div>
                                                        <div className="font-semibold text-gray-800">{p.name}</div>
                                                        <div className="text-xs text-gray-400">Current Cost: ৳{p.buy_price} | Stock: {p.stock_quantity}</div>
                                                    </div>
                                                    <Plus className="text-[#0065F4]" size={18} />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-gray-500">No matching generic products found.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Main Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
                                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[25%]">Product Name</th>
                                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[10%]">Qty</th>
                                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[15%]">Raw Buy (৳)</th>
                                            <th className="p-4 text-xs font-bold text-blue-500 uppercase tracking-wider w-[15%]">Landing Price (৳)</th>
                                            <th className="p-4 text-xs font-bold text-green-600 uppercase tracking-wider w-[15%]">Auto SRP (৳)</th>
                                            <th className="p-4 text-xs font-bold text-gray-800 uppercase tracking-wider w-[15%]">Final Sell (৳)</th>
                                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-[5%]">X</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E5E7EB]">
                                        {calculatedItems.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="p-8 text-center text-gray-400">
                                                    <PackageCheck size={32} className="mx-auto mb-3 opacity-30" />
                                                    No products added to this shipment yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            calculatedItems.map((item, idx) => (
                                                <tr key={item.id} className="hover:bg-gray-50">
                                                    <td className="p-4 text-sm font-semibold text-gray-800">
                                                        {item.name}
                                                    </td>
                                                    <td className="p-4">
                                                        <input
                                                            type="number" min="1"
                                                            className="w-16 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-[#0065F4] text-center font-semibold"
                                                            value={item.qty === 0 ? '' : item.qty}
                                                            onChange={(e) => updateItem(item.id, 'qty', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <input
                                                            type="number" min="0" step="0.01"
                                                            className="w-20 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-[#0065F4] text-right font-medium"
                                                            value={item.rawBuyPrice === 0 ? '' : item.rawBuyPrice}
                                                            onChange={(e) => updateItem(item.id, 'rawBuyPrice', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md inline-block">
                                                            {item.adjustedBuyPrice.toFixed(2)}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-bold text-green-600 px-3 py-1.5">
                                                            {item.suggestedSRP.toFixed(2)}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <input
                                                            type="number" min="0" step="1"
                                                            className="w-24 px-2 py-1.5 border border-green-400 bg-green-50 rounded-md focus:outline-green-600 text-right font-bold text-gray-900"
                                                            value={item.customSRP !== null ? item.customSRP : item.suggestedSRP}
                                                            onChange={(e) => updateItem(item.id, 'customSRP', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                            placeholder={item.suggestedSRP}
                                                        />
                                                        {item.customSRP !== null && item.customSRP !== item.suggestedSRP && (
                                                            <div className="text-[10px] text-orange-500 font-semibold mt-1">Overridden</div>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            className="text-red-400 hover:text-red-600 p-1"
                                                            title="Remove from batch"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Financial Summary */}
                    <div className="w-full xl:w-[350px] 2xl:w-[400px]">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E7EB] sticky top-8">
                            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <DollarSign className="text-green-500" />
                                Shipment Intelligence
                            </h2>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Total Items in Batch</span>
                                    <span className="font-bold text-gray-800">{calculatedItems.length} Products</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Raw Capital</span>
                                    <span className="font-medium text-gray-800">৳{summary.totalRawInvestment.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Logistics/Transport</span>
                                    <span className="font-medium text-red-500">+ ৳{transportCost.toFixed(2)}</span>
                                </div>

                                <div className="h-px bg-gray-100 my-2"></div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 font-semibold">Total Net Investment</span>
                                    <span className="text-blue-600 font-bold text-lg">৳{summary.totalInvestment.toFixed(2)}</span>
                                </div>

                                <div className="mt-8 mb-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Expected Returns</h3>

                                    <div className="bg-[#F8FAFC] p-4 rounded-xl space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600 font-medium">Expected Revenue</span>
                                            <span className="font-bold text-gray-900">৳{summary.expectedRevenue.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600 font-medium">Est. Net Profit</span>
                                            <span className="font-bold text-green-600">৳{summary.totalProfit.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                                            <span className="text-gray-600 font-medium">Batch Margin</span>
                                            <span className="font-bold text-[#FF9900]">{summary.margin.toFixed(2)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || calculatedItems.length === 0}
                                className="w-full mt-6 py-4 rounded-xl bg-[#0065F4] text-white font-bold text-md flex items-center justify-center gap-2 hover:bg-[#0055cc] disabled:opacity-50 transition-colors shadow-md shadow-blue-500/20"
                            >
                                {isSubmitting ? 'Processing...' : 'Deploy Capital (Stock)'}
                                {!isSubmitting && <ArrowRight size={20} />}
                            </button>
                            <p className="text-center text-[10px] text-gray-400 mt-3 px-2">
                                Proceeding will permanently append these items to your store inventory and record an exact capital track.
                            </p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
