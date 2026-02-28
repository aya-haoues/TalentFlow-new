// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import 'antd/dist/reset.css'; // ou 'antd/dist/antd.css' selon votre version
import { ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';

// 📄 Pages Publiques
import Home from "./pages/Home";
import Login from "./pages/Login";
import RegisterCandidat from "./pages/RegisterCandidat";
import RegisterRh from "./pages/RegisterRh";
import RegisterManager from "./pages/RegisterManager";
import CandidatesPage from './pages/CandidatesPage';

// 📄 Pages RH (Protégées)
import RhDashboard from "./pages/RhDashboard";
import JobsPage from './pages/JobsPage';

// 🔐 Service d'authentification (directement depuis services/)
import { authService } from "./services/api";
import type { User } from "./types";

// 🛡️ Composant pour protéger les routes RH
function RhRoute({ children }: { children: React.ReactNode }) {
  // ✅ Vérification directe avec authService
  const user: User | null = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();
  
  // Si non connecté → redirect login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  // Si connecté mais pas RH → redirect home
  if (user.role !== 'rh') {
    return <Navigate to="/" replace />;
  }
  
  // ✅ Accès autorisé
  return <>{children}</>;
}

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={frFR}
      theme={{
        token: {
          colorPrimary: '#00a89c', // Orangé
        },
      }}
    >

    <Router>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        
        <main style={{ flex: 1 }}>
          <Routes>
            {/* 🌍 ROUTES PUBLIQUES */}
            <Route path="/" element={<Home />} />
            
            {/* 🔐 AUTHENTIFICATION */}
            <Route path="/login" element={<Login />} />
            <Route path="/login/rh" element={<Login />} />
            <Route path="/login/manager" element={<Login />} />
            
            {/* 📝 INSCRIPTIONS */}
            <Route path="/register" element={<RegisterCandidat />} />
            <Route path="/register/rh" element={<RegisterRh />} />
            <Route path="/register/manager" element={<RegisterManager />} />
            
            {/* 👔 ROUTES RH (Protégées) */}
            <Route 
              path="/dashboard/rh" 
              element={
                <RhRoute>
                  <RhDashboard />
                </RhRoute>
              } 
            />
            
            {/* 🎯 GESTION DES OFFRES */}
            <Route 
              path="/jobs" 
              element={
                <RhRoute>
                  <JobsPage />
                </RhRoute>
              } 
            />
            
            {/* ✅ Pages RH avec layout partagé */}
        <Route path="/dashboard/rh" element={<RhDashboard />} />
        <Route path="/jobs" element={<JobsPage />} />

<Route path="/candidates" element={<CandidatesPage />} />

            {/* 🔄 REDIRECTIONS */}
        <Route path="/" element={<Navigate to="/dashboard/rh" replace />} />
        <Route path="*" element={<Navigate to="/dashboard/rh" replace />} />
          </Routes>
        </main>
      </div>
    </Router>

        </ConfigProvider>

  );
};



export default App;