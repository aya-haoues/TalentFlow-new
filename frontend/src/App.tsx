// src/App.tsx - VERSION CORRIGÉE (sans double layout)
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';

// 🎨 Layouts
import Navbar from "./components/layout/Navbar";

// 📄 Pages Publiques
import Home from "./pages/Home";
import JobsPage from "./pages/JobsPage";
import JobDetailPage from "./pages/JobDetailPage";
import Login from "./pages/Login";
import RegisterCandidat from "./pages/RegisterCandidat";
import RegisterRh from "./pages/RegisterRh";
import RegisterManager from "./pages/RegisterManager";

// 📄 Pages RH (dans dossier rh/)
import RhDashboard from "./pages/rh/RhDashboard";
import RhJobsPage from "./pages/rh/RhJobsPage";
import CandidatesPage from "./pages/rh/CandidatesPage";

import ApplyJobPage from './pages/ApplyJobPage';

// 🔐 Auth service
import { authService } from "./services/api";
import type { User } from "./types";

// 🛡️ Protection routes RH
function RhRoute({ children }: { children: React.ReactNode }) {
  const user: User | null = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'rh') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

// Fonction de protection pour les candidats (ou tout utilisateur connecté)
function CandidateRoute({ children }: { children: React.ReactNode }) {
  const user: User | null = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  // Si vous voulez restreindre aux seuls candidats :
  // if (user.role !== 'candidat') return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={frFR}
      theme={{
        token: {
          colorPrimary: '#00a89c',
          borderRadius: 8,
        },
      }}
    >
      <Router>
        <Routes>
          
          {/* ============================================
              🌍 ROUTES PUBLIQUES (sans auth)
              ============================================ */}
          
          <Route path="/" element={
            <>
              <Navbar />
              <Home />
            </>
          } />
          
          <Route path="/jobs" element={
            <>
              <Navbar />
              <JobsPage />
            </>
          } />
          
          <Route path="/jobs/:id" element={
            <>
              <Navbar />
              <JobDetailPage />
            </>
          } />

          <Route path="/jobs/:id/apply" element={<CandidateRoute><ApplyJobPage /></CandidateRoute>} />

          
          <Route path="/about" element={
            <>
              <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <h1>À propos de TalentFlow</h1>
              </div>
            </>
          } />
          
          {/* 🔐 AUTHENTIFICATION */}
          <Route path="/login" element={<Login />} />
          <Route path="/login/rh" element={<Login />} />
          <Route path="/login/manager" element={<Login />} />
          
          {/* 📝 INSCRIPTIONS */}
          <Route path="/register" element={<RegisterCandidat />} />
          <Route path="/register/rh" element={<RegisterRh />} />
          <Route path="/register/manager" element={<RegisterManager />} />
          
          {/* ============================================
              👔 ROUTES RH (protégées)
              ============================================ */}
          
          <Route path="/dashboard/rh" element={
            <RhRoute>
              <RhDashboard />  {/* ← plus de wrapper RhLayout ici */}
            </RhRoute>
          } />
          
          <Route path="/rh/jobs" element={
            <RhRoute>
              <RhJobsPage />   {/* ← plus de wrapper RhLayout ici */}
            </RhRoute>
          } />
          
          <Route path="/rh/candidates" element={
            <RhRoute>
              <CandidatesPage />  {/* ← plus de wrapper RhLayout ici */}
            </RhRoute>
          } />
          
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;