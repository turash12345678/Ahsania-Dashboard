"use client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface SalesGraphProps {
    data: { date: string; total: number }[];
}

export function SalesGraph({ data }: SalesGraphProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9AA3B0', fontSize: 12 }}
                    dy={10}
                    tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}`;
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
                    labelStyle={{ color: '#7B7480', marginBottom: '4px' }}
                    formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Income']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                />
                <Line
                    type="linear"
                    dataKey="total"
                    stroke="#0067FD"
                    strokeWidth={3}
                    dot={{ r: 4, stroke: '#0067FD', strokeWidth: 2, fill: '#FFFFFF' }}
                    activeDot={{ r: 6, stroke: '#0067FD', strokeWidth: 2, fill: '#0067FD' }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
