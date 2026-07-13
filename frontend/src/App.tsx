import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import Home from "./pages/Home";

const TOKEN_KEY = "feedback_admin_token";

export default function App() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));

  function handleLogin(newToken: string) {
    sessionStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/admin"
        element={token ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin onLogin={handleLogin} />}
      />
      <Route
        path="/admin/dashboard"
        element={
          token ? <AdminDashboard token={token} onLogout={handleLogout} /> : <Navigate to="/admin" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
