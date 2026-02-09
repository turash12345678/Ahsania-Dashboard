'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SalesGraph } from '@/components/dashboard/SalesGraph';
import { TopProducts } from '@/components/dashboard/TopProducts';
import { StockAlerts } from '@/components/dashboard/StockAlerts';
import { SalesHistoryTable } from '@/components/dashboard/SalesHistoryTable';
import { BadgeDollarSign, ShoppingCart, Download, ChevronLeft, ChevronRight, User, CircleDollarSign } from "lucide-react";

export default function Dashboard() {
    const router = useRouter();
    // User Session
    const [user, setUser] = useState(null);

    // Stats State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [data, setData] = useState({
        daily: { revenue: 0, orders: 0, profit: 0, history: [] },
        monthly: { revenue: 0, orders: 0, profit: 0, graph_data: [], top_products: [] },
        user_performance: { revenue: 0, orders: 0 },
        alerts: []
    });
    // Investment Tracker State
    const [showInvestment, setShowInvestment] = useState(false);
    const [investmentData, setInvestmentData] = useState({ invest: 0, revenue: 0, profit: 0 });
    const [investmentFilter, setInvestmentFilter] = useState('January'); // Default to Jan or calculate from date?
    const [loading, setLoading] = useState(true);

    // 1. Fetch User Session (Auth Bypass active)
    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) setUser(data.user);
                else router.push('/login');
            })
            .catch(() => router.push('/login'));
    }, []);

    // Sync investment filter with selected date on load/change, IF it's not 'All Time'
    useEffect(() => {
        if (investmentFilter !== 'All Time') {
            const date = new Date(selectedDate);
            const mName = date.toLocaleString('default', { month: 'long' });
            setInvestmentFilter(mName);
        }
    }, [selectedDate]);

    // 2. Fetch Dashboard Data
    useEffect(() => {
        if (!user) return;

        setLoading(true);

        const fetchData = async () => {
            try {
                // Calculate Local Start and End of the selected day
                const [y, m, d] = selectedDate.split('-').map(Number);
                const startDt = new Date(y, m - 1, d, 0, 0, 0, 0);
                const endDt = new Date(y, m - 1, d, 23, 59, 59, 999);

                const start = startDt.toISOString();
                const end = endDt.toISOString();

                // Add timestamp to prevent caching
                // Add dateStr to ensure API knows the "Intended Local Date" for Monthly calculations
                const res = await fetch(`/api/dashboard/stats?startDate=${start}&endDate=${end}&userId=${user.id}&dateStr=${selectedDate}&_t=${Date.now()}`);
                const data = await res.json();

                if (!data.error) setData(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedDate, user]);

    // Fetch Investment Data independently
    useEffect(() => {
        if (!user) return;
        const fetchInvestment = async () => {
            // Determine filter param
            let param = '';
            if (investmentFilter === 'All Time') {
                param = 'filter=all';
            } else {
                // Assume 'MonthName' implies current year of selectedDate
                const [y] = selectedDate.split('-');
                const mIdx = months.indexOf(investmentFilter);
                if (mIdx !== -1) {
                    const mStr = String(mIdx + 1).padStart(2, '0');
                    param = `filter=${y}-${mStr}`;
                } else {
                    // Fallback to current
                    param = `date=${selectedDate}`;
                }
            }

            try {
                const res = await fetch(`/api/dashboard/investment?${param}`);
                const json = await res.json();
                if (!json.error) setInvestmentData(json);
            } catch (err) {
                console.error(err);
            }
        };
        fetchInvestment();
    }, [investmentFilter, selectedDate, user]);

    // Date Navigation
    const changeDate = (days) => {
        // Create date from current state (YYYY-MM-DD parts) to avoid timezone/UTC shift issues
        const [y, m, d] = selectedDate.split('-').map(Number);
        const date = new Date(y, m - 1, d);

        // Add days
        date.setDate(date.getDate() + days);

        // Convert back to YYYY-MM-DD manually to stick to local calendar date
        const nextY = date.getFullYear();
        const nextM = String(date.getMonth() + 1).padStart(2, '0');
        const nextD = String(date.getDate()).padStart(2, '0');

        setSelectedDate(`${nextY}-${nextM}-${nextD}`);
    };

    const handleExportMonthly = () => {
        const date = new Date(selectedDate);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
        window.open(`/api/export?startDate=${startOfMonth}&endDate=${endOfMonth}`, '_blank');
    };

    const handleExportDaily = () => {
        window.open(`/api/export?startDate=${selectedDate}&endDate=${selectedDate}`, '_blank');
    };

    if (!user) return <div className="flex justify-center items-center h-screen bg-[#EEF3FA]">Loading...</div>;

    // Helper for date display
    // Parse YYYY-MM-DD manually to ensure we display the Month of the string, not the UTC converted date
    const [yVal, mVal, dVal] = selectedDate.split('-').map(Number);
    const dateObj = new Date(yVal, mVal - 1, dVal); // Local construction
    const day = String(dVal).padStart(2, '0');
    const month = dateObj.toLocaleString('default', { month: 'long' });
    const monthNum = String(mVal).padStart(2, '0');
    const year = yVal;

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const handleMonthSelect = (monthName) => {
        const monthIndex = months.indexOf(monthName);
        if (monthIndex === -1) return;

        const [y, m, d] = selectedDate.split('-').map(Number);
        const newDate = new Date(y, monthIndex, 1);

        const nextY = newDate.getFullYear();
        const nextM = String(newDate.getMonth() + 1).padStart(2, '0');
        const nextD = '01';
        setSelectedDate(`${nextY}-${nextM}-${nextD}`);
    };

    // Monthly Navigation Handler
    const changeMonth = (offset) => {
        const [y, m, d] = selectedDate.split('-').map(Number);
        const date = new Date(y, m - 1, 1); // Set to 1st of month to avoid overflow (e.g. Jan 31 -> Feb 1 skipping)

        date.setMonth(date.getMonth() + offset);

        // Try to keep the same day if possible, or clamp to end of month?
        // User just wants to navigate months. 
        // Resetting to the 1st of the new month is safest and clearest for a "Monthly View" context, 
        // but might be annoying if they were looking at the 15th. 
        // However, standard monthly nav usually jumps to the month. 
        // Let's reset to TODAY's day-number if valid, or 1st? 
        // User's request implies navigating date ranges. 
        // Let's just update the MONTH part.

        // Actually simplest is just valid date math:
        // If Jan 31 + 1 month -> Feb 28/29.

        const finalDate = new Date(y, m - 1 + offset, 1); // Go to 1st of next month
        // Or if we want to keep the day? 
        // "Upor theke Date samne pichone nile dashboard er blank jayga... click kora lage"
        // Let's stick to safe date math:

        const nextY = finalDate.getFullYear();
        const nextM = String(finalDate.getMonth() + 1).padStart(2, '0');
        // Reset day to 01 for monthly navigation to make it clear we changed months? 
        // Or keep 'd'? 
        // If I change month, the "Selected Date" changes. 
        // Let's default to the 1st of that month to avoid confusion, 
        // as the user is likely looking for monthly stats.
        const nextD = '01';

        setSelectedDate(`${nextY}-${nextM}-${nextD}`);
    };

    return (
        <div className="flex flex-row justify-start items-start min-h-screen bg-[#EEF3FA] relative">
            <Sidebar />

            <main className="flex flex-col items-start p-3 md:p-6 lg:p-8 gap-4 lg:gap-8 w-full max-w-[1600px] lg:ml-[260px]">

                {/* --- HEADER --- */}
                <header className="flex flex-row justify-between items-center w-full p-4 bg-white rounded-[24px] shadow-sm h-[90px]">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-[24px] font-roboto font-bold text-[#0C1829] leading-9">Dashboard</h1>
                        <p className="text-[#7B7480] text-[14px] font-inter">Welcome back</p>
                    </div>

                    <div className="flex flex-row items-center gap-6">
                        {/* Date Picker (Custom UI from CSS) */}
                        <div className="flex flex-row items-center p-1 gap-2 bg-[#F2F4F5] rounded-[16px] h-[40px] px-2">
                            <button onClick={() => changeDate(-1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-gray-50 active:scale-95 transition-all">
                                <ChevronLeft size={16} color="#0C1829" />
                            </button>
                            <div className="flex flex-row items-center gap-1">
                                <span className="font-roboto font-bold text-[14px] text-[#0C1829]">{monthNum}</span>
                                <span className="font-roboto font-bold text-[14px] text-[#0C1829]">/</span>
                                <span className="font-roboto font-bold text-[14px] text-[#0C1829]">{day}</span>
                                <span className="font-roboto font-bold text-[14px] text-[#0C1829]">/</span>
                                <span className="font-roboto font-bold text-[14px] text-[#0C1829]">{year}</span>
                            </div>
                            <button onClick={() => changeDate(1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-gray-50 active:scale-95 transition-all">
                                <ChevronRight size={16} color="#0C1829" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* --- CONTENT GRID --- */}
                {/* --- CONTENT GRID --- */}
                {/* Mobile: Column Reverse (Daily Top, Monthly Bottom). Desktop: Row (Monthly Left, Daily Right) */}
                <div className="flex flex-col-reverse md:flex-row items-start gap-8 w-full">

                    {/* LEFT COLUMN (Desktop) / BOTTOM COLUMN (Mobile): MONTHLY REPORT */}
                    <div className="flex flex-col gap-6 w-full md:flex-1 md:min-w-[0px] no-scrollbar md:pb-4">

                        {/* Section Header */}
                        <div className="flex justify-between items-center h-[21px]">
                            <h2 className="text-[#7B7480] text-[14px] font-inter font-bold uppercase tracking-wider">MONTHLY REPORT</h2>
                            <button onClick={handleExportMonthly} className="text-[#0067FD] text-[12px] font-bold flex items-center gap-1 hover:underline">
                                <Download size={14} /> Download Month CSV
                            </button>
                        </div>

                        {/* Monthly Stats Cards */}
                        {/* Mobile: Horizontal Scroll. Desktop: Grid/Flex */}
                        <div className="flex flex-row gap-3 overflow-x-auto pb-2 no-scrollbar md:pb-0 md:overflow-visible min-h-[160px] md:h-[150px]">
                            {/* Net Sale (Green) */}
                            <div className="min-w-[280px] md:min-w-0 flex-1 bg-white rounded-[26px] p-6 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[#7B7480] font-roboto font-medium text-[16px]">Net Sale</span>
                                        <span className="text-[#00BC7C] font-nirmala font-bold text-[36px] flex items-center">
                                            <span className="text-[36px] mr-1 font-extrabold">৳</span>{(data.monthly.revenue || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-[#E6F8F2] flex items-center justify-center text-[#00BC7C]">
                                        <CircleDollarSign size={24} />
                                    </div>
                                </div>
                                <span className="text-[#7B7480] text-[14px] font-medium">Profit</span>
                            </div>

                            {/* Net Income */}
                            <div className="min-w-[280px] md:min-w-0 flex-1 bg-white rounded-[26px] p-6 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[#7B7480] font-roboto font-medium text-[16px]">Net Income</span>
                                        <span className="text-[#0067FD] font-nirmala font-bold text-[36px] flex items-center">
                                            <span className="text-[36px] mr-1 font-extrabold">৳</span>{(data.monthly.profit || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-[#E6F0FF] flex items-center justify-center text-[#0067FD]">
                                        <BadgeDollarSign size={24} />
                                    </div>
                                </div>
                                <span className="text-[#7B7480] text-[14px] font-medium">Revenue</span>
                            </div>

                            {/* Orders */}
                            <div className="min-w-[280px] md:min-w-0 flex-1 bg-white rounded-[26px] p-6 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[#7B7480] font-roboto font-medium text-[16px]">Orders</span>
                                        <span className="text-[#FF9900] font-nirmala font-bold text-[36px]">
                                            {data.monthly.orders || 0}
                                        </span>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-[#FFF5E6] flex items-center justify-center text-[#FF9900]">
                                        <ShoppingCart size={24} />
                                    </div>
                                </div>
                                <div className="flex gap-4 text-[12px] font-medium text-[#465566]">
                                    <span>Service : {data.monthly.service_count || 0}</span>
                                    <span>Product : {data.monthly.product_count || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Monthly Graph - CSS Applied */}
                        <div style={{
                            padding: '24px',
                            gap: '24px',
                            width: '100%',
                            height: '400px',
                            background: '#FFFFFF',
                            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
                            borderRadius: '32px',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div className="flex justify-between items-center">
                                <h2 className="text-[20px] font-bold text-[#0C1829] font-roboto">Monthly Sales</h2>
                                <div className="relative">
                                    <select
                                        value={month}
                                        onChange={(e) => handleMonthSelect(e.target.value)}
                                        className="appearance-none bg-[#F2F4F5] rounded-[16px] px-4 py-2 pr-8 font-roboto font-bold text-[14px] text-[#0C1829] outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                                    >
                                        {months.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                    <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" size={16} color="#0C1829" />
                                </div>
                            </div>
                            <div className="flex-1 w-full relative">
                                <SalesGraph data={data.monthly.graph_data} />
                            </div>
                        </div>

                        {/* Investment Tracker (Style Updated) */}
                        <div className="bg-white rounded-[26px] overflow-hidden shadow-sm mb-6">
                            {/* Header - Clickable for toggle */}
                            <div
                                onClick={() => setShowInvestment(!showInvestment)}
                                className="w-full flex items-center justify-between p-6 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <h3 className="text-[20px] font-bold text-[#0C1829] font-roboto">Investment Tracker</h3>

                                <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                                    {/* Month/All Dropdown */}
                                    {showInvestment && (
                                        <div className="relative">
                                            <select
                                                value={investmentFilter}
                                                onChange={(e) => setInvestmentFilter(e.target.value)}
                                                className="appearance-none bg-[#F2F4F5] rounded-[16px] px-4 py-2 pr-8 font-roboto font-bold text-[14px] text-[#0C1829] outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                                            >
                                                <option value="All Time">All Time</option>
                                                {months.map(m => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" size={16} color="#0C1829" />
                                        </div>
                                    )}

                                    {/* Toggle Icon */}
                                    <div className="p-1">
                                        {showInvestment ? <ChevronLeft className="rotate-90" size={20} /> : <ChevronRight className="rotate-90" size={20} />}
                                    </div>
                                </div>
                            </div>

                            {showInvestment && (
                                <div className="p-6 pt-0 animate-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Invest - Card Style */}
                                        <div className="bg-white rounded-[26px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between min-h-[140px]">
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[#7B7480] font-roboto font-medium text-[16px]">Net Investment</span>
                                                    <span className="text-[#0065F4] font-nirmala font-bold text-[36px] flex items-center">
                                                        <span className="text-[36px] mr-1 font-extrabold">৳</span>{(investmentData.invest || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="w-12 h-12 rounded-full bg-[#E6F0FF] flex items-center justify-center text-[#0065F4]">
                                                    <BadgeDollarSign size={24} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sold - Card Style */}
                                        <div className="bg-white rounded-[26px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between min-h-[140px]">
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[#7B7480] font-roboto font-medium text-[16px]">Net Sold</span>
                                                    <span className="text-[#00BC7C] font-nirmala font-bold text-[36px] flex items-center">
                                                        <span className="text-[36px] mr-1 font-extrabold">৳</span>{(investmentData.revenue || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="w-12 h-12 rounded-full bg-[#E6F8F2] flex items-center justify-center text-[#00BC7C]">
                                                    <CircleDollarSign size={24} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Profit - Card Style */}
                                        <div className="bg-white rounded-[26px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between min-h-[140px]">
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[#7B7480] font-roboto font-medium text-[16px]">Net Profit</span>
                                                    <span className="text-[#FF9900] font-nirmala font-bold text-[36px] flex items-center">
                                                        <span className="text-[36px] mr-1 font-extrabold">৳</span>{(investmentData.profit || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="w-12 h-12 rounded-full bg-[#FFF5E6] flex items-center justify-center text-[#FF9900]">
                                                    <ShoppingCart size={24} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Compact Row: Top Products & Stock Alerts */}
                        <div className="flex flex-col xl:flex-row gap-6 w-full">
                            {/* Top Products */}
                            <div className="flex-1 bg-white rounded-[32px] p-6 shadow-sm min-h-[282px]">
                                <h3 className="text-[20px] font-bold text-[#0C1829] font-roboto mb-6">Top Selling Products ({month})</h3>
                                <TopProducts products={data.monthly.top_products} />
                            </div>

                            {/* Stock Alerts */}
                            <div className="flex-1 bg-white rounded-[32px] p-6 shadow-sm min-h-[282px]">
                                <h3 className="text-[20px] font-bold text-[#0C1829] font-roboto mb-6">Stock Alert</h3>
                                <StockAlerts items={data.alerts} />
                            </div>
                        </div>
                    </div>


                    {/* RIGHT COLUMN (Desktop) / TOP COLUMN (Mobile): DAILY OVERVIEW */}
                    <div className="flex flex-col gap-6 w-full md:w-[45%] lg:w-[506px] md:min-w-[320px] lg:min-w-[506px] md:sticky md:top-8 md:h-[calc(100vh-32px)] overflow-hidden">

                        {/* Section Header */}
                        <div className="flex justify-between items-center h-[21px] flex-shrink-0">
                            <h2 className="text-[#7B7480] text-[14px] font-inter font-bold uppercase tracking-wider">DAILY OVERVIEW</h2>
                            <button onClick={handleExportDaily} className="text-[#0067FD] text-[12px] font-bold flex items-center gap-1 hover:underline">
                                <Download size={14} /> Download Daily CSV
                            </button>
                        </div>

                        {/* Daily Mini Stats */}
                        <div className="flex flex-row gap-3 h-[98px] flex-shrink-0">
                            {/* Total Sale */}
                            <div className="flex-1 bg-white rounded-[20px] p-4 shadow-sm flex flex-col justify-center gap-1">
                                <span className="text-[#7B7480] font-medium text-[12px]">Total Sale</span>
                                <span className="text-[#161616] font-nirmala font-bold text-[25px] flex items-center">
                                    <span className="font-extrabold mr-1">৳</span>{(data.daily.revenue || 0).toLocaleString()}
                                </span>
                            </div>
                            {/* Profit */}
                            <div className="flex-1 bg-white rounded-[20px] p-4 shadow-sm flex flex-col justify-center gap-1">
                                <span className="text-[#7B7480] font-medium text-[12px]">Total Profit</span>
                                <span className="text-[#FF5500] font-nirmala font-bold text-[25px] flex items-center">
                                    <span className="font-extrabold mr-1">৳</span>{(data.daily.profit || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Daily History - CSS Applied (Responsive Width) */}
                        <div style={{
                            padding: '24px 14px',
                            gap: '11.93px',
                            width: '100%',
                            minHeight: '0', // Allow shrinking below content size if needed
                            background: '#FFFFFF',
                            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
                            borderRadius: '32px',
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            overflow: 'hidden'
                        }}>
                            <h3 className="text-[20px] font-bold text-[#0C1829] font-roboto mb-4 flex-shrink-0">Transactions</h3>
                            <SalesHistoryTable
                                sales={data.daily.history}
                                canEdit={true}
                                onDeleteSale={(id) => {
                                    setData(prev => ({
                                        ...prev,
                                        daily: {
                                            ...prev.daily,
                                            history: prev.daily.history.filter(s => s.id !== id)
                                        }
                                    }));
                                }} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
