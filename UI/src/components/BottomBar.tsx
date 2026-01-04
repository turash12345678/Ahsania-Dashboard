interface BottomBarProps {
  total: number;
  currency: string;
}

export function BottomBar({ total, currency }: BottomBarProps) {
  return (
    <div className="bg-[#E8EDF7] rounded-t-[28px] p-[16px] pt-4 pb-10 w-full z-20">
      {/* Total Row */}
      <div className="flex justify-between items-center mb-4 px-2">
        <span className="font-roboto font-medium text-[22px] text-[#0F1828]">
          Total
        </span>
        <span className="font-roboto font-bold text-[22px] text-[#0065F4]">
          {currency}{total}
        </span>
      </div>

      {/* Complete Sale Button */}
      <button className="w-full h-[55px] bg-[#0065F4] rounded-[33px] flex items-center justify-center text-white font-roboto font-bold text-[18px] hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/30">
        Complete Sale
      </button>
    </div>
  );
}
