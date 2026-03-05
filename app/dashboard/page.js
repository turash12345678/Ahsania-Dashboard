'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { SalesGraph } from '@/components/dashboard/SalesGraph';
import { TopProducts } from '@/components/dashboard/TopProducts';
import { StockAlerts } from '@/components/dashboard/StockAlerts';
import { DeadStock } from '@/components/dashboard/DeadStock';
import { SalesHistoryTable } from '@/components/dashboard/SalesHistoryTable';
import { BadgeDollarSign, ShoppingCart, Download, ChevronLeft, ChevronRight, User, CircleDollarSign, Timer, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    const [investmentFilter, setInvestmentFilter] = useState(
        () => new Date().toLocaleString('default', { month: 'long' })
    );
    const [loading, setLoading] = useState(true);

    // Month names — declared here so useEffect and render can both access it
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

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

    // Sync investment filter with selected date whenever date changes
    useEffect(() => {
        const [yVal, mVal] = selectedDate.split('-').map(Number);
        const mName = new Date(yVal, mVal - 1, 1).toLocaleString('default', { month: 'long' });
        setInvestmentFilter(mName);
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
        <div className="flex flex-row justify-start items-start min-h-screen relative bg-surface-container-lowest">
            <Sidebar />

            <main className="flex flex-col items-start p-3 md:p-6 lg:p-8 gap-4 lg:gap-8 w-full lg:ml-[260px]">

                {/* --- HEADER --- */}
                <header className="flex flex-row justify-between items-center w-full px-8 py-4 bg-surface rounded-2xl border border-outline-variant shadow-m3-1 h-[90px]">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-[28px] font-roboto font-bold text-foreground leading-tight">Dashboard</h1>
                        <p className="text-muted-foreground text-[14px] font-inter">Welcome back</p>
                    </div>

                    <div className="flex flex-row items-center gap-6">
                        {/* Date Picker (Custom UI from CSS) */}
                        <div className="flex flex-row items-center p-1 gap-2 bg-surface-variant rounded-full h-[48px] px-2 shadow-inner">
                            <Button variant="tonal" size="icon" onClick={() => changeDate(-1)} className="w-10 h-10 rounded-full bg-surface hover:bg-surface border border-outline-variant disabled:opacity-50">
                                <ChevronLeft size={20} className="text-on-surface" />
                            </Button>
                            <div className="flex flex-row items-center gap-1 mx-2">
                                <span className="font-roboto font-bold text-[15px] text-on-surface-variant">{monthNum}</span>
                                <span className="font-roboto font-bold text-[15px] text-on-surface-variant">/</span>
                                <span className="font-roboto font-bold text-[15px] text-on-surface-variant">{day}</span>
                                <span className="font-roboto font-bold text-[15px] text-on-surface-variant">/</span>
                                <span className="font-roboto font-bold text-[15px] text-on-surface-variant">{year}</span>
                            </div>
                            <Button variant="tonal" size="icon" onClick={() => changeDate(1)} className="w-10 h-10 rounded-full bg-surface hover:bg-surface border border-outline-variant disabled:opacity-50">
                                <ChevronRight size={20} className="text-on-surface" />
                            </Button>
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
                        <div className="flex flex-row gap-3 overflow-x-auto pb-2 no-scrollbar md:pb-0 md:overflow-visible min-h-[160px] md:h-[150px]">
                            {/* Net Sale (Green) */}
                            <Card className="min-w-[280px] md:min-w-0 flex-1 flex flex-col justify-between">
                                <CardContent className="p-6 h-full flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-on-surface-variant font-roboto font-medium text-[16px]">Net Sale</span>
                                            <span className="text-primary font-nirmala font-bold text-[36px] flex items-center">
                                                <span className="text-[36px] mr-1 font-extrabold">৳</span>{(data.monthly.revenue || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
                                            <CircleDollarSign size={24} />
                                        </div>
                                    </div>
                                    <span className="text-muted-foreground text-[14px] font-medium mt-auto">Revenue</span>
                                </CardContent>
                            </Card>

                            {/* Net Income */}
                            <Card className="min-w-[280px] md:min-w-0 flex-1 flex flex-col justify-between">
                                <CardContent className="p-6 h-full flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-on-surface-variant font-roboto font-medium text-[16px]">Net Income</span>
                                            <span className="text-secondary font-nirmala font-bold text-[36px] flex items-center">
                                                <span className="text-[36px] mr-1 font-extrabold">৳</span>{(data.monthly.profit || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                                            <BadgeDollarSign size={24} />
                                        </div>
                                    </div>
                                    <span className="text-muted-foreground text-[14px] font-medium mt-auto">Profit</span>
                                </CardContent>
                            </Card>

                            {/* Orders */}
                            <Card className="min-w-[280px] md:min-w-0 flex-1 flex flex-col justify-between">
                                <CardContent className="p-6 h-full flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-on-surface-variant font-roboto font-medium text-[16px]">Orders</span>
                                            <span className="text-tertiary font-nirmala font-bold text-[36px]">
                                                {data.monthly.orders || 0}
                                            </span>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container">
                                            <ShoppingCart size={24} />
                                        </div>
                                    </div>
                                    <div className="flex gap-4 text-[12px] font-medium text-muted-foreground mt-4">
                                        <span>Service : {data.monthly.service_count || 0}</span>
                                        <span>Product : {data.monthly.product_count || 0}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Monthly Graph - CSS Applied */}
                        <Card className="w-full h-[400px] flex flex-col">
                            <CardContent className="p-6 flex flex-col h-full gap-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-[20px] font-bold text-foreground font-roboto">Monthly Sales</h2>
                                    <div className="relative border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-m3-1 transition-shadow bg-surface-container-high">
                                        <select
                                            value={month}
                                            onChange={(e) => handleMonthSelect(e.target.value)}
                                            className="appearance-none bg-transparent w-full pl-4 pr-10 py-2 font-roboto font-bold text-[14px] text-on-surface-variant outline-none cursor-pointer"
                                        >
                                            {months.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-on-surface-variant">
                                            <ChevronDown size={18} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 w-full relative">
                                    <SalesGraph data={data.monthly.graph_data} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Revenue Progress Tracker (Expected vs Actual) */}
                        <Card className="mb-6">
                            <CardContent className="p-6 flex flex-col gap-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-[20px] font-bold text-foreground font-roboto flex items-center gap-2">
                                        <Activity className="text-primary" size={20} /> Revenue Velocity
                                    </h3>
                                    <div className="relative border border-outline-variant rounded-xl overflow-hidden shadow-sm bg-surface-container-high hover:shadow-m3-1 transition-shadow">
                                        <select
                                            value={month}
                                            onChange={(e) => handleMonthSelect(e.target.value)}
                                            className="appearance-none bg-transparent w-full pl-3 pr-8 py-1.5 font-roboto font-bold text-[13px] text-on-surface-variant outline-none cursor-pointer"
                                        >
                                            {months.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-on-surface-variant">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 relative">
                                    <div className="flex justify-between items-end mb-1">
                                        <div className="flex flex-col">
                                            <span className="text-[13px] text-muted-foreground font-semibold uppercase tracking-wider">Actual Recovery</span>
                                            <span className="text-[22px] font-bold text-primary">৳{(data.monthly?.revenue_progress?.actual || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[13px] text-muted-foreground font-semibold uppercase tracking-wider">Expected Potential</span>
                                            <span className="text-[16px] font-bold text-on-surface-variant">৳{(data.monthly?.revenue_progress?.expected || 0).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-4 w-full bg-surface-variant rounded-full overflow-hidden relative">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-1000 ease-in-out"
                                            style={{
                                                width: `${data.monthly?.revenue_progress?.expected > 0 ? Math.min((data.monthly.revenue_progress.actual / data.monthly.revenue_progress.expected) * 100, 100) : 0}%`
                                            }}
                                        />
                                    </div>

                                    <span className="text-[12px] text-on-surface-variant font-medium text-right mt-1">
                                        {data.monthly?.revenue_progress?.expected > 0
                                            ? `${((data.monthly.revenue_progress.actual / data.monthly.revenue_progress.expected) * 100).toFixed(1)}% of potential revenue realized`
                                            : 'No investments made this month'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Investment Tracker (Style Updated) */}
                        <Card className="mb-6 overflow-hidden">
                            {/* Header - Clickable for toggle */}
                            <div
                                onClick={() => setShowInvestment(!showInvestment)}
                                className="w-full flex items-center justify-between p-6 bg-surface cursor-pointer hover:bg-surface-variant/30 transition-colors"
                            >
                                <h3 className="text-[20px] font-bold text-foreground font-roboto">Investment Tracker</h3>

                                <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                                    {/* Month/All Dropdown */}
                                    {showInvestment && (
                                        <div className="relative border border-outline-variant rounded-xl overflow-hidden shadow-sm bg-surface-container-high hover:shadow-m3-1 transition-shadow">
                                            <select
                                                value={investmentFilter}
                                                onChange={(e) => setInvestmentFilter(e.target.value)}
                                                className="appearance-none bg-transparent w-full pl-3 pr-8 py-1.5 font-roboto font-bold text-[13px] text-on-surface-variant outline-none cursor-pointer"
                                            >
                                                <option value="All Time">All Month</option>
                                                {months.map(m => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-on-surface-variant">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Toggle Icon */}
                                    <div className="p-1">
                                        {showInvestment ? <ChevronLeft className="rotate-90 text-on-surface-variant" size={20} /> : <ChevronRight className="rotate-90 text-on-surface-variant" size={20} />}
                                    </div>
                                </div>
                            </div>

                            {showInvestment && (
                                <div className="p-6 pt-0 animate-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Invest - Card Style */}
                                        <Card variant="outlined" className="flex flex-col justify-between min-h-[140px]">
                                            <CardContent className="p-6">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-on-surface-variant font-roboto font-medium text-[16px]">Net Investment</span>
                                                        <span className="text-secondary font-nirmala font-bold text-[36px] flex items-center">
                                                            <span className="text-[36px] mr-1 font-extrabold">৳</span>{(investmentData.invest || 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                                                        <BadgeDollarSign size={24} />
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                                                    <span className="text-[13px] text-muted-foreground font-medium">Active Capital</span>
                                                    <span className="text-[14px] font-bold text-foreground">৳{((investmentData.invest || 0) - (investmentData.revenue || 0)).toLocaleString()}</span>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Sold - Card Style */}
                                        <Card variant="outlined" className="flex flex-col justify-between min-h-[140px]">
                                            <CardContent className="p-6">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-on-surface-variant font-roboto font-medium text-[16px]">Net Sold</span>
                                                        <span className="text-primary font-nirmala font-bold text-[36px] flex items-center">
                                                            <span className="text-[36px] mr-1 font-extrabold">৳</span>{(investmentData.revenue || 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
                                                        <CircleDollarSign size={24} />
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                                                    <span className="text-[13px] text-muted-foreground font-medium">Recovery Rate</span>
                                                    <span className="text-[14px] font-bold text-foreground">{investmentData.invest > 0 ? (((investmentData.revenue || 0) / investmentData.invest) * 100).toFixed(2) : 0}%</span>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Profit - Card Style */}
                                        <Card variant="outlined" className="flex flex-col justify-between min-h-[140px]">
                                            <CardContent className="p-6">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-on-surface-variant font-roboto font-medium text-[16px]">Net Profit</span>
                                                        <span className="text-tertiary font-nirmala font-bold text-[36px] flex items-center">
                                                            <span className="text-[36px] mr-1 font-extrabold">৳</span>{(investmentData.profit || 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container">
                                                        <ShoppingCart size={24} />
                                                    </div>
                                                </div>
                                                <div className="mt-auto pt-3 border-t border-border flex justify-between items-center">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Margin</span>
                                                        <span className="text-[14px] font-bold text-foreground">{investmentData.revenue > 0 ? (((investmentData.profit || 0) / investmentData.revenue) * 100).toFixed(2) : 0}%</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">ROI</span>
                                                        <span className="text-[14px] font-bold text-secondary">{investmentData.invest > 0 ? (((investmentData.profit || 0) / investmentData.invest) * 100).toFixed(2) : 0}%</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Compact Row: Top Products & Stock Alerts */}
                        <div className="flex flex-col xl:flex-row gap-6 w-full">
                            {/* Top Products */}
                            <Card className="flex-1 min-h-[282px]">
                                <CardContent className="p-6">
                                    <h3 className="text-[20px] font-bold text-foreground font-roboto mb-6">Top Selling Products ({month})</h3>
                                    <TopProducts products={data.monthly.top_products} />
                                </CardContent>
                            </Card>

                            {/* Stock Alerts */}
                            <Card className="flex-1 min-h-[282px]">
                                <CardContent className="p-6">
                                    <h3 className="text-[20px] font-bold text-foreground font-roboto mb-6">Low Stock Alerts</h3>
                                    <StockAlerts items={data.alerts} />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Secondary Compact Row: Dead Stock */}
                        <div className="flex flex-col gap-6 w-full mt-6">
                            <Card className="w-full">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-[20px] font-bold text-foreground font-roboto flex items-center gap-2">
                                            <Timer className="text-error" size={20} /> Dead Stock Tracker
                                        </h3>
                                        <div className="relative border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-m3-1 transition-shadow bg-surface-container-high">
                                            <select
                                                value={month}
                                                onChange={(e) => handleMonthSelect(e.target.value)}
                                                className="appearance-none bg-transparent w-full pl-3 pr-8 py-1.5 font-roboto font-bold text-[13px] text-on-surface-variant outline-none cursor-pointer"
                                            >
                                                {months.map(m => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-on-surface-variant">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>
                                    <DeadStock items={data.monthly?.dead_stock || []} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>


                    {/* RIGHT COLUMN (Desktop) / TOP COLUMN (Mobile): DAILY OVERVIEW */}
                    <div className="flex flex-col gap-6 w-full md:w-[40%] xl:w-[450px] 2xl:w-[550px] md:sticky md:top-8 md:h-[calc(100vh-32px)] overflow-hidden">

                        {/* Section Header */}
                        <div className="flex justify-between items-center h-[21px] flex-shrink-0">
                            <h2 className="text-on-surface-variant text-[14px] font-inter font-bold uppercase tracking-wider">DAILY OVERVIEW</h2>
                            <Button variant="text" size="sm" onClick={handleExportDaily} className="text-[12px] font-bold">
                                <Download size={14} /> Download Daily CSV
                            </Button>
                        </div>

                        {/* Daily Mini Stats */}
                        <div className="flex flex-row gap-3 h-[98px] flex-shrink-0">
                            {/* Total Sale */}
                            <Card className="flex-1 flex flex-col justify-center">
                                <CardContent className="p-4 gap-1">
                                    <span className="text-muted-foreground font-medium text-[12px]">Total Sale</span>
                                    <span className="text-foreground font-nirmala font-bold text-[25px] flex items-center">
                                        <span className="font-extrabold mr-1">৳</span>{(data.daily.revenue || 0).toLocaleString()}
                                    </span>
                                </CardContent>
                            </Card>
                            {/* Profit */}
                            <Card className="flex-1 flex flex-col justify-center">
                                <CardContent className="p-4 gap-1">
                                    <span className="text-muted-foreground font-medium text-[12px]">Total Profit</span>
                                    <span className="text-secondary font-nirmala font-bold text-[25px] flex items-center">
                                        <span className="font-extrabold mr-1">৳</span>{(data.daily.profit || 0).toLocaleString()}
                                    </span>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Daily History - CSS Applied (Responsive Width) */}
                        <Card className="w-full flex-1 flex flex-col overflow-hidden">
                            <CardContent className="p-6 flex flex-col h-full gap-3 overflow-hidden">
                                <h3 className="text-[20px] font-bold text-foreground font-roboto mb-2 flex-shrink-0">Transactions</h3>
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
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main >
        </div >
    );
}
