import { Plus, Mic } from "lucide-react";

export function Header() {
  return (
    <div className="flex flex-col items-center w-full bg-[#EFF3F9] pt-[16px] pr-[16px] pb-[8px] pl-[16px]">
      <div className="flex flex-row items-center w-full max-w-[380px] h-[60px] gap-[21px]">
        {/* Close Button (Plus rotated 45deg) */}
        <button className="flex-none w-[29px] h-[29px] flex items-center justify-center text-[#40444A] transform rotate-45 active:scale-95 transition-transform">
          <Plus size={36} strokeWidth={2.5} />
        </button>

        {/* Search Pill */}
        <div className="flex-1 h-[60px] bg-white rounded-[33px] flex items-center justify-center shadow-sm px-4">
          <input
            type="text"
            placeholder="Search in List"
            className="w-full bg-transparent outline-none text-[20px] leading-[30px] text-[#7A747F] placeholder-[#7A747F] font-roboto font-normal text-center"
          />
        </div>

        {/* Microphone Icon */}
        <button className="flex-none w-[29px] h-[29px] flex items-center justify-center text-[#40444A] active:scale-95 transition-transform opacity-80">
          <Mic size={28} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
