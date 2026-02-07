/**
 * UAE Emirates configuration
 * Centralized list of supported emirates for the application
 */
import type { Emirate } from '../types';

export const EMIRATES: Emirate[] = [
  { id: 'dubai', name: 'Dubai' },
  { id: 'sharjah', name: 'Sharjah' },
  { id: 'ajman', name: 'Ajman' },
  { id: 'abu_dhabi', name: 'Abu Dhabi' },
  { id: 'ras_al_khaimah', name: 'Ras Al Khaimah' },
  { id: 'fujairah', name: 'Fujairah' },
  { id: 'umm_al_quwain', name: 'Umm Al Quwain' },
];

/**
 * Get emirate name by ID
 */
export const getEmirateName = (id: string): string | null => {
  const emirate = EMIRATES.find((e) => e.id === id);
  return emirate?.name || null;
};

export default EMIRATES;
