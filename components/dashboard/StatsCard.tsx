import { LucideIcon } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string; // e.g., "+5% from last month"
    color?: string; // Custom color for icon/value, default is primary blue from Design System
}

export function StatsCard({ title, value, icon: Icon, trend, color = "#0065F4" }: StatsCardProps) {
    return (
        <div className="bg-white rounded-[26px] p-6 shadow-sm flex flex-col justify-between h-[150px] transition-transform hover:scale-[1.02] duration-200">
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <h3 className="text-[#7A747F] font-roboto font-medium text-[16px] mb-1">{title}</h3>
                    <span className="text-[#0F1828] font-roboto font-bold text-[28px]" style={{ color: color }}>
                        {value}
                    </span>
                </div>
                <div
                    className="w-[48px] h-[48px] rounded-full flex items-center justify-center opacity-10"
                    style={{ backgroundColor: color }}
                >
                    <Icon size={24} color={color} style={{ opacity: 10 }} />
                    {/* The above opacity trick is tricky in inline styles, let's use plain Tailwind for reliability */}
                </div>
                <div
                    className="w-[48px] h-[48px] rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${color}1A` }} // 10% opacity hex
                >
                    <Icon size={24} color={color} />
                </div>
            </div>

            {trend && (
                <span className="text-[#495564] text-[13px] font-inter">
                    {trend}
                </span>
            )}
        </div>
    );
}
