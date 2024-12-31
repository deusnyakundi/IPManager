// client/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ component: Component, roles, ...rest }) => {
  const { user } = useAuth();

  if (!user) {
    // User is not authenticated
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // User does not have the required role
    return <Navigate to="/" replace />;
  }

  return <Component {...rest} />;
};

export default ProtectedRoute;