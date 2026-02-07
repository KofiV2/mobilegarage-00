/**
 * Staff Auth Context - Re-exports from factory with legacy API compatibility
 * 
 * This module provides backward compatibility for consumers expecting the original
 * API (staffLogin, staffLogout, isStaffAuthenticated) while using the shared factory.
 */
import React, { useMemo } from 'react';
import {
  StaffAuthContext,
  StaffAuthProvider as BaseStaffAuthProvider,
  useStaffAuth as useBaseStaffAuth
} from '../utils/createRoleAuthContext';

/**
 * Hook that wraps the factory hook to provide legacy API compatibility
 * Maps: login → staffLogin, logout → staffLogout, isStaff → isStaffAuthenticated
 */
export const useStaffAuth = () => {
  const context = useBaseStaffAuth();
  
  // Memoize the extended context to avoid unnecessary re-renders
  return useMemo(() => ({
    ...context,
    // Legacy API aliases
    staffLogin: context.login,
    staffLogout: context.logout,
    isStaffAuthenticated: context.isStaff
  }), [context]);
};

// Re-export the provider and context as-is
export { StaffAuthContext };
export const StaffAuthProvider = BaseStaffAuthProvider;

export default StaffAuthContext;
