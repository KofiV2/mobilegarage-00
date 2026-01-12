import Fuse from 'fuse.js';

// Create fuzzy search instance with customizable options
export const createSearchEngine = (data, keys, options = {}) => {
  const defaultOptions = {
    keys,
    threshold: 0.3, // Lower = stricter match (0.0 = exact, 1.0 = match anything)
    distance: 100, // Maximum distance for fuzzy matching
    includeScore: true,
    includeMatches: true, // Include match indices for highlighting
    minMatchCharLength: 2,
    ignoreLocation: true, // Don't consider position in string
    findAllMatches: true, // Continue searching after finding a match
    ...options
  };

  return new Fuse(data, defaultOptions);
};

// Simple search function
export const simpleSearch = (data, query, keys) => {
  if (!query || query.trim() === '') {
    return data;
  }

  const lowerQuery = query.toLowerCase();

  return data.filter(item => {
    return keys.some(key => {
      const value = getNestedValue(item, key);
      if (value === null || value === undefined) return false;

      return String(value).toLowerCase().includes(lowerQuery);
    });
  });
};

// Fuzzy search with Fuse.js (returns items with match info)
export const fuzzySearch = (data, query, keys, options = {}) => {
  if (!query || query.trim() === '') {
    return data;
  }

  const fuse = createSearchEngine(data, keys, options);
  const results = fuse.search(query);

  return results.map(result => result.item);
};

// Fuzzy search that returns full results with highlighting info
export const fuzzySearchWithHighlights = (data, query, keys, options = {}) => {
  if (!query || query.trim() === '') {
    return data.map(item => ({ item, matches: [] }));
  }

  const fuse = createSearchEngine(data, keys, options);
  const results = fuse.search(query);

  return results.map(result => ({
    item: result.item,
    matches: result.matches || [],
    score: result.score
  }));
};

// Advanced filter function
export const advancedFilter = (data, filters) => {
  return data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        return true; // Skip empty filters
      }

      const itemValue = getNestedValue(item, key);

      // Handle different filter types
      if (Array.isArray(value)) {
        // Multiple values (OR condition)
        return value.includes(itemValue);
      } else if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
        // Range filter
        return itemValue >= value.min && itemValue <= value.max;
      } else if (typeof value === 'object' && value.start && value.end) {
        // Date range filter
        const itemDate = new Date(itemValue);
        const startDate = new Date(value.start);
        const endDate = new Date(value.end);
        return itemDate >= startDate && itemDate <= endDate;
      } else {
        // Exact match
        return itemValue === value;
      }
    });
  });
};

// Sort data
export const sortData = (data, sortBy, sortOrder = 'asc') => {
  if (!sortBy) return data;

  return [...data].sort((a, b) => {
    const aValue = getNestedValue(a, sortBy);
    const bValue = getNestedValue(b, sortBy);

    // Handle null/undefined
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    // Handle different data types
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortOrder === 'asc' ? comparison : -comparison;
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    } else if (aValue instanceof Date && bValue instanceof Date) {
      return sortOrder === 'asc'
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    } else {
      // Fallback to string comparison
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortOrder === 'asc' ? comparison : -comparison;
    }
  });
};

// Get nested object value by path (e.g., 'user.profile.name')
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
};

// Combine search, filter, and sort
export const processData = (data, {
  searchQuery = '',
  searchKeys = [],
  filters = {},
  sortBy = null,
  sortOrder = 'asc',
  usesFuzzySearch = true
}) => {
  let result = data;

  // Apply filters first
  if (Object.keys(filters).length > 0) {
    result = advancedFilter(result, filters);
  }

  // Apply search
  if (searchQuery && searchKeys.length > 0) {
    result = usesFuzzySearch
      ? fuzzySearch(result, searchQuery, searchKeys)
      : simpleSearch(result, searchQuery, searchKeys);
  }

  // Apply sorting
  if (sortBy) {
    result = sortData(result, sortBy, sortOrder);
  }

  return result;
};

// Helper function to highlight matched text
export const highlightText = (text, matches = []) => {
  if (!text || matches.length === 0) return text;

  let highlightedText = text;
  const highlights = [];

  matches.forEach(match => {
    if (match.indices) {
      match.indices.forEach(([start, end]) => {
        highlights.push({ start, end: end + 1 });
      });
    }
  });

  // Sort highlights by start position (reverse order for string manipulation)
  highlights.sort((a, b) => b.start - a.start);

  // Apply highlights
  highlights.forEach(({ start, end }) => {
    const before = highlightedText.slice(0, start);
    const match = highlightedText.slice(start, end);
    const after = highlightedText.slice(end);
    highlightedText = `${before}<mark>${match}</mark>${after}`;
  });

  return highlightedText;
};

// Debounce utility for search inputs
export const debounce = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Date range filter helper
export const filterByDateRange = (data, dateField, startDate, endDate) => {
  if (!startDate && !endDate) return data;

  return data.filter(item => {
    const itemDate = new Date(getNestedValue(item, dateField));

    if (startDate && endDate) {
      return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
    } else if (startDate) {
      return itemDate >= new Date(startDate);
    } else {
      return itemDate <= new Date(endDate);
    }
  });
};

// Price/number range filter helper
export const filterByNumberRange = (data, field, min, max) => {
  if (min === undefined && max === undefined) return data;

  return data.filter(item => {
    const value = parseFloat(getNestedValue(item, field));

    if (min !== undefined && max !== undefined) {
      return value >= min && value <= max;
    } else if (min !== undefined) {
      return value >= min;
    } else {
      return value <= max;
    }
  });
};

// Multi-select filter helper
export const filterByMultipleValues = (data, field, values = []) => {
  if (!values || values.length === 0) return data;

  return data.filter(item => {
    const itemValue = getNestedValue(item, field);
    return values.includes(itemValue);
  });
};
