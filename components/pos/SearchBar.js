'use client';

import { useState } from 'react';
import styles from './SearchBar.module.css';

/**
 * SearchBar Component
 * 
 * Search field with action buttons (plus, microphone).
 * Demo mode - no real search functionality yet.
 * 
 * Props:
 * - onSearch: function - Called on search input change
 * - onAddNew: function - Called when plus button is clicked
 * - onVoice: function - Called when microphone button is clicked
 */
export default function SearchBar({
  onSearch,
  onAddNew,
  onVoice
}) {
  const [searchValue, setSearchValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (value) => {
    setSearchValue(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleClear = () => {
    setSearchValue('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className={styles.container}>
      {/* Close/Back Button */}
      <button
        className={styles.actionButton}
        onClick={() => {
          handleClear();
        }}
        aria-label="Clear search"
        title="Close"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
        </svg>
      </button>

      {/* Search Input */}
      <input
        type="text"
        className={`${styles.searchInput} ${isFocused ? styles.focused : ''}`}
        placeholder="Search in List"
        value={searchValue}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      {/* Microphone Button */}
      <button
        className={styles.actionButton}
        onClick={onVoice}
        aria-label="Voice search"
        title="Voice search"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 16.91c-1.48 1.46-3.51 2.36-5.77 2.36-2.26 0-4.29-.9-5.77-2.36M19 10.5a7 7 0 00-14 0" />
        </svg>
      </button>
    </div>
  );
}
