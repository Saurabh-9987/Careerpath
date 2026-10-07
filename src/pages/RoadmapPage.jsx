import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import GlowSeparator from "../components/GlowSeparator";
import { useCareer } from "../context/CareerContextCore";
import { careerData, skillDescriptions } from "../data/careerData";
import { generateRouteRoadmap } from "../data/careerRoadmapEngine";
import { getScore } from "../utils/careerScoring";
import { calculateCareerProgress } from "../utils/roadmapProgress";

const skillExplanations = {
  ...skillDescriptions,
  "Machine Learning": "Study supervised learning, unsupervised learning, model evaluation, and feature engineering.",
  "Spark": "Learn distributed data processing, Spark DataFrames, and practical data transformation.",
  "Cloud": "Learn cloud storage, compute, databases, and managed data services.",
  "Deep Learning": "Study neural networks, CNNs, and practical deep learning workflows.",
  "Docker": "Learn how to containerize and run machine learning applications with reproducible environments.",
  "Python": "Practice core data structures, analytical pipelines, and system scripting.",
  "SQL": "Master relational database querying, window functions, and schema transformations.",
  "Statistics": "Study probability distributions, hypothesis testing, and exploratory data analysis.",
};

export default function RoadmapPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    role,
    profile,
    setProfile,
    selectedCareer,
    setSelectedCareer,
    mlProject,
    roadmapProgress,
    handleUpdateRoadmapProgress,
  } = useCareer();

  // Route & simulation parameters
  const [savingMilestone, setSavingMilestone] = useState(null);
  const [statusFeedback, setStatusFeedback] = useState(null);
  const [optimizationMode, setOptimizationMode] = useState("Fastest");

  // Read What-If simulated scenario passed from What-If Simulator or Navigation
  const [whatIfScenario, setWhatIfScenario] = useState(() => {
    return location.state?.whatIfScenario || null;
  });

  const allCareers = useMemo(() => Object.keys(careerData), []);

  // Determine active target career (priority: location state -> context selectedCareer -> What-If override -> default)
  const activeCareer = useMemo(() => {
    if (whatIfScenario?.overrideTargetRole && careerData[whatIfScenario.overrideTargetRole]) {
      return whatIfScenario.overrideTargetRole;
    }
    if (location.state?.selectedCareer && careerData[location.state.selectedCareer]) {
      return location.state.selectedCareer;
    }
    if (location.state?.targetRole && careerData[location.state.targetRole]) {
      return location.state.targetRole;
    }
    return selectedCareer || "Data Scientist";
  }, [location.state, selectedCareer, whatIfScenario]);

  const careerInfo = careerData[activeCareer] || careerData["Data Scientist"];
  const currentRole = role || profile?.role || "Data Analyst";

  // Generate complete route-aware roadmap using Stage 10 Career Roadmap Engine
  const routeRoadmap = useMemo(() => {
    return generateRouteRoadmap(currentRole, activeCareer, profile, {
      optimizationMode,
      mlProject,
      whatIfScenario,
    });
  }, [currentRole, activeCareer, profile, optimizationMode, mlProject, whatIfScenario]);

  // Compute profile readiness score using effective profile
  const effectiveProfile = useMemo(() => {
    if (!whatIfScenario) return profile;
    const baseSkills = getProfileSkills(profile);
    const addedSkills = whatIfScenario.additionalSkills || [];
    return {
      ...profile,
      skills: Array.from(new Set([...baseSkills, ...addedSkills])),
      experience: whatIfScenario.additionalExpYears
        ? `${(parseFloat(String(profile?.experience || "").replace(/[^0-9.]/g, "")) || 0) + whatIfScenario.additionalExpYears} years`
        : profile?.experience,
    };
  }, [profile, whatIfScenario]);

  const score = getScore(activeCareer, effectiveProfile, mlProject);

  // Genuine completion progress calculation across saved milestones
  const careerProgress = useMemo(() => {
    return calculateCareerProgress(activeCareer, effectiveProfile, mlProject, roadmapProgress);
  }, [activeCareer, effectiveProfile, mlProject, roadmapProgress]);

  // Milestone status change handler
  const handleStatusChange = async (milestoneTitle, newStatus, milestoneType) => {
    setSavingMilestone(milestoneTitle);
    setStatusFeedback(null);

    const res = await handleUpdateRoadmapProgress({
      career: activeCareer,
      milestoneTitle,
      status: newStatus,
      milestoneType,
    });

    setSavingMilestone(null);
    if (res?.offline) {
      setStatusFeedback({
        type: "info",
        message: `Milestone status updated in offline storage: "${milestoneTitle}" → ${newStatus.replace("_", " ")}`,
      });
    } else if (res?.success) {
      setStatusFeedback({
        type: "success",
        message: `Saved: "${milestoneTitle}" is now ${newStatus.replace("_", " ")}.`,
      });
    } else {
      setStatusFeedback({
        type: "error",
        message: `Failed to save milestone progress for "${milestoneTitle}".`,
      });
    }

    setTimeout(() => {
      setStatusFeedback(null);
    }, 4000);
  };

  // Revert What-If simulated state to stored profile
  const handleRevertWhatIf = () => {
    setWhatIfScenario(null);
    setStatusFeedback({
      type: "info",
      message: "Reverted to baseline profile. Simulated qualifications cleared.",
    });
    setTimeout(() => setStatusFeedback(null), 3500);
  };

  // Optional: Apply What-If modifications permanently to stored profile
  const handleApplyWhatIfToProfile = () => {
    if (!whatIfScenario || !setProfile) return;
    setProfile(effectiveProfile);
    try {
      localStorage.setItem("careerProfile", JSON.stringify(effectiveProfile));
    } catch {
      // Ignore storage errors
    }
    setWhatIfScenario(null);
    setStatusFeedback({
      type: "success",
      message: "Simulated skills permanently saved to your active profile.",
    });
    setTimeout(() => setStatusFeedback(null), 4000);
  };

  return (
    <div className="roadmap-page-container">
      {/* 1. Header & Target Selector */}
      <section className="roadmap-page-header">
        <div>
          <p className="eyebrow">STAGE 10 — ACTIONABLE BLUEPRINT</p>
          <h1>
            Your Career <span>Roadmap</span>
          </h1>
          <p className="explorer-header-desc">
            Algorithmic transition pathway turning recommended routes into an actionable 4-phase learning trajectory
            for <strong>{activeCareer}</strong>.
          </p>
        </div>

        <div className="skillgap-selector-box">
          <label htmlFor="roadmap-career-select" className="skillgap-selector-label">
            Target Career
          </label>
          <select
            id="roadmap-career-select"
            className="skillgap-selector"
            value={activeCareer}
            onChange={(e) => {
              if (setSelectedCareer) setSelectedCareer(e.target.value);
            }}
          >
            {allCareers.map((career) => (
              <option key={career} value={career}>
                {career}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Save feedback banner */}
      {statusFeedback && (
        <div
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            marginBottom: "16px",
            fontSize: "13px",
            fontWeight: "700",
            background:
              statusFeedback.type === "error"
                ? "rgba(239, 68, 68, 0.12)"
                : statusFeedback.type === "info"
                ? "rgba(59, 130, 246, 0.12)"
                : "rgba(16, 185, 129, 0.12)",
            border: `1px solid ${
              statusFeedback.type === "error"
                ? "rgba(239, 68, 68, 0.3)"
                : statusFeedback.type === "info"
                ? "rgba(59, 130, 246, 0.3)"
                : "rgba(16, 185, 129, 0.3)"
            }`,
            color:
              statusFeedback.type === "error"
                ? "#EF4444"
                : statusFeedback.type === "info"
                ? "#60A5FA"
                : "#10B981",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{statusFeedback.message}</span>
          <button
            onClick={() => setStatusFeedback(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "14px" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* What-If Active Banner */}
      {whatIfScenario && (
        <div
          style={{
            padding: "14px 20px",
            borderRadius: "12px",
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            color: "#F59E0B",
            marginBottom: "20px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>⚡</span>
            <div>
              <strong style={{ display: "block", color: "#FBBF24", fontSize: "14px" }}>
                SIMULATED WHAT-IF SCENARIO ACTIVE
              </strong>
              <span style={{ color: "#CBD5E1", fontSize: "12px" }}>
                Roadmap reflects simulated skills ({whatIfScenario.additionalSkills?.join(", ") || "custom"}
                {whatIfScenario.additionalExpYears ? `, +${whatIfScenario.additionalExpYears} yrs exp` : ""}).
                Your stored profile remains unchanged.
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={handleRevertWhatIf}
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                color: "#FBBF24",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Revert to Baseline Profile
            </button>
            <button
              type="button"
              onClick={handleApplyWhatIfToProfile}
              style={{
                background: "#F59E0B",
                border: "none",
                color: "#0F172A",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Save to Profile
            </button>
          </div>
        </div>
      )}

      {/* 2. Route-Aware Transition Banner */}
      <section
        className="roadmap-transition-banner"
        style={{
          borderRadius: "16px",
          padding: "18px 24px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <span style={{ fontSize: "11px", fontWeight: "800", color: "#60A5FA", letterSpacing: "1px", textTransform: "uppercase" }}>
            RECOMMENDED TRANSITION ROUTE ({routeRoadmap.route.routeType.toUpperCase()})
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "16px", fontWeight: "800", color: "#FFFFFF" }}>
              {routeRoadmap.route.currentPosition.role}
            </span>
            <span style={{ color: "#94A3B8", fontWeight: "700" }}>➔</span>

            {routeRoadmap.route.routeType === "intermediate" && (
              <>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "800",
                    background: "rgba(59, 130, 246, 0.15)",
                    color: "#60A5FA",
                    padding: "4px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                  }}
                >
                  Bridge Milestone: {routeRoadmap.route.intermediateMilestone.role}
                </span>
                <span style={{ color: "#94A3B8", fontWeight: "700" }}>➔</span>
              </>
            )}

            <span style={{ fontSize: "16px", fontWeight: "800", color: "#60A5FA" }}>
              {routeRoadmap.route.targetPosition.role}
            </span>
          </div>
        </div>

        {/* Optimization Mode Tabs */}
        <div style={{ display: "flex", gap: "6px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "4px", borderRadius: "10px" }}>
          {["Fastest", "Skill Fit", "Market"].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setOptimizationMode(mode)}
              style={{
                background: optimizationMode === mode ? "rgba(59, 130, 246, 0.2)" : "transparent",
                color: optimizationMode === mode ? "#60A5FA" : "#94A3B8",
                border: optimizationMode === mode ? "1px solid rgba(59, 130, 246, 0.4)" : "1px solid transparent",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: optimizationMode === mode ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "none",
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Roadmap Overview Grid */}
      <section className="roadmap-overview-grid">
        <div className="roadmap-overview-card">
          <span className="roadmap-overview-label">Target Career</span>
          <div className="roadmap-overview-val" style={{ color: "#2563EB" }}>
            {activeCareer}
          </div>
        </div>

        <div className="roadmap-overview-card">
          <span className="roadmap-overview-label">Current Role</span>
          <div className="roadmap-overview-val">{currentRole}</div>
        </div>

        <div className="roadmap-overview-card">
          <span className="roadmap-overview-label">Mobility Compatibility</span>
          <div className="roadmap-overview-val" style={{ color: "#2563EB" }}>
            {routeRoadmap.route.mobilityScore?.overallScore ?? score}/100
          </div>
        </div>

        <div className="roadmap-overview-card">
          <span className="roadmap-overview-label">Roadmap Completion</span>
          <div className="roadmap-overview-val" style={{ color: careerProgress.completionPercent === 100 ? "#10B981" : "#2563EB" }}>
            {careerProgress.completionPercent}%
          </div>
        </div>

        <div className="roadmap-overview-card">
          <span className="roadmap-overview-label">Milestones Done</span>
          <div className="roadmap-overview-val" style={{ color: "#10B981" }}>
            {careerProgress.completedCount} / {careerProgress.totalCount}
          </div>
        </div>

        <div className="roadmap-overview-card">
          <span className="roadmap-overview-label">Estimated Prep</span>
          <div className="roadmap-overview-val" style={{ fontSize: "18px" }}>
            {careerInfo.time}
          </div>
        </div>
      </section>

      {/* 4. Real Milestone Progress Summary Card */}
      <section className="milestone-progress-summary-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span className="timeline-stage-badge" style={{ marginBottom: "6px" }}>PROGRESS TRACKING</span>
            <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#FFFFFF", margin: "4px 0" }}>
              {activeCareer} Milestones Progress
            </h3>
            <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0 }}>
              Calculated from actual completed milestones: {careerProgress.completedCount} of {careerProgress.totalCount} completed.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "24px", fontWeight: "900", color: careerProgress.completionPercent === 100 ? "#10B981" : "#60A5FA" }}>
              {careerProgress.completionPercent}%
            </span>
          </div>
        </div>

        <div className="milestone-progress-bar-track">
          <div
            className="milestone-progress-bar-fill"
            style={{ width: `${careerProgress.completionPercent}%` }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", fontSize: "13px" }}>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <span style={{ color: "#10B981", fontWeight: "700" }}>✓ {careerProgress.completedCount} Completed</span>
            <span style={{ color: "#60A5FA", fontWeight: "700" }}>⏳ {careerProgress.inProgressCount} In Progress</span>
            <span style={{ color: "#94A3B8", fontWeight: "600" }}>○ {careerProgress.remainingCount} Remaining</span>
          </div>

          <div>
            {careerProgress.nextMilestone ? (
              <span style={{ color: "#CBD5E1" }}>
                Next action: <strong style={{ color: "#60A5FA" }}>{careerProgress.nextMilestone.title}</strong>
              </span>
            ) : (
              <span style={{ color: "#10B981", fontWeight: "700" }}>
                All roadmap milestones completed!
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 5. Market Context Card (Strictly labeled "MARKET EVIDENCE", no proxies) */}
      <section
        className="roadmap-market-card"
        style={{
          borderRadius: "16px",
          padding: "20px 24px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "900",
                background: routeRoadmap.marketContext.available ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.1)",
                color: routeRoadmap.marketContext.available ? "#34D399" : "#94A3B8",
                border: routeRoadmap.marketContext.available ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(148, 163, 184, 0.2)",
                padding: "3px 8px",
                borderRadius: "6px",
                letterSpacing: "0.5px",
              }}
            >
              MARKET EVIDENCE
            </span>
            <strong style={{ fontSize: "14px", color: "#FFFFFF" }}>{activeCareer} Market Context</strong>
          </div>
          <span style={{ fontSize: "12px", color: "#94A3B8", fontStyle: "italic" }}>
            {routeRoadmap.marketContext.benchmarkNote}
          </span>
        </div>

        {routeRoadmap.marketContext.available ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
            <div className="dark-inner-box" style={{ padding: "12px 16px" }}>
              <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: "700", textTransform: "uppercase" }}>Observed Demand</span>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#60A5FA", marginTop: "4px" }}>
                {routeRoadmap.marketContext.formattedDemand}
              </div>
            </div>

            <div className="dark-inner-box" style={{ padding: "12px 16px" }}>
              <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: "700", textTransform: "uppercase" }}>Observed Salary Benchmark</span>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#10B981", marginTop: "4px" }}>
                {routeRoadmap.marketContext.formattedAvgSalary || `₹${routeRoadmap.marketContext.avgSalary} LPA`}
              </div>
            </div>

            <div className="dark-inner-box" style={{ padding: "12px 16px" }}>
              <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: "700", textTransform: "uppercase" }}>Demand Tier</span>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#60A5FA", marginTop: "4px" }}>
                {routeRoadmap.marketContext.demandTier}
              </div>
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, color: "#94A3B8", fontSize: "13px" }}>
            Market evidence unavailable for this role in the provided benchmark dataset. No empirical salary or posting estimates are displayed.
          </p>
        )}
      </section>

      {/* ML Project Integration Notice */}
      {mlProject && careerInfo.skills?.includes("Machine Learning") && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "12px",
            background: "rgba(59, 130, 246, 0.12)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            color: "#2563EB",
            fontSize: "13px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <span>⚡</span>
          <span>
            ML Project simulation active: Machine Learning competency fulfilled via practical project experience.
          </span>
        </div>
      )}

      <GlowSeparator />

      {/* 6. Actionable 4-Phase Roadmap Timeline */}
      <section className="roadmap-timeline-wrapper">

        {/* Phase 1 — Strengthen Core Skills */}
        <div className="timeline-stage-card">
          <span className="timeline-stage-badge">PHASE 01 — CORE FOUNDATIONS</span>
          <h2 className="timeline-stage-title">Strengthen Core Skills</h2>
          <p style={{ color: "#64748B", fontSize: "14px", lineHeight: "1.6", maxWidth: "700px" }}>
            Reinforce verified baseline competencies and overlapping fundamentals already demonstrated in your profile.
            These form the bedrock for qualifying in <strong>{activeCareer}</strong>.
          </p>

          <div style={{ marginTop: "16px" }}>
            {routeRoadmap.phases.phase1.items.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {routeRoadmap.phases.phase1.items.map((item) => (
                  <div
                    key={item.skill}
                    className="dark-inner-box"
                    style={{
                      padding: "12px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "#34D399", fontWeight: "800" }}>✓ {item.skill}</span>
                        <span style={{ fontSize: "11px", color: "#94A3B8", background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "2px 6px", borderRadius: "4px" }}>
                          Weight: {item.weightPercent}%
                        </span>
                      </div>
                      <p style={{ margin: "4px 0 0", color: "#94A3B8", fontSize: "12px" }}>
                        {item.explanation}
                      </p>
                    </div>
                    <span style={{ fontSize: "12px", color: "#34D399", fontWeight: "700" }}>
                      ✓ Verified Foundation
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#64748B", fontSize: "13px", fontStyle: "italic" }}>
                No overlapping core competencies recorded in your current profile yet. Review Phase 2 to acquire core prerequisites.
              </p>
            )}
          </div>
        </div>

        {/* Phase 2 — Close Target Skill Gaps */}
        <div className="timeline-stage-card">
          <span className="timeline-stage-badge">PHASE 02 — SKILL BRIDGING</span>
          <h2 className="timeline-stage-title">Close Target Skill Gaps</h2>
          <p style={{ color: "#64748B", fontSize: "14px", lineHeight: "1.6", maxWidth: "700px" }}>
            {routeRoadmap.phases.phase2.subtitle}.
            Prioritized by essential missing competencies and existing catalog skill weights.
          </p>

          {/* Completion State Banner when all core skills are satisfied */}
          {routeRoadmap.completionState.isCovered ? (
            <div className="roadmap-completed-card" style={{ marginTop: "20px" }}>
              <div style={{ fontSize: "32px" }}>✓</div>
              <h3 style={{ fontSize: "18px", color: "#059669", fontWeight: "800" }}>
                Core skill requirements covered
              </h3>
              <p style={{ color: "#64748B", fontSize: "13px", maxWidth: "560px" }}>
                Candidate profile satisfies all core catalog competency requirements for {activeCareer} ({score}% Overall Readiness).
                Focus on reinforcing portfolio evidence in Phase 3 and interview preparation in Phase 4.
              </p>
              <small style={{ color: "#94A3B8", fontSize: "11px", fontStyle: "italic" }}>
                {routeRoadmap.completionState.guaranteeDisclaimer}
              </small>
            </div>
          ) : (
            <div className="timeline-step-list">
              {routeRoadmap.phases.phase2.milestones.map((milestone, index) => {
                const milestoneTitle = milestone.title;
                const milestoneRecord = careerProgress.milestones.find((m) => m.title === milestoneTitle);
                const status = milestoneRecord?.status || "NOT_STARTED";
                const isSaving = savingMilestone === milestoneTitle;

                return (
                  <div
                    className={`timeline-step-item ${status === "COMPLETED" ? "is-completed" : status === "IN_PROGRESS" ? "is-in-progress" : ""}`}
                    key={milestone.id}
                  >
                    <div className="timeline-step-num">
                      {status === "COMPLETED" ? "✓" : String(index + 1).padStart(2, "0")}
                    </div>

                    <div style={{ flexGrow: 1 }}>
                      <div className="timeline-step-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                        <div>
                          <span className="timeline-step-name">{milestoneTitle}</span>
                          <span className="timeline-step-tag">
                            {milestone.transitionPhase === "intermediate" ? "Step 1 Bridge" : `Target Core (Weight: ${milestone.weightPercent}%)`}
                          </span>
                        </div>

                        <div>
                          {status === "COMPLETED" && <span className="milestone-state-badge completed">✓ Completed</span>}
                          {status === "IN_PROGRESS" && <span className="milestone-state-badge in-progress">⏳ In Progress</span>}
                          {status === "NOT_STARTED" && <span className="milestone-state-badge not-started">○ Not Started</span>}
                        </div>
                      </div>

                      <p className="timeline-step-desc">
                        {skillExplanations[milestone.skill] || milestone.explanation}
                      </p>

                      {/* Explainability Tag */}
                      <div style={{ margin: "6px 0 10px", fontSize: "12px", color: "#2563EB", fontWeight: "600" }}>
                        Reason: {milestone.explanation}
                      </div>

                      {/* Interactive Status Selector */}
                      <div className="milestone-status-control">
                        <span style={{ fontSize: "12px", color: "#64748B", marginRight: "4px" }}>Status:</span>
                        <button
                          type="button"
                          className={`status-btn not-started ${status === "NOT_STARTED" ? "active" : ""}`}
                          onClick={() => handleStatusChange(milestoneTitle, "NOT_STARTED", "SKILL_GAP")}
                          disabled={isSaving}
                        >
                          Not Started
                        </button>
                        <button
                          type="button"
                          className={`status-btn in-progress ${status === "IN_PROGRESS" ? "active" : ""}`}
                          onClick={() => handleStatusChange(milestoneTitle, "IN_PROGRESS", "SKILL_GAP")}
                          disabled={isSaving}
                        >
                          In Progress
                        </button>
                        <button
                          type="button"
                          className={`status-btn completed ${status === "COMPLETED" ? "active" : ""}`}
                          onClick={() => handleStatusChange(milestoneTitle, "COMPLETED", "SKILL_GAP")}
                          disabled={isSaving}
                        >
                          ✓ Completed
                        </button>

                        {isSaving && <span className="saving-indicator">Saving...</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Phase 3 — Build Evidence */}
        <div className="timeline-stage-card">
          <span className="timeline-stage-badge">PHASE 03 — PRACTICAL EVIDENCE</span>
          <h2 className="timeline-stage-title">Build Practical Evidence</h2>
          <p style={{ color: "#64748B", fontSize: "14px", lineHeight: "1.6", maxWidth: "700px" }}>
            Demonstrate applied domain competency through working projects, production pipelines, and verified portfolio artifacts.
          </p>

          <div className="timeline-step-list">
            {routeRoadmap.phases.phase3.milestones.map((step, index) => {
              const milestoneRecord = careerProgress.milestones.find((m) => m.title === step.title);
              const status = milestoneRecord?.status || "NOT_STARTED";
              const isSaving = savingMilestone === step.title;

              return (
                <div
                  className={`timeline-step-item ${status === "COMPLETED" ? "is-completed" : status === "IN_PROGRESS" ? "is-in-progress" : ""}`}
                  key={step.id || step.title}
                >
                  <div
                    className="timeline-step-num"
                    style={{
                      borderColor: status === "COMPLETED" ? "#10B981" : "#2563EB",
                      color: status === "COMPLETED" ? "#10B981" : "#2563EB",
                    }}
                  >
                    {status === "COMPLETED" ? "✓" : String(index + 1).padStart(2, "0")}
                  </div>

                  <div style={{ flexGrow: 1 }}>
                    <div className="timeline-step-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <span className="timeline-step-name">{step.title}</span>
                        <span className="timeline-step-tag milestone">Portfolio Artifact</span>
                      </div>

                      <div>
                        {status === "COMPLETED" && <span className="milestone-state-badge completed">✓ Completed</span>}
                        {status === "IN_PROGRESS" && <span className="milestone-state-badge in-progress">⏳ In Progress</span>}
                        {status === "NOT_STARTED" && <span className="milestone-state-badge not-started">○ Not Started</span>}
                      </div>
                    </div>

                    <p className="timeline-step-desc">{step.description}</p>

                    <div style={{ margin: "6px 0 10px", fontSize: "12px", color: "#2563EB", fontWeight: "600" }}>
                      Reason: {step.explanation}
                    </div>

                    {/* Interactive Status Selector */}
                    <div className="milestone-status-control">
                      <span style={{ fontSize: "12px", color: "#64748B", marginRight: "4px" }}>Status:</span>
                      <button
                        type="button"
                        className={`status-btn not-started ${status === "NOT_STARTED" ? "active" : ""}`}
                        onClick={() => handleStatusChange(step.title, "NOT_STARTED", "DESTINATION")}
                        disabled={isSaving}
                      >
                        Not Started
                      </button>
                      <button
                        type="button"
                        className={`status-btn in-progress ${status === "IN_PROGRESS" ? "active" : ""}`}
                        onClick={() => handleStatusChange(step.title, "IN_PROGRESS", "DESTINATION")}
                        disabled={isSaving}
                      >
                        In Progress
                      </button>
                      <button
                        type="button"
                        className={`status-btn completed ${status === "COMPLETED" ? "active" : ""}`}
                        onClick={() => handleStatusChange(step.title, "COMPLETED", "DESTINATION")}
                        disabled={isSaving}
                      >
                        ✓ Completed
                      </button>

                      {isSaving && <span className="saving-indicator">Saving...</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phase 4 — Target Role Readiness */}
        <div className="timeline-stage-card">
          <span className="timeline-stage-badge">PHASE 04 — ROLE READINESS</span>
          <h2 className="timeline-stage-title">Target Role Readiness</h2>
          <p style={{ color: "#64748B", fontSize: "14px", lineHeight: "1.6", maxWidth: "700px" }}>
            Technical evaluation challenges, architecture design, and role-specific interview preparation to finalize your transition into <strong>{activeCareer}</strong>.
          </p>

          <div className="timeline-step-list">
            {routeRoadmap.phases.phase4.milestones.map((step, index) => {
              const milestoneRecord = careerProgress.milestones.find((m) => m.title === step.title);
              const status = milestoneRecord?.status || "NOT_STARTED";
              const isSaving = savingMilestone === step.title;

              return (
                <div
                  className={`timeline-step-item ${status === "COMPLETED" ? "is-completed" : status === "IN_PROGRESS" ? "is-in-progress" : ""}`}
                  key={step.id || step.title}
                >
                  <div
                    className="timeline-step-num"
                    style={{
                      borderColor: status === "COMPLETED" ? "#10B981" : "#2563EB",
                      color: status === "COMPLETED" ? "#10B981" : "#2563EB",
                    }}
                  >
                    {status === "COMPLETED" ? "✓" : String(index + 1).padStart(2, "0")}
                  </div>

                  <div style={{ flexGrow: 1 }}>
                    <div className="timeline-step-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <span className="timeline-step-name">{step.title}</span>
                        <span className="timeline-step-tag milestone">Interview & Readiness</span>
                      </div>

                      <div>
                        {status === "COMPLETED" && <span className="milestone-state-badge completed">✓ Completed</span>}
                        {status === "IN_PROGRESS" && <span className="milestone-state-badge in-progress">⏳ In Progress</span>}
                        {status === "NOT_STARTED" && <span className="milestone-state-badge not-started">○ Not Started</span>}
                      </div>
                    </div>

                    <p className="timeline-step-desc">{step.description}</p>

                    <div style={{ margin: "6px 0 10px", fontSize: "12px", color: "#2563EB", fontWeight: "600" }}>
                      Reason: {step.explanation}
                    </div>

                    {/* Interactive Status Selector */}
                    <div className="milestone-status-control">
                      <span style={{ fontSize: "12px", color: "#64748B", marginRight: "4px" }}>Status:</span>
                      <button
                        type="button"
                        className={`status-btn not-started ${status === "NOT_STARTED" ? "active" : ""}`}
                        onClick={() => handleStatusChange(step.title, "NOT_STARTED", "DESTINATION")}
                        disabled={isSaving}
                      >
                        Not Started
                      </button>
                      <button
                        type="button"
                        className={`status-btn in-progress ${status === "IN_PROGRESS" ? "active" : ""}`}
                        onClick={() => handleStatusChange(step.title, "IN_PROGRESS", "DESTINATION")}
                        disabled={isSaving}
                      >
                        In Progress
                      </button>
                      <button
                        type="button"
                        className={`status-btn completed ${status === "COMPLETED" ? "active" : ""}`}
                        onClick={() => handleStatusChange(step.title, "COMPLETED", "DESTINATION")}
                        disabled={isSaving}
                      >
                        ✓ Completed
                      </button>

                      {isSaving && <span className="saving-indicator">Saving...</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </section>

      <GlowSeparator />

      {/* 7. Action Navigation Row */}
      <section className="roadmap-actions-row">
        <button
          className="secondary-button"
          onClick={() => navigate("/mobility")}
        >
          ← Mobility Intelligence
        </button>

        <button
          className="secondary-button"
          onClick={() => navigate("/simulator")}
        >
          ⚡ What-If Sandbox
        </button>

        <button
          className="primary-button"
          onClick={() => navigate("/skill-gap")}
        >
          Analyze Skill Gap →
        </button>

        <button
          className="secondary-button"
          onClick={() => navigate("/progress")}
        >
          Track Full Progress →
        </button>
      </section>
    </div>
  );
}
