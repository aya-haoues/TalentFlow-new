// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';

// ── Layouts ──────────────────────────────────────────────
import Navbar from './components/layout/Navbar';

// ── Pages publiques ──────────────────────────────────────
import Home            from './pages/Home';
import About           from './pages/About';
import Login           from './pages/Login';
import Register        from './pages/Register';
import SocialCallback  from './pages/SocialCallback';
import JobsPage        from './pages/JobsPage';
import JobDetailPage   from './pages/JobDetailPage';
import ApplyJobPage    from './pages/ApplyJobPage';

// ── Pages candidat ───────────────────────────────────────
import CandidatDashboard from './pages/candidat/CandidatDashboard';
import MyApplications    from './pages/candidat/MyApplications';

// ── Pages RH ─────────────────────────────────────────────
import RhDashboard    from './pages/rh/RhDashboard';
import RhJobsPage     from './pages/rh/RhJobsPage';
import RhCandidats from './pages/rh/RhCandidats';

// ── Pages Admin ───────────────────────────────────────────
import AdminDashboard        from './pages/admin/AdminDashboard';
import UsersManagement       from './pages/admin/UsersManagement';
import DepartmentsManagement from './pages/admin/DepartmentsManagement';

// ── Vérification Email ────────────────────────────────────
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// ── Auth Service ──────────────────────────────────────────
import { authService } from './services/api';
import TawkChat from './components/ui/TawkChat';
import Contact from './pages/Contact'; // <--- Ton import ici
/* ── Guards ─────────────────────────────────────────────── */
import RhPipeline  from './pages/rh/RhPipeline';
//import CandidatesList  from './pages/rh/CandidatesList';
//import RhLayout from './pages/rh/components/RhLayout';

function RequireAuth({ children }: { children: React.ReactNode }) {
    if (!authService.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    
    return <>{children}</>;
}


function CandidateRoute({ children }: { children: React.ReactNode }) {
    const user = authService.getCurrentUser();

    if (!authService.isAuthenticated()) {
        return <Navigate to="/login/candidat" replace state={{ from: window.location.pathname }} />;
    }
    if (user && !user.email_verified) {
        return <Navigate to="/verify-email" replace />;
    }
    if (user?.role !== 'candidat') {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}

function RhRoute({ children }: { children: React.ReactNode }) {
    const user = authService.getCurrentUser();

    if (!authService.isAuthenticated()) {
        return <Navigate to="/login/rh" replace />;
    }
    if (user && !user.email_verified) {
        return <Navigate to="/verify-email" replace />;
    }
    if (user?.role !== 'rh') {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
    const user = authService.getCurrentUser();

    if (!authService.isAuthenticated()) {
        return <Navigate to="/login/admin" replace />;
    }
    if (user?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}

/* ══════════════════════════════════════════════════════════
    APP
══════════════════════════════════════════════════════════ */
const App: React.FC = () => {
    const currentUser = authService.getCurrentUser();

    return (
        <ConfigProvider
            locale={frFR}
            theme={{
                token: { colorPrimary: '#00a89c', borderRadius: 8 },
            }}
        >
            <Router>
                <Routes>
                    {/* ... tes routes restent inchangées ... */}
                    <Route path="/" element={<><Navbar /><Home /></>} />
                    <Route path="/about" element={<><Navbar /><About /></>} />
                    <Route path="/contact" element={<><Navbar /><Contact /></>} />
                    <Route path="/jobs" element={<><Navbar /><JobsPage /></>} />
                    <Route path="/jobs/:id/apply" element={
                        <CandidateRoute><ApplyJobPage /></CandidateRoute>
                    } />
                    <Route path="/jobs/:id" element={<><Navbar /><JobDetailPage /></>} />

                    <Route path="/login/:role?" element={<Login />} />
                    <Route path="/register/:role?" element={<Register />} />
                    <Route path="/social/callback" element={<SocialCallback />} />

                    <Route path="/verify-email" element={
                        <RequireAuth>
                            <VerifyEmail />
                        </RequireAuth>
                    } />

                    <Route path="/candidat/dashboard" element={
                        <CandidateRoute><CandidatDashboard /></CandidateRoute>
                    } />
                    <Route path="/candidat/applications" element={
                        <CandidateRoute><MyApplications /></CandidateRoute>
                    } />

                   <Route path="/rh/dashboard"              element={<RhRoute><RhDashboard /></RhRoute>} />
<Route path="/rh/jobs"                   element={<RhRoute><RhJobsPage /></RhRoute>} />
<Route path="/rh/jobs/:jobId/pipeline"   element={<RhRoute><RhPipeline /></RhRoute>} />
<Route path="/rh/candidats"              element={<RhRoute><RhCandidats /></RhRoute>} />
<Route path="/rh/candidats/nouveaux"     element={<RhRoute><RhCandidats /></RhRoute>} />
<Route path="/rh/candidats/entretiens"   element={<RhRoute><RhCandidats /></RhRoute>} />
<Route path="/rh/candidats/retenus"      element={<RhRoute><RhCandidats /></RhRoute>} />
<Route path="/rh"></Route>



                    <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    <Route path="/admin/users" element={<AdminRoute><UsersManagement /></AdminRoute>} />
                    <Route path="/admin/departments" element={<AdminRoute><DepartmentsManagement /></AdminRoute>} />

                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    
                    <Route path="*" element={<Navigate to="/" replace />} />
                
   

                </Routes>

                {/* 2. On utilise maintenant les constantes définies plus haut */}
                <TawkChat
                    propertyId="69c97df2ae1d9e1c31b5efa0"
                    widgetId="1jkth7v5g"
                    user={currentUser ? {
                        name:  currentUser.name,
                        email: currentUser.email,
                        role:  currentUser.role,
                        id:    currentUser.id,
                    } : undefined}
                />

            </Router>
        </ConfigProvider>
        
    );
    
};

export default App;