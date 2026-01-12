import React, { useState, useEffect } from 'react';
import './SearchBar.css';

const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search...',
  debounceDelay = 500,
  showClearButton = true,
  icon = '🔍',
  className = ''
}) => {
  const [inputValue, setInputValue] = useState(value || '');

  // Debounce the search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onChange(inputValue);
    }, debounceDelay);

    return () => clearTimeout(timeoutId);
  }, [inputValue, onChange, debounceDelay]);

  // Update local state when external value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleClear = () => {
    setInputValue('');
    onChange('');
  };

  return (
    <div className={`search-bar-container ${className}`}>
      <span className="search-icon">{icon}</span>
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      {showClearButton && inputValue && (
        <button
          type="button"
          className="clear-button"
          onClick={handleClear}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
      {inputValue && (
        <span className="search-status">Searching...</span>
      )}
    </div>
  );
};

export default SearchBar;
