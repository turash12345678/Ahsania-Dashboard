"use client";

import { useState, useMemo, useEffect } from "react";
import Fuse from "fuse.js";
import { Header } from "./Header";
import { ProductItem } from "./ProductItem";
import { BottomBar } from "./BottomBar";

// Product Data Structure Explanation:
// - productName: The product's name (e.g., "Pencil")
// - productImage: URL to product image (currently null, will use placeholder)
// - buyingPrice: Your purchase/cost price (120) - NOT shown in UI, kept for profit calculation
// - sellingPrice: Your selling price (200) - Shown in UI as default price and "Fixed Price" option

// Dummy Data
interface Product {
  id: string;
  productName: string;
  productImage: string | null;
  buyingPrice: number;
  sellingPrice: number;
  type?: 'product' | 'service';
  salesCount: number;
  stockQuantity: number | null; // null for services or unlimited
}

export default function PosContainer() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | number>(1);

  // Fetch products from API
  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, servicesRes] = await Promise.all([
          fetch("/api/inventory/products"),
          fetch("/api/inventory/services")
        ]);

        let combinedData: Product[] = [];

        if (productsRes.ok) {
          const pData = await productsRes.json();
          const mappedProducts = (Array.isArray(pData) ? pData : pData.data || []).map((p: any) => ({
            id: `p-${p.id}`,
            originalId: String(p.id),
            productName: p.name,
            productImage: null,
            buyingPrice: Number(p.buy_price) || 0,
            sellingPrice: Number(p.sell_price) || 0,
            type: 'product',
            salesCount: p.sales_count || 0,
            stockQuantity: p.stock_quantity !== undefined ? Number(p.stock_quantity) : 0
          }));
          combinedData = [...combinedData, ...mappedProducts];
        }

        if (servicesRes.ok) {
          const sData = await servicesRes.json();
          const mappedServices = (Array.isArray(sData) ? sData : sData.data || []).map((s: any) => ({
            id: `s-${s.id}`,
            originalId: String(s.id),
            productName: s.name,
            productImage: null,
            buyingPrice: 0,
            sellingPrice: Number(s.price) || 0,
            type: 'service',
            salesCount: s.sales_count || 0,
            stockQuantity: null // Services have no stock limit
          }));
          combinedData = [...combinedData, ...mappedServices];
        }

        // Sort by salesCount (Popularity) DESC
        combinedData.sort((a, b) => b.salesCount - a.salesCount);

        setProducts(combinedData);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const [searchTerm, setSearchTerm] = useState("");

  // State for multiple selections
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // State for quantities
  const [quantities, setQuantities] = useState<Record<string, number>>({});

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
    // Normalize Bangla digits to English
    const normalize = (str: string) => {
      const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return str.split('').map(char => {
        const idx = banglaDigits.indexOf(char);
        return idx > -1 ? String(idx) : char;
      }).join('');
    };

    const engValue = normalize(value);

    // Allow numeric input (integer or decimal)
    if (/^\d*\.?\d*$/.test(engValue)) {
      setCustomPrices((prev) => ({ ...prev, [id]: engValue }));
    }
  };

  // Calculate Total
  const total = useMemo(() => {
    let sum = 0;
    selectedIds.forEach((id) => {
      const product = products.find((p) => p.id === id);
      if (product) {
        const qty = quantities[id] || 1;
        const option = priceOptions[id] || 'fixed';

        // Price Calculation Logic:
        // - If "Fixed" (200) is selected: Use product.sellingPrice
        // - If "Custom" is selected: Use the custom input value only
        let price = 0;

        if (option === 'fixed') {
          price = Number(product.sellingPrice) || 0; // Use default selling price
        } else {
          // Custom price mode: Use only the custom input value
          const customVal = parseFloat(customPrices[id] || "0");
          price = isNaN(customVal) ? 0 : customVal;
        }

        console.log(`Calc Item ${id}: Option=${option}, Price=${price}`); // Debug log

        sum += price * qty;
      }
    });
    return sum;
  }, [selectedIds, quantities, priceOptions, customPrices, products]);

  // Fetch current user
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user?.id) setCurrentUserId(data.user.id);
      })
      .catch(err => console.error("Failed to fetch user", err));
  }, []);

  const handleCheckout = async () => {
    const orderItems = Array.from(selectedIds).map(id => {
      const product = products.find(p => p.id === id);
      if (!product) return null;

      const option = priceOptions[id] || 'fixed';
      const qty = quantities[id] || 1;
      const unitPrice = option === 'fixed'
        ? product.sellingPrice
        : (parseFloat(customPrices[id] || "0") || 0);

      // Use originalId for backend
      // @ts-ignore
      const realId = product.originalId || id;

      return {
        id: realId,
        type: product.type || 'product',
        quantity: qty,
        price: unitPrice
      };
    }).filter(Boolean);

    if (orderItems.length === 0) return;

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          payment_method: 'cash',
          total_amount: total,
          user_id: currentUserId
        }),
      });

      if (res.ok) {
        alert("Sale completed!");
        setSelectedIds(new Set());
        setQuantities({});
        setPriceOptions({});
        setCustomPrices({});
      } else {
        const result = await res.json();
        alert(`Sale failed: ${result.error || result.message || 'Unknown error'}`);
      }
    } catch (e) {
      alert(`Error processing sale: ${e instanceof Error ? e.message : 'Network error'}`);
    }
  };


  return (
    <div className="flex justify-center min-h-screen bg-gray-200 font-sans">
      {/* Mobile Frame - Updated for Safe Area */}
      {/* Added pt-[env(safe-area-inset-top)] to handle top status bar space */}
      <div className="w-full max-w-[412px] bg-[#EFF3F9] h-[100dvh] shadow-2xl flex flex-col relative overflow-hidden pt-[env(safe-area-inset-top)]">

        {/* Header - Fixed Top */}
        <div className="shrink-0 z-20 relative">
          <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        </div>

        {/* Main Content Area - Full Height */}
        <div className="flex-1 px-1.5 pb-0 overflow-hidden flex flex-col relative z-10">
          {/* List Container (Frame 15) */}
          <div className="flex-1 bg-white rounded-[38px] p-1 space-y-1 overflow-y-auto no-scrollbar pb-[calc(140px+env(safe-area-inset-bottom))] mt-2">
            {(() => {
              // Sorting Logic:
              // 1. Split into "Selected" and "Unselected".
              // 2. "Selected" items ALWAYS appear at the top (Pinned).
              // 3. "Unselected" items are filtered by search term.

              const term = searchTerm.toLowerCase();

              // Fuse.js Fuzzy Search Configuration
              const fuseOptions = {
                keys: ['productName', 'buyingPrice', 'sellingPrice'],
                threshold: 0.4, // Matches somewhat loosely (0.0 = perfect, 1.0 = match anything)
                distance: 100,  // Distance for fuzzy match
              };

              const fuse = new Fuse(products, fuseOptions);

              let displayList: Product[] = [];

              if (term) {
                // Search Mode: Fuzzy Search using Fuse.js
                const result = fuse.search(term);
                displayList = result.map(r => r.item);
              } else {
                // Default Mode: Pin Selected Items to Top
                const pinnedItems = products.filter(p => selectedIds.has(p.id));
                const unselectedItems = products.filter(p => !selectedIds.has(p.id));
                displayList = [...pinnedItems, ...unselectedItems];
              }

              return displayList.map((product) => (
                <ProductItem
                  key={product.id}
                  id={product.id}
                  name={product.productName}
                  buyingPrice={product.buyingPrice} // Pass cost price
                  sellingPrice={product.sellingPrice} // Pass sell price
                  stock={product.stockQuantity} // Pass stock info
                  isSelected={selectedIds.has(product.id)}
                  quantity={quantities[product.id] || 1}
                  onSelect={() => handleSelect(product.id)}
                  onQuantityChange={(delta) => handleQuantityChange(product.id, delta)}
                  priceOption={priceOptions[product.id] || 'fixed'}
                  customPrice={customPrices[product.id] || ""}
                  onPriceOptionChange={(opt) => handlePriceOptionChange(product.id, opt)}
                  onCustomPriceChange={(val) => handleCustomPriceChange(product.id, val)}
                />
              ));
            })()}
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
          <BottomBar total={total} currency="৳" onCheckout={handleCheckout} />
        </div>
      </div>
    </div>
  );
}