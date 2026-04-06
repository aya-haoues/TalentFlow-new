import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ConfigProvider } from "antd";
import frFR from "antd/locale/fr_FR";

// ── Layouts ──────────────────────────────────────────────
import Navbar from "./components/layout/Navbar";
import ManagerLayout from "./components/layout/ManagerLayout";

// ── Pages publiques ──────────────────────────────────────
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SocialCallback from "./pages/SocialCallback";
import JobsPage from "./pages/JobsPage";
import JobDetailPage from "./pages/JobDetailPage";
import ApplyJobPage from "./pages/ApplyJobPage";

// ── Pages candidat ───────────────────────────────────────
import CandidatDashboard from "./pages/candidat/CandidatDashboard";
import MyApplications from "./pages/candidat/MyApplications";

// ── Pages RH ─────────────────────────────────────────────
import RhDashboard from "./pages/rh/RhDashboard";
import RhJobsPage from "./pages/rh/RhJobsPage";
import CandidatesPage from "./pages/rh/CandidatesPage";

// ── Pages Manager ────────────────────────────────────────
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerApplications from "./pages/manager/ManagerApplications";
import ManagerTeam from "./pages/manager/MonEquipe";
// import ManagerInterviews from "./pages/manager/ManagerInterviews"; // À décommenter si le fichier existe

// ── Pages Admin ──────────────────────────────────────────
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersManagement from "./pages/admin/UsersManagement";
import DepartmentsManagement from "./pages/admin/DepartmentsManagement";

// ── Auth & Guards ────────────────────────────────────────
import { authService } from "./services/api";

/* ── Guards de Sécurité ─────────────────────────────────── */
function RhRoute({ children }: { children: React.ReactNode }) {
  const user = authService.getCurrentUser();
  if (!authService.isAuthenticated() || user?.role !== "rh") {
    return <Navigate to="/login/rh" replace />;
  }
  return <>{children}</>;
}

function ManagerRoute({ children }: { children: React.ReactNode }) {
  const user = authService.getCurrentUser();
  if (!authService.isAuthenticated() || user?.role !== "manager") {
    return <Navigate to="/login/manager" replace />;
  }
  return <>{children}</>;
}

function CandidateRoute({ children }: { children: React.ReactNode }) {
  const user = authService.getCurrentUser();
  if (!authService.isAuthenticated() || user?.role !== "candidat") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: window.location.pathname }}
      />
    );
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
      token: { colorPrimary: "#00a89c", borderRadius: 8 },
    }}
  >
    <Router>
      <Routes>
        {/* ── Routes Publiques ───────────────────────────── */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Home />
            </>
          }
        />
        <Route
          path="/about"
          element={
            <>
              <Navbar />
              <About />
            </>
          }
        />
        <Route
          path="/jobs"
          element={
            <>
              <Navbar />
              <JobsPage />
            </>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <>
              <Navbar />
              <JobDetailPage />
            </>
          }
        />

        <Route
          path="/jobs/:id/apply"
          element={
            <CandidateRoute>
              <ApplyJobPage />
            </CandidateRoute>
          }
        />

        {/* ── Authentification ───────────────────────────── */}
        <Route path="/login/:role?" element={<Login />} />
        <Route path="/register/:role?" element={<Register />} />
        <Route path="/social/callback" element={<SocialCallback />} />

        {/* ── Espace Candidat ────────────────────────────── */}
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
              <MyApplications />
            </CandidateRoute>
          }
        />

        {/* ── Espace RH ──────────────────────────────────── */}
        <Route
          path="/rh/dashboard"
          element={
            <RhRoute>
              <RhDashboard />
            </RhRoute>
          }
        />
        <Route
          path="/rh/jobs"
          element={
            <RhRoute>
              <RhJobsPage />
            </RhRoute>
          }
        />
        <Route
          path="/rh/candidates"
          element={
            <RhRoute>
              <CandidatesPage />
            </RhRoute>
          }
        />

        {/* ── Espace Manager (Protégé) ───────────────────── */}
        <Route
          path="/manager"
          element={
            <ManagerRoute>
              <ManagerLayout />
            </ManagerRoute>
          }
        >
          {/* Redirige /manager vers /manager/dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="candidatures" element={<ManagerApplications />} />
          <Route path="equipe" element={<ManagerTeam />} />
          <Route
            path="entretiens"
            element={<div>Page Entretiens en construction</div>}
          />
        </Route>

        {/* ── Espace Admin ───────────────────────────────── */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UsersManagement />} />
        <Route path="/admin/departments" element={<DepartmentsManagement />} />

        {/* ── Fallback ───────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  </ConfigProvider>
);

export default App;
