import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="auth-loading-state"
        style={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          color: "rgba(255, 255, 255, 0.7)",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid rgba(255, 255, 255, 0.15)",
            borderTopColor: "#ffffff",
            borderRadius: "50%",
            animation: "auth-spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes auth-spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ margin: 0, fontSize: "14px", letterSpacing: "0.02em" }}>
          Verifying authentication session...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}
