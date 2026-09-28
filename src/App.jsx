import { Routes, Route } from "react-router-dom";
import ClientListPage from "./pages/ClientListPage";
import ClientDetailPage from "./pages/ClientDetailPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Layout><ClientListPage /></Layout></ProtectedRoute>} />
      <Route path="/clients/:id" element={<ProtectedRoute><Layout><ClientDetailPage /></Layout></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}