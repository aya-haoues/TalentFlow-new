// src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ConfigProvider } from "antd";
import frFR from "antd/locale/fr_FR";
import CandidatDashboard from './pages/candidat/CandidatDashboard';
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
import SocialCallback from "./pages/SocialCallback";
import About from "./pages/About";
import ApplyJobPage from "./pages/ApplyJobPage";

// 📄 Pages RH
import RhDashboard from "./pages/rh/RhDashboard";
import RhJobsPage from "./pages/rh/RhJobsPage";
import CandidatesPage from "./pages/rh/CandidatesPage";

// 🔐 Auth service
import { authService } from "./services/api";

/**
 * 🛡️ Guard : Protège les routes RH
 */
function RhRoute({ children }: { children: React.ReactNode }) {
  const user = authService.getCurrentUser();
  if (!authService.isAuthenticated() || user?.role !== "rh") {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/**
 * 🛡️ Guard : Protège les routes Candidat
 */
function CandidateRoute({ children }: { children: React.ReactNode }) {
  const user = authService.getCurrentUser();
  
  if (!authService.isAuthenticated() || user?.role !== 'candidat') {
    return (
      <Navigate 
        to="/login" 
        replace 
        state={{ from: window.location.pathname }} // ✅ ex: /jobs/5/apply
      />
    );
  }
  
  return <>{children}</>;
}

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={frFR}
      theme={{
        token: {
          colorPrimary: "#00a89c",
          borderRadius: 8,
        },
      }}
    >
      <Router>
        <Routes>
          
          {/* 🌍 ROUTES PUBLIQUES */}
          <Route path="/" element={<><Navbar /><Home /></>} />
          <Route path="/jobs" element={<><Navbar /><JobsPage /></>} />
          
          {/* ✅ ROUTE SPÉCIFIQUE /apply AVANT la route générique /:id */}
          <Route
            path="/jobs/:id/apply"
            element={
              <CandidateRoute>
                <ApplyJobPage />
              </CandidateRoute>
            }
          />
          
          {/* ✅ Route générique /:id APRÈS (moins spécifique) */}
          <Route
            path="/jobs/:id"
            element={
              <>
                <Navbar />
                <JobDetailPage />
              </>
            }
          />
          
          {/* ✅ Callback OAuth - PUBLIQUE */}
          <Route path="/social/callback" element={<SocialCallback />} />
          
          {/* 🔐 AUTH & INSCRIPTION */}
          <Route path="/login/:role?" element={<Login />} />
          <Route path="/register" element={<RegisterCandidat />} />
          <Route path="/register/rh" element={<RegisterRh />} />
          <Route path="/register/manager" element={<RegisterManager />} />

<Route
  path="/candidat/dashboard"
  element={
    <CandidateRoute>
      <CandidatDashboard />
    </CandidateRoute>
  }
/>

<Route
  path="/candidat/applications"
  element={
    <CandidateRoute>
      <CandidatDashboard />  {/* Ou créer une page dédiée ApplicationsList */}
    </CandidateRoute>
  }
/>

          {/* 👤 ROUTES CANDIDAT (Protégées) */}
          <Route
            path="/candidat/applications"
            element={
              <CandidateRoute>
                <ApplyJobPage />
              </CandidateRoute>
            }
          />

          {/* 👔 ROUTES RH (Protégées) */}
          <Route path="/dashboard/rh" element={<RhRoute><RhDashboard /></RhRoute>} />
          <Route path="/rh/jobs" element={<RhRoute><RhJobsPage /></RhRoute>} />
          <Route
            path="/rh/candidates"  // ✅ Path exact qui correspond au Sidebar
            element={
              <RhRoute>  // ✅ Guard pour vérifier rôle RH
                <CandidatesPage />
              </RhRoute>
            }
          />          
          <Route path="/about" element={<About />} />

          {/* 🔄 Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
          
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;