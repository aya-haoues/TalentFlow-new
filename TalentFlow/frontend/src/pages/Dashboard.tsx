// src/pages/Dashboard.tsx
import { Navigate } from 'react-router-dom';
import { authService } from '../services/api';

const Dashboard = () => {
  const user = authService.getCurrentUser();

  switch (user?.role) {
    case 'admin':    return <Navigate to="/admin/dashboard" replace />;
    case 'rh':       return <Navigate to="/rh/dashboard" replace />;
    case 'candidat': return <Navigate to="/candidat/dashboard" replace />;
    default:         return <Navigate to="/" replace />;
  }
};

export default Dashboard;