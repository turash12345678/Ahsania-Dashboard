"use client";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface SalesGraphProps {
    data: { date: string; total: number }[];
}

export function SalesGraph({ data }: SalesGraphProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0067FD" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0067FD" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9AA3B0', fontSize: 12 }}
                    dy={10}
                    tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}`; // Just the day number as per design? Or "1", "2"... 
                        // The design shows just numbers "1", "2", "3"... but our data might be dates.
                        // Let's stick to simple day number if possible, or "DD Mon" if space permits.
                        // Design image shows "1 2 3 ... 30".
                    }}
                    interval="preserveStartEnd"
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9AA3B0', fontSize: 12 }}
                    tickFormatter={(value) => `৳${value}`}
                />
                <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0px 4px 20px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#0067FD', fontWeight: 'bold' }}
                    formatter={(value: number) => [`৳${value}`, 'Sales']}
                />
                <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#0067FD"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
