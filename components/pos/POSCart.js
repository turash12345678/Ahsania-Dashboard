'use client';

import { useState, useEffect } from 'react';
import styles from './POSCart.module.css';

/**
 * POSCart Component
 * 
 * Bottom cart summary with total and action button.
 * Displays grand total and "Complete Sale" button.
 * Demo mode - no real data binding yet.
 * 
 * Props:
 * - total: number - Cart total amount
 * - itemCount: number - Number of items in cart
 * - onCompleteSale: function - Called when sale is completed
 */
export default function POSCart({
  total = 200,
  itemCount = 1,
  onCompleteSale
}) {
  const [isHovering, setIsHovering] = useState(false);

  const handleCompleteSale = () => {
    if (onCompleteSale) {
      onCompleteSale();
    }
  };

  return (
    <div className={styles.cartContainer}>
      <div className={styles.content}>
        {/* Total Section */}
        <div className={styles.totalSection}>
          <span className={styles.label}>Total</span>
          <span className={styles.totalAmount}>৳{total}</span>
        </div>

        {/* Complete Sale Button */}
        <button
          className={`${styles.saleButton} ${isHovering ? styles.saleButtonHover : ''}`}
          onClick={handleCompleteSale}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onTouchStart={() => setIsHovering(true)}
          onTouchEnd={() => setIsHovering(false)}
        >
          <span className={styles.buttonText}>Complete Sale</span>
        </button>
      </div>
    </div>
  );
}
