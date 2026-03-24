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
import Register from './pages/Register';

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
import CandidatesPage from './pages/rh/CandidatesPage';

// ── Auth ─────────────────────────────────────────────────
import { authService } from './services/api';
import AdminDashboard from './pages/admin/AdminDashboard';

import UsersManagement from './pages/admin/UsersManagement';
import DepartmentsManagement from './pages/admin/DepartmentsManagement';

/* ── Guards ─────────────────────────────────────────────── */
function RhRoute({ children }: { children: React.ReactNode }) {
  const user = authService.getCurrentUser();
  if (!authService.isAuthenticated() || user?.role !== 'rh') {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function CandidateRoute({ children }: { children: React.ReactNode }) {
  const user = authService.getCurrentUser();
  if (!authService.isAuthenticated() || user?.role !== 'candidat') {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }
  return <>{children}</>;
}

/* ══════════════════════════════════════════════════════════
   APP
══════════════════════════════════════════════════════════ */
const App: React.FC = () => (
  <ConfigProvider
    locale={frFR}
    theme={{
      token: { colorPrimary: '#00a89c', borderRadius: 8 },
    }}
  >
    <Router>
      <Routes>

        {/* ── Publiques ───────────────────────────────── */}
        <Route path="/"        element={<><Navbar /><Home /></>} />
        <Route path="/about"   element={<><Navbar /><About /></>} />
        <Route path="/jobs"    element={<><Navbar /><JobsPage /></>} />

        {/* Route /apply AVANT /:id (plus spécifique en premier) */}
        <Route path="/jobs/:id/apply" element={<CandidateRoute><ApplyJobPage /></CandidateRoute>} />
        <Route path="/jobs/:id"       element={<><Navbar /><JobDetailPage /></>} />

        {/* ── Auth ────────────────────────────────────── */}

        <Route path="/login/:role?"       element={<Login />} />
        <Route path="/register/:role?" element={<Register />} />
        <Route path="/social/callback"    element={<SocialCallback />} />

        {/* ── Candidat (protégées) ────────────────────── */}
        <Route path="/candidat/dashboard"    element={<CandidateRoute><CandidatDashboard /></CandidateRoute>} />
        <Route path="/candidat/applications" element={<CandidateRoute><MyApplications /></CandidateRoute>} />

        {/* ── RH (protégées) ──────────────────────────── */}
        <Route path="/rh/dashboard"  element={<RhRoute><RhDashboard /></RhRoute>} />
        <Route path="/rh/jobs"       element={<RhRoute><RhJobsPage /></RhRoute>} />
        <Route path="/rh/candidates" element={<RhRoute><CandidatesPage /></RhRoute>} />



        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UsersManagement />} />
        <Route path="/admin/departments" element={<DepartmentsManagement />} />


        {/* ── Fallback ────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />


      </Routes>
    </Router>
  </ConfigProvider>
);

export default App;
