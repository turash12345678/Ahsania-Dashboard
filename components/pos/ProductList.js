'use client';

import ProductListItem from './ProductListItem';
import styles from './ProductList.module.css';

/**
 * ProductList Container Component
 * 
 * Manages list of products with selection state from parent.
 * 
 * Props:
 * - items: array - List of product objects
 * - cart: object - Cart state { [itemId]: { quantity, price } }
 * - onItemSelect: function(itemId) - Called when item is clicked
 * - onQuantityChange: function(itemId, delta) - Called when quantity changes
 * - onPriceChange: function(itemId, newPrice) - Called when price changes
 */
export default function ProductList({
  items = [],
  cart = {},
  onItemSelect,
  onQuantityChange,
  onPriceChange
}) {

  // Demo data fallback
  const demoItems = [
    { id: 1, name: 'Pencil', price: 120, image: null },
    { id: 2, name: 'Pen', price: 150, image: null },
    { id: 3, name: 'Notebook', price: 200, image: null },
    { id: 4, name: 'Eraser', price: 50, image: null },
  ];

  const displayItems = items.length > 0 ? items : demoItems;

  return (
    <div className={styles.container}>
      <div className={styles.scrollArea}>
        {displayItems.map((item) => {
          const cartItem = cart[item.id];
          const isSelected = !!cartItem;

          return (
            <ProductListItem
              key={item.id}
              item={item}
              isSelected={isSelected}
              quantity={cartItem?.quantity || 1}
              price={cartItem?.price}
              onSelect={() => onItemSelect(item)}
              onQuantityChange={(delta) => onQuantityChange(item.id, delta)}
              onPriceChange={(newPrice) => onPriceChange(item.id, newPrice)}
            />
          );
        })}
      </div>
    </div>
  );
}
