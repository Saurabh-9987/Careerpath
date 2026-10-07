import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { mapAuthError } from "../lib/authErrors";

export default function AuthPage() {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const { user, loading, isConfigured, authConfig, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError("");
    setMessage("");
    setStatusNotice("");

    // 1. Pre-flight check: Environment configuration
    if (!isConfigured) {
      setError(
        authConfig?.message ||
        "Authentication is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the frontend .env file and restart the Vite development server."
      );
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please enter both email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password is too weak. Please use at least 6 characters.");
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "signin") {
        setStatusNotice("Signing in...");
        await signIn(trimmedEmail, password);
        setStatusNotice("Signed in successfully. Redirecting...");
        setPassword(""); // Clear password from memory immediately
        navigate(from, { replace: true });
      } else {
        setStatusNotice("Creating account...");
        const data = await signUp(trimmedEmail, password);
        setPassword(""); // Clear password from memory immediately
        if (data?.session) {
          setStatusNotice("Signed in successfully. Redirecting...");
          navigate(from, { replace: true });
        } else {
          setStatusNotice("");
          setMessage(
            "Account created. Please verify your email if email confirmation is enabled, then sign in."
          );
          setMode("signin");
        }
      }
    } catch (err) {
      console.warn("[Auth] Submission error:", err?.message || err);
      setPassword(""); // Clear password on error
      setStatusNotice("");
      const friendlyError = mapAuthError(err, authConfig);
      setError(friendlyError);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = (newMode) => {
    setMode(newMode);
    setError("");
    setMessage("");
    setStatusNotice("");
  };

  return (
    <div
      className="auth-page-container"
      style={{
        minHeight: "calc(100vh - 120px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        className="auth-card"
        style={{
          width: "100%",
          maxWidth: "430px",
          backgroundColor: "rgba(18, 18, 20, 0.88)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "16px",
          padding: "36px 32px",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow:
            "0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "26px" }}>
          <h2
            style={{
              margin: "0 0 8px 0",
              fontSize: "24px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#ffffff",
            }}
          >
            {mode === "signin" ? "Sign In" : "Create Account"}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "rgba(255, 255, 255, 0.65)",
              lineHeight: 1.5,
            }}
          >
            {mode === "signin"
              ? "Access your career trajectory simulations and roadmaps."
              : "Start predicting and bridging your career skill gaps."}
          </p>
        </div>

        {/* Clear setup message if Supabase credentials are missing or invalid */}
        {!isConfigured && (
          <div
            id="auth-setup-banner"
            style={{
              marginBottom: "20px",
              padding: "14px 16px",
              borderRadius: "10px",
              backgroundColor: "rgba(234, 179, 8, 0.12)",
              border: "1px solid rgba(234, 179, 8, 0.35)",
              color: "#fde047",
              fontSize: "13px",
              lineHeight: 1.45,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "4px" }}>
              Authentication is not configured yet.
            </div>
            <div style={{ opacity: 0.95 }}>
              Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to the
              frontend <code>.env</code> file and restart the Vite development server.
            </div>
            <div
              style={{
                fontSize: "11px",
                opacity: 0.75,
                marginTop: "6px",
                borderTop: "1px solid rgba(234, 179, 8, 0.2)",
                paddingTop: "6px",
              }}
            >
              After changing <code>.env</code>, restart the Vite development server.
            </div>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            padding: "4px",
            borderRadius: "10px",
            marginBottom: "24px",
          }}
        >
          <button
            type="button"
            id="tab-signin-btn"
            onClick={() => toggleMode("signin")}
            disabled={submitting}
            style={{
              padding: "8px 12px",
              borderRadius: "7px",
              border: "none",
              fontSize: "13px",
              fontWeight: mode === "signin" ? 600 : 400,
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              backgroundColor:
                mode === "signin" ? "rgba(255, 255, 255, 0.15)" : "transparent",
              color: mode === "signin" ? "#ffffff" : "rgba(255, 255, 255, 0.6)",
              boxShadow:
                mode === "signin"
                  ? "0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                  : "none",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            id="tab-signup-btn"
            onClick={() => toggleMode("signup")}
            disabled={submitting}
            style={{
              padding: "8px 12px",
              borderRadius: "7px",
              border: "none",
              fontSize: "13px",
              fontWeight: mode === "signup" ? 600 : 400,
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              backgroundColor:
                mode === "signup" ? "rgba(255, 255, 255, 0.15)" : "transparent",
              color: mode === "signup" ? "#ffffff" : "rgba(255, 255, 255, 0.6)",
              boxShadow:
                mode === "signup"
                  ? "0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                  : "none",
            }}
          >
            Create Account
          </button>
        </div>

        {/* Dynamic Status / Progress Notice */}
        {statusNotice && (
          <div
            id="auth-status-notice"
            style={{
              marginBottom: "16px",
              padding: "10px 14px",
              borderRadius: "8px",
              backgroundColor: "rgba(59, 130, 246, 0.12)",
              border: "1px solid rgba(59, 130, 246, 0.35)",
              color: "#93c5fd",
              fontSize: "13px",
              textAlign: "center",
            }}
          >
            {statusNotice}
          </div>
        )}

        {/* Status Messages: Error */}
        {error && (
          <div
            id="auth-error-message"
            style={{
              marginBottom: "18px",
              padding: "12px 14px",
              borderRadius: "8px",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#fca5a5",
              fontSize: "13px",
              lineHeight: 1.45,
            }}
          >
            {error}
          </div>
        )}

        {/* Status Messages: Success */}
        {message && (
          <div
            id="auth-success-message"
            style={{
              marginBottom: "18px",
              padding: "12px 14px",
              borderRadius: "8px",
              backgroundColor: "rgba(34, 197, 94, 0.12)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
              color: "#86efac",
              fontSize: "13px",
              lineHeight: 1.45,
            }}
          >
            {message}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "18px" }}
        >
          <div className="profile-field-group">
            <label
              htmlFor="auth-email"
              className="profile-field-label"
              style={{ color: "rgba(255, 255, 255, 0.8)" }}
            >
              Email Address
            </label>
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="profile-field-group">
            <label
              htmlFor="auth-password"
              className="profile-field-label"
              style={{ color: "rgba(255, 255, 255, 0.8)" }}
            >
              Password
            </label>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            id="auth-submit-btn"
            disabled={submitting || !isConfigured}
            className="btn btn-solid"
            style={{
              width: "100%",
              height: "44px",
              marginTop: "6px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: submitting || !isConfigured ? "not-allowed" : "pointer",
              opacity: submitting || !isConfigured ? 0.6 : 1,
            }}
          >
            {submitting
              ? statusNotice || (mode === "signin" ? "Signing in..." : "Creating account...")
              : !isConfigured
                ? "Authentication Unavailable"
                : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
          </button>
        </form>

        {/* Footer switch prompt */}
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <button
            type="button"
            id="auth-switch-mode-btn"
            onClick={() => toggleMode(mode === "signin" ? "signup" : "signin")}
            disabled={submitting}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255, 255, 255, 0.65)",
              fontSize: "13px",
              cursor: submitting ? "not-allowed" : "pointer",
              textDecoration: "underline",
              padding: "4px",
            }}
          >
            {mode === "signin"
              ? "Don't have an account? Create Account"
              : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
