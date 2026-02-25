import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import RegisterCandidat from "./pages/RegisterCandidat";
import RegisterRh from "./pages/RegisterRh";
import RegisterManager from "./pages/RegisterManager";
import RhDashboard from "./pages/RhDashboard";
const App: React.FC = () => {
  return (
    <Router>
      <div
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Header />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard/rh" element={<RhDashboard />} />
            {/* AUTHENTIFICATION */}
            <Route path="/login" element={<Login />} />
            <Route path="/login/rh" element={<Login />} />
            <Route path="/login/manager" element={<Login />} />

            {/* INSCRIPTIONS SÉPARÉES */}
            <Route path="/register" element={<RegisterCandidat />} />
            <Route path="/register/rh" element={<RegisterRh />} />
            <Route path="/register/manager" element={<RegisterManager />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
