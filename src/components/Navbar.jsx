import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ isLanding = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const burgerRef = useRef(null);
  const navRef = useRef(null);
  const location = useLocation();

  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setMenuOpen(false);
  }

  // Handle body class for menu open
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
  }, [menuOpen]);

  // Handle Escape key & focus trapping
  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        burgerRef.current?.focus();
        return;
      }

      if (e.key === "Tab" && navRef.current) {
        const focusable = [
          burgerRef.current,
          ...Array.from(navRef.current.querySelectorAll("a, button")),
        ].filter(Boolean);

        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  // Close menu when viewport resizes past 1060px
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1061px)");
    const handler = (e) => {
      if (e.matches) {
        setMenuOpen(false);
      }
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isAuth = location.pathname === "/auth";

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("[Auth] Logout error:", err);
    } finally {
      navigate("/auth");
    }
  };

  // Simplified navigation for landing page, full navigation for workspace
  const desktopLinks = isLanding
    ? [
        { to: "/simulator", label: "Simulator" },
        { to: "/dashboard", label: "Dashboard" },
        { to: "/roadmap", label: "Roadmap" },
      ]
    : isAuth
    ? []
    : [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/mobility", label: "Mobility" },
        { to: "/market", label: "Market" },
        { to: "/simulator", label: "Simulator" },
        { to: "/explorer", label: "Explorer" },
        { to: "/skill-gap", label: "Skill Gap" },
        { to: "/compare", label: "Compare" },
        { to: "/roadmap", label: "Roadmap" },
        { to: "/progress", label: "Progress" },
      ];

  const allWorkspaceLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/mobility", label: "Mobility" },
    { to: "/market", label: "Market" },
    { to: "/simulator", label: "Simulator" },
    { to: "/explorer", label: "Explorer" },
    { to: "/skill-gap", label: "Skill Gap" },
    { to: "/compare", label: "Compare" },
    { to: "/roadmap", label: "Roadmap" },
    { to: "/progress", label: "Progress" },
    { to: "/profile", label: "My Profile" },
  ];

  return (
    <>
      <div
        className="menu-backdrop"
        onClick={() => {
          setMenuOpen(false);
          burgerRef.current?.focus();
        }}
        aria-hidden="true"
      />

      <header className={`navbar vesper-header ${isLanding ? "vesper-header-landing" : "vesper-header-workspace"}`}>
        {/* Left: Career Trajectory Simulator Logo */}
        <Link to="/" className="logo vesper-logo" aria-label="Career Trajectory Simulator Homepage">
          <svg className="logo-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="5" cy="19" r="2.5" fill="currentColor" />
            <circle cx="19" cy="5" r="2.5" fill="currentColor" />
            <path d="M7 17L17 7" />
            <path d="M12 7h5v5" />
          </svg>
          <span>
            Career Trajectory<span className="logo-suffix"> Simulator</span>
          </span>
        </Link>

        {/* Center: Liquid-Metal Navigation Pills */}
        <nav id="site-nav" ref={navRef} aria-label="Primary Navigation">
          {/* Desktop links */}
          <div className="desktop-nav-group">
            {desktopLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? "nav-pill active" : "nav-pill"
                }
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Mobile drawer links (all routes available) */}
          <div className="mobile-nav-group">
            {isAuth ? (
              <NavLink
                to="/"
                className="nav-pill"
                onClick={() => setMenuOpen(false)}
              >
                Home
              </NavLink>
            ) : (
              allWorkspaceLinks.map((link) => (
                <NavLink
                  key={`mobile-${link.to}`}
                  to={link.to}
                  className={({ isActive }) =>
                    isActive ? "nav-pill active" : "nav-pill"
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))
            )}
            {user && (
              <button
                type="button"
                id="mobile-nav-logout-btn"
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="nav-pill"
                style={{
                  textAlign: "left",
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#f87171",
                  marginTop: "8px",
                }}
              >
                Log Out
              </button>
            )}
          </div>
        </nav>

        {/* Right: CTA & Mobile Hamburger */}
        <div className="navbar-right">
          {isLanding ? (
            user ? (
              <>
                <Link to="/dashboard" className="btn btn-solid profile-cta">
                  Workspace
                </Link>
                <button
                  type="button"
                  id="nav-logout-btn"
                  onClick={handleLogout}
                  className="btn btn-hero-ghost profile-cta"
                  style={{ padding: "0 12px" }}
                  aria-label="Log out"
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link to="/simulator" className="btn btn-hero-ghost profile-cta">
                Launch App →
              </Link>
            )
          ) : isAuth ? (
            <Link to="/" className="btn btn-hero-ghost profile-cta">
              Home
            </Link>
          ) : (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  isActive
                    ? "btn btn-solid profile-cta active"
                    : "btn btn-solid profile-cta"
                }
              >
                My Profile
              </NavLink>
              {user && (
                <button
                  type="button"
                  id="nav-logout-btn"
                  onClick={handleLogout}
                  className="btn btn-hero-ghost profile-cta"
                  style={{ padding: "0 12px" }}
                  aria-label="Log out"
                >
                  Log Out
                </button>
              )}
            </>
          )}

          <button
            ref={burgerRef}
            className="burger"
            id="burger-btn"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-controls="site-nav"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            type="button"
          >
            <span className="burger-bar" />
            <span className="burger-bar" />
            <span className="burger-bar" />
          </button>
        </div>
      </header>
    </>
  );
}
