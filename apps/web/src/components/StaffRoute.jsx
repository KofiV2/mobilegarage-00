import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStaffAuth } from '../contexts/StaffAuthContext';

const StaffRoute = ({ children }) => {
  const { isStaffAuthenticated, loading } = useStaffAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="staff-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isStaffAuthenticated) {
    // Redirect to staff login, preserving the intended destination
    return <Navigate to="/staff/login" state={{ from: location }} replace />;
  }

  return children;
};

export default StaffRoute;
