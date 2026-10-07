import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import GlowSeparator from "../components/GlowSeparator";

export default function VesperLandingPage() {
  const glowRef = useRef(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    const canGlow = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)"
    );
    if (!canGlow.matches) return;

    let rafId = null;
    let targetX = -1000;
    let targetY = -1000;
    let hasMoved = false;

    const updateGlow = () => {
      if (glow) {
        glow.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
        if (!hasMoved) {
          hasMoved = true;
          glow.classList.add("is-active");
        }
      }
      rafId = null;
    };

    const handlePointerMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!rafId) {
        rafId = requestAnimationFrame(updateGlow);
      }
    };

    const handleMouseLeave = () => {
      if (glow) {
        glow.classList.remove("is-active");
      }
      hasMoved = false;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Entrance animations settlement
  useEffect(() => {
    const appears = document.querySelectorAll(".vesper-page .appear");
    appears.forEach((el) => {
      el.addEventListener(
        "animationend",
        (e) => {
          if (e.target === el) {
            el.classList.add("is-in");
          }
        },
        { once: true }
      );
    });

    const timer = setTimeout(() => {
      appears.forEach((el) => el.classList.add("is-in"));
    }, 1600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="vesper-page">
      {/* Grain overlay */}
      <div className="vesper-grain" aria-hidden="true" />

      {/* Hero photo background with radial scrim */}
      <div className="vesper-hero-photo" aria-hidden="true" />

      {/* Hero 13 Soft Ambient Radial Glow & Grid Pattern */}
      <div className="hero13-ambient-glow" aria-hidden="true" />
      <div className="hero13-ambient-grid" aria-hidden="true" />

      {/* Subtle ambient cursor glow */}
      <div className="vesper-cursor-glow" ref={glowRef} aria-hidden="true" />

      {/* Hero Section */}
      <section className="vesper-hero" id="top">
        {/* Hero 13 Tasteful Floating Competency Badges */}
        <div className="hero13-floating-layer" aria-hidden="true">
          {/* Badge 1: Top Left - Python / Logic */}
          <div className="hero13-floating-badge badge-top-left">
            <span className="badge-icon-wrap code-glow">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </span>
            <span className="badge-text">Python & Logic</span>
          </div>

          {/* Badge 2: Top Right - Predictive AI */}
          <div className="hero13-floating-badge badge-top-right">
            <span className="badge-icon-wrap ai-glow">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" />
              </svg>
            </span>
            <span className="badge-text">Predictive AI</span>
          </div>

          {/* Badge 3: Bottom Left - Distributed ETL */}
          <div className="hero13-floating-badge badge-bottom-left">
            <span className="badge-icon-wrap data-glow">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </span>
            <span className="badge-text">Distributed ETL</span>
          </div>

          {/* Badge 4: Bottom Right - Career Velocity */}
          <div className="hero13-floating-badge badge-bottom-right">
            <span className="badge-icon-wrap path-glow">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </span>
            <span className="badge-text">Career Velocity</span>
          </div>
        </div>

        <div className="vesper-hero-copy">
          {/* Badge */}
          <div className="vesper-badge appear appear--pop" style={{ "--d": "0.22s" }}>
            <svg className="badge-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2.6C12.55 2.6 12.88 3.15 13.08 4.7c.62 4.7 1.52 5.6 6.22 6.22 1.55.2 2.1.53 2.1 1.08s-.55.88-2.1 1.08c-4.7.62-5.6 1.52-6.22 6.22-.2 1.55-.53 2.1-1.08 2.1s-.88-.55-1.08-2.1c-.62-4.7-1.52-5.6-6.22-6.22C3.15 12.88 2.6 12.55 2.6 12s.55-.88 2.1-1.08c4.7-.62 5.6-1.52 6.22-6.22C11.12 3.15 11.45 2.6 12 2.6Z" />
            </svg>
            <span>Career Trajectory Simulator</span>
          </div>

          {/* Masked Headline */}
          <h1 className="vesper-headline">
            <span className="headline-line">
              <span className="headline-inner appear appear--mask" style={{ "--d": "0.42s" }}>
                Simulate <em>career paths</em> and
              </span>
            </span>
            <span className="headline-line">
              <span className="headline-inner appear appear--mask" style={{ "--d": "0.62s" }}>
                bridge skill gaps faster.
              </span>
            </span>
          </h1>

          {/* Lede Paragraph */}
          <p className="vesper-lede appear appear--soft" style={{ "--d": "0.82s" }}>
            Explore interactive 3D career trajectories, analyze skill gap readiness, and simulate targeted transitions in real time.
          </p>

          {/* Hero Actions launching Simulator & Workspace */}
          <div className="vesper-hero-actions">
            <Link
              to="/simulator"
              className="btn btn-solid hero-btn appear appear--btn"
              style={{ "--d": "0.96s" }}
            >
              Launch Simulator →
            </Link>
            <Link
              to="/dashboard"
              className="btn btn-hero-ghost hero-btn appear appear--side"
              style={{ "--d": "1.10s" }}
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Hero 13 Luminous Glow Separator */}
      <div className="hero13-separator-wrap appear appear--soft" style={{ "--d": "1.05s" }}>
        <GlowSeparator />
      </div>

      {/* Stats Footer */}
      <footer className="vesper-stats">
        {/* Stat 1 */}
        <div className="stat appear appear--stat" style={{ "--d": "1.12s" }}>
          <svg className="stat-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="v-pill-left" x1="3" y1="2" x2="14" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="38%" stopColor="#ffffff" />
                <stop offset="62%" stopColor="#3a3a3a" />
              </linearGradient>
              <linearGradient id="v-pill-right" x1="13" y1="2" x2="24" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="38%" stopColor="#3a3a3a" />
                <stop offset="62%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
            <rect x="3.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#v-pill-left)" />
            <rect x="13.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#v-pill-right)" />
            <rect x="9.2" y="10.9" width="5.6" height="2.2" rx="1.1" fill="#4a4a4a" />
          </svg>
          <span>15,000+ career trajectories simulated</span>
        </div>

        {/* Stat 2 */}
        <div className="stat appear appear--stat" style={{ "--d": "1.28s" }}>
          <svg className="stat-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2.4" y="2.4" width="19.2" height="19.2" rx="6.2" fill="#ffffff" />
            <path d="M12 7.1v7.4" stroke="#111111" strokeWidth="1.85" strokeLinecap="round" />
            <path d="M8.15 12.35L12 16.2l3.85-3.85" stroke="#111111" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>88% faster skill gap identification</span>
        </div>

        {/* Stat 3 */}
        <div className="stat appear appear--stat" style={{ "--d": "1.44s" }}>
          <svg className="stat-icon-wide" viewBox="0 0 40 22" fill="none" aria-hidden="true">
            <circle cx="10.2" cy="11" r="9.2" fill="#2b2b2b" />
            <path d="M7.8 7.2L6.6 4.8L9.2 6.1Z" fill="#2b2b2b" />
            <path d="M12.6 7.2L13.8 4.8L11.2 6.1Z" fill="#2b2b2b" />
            <ellipse cx="10.2" cy="12.1" rx="4.15" ry="3.7" fill="#f4f4f4" />
            <circle cx="8.8" cy="11.5" r="0.7" fill="#1a1a1a" />
            <circle cx="11.6" cy="11.5" r="0.7" fill="#1a1a1a" />

            <circle cx="20.2" cy="11" r="9.2" fill="#ffffff" />
            <circle cx="18.2" cy="10.2" r="1.7" fill="#111111" />
            <circle cx="22.2" cy="10.2" r="1.7" fill="#111111" />
            <ellipse cx="20.2" cy="12.2" rx="1" ry="0.7" fill="#111111" />
            <path d="M18.6 13.8c.8.9 2.4.9 3.2 0" stroke="#111111" strokeWidth="1.2" strokeLinecap="round" fill="none" />

            <circle cx="30.2" cy="11" r="9.2" fill="#3B82F6" />
            <text x="30.2" y="15.1" fontSize="12.5" fontFamily="'Inter', sans-serif" fontWeight="700" textAnchor="middle" fill="#ffffff">↗</text>
          </svg>
          <span>40+ target tech roles analyzed</span>
        </div>
      </footer>
    </div>
  );
}
