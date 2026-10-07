import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CareerProvider } from "./context/CareerContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import VesperLandingPage from "./pages/VesperLandingPage";
import SimulatorPage from "./pages/SimulatorPage";
import ExplorerPage from "./pages/ExplorerPage";
import SkillGapPage from "./pages/SkillGapPage";
import ComparePage from "./pages/ComparePage";
import RoadmapPage from "./pages/RoadmapPage";
import ProgressPage from "./pages/ProgressPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CareerProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Public Routes */}
              <Route index element={<VesperLandingPage />} />
              <Route path="auth" element={<AuthPage />} />

              {/* Protected Application Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="simulator" element={<SimulatorPage />} />
                <Route path="explorer" element={<ExplorerPage />} />
                <Route path="skill-gap" element={<SkillGapPage />} />
                <Route path="compare" element={<ComparePage />} />
                <Route path="roadmap" element={<RoadmapPage />} />
                <Route path="progress" element={<ProgressPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </CareerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;