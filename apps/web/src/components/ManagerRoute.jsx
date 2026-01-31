import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useManagerAuth } from '../contexts/ManagerAuthContext';

const ManagerRoute = ({ children }) => {
  const { isManagerAuthenticated, loading } = useManagerAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="manager-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isManagerAuthenticated) {
    // Redirect to manager login, preserving the intended destination
    return <Navigate to="/manager/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ManagerRoute;
