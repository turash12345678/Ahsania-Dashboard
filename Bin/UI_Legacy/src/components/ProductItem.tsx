import { Minus, Plus, Check, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductItemProps {
  id: string;
  name: string;
  defaultPrice: number; // This is the sellingPrice (e.g., 200)
  isSelected: boolean;
  quantity: number;
  onSelect: () => void;
  onQuantityChange: (delta: number) => void;
  priceOption: 'fixed' | 'custom';
  customPrice: string;
  onPriceOptionChange: (option: 'fixed' | 'custom') => void;
  onCustomPriceChange: (value: string) => void;
}

export function ProductItem({
  id,
  name,
  defaultPrice,
  isSelected,
  quantity,
  onSelect,
  onQuantityChange,
  priceOption,
  customPrice,
  onPriceOptionChange,
  onCustomPriceChange,
}: ProductItemProps) {

  return (
    <div
      onClick={() => {
        // Toggle selection logic handled by parent
        onSelect();
      }}
      className={cn(
        "w-full transition-all duration-300 ease-in-out cursor-pointer",
        isSelected
          ? "bg-[#EFF3F9] rounded-[36px_36px_26px_26px] p-2"
          : "bg-white rounded-[5px] p-2 hover:bg-gray-50"
      )}
    >
      {/* Top Row: Icon + Name + (Price or Quantity Controls) */}
      <div className={cn("flex items-center gap-3", isSelected ? "h-[56px] mb-3" : "h-[56px]")}>
        {/* Icon Container */}
        <div
          className={cn(
            "flex-none w-[56px] h-[56px] rounded-full flex items-center justify-center transition-colors duration-300",
            isSelected ? "bg-[#0065F4]" : "bg-[#00D2E6]"
          )}
        >
          {isSelected ? (
            <Check className="text-white w-7 h-7" strokeWidth={3} />
          ) : (
            <ImageIcon className="text-white w-7 h-7" />
          )}
        </div>

        {/* Name */}
        <div className="flex-1 flex justify-between items-center min-w-0">
          <span className="font-roboto font-medium text-[22px] text-[#0F1828] truncate">
            {name}
          </span>
          
          {/* Default View: Price only */}
          {!isSelected && (
            <span className="font-inter font-medium text-[14px] text-[#495564]">
              ৳{defaultPrice}
            </span>
          )}
        </div>

        {/* Selected View: Quantity Stepper */}
        {isSelected && (
          <div 
            className="flex items-center bg-white border border-[#E0E0E0] rounded-[64px] h-[42px] px-[5px] gap-[2px] shadow-sm"
            onClick={(e) => e.stopPropagation()}
            style={{ borderWidth: "1.14px" }}
          >
            <button
              onClick={() => onQuantityChange(-1)}
              className="w-[33px] h-[33px] rounded-full bg-[#F2F4F5] flex items-center justify-center text-[#0065F4] hover:bg-gray-200 active:scale-95 transition"
            >
              <Minus size={16} strokeWidth={2.5} />
            </button>
            <span className="w-[33px] text-center font-roboto font-medium text-[17px] text-[#0F1828]">
              {quantity}
            </span>
            <button
              onClick={() => onQuantityChange(1)}
              className="w-[33px] h-[33px] rounded-full bg-[#F2F4F5] flex items-center justify-center text-[#0065F4] hover:bg-gray-200 active:scale-95 transition"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* Expanded Content: Price Options */}
      {isSelected && (
        <div className="flex gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
          {/* Option 1: Fixed Price */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onPriceOptionChange('fixed');
            }}
            className="flex-1 h-[38px] bg-white border border-[#E0E0E0] rounded-[18px] p-[4px] flex items-center cursor-pointer hover:border-blue-400 transition-colors"
          >
             <div className={cn(
               "w-full h-full rounded-[43px] flex items-center justify-center transition-colors duration-200",
               priceOption === 'fixed' ? "bg-[#F2F4F5]" : "bg-transparent"
             )}>
                <span className={cn(
                  "font-roboto text-[18px]",
                  priceOption === 'fixed' ? "font-bold text-[#0065F4]" : "font-normal text-[#0F1828]"
                )}>
                  {defaultPrice}
                </span>
             </div>
          </div>

          {/* Option 2: Custom Price */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onPriceOptionChange('custom');
            }}
            className="flex-1 h-[38px] bg-white border border-[#E0E0E0] rounded-[18px] p-[4px] flex items-center cursor-pointer hover:border-blue-400 transition-colors"
          >
            <div className={cn(
               "w-full h-full rounded-[43px] flex items-center justify-center transition-colors duration-200",
               priceOption === 'custom' ? "bg-[#F2F4F5]" : "bg-transparent"
             )}>
                {priceOption === 'custom' ? (
                  <input
                    autoFocus
                    type="text"
                    inputMode="numeric"
                    value={customPrice}
                    onChange={(e) => onCustomPriceChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-transparent text-center font-roboto font-bold text-[18px] text-[#0F1828] outline-none placeholder:text-gray-400"
                    placeholder="0"
                  />
                ) : (
                  // Empty state or hidden placeholder if needed
                  null
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility for class merging
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}