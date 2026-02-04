/**
 * UAE Emirates configuration
 * Centralized list of supported emirates for the application
 */

export const EMIRATES = [
  { id: 'dubai', name: 'Dubai' },
  { id: 'sharjah', name: 'Sharjah' },
  { id: 'ajman', name: 'Ajman' },
  { id: 'abu_dhabi', name: 'Abu Dhabi' },
  { id: 'ras_al_khaimah', name: 'Ras Al Khaimah' },
  { id: 'fujairah', name: 'Fujairah' },
  { id: 'umm_al_quwain', name: 'Umm Al Quwain' }
];

/**
 * Get emirate name by ID
 * @param {string} id - Emirate ID
 * @returns {string|null} Emirate name or null if not found
 */
export const getEmirateName = (id) => {
  const emirate = EMIRATES.find(e => e.id === id);
  return emirate?.name || null;
};

export default EMIRATES;
