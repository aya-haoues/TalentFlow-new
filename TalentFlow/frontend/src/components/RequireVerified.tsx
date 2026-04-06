// src/components/RequireVerified.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RequireVerified({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!user?.email_verified) {
        return <Navigate to="/verify-email" replace />;
    }

    return <>{children}</>;
}