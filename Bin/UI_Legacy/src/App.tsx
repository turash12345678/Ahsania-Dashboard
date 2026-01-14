import { useState, useMemo } from "react";
import { Header } from "./components/Header";
import { ProductItem } from "./components/ProductItem";
import { BottomBar } from "./components/BottomBar";

// Product Data Structure Explanation:
// - productName: The product's name (e.g., "Pencil")
// - productImage: URL to product image (currently null, will use placeholder)
// - buyingPrice: Your purchase/cost price (120) - NOT shown in UI, kept for profit calculation
// - sellingPrice: Your selling price (200) - Shown in UI as default price and "Fixed Price" option

// Dummy Data
const INITIAL_PRODUCTS = [
  { 
    id: "1", 
    productName: "Pencil", 
    productImage: null, // Placeholder for product image URL
    buyingPrice: 120,   // Cost price (not used in frontend calculation)
    sellingPrice: 200   // Default selling price
  },
  { 
    id: "2", 
    productName: "Pencil", 
    productImage: null,
    buyingPrice: 120,
    sellingPrice: 200
  },
  { 
    id: "3", 
    productName: "Pencil", 
    productImage: null,
    buyingPrice: 120,
    sellingPrice: 200
  },
  { 
    id: "4", 
    productName: "Pencil", 
    productImage: null,
    buyingPrice: 120,
    sellingPrice: 200
  },
  { 
    id: "5", 
    productName: "Pencil", 
    productImage: null,
    buyingPrice: 120,
    sellingPrice: 200
  },
  { 
    id: "6", 
    productName: "Pencil", 
    productImage: null,
    buyingPrice: 120,
    sellingPrice: 200
  },
  { 
    id: "7", 
    productName: "Pencil", 
    productImage: null,
    buyingPrice: 120,
    sellingPrice: 200
  },
  { 
    id: "8", 
    productName: "Pencil", 
    productImage: null,
    buyingPrice: 120,
    sellingPrice: 200
  },
  { 
    id: "9", 
    productName: "Pencil", 
    productImage: null,
    buyingPrice: 120,
    sellingPrice: 200
  },
  { 
    id: "10", 
    productName: "Pencil", 
    productImage: null,
    buyingPrice: 120,
    sellingPrice: 200
  },
];

export default function App() {
  // State for multiple selections
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(["2"]));
  
  // State for quantities
  const [quantities, setQuantities] = useState<Record<string, number>>({
    "1": 1, "2": 1, "3": 1, "4": 1, "5": 1, 
    "6": 1, "7": 1, "8": 1, "9": 1, "10": 1,
  });

  // State for price options (fixed vs custom)
  const [priceOptions, setPriceOptions] = useState<Record<string, 'fixed' | 'custom'>>({});

  // State for custom price values
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleQuantityChange = (id: string, delta: number) => {
    setQuantities((prev) => {
      const newQty = Math.max(1, (prev[id] || 1) + delta);
      return { ...prev, [id]: newQty };
    });
  };

  const handlePriceOptionChange = (id: string, option: 'fixed' | 'custom') => {
    setPriceOptions((prev) => ({ ...prev, [id]: option }));
  };

  const handleCustomPriceChange = (id: string, value: string) => {
    // Allow only numeric input
    if (/^\d*$/.test(value)) {
       setCustomPrices((prev) => ({ ...prev, [id]: value }));
    }
  };

  // Calculate Total
  const total = useMemo(() => {
    let sum = 0;
    selectedIds.forEach((id) => {
      const product = INITIAL_PRODUCTS.find((p) => p.id === id);
      if (product) {
        const qty = quantities[id] || 1;
        const option = priceOptions[id] || 'fixed';
        
        // Price Calculation Logic:
        // - If "Fixed" (200) is selected: Use product.sellingPrice
        // - If "Custom" is selected: Use the custom input value only
        let price = 0;

        if (option === 'fixed') {
          price = product.sellingPrice; // Use default selling price (200)
        } else {
          // Custom price mode: Use only the custom input value
          const customVal = parseFloat(customPrices[id] || "0");
          price = isNaN(customVal) ? 0 : customVal;
        }

        sum += price * qty;
      }
    });
    return sum;
  }, [selectedIds, quantities, priceOptions, customPrices]);

  return (
    <div className="flex justify-center min-h-screen bg-gray-200 font-sans">
      {/* Mobile Frame - Updated for Safe Area */}
      {/* Added pt-[env(safe-area-inset-top)] to handle top status bar space */}
      <div className="w-full max-w-[412px] bg-[#EFF3F9] h-screen shadow-2xl flex flex-col relative overflow-hidden pt-[env(safe-area-inset-top)]">
        
        {/* Header - Fixed Top */}
        <div className="shrink-0 z-20 relative">
           <Header />
        </div>

        {/* Main Content Area - Full Height */}
        <div className="flex-1 px-1.5 pb-0 overflow-hidden flex flex-col relative z-10">
          {/* List Container (Frame 15) */}
          <div className="flex-1 bg-white rounded-[38px] p-1 space-y-1 overflow-y-auto no-scrollbar mb-[calc(170px+env(safe-area-inset-bottom))] mt-[0px] mr-[0px] mb-[144px] ml-[0px]">
            {INITIAL_PRODUCTS.map((product) => (
              <ProductItem
                key={product.id}
                id={product.id}
                name={product.productName}
                defaultPrice={product.sellingPrice} // This renders in collapsed view
                isSelected={selectedIds.has(product.id)}
                quantity={quantities[product.id] || 1}
                onSelect={() => handleSelect(product.id)}
                onQuantityChange={(delta) => handleQuantityChange(product.id, delta)}
                priceOption={priceOptions[product.id] || 'fixed'}
                customPrice={customPrices[product.id] || ""}
                onPriceOptionChange={(opt) => handlePriceOptionChange(product.id, opt)}
                onCustomPriceChange={(val) => handleCustomPriceChange(product.id, val)}
              />
            ))}
          </div>
        </div>

        {/* Bottom Bar - Floating Absolute Bottom */}
        {/* Added pb-[env(safe-area-inset-bottom)] to handle bottom gesture bar space */}
        <div className="absolute bottom-0 left-0 right-0 z-30 pb-[env(safe-area-inset-bottom)] bg-[#E8EDF7] rounded-t-[28px]"> 
          {/* Note: I added bg and radius to the wrapper to ensure safe area background matches the bar if needed, 
              but BottomBar component likely has its own styling. 
              Actually, BottomBar usually has the background. If I add padding here, the background might need to extend.
              If BottomBar has fixed height, adding padding to this wrapper pushes it up.
              Ideally, the BottomBar component itself should include the padding, or this wrapper should have the background color.
              The BottomBar component in Turn 2 was just imported. I'll assume it handles its own background.
              BUT if I pad this container, there will be transparent space at the bottom if the background isn't set.
              I'll apply the background color to this wrapper to be safe.
          */}
          <BottomBar total={total} currency="৳" />
        </div>
      </div>
    </div>
  );
}