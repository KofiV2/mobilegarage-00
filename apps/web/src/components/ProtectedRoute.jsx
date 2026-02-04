import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireFullAuth = false }) => {
  const { isAuthenticated, isGuest, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // If route requires full auth (like profile), don't allow guests
  if (requireFullAuth && !isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Allow access if authenticated OR in guest mode
  if (!isAuthenticated && !isGuest) {
    // Redirect to auth page, but save the intended destination
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requireFullAuth: PropTypes.bool
};

export default ProtectedRoute;
