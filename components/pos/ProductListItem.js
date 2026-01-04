'use client';

import { useState } from 'react';
import styles from './ProductListItem.module.css';

export default function ProductListItem({
  item,
  isSelected = false,
  quantity = 1,
  price, // Custom price if set
  onSelect,
  onQuantityChange,
  onPriceChange
}) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    if (onSelect) onSelect(item.id);
  };

  const handleQuantityChange = (delta) => {
    if (onQuantityChange) {
      onQuantityChange(delta);
    }
  };

  return (
    <div
      className={`${styles.container} ${isSelected ? styles.selected : styles.default} ${isPressed ? styles.pressed : ''
        }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Product Image / Icon */}
      <div className={styles.imageContainer}>
        <div className={styles.imagePlaceholder}>
          {item.image ? (
            <img src={item.image} alt={item.name} />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          )}
        </div>
        {isSelected && (
          <div className={styles.checkmark}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className={styles.infoContainer}>
        <h3 className={styles.productName}>{item.name}</h3>
        {!isSelected && (
          <span className={styles.price}>৳{price || item.price}</span>
        )}
      </div>

      {/* Selected State: Quantity Controls */}
      {isSelected && (
        <div className={styles.selectedContainer}>
          {/* Quantity Selector */}
          <div className={styles.quantityControl}>
            <button
              className={styles.quantityButton}
              onClick={(e) => {
                e.stopPropagation();
                handleQuantityChange(-1);
              }}
              aria-label="Decrease quantity"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13H5v-2h14v2z" />
              </svg>
            </button>
            <span className={styles.quantityValue}>{quantity}</span>
            <button
              className={styles.quantityButton}
              onClick={(e) => {
                e.stopPropagation();
                handleQuantityChange(1);
              }}
              aria-label="Increase quantity"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </button>
          </div>

          {/* Price Input Fields */}
          <div className={styles.priceFields}>
            <input
              type="number"
              className={styles.priceInput}
              value={price || item.price}
              onChange={(e) => onPriceChange && onPriceChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Price"
            />
          </div>
        </div>
      )}
    </div>
  );
}
