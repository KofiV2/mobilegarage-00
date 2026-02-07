/**
 * Manager Auth Context - Re-exports from factory with legacy API compatibility
 * 
 * This module provides backward compatibility for consumers expecting the original
 * API (managerLogin, managerLogout, isManagerAuthenticated) while using the shared factory.
 */
import React, { useMemo } from 'react';
import {
  ManagerAuthContext,
  ManagerAuthProvider as BaseManagerAuthProvider,
  useManagerAuth as useBaseManagerAuth
} from '../utils/createRoleAuthContext';

/**
 * Hook that wraps the factory hook to provide legacy API compatibility
 * Maps: login → managerLogin, logout → managerLogout, isManager → isManagerAuthenticated
 */
export const useManagerAuth = () => {
  const context = useBaseManagerAuth();
  
  // Memoize the extended context to avoid unnecessary re-renders
  return useMemo(() => ({
    ...context,
    // Legacy API aliases
    managerLogin: context.login,
    managerLogout: context.logout,
    isManagerAuthenticated: context.isManager
  }), [context]);
};

// Re-export the provider and context as-is
export { ManagerAuthContext };
export const ManagerAuthProvider = BaseManagerAuthProvider;

export default ManagerAuthContext;
