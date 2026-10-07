import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlowSeparator from "../components/GlowSeparator";
import { useCareer } from "../context/CareerContextCore";
import { careerData, skillDescriptions } from "../data/careerData";
import {
  getScore,
  getMissingSkills,
  getRoadmap,
  getProfileSkills,
  getMatchedSkills,
} from "../utils/careerScoring";
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
  const {
    role,
    profile,
    selectedCareer,
    setSelectedCareer,
    mlProject,
    roadmapProgress,
    handleUpdateRoadmapProgress,
  } = useCareer();

  const [savingMilestone, setSavingMilestone] = useState(null);
  const [statusFeedback, setStatusFeedback] = useState(null);

  const allCareers = useMemo(() => Object.keys(careerData), []);
  const activeCareer = selectedCareer || "Data Scientist";
  const careerInfo = careerData[activeCareer] || careerData["Data Scientist"];

  const userSkillsList = useMemo(() => {
    return getProfileSkills(profile);
  }, [profile]);

  const score = getScore(activeCareer, profile, mlProject);
  const missingSkills = getMissingSkills(activeCareer, profile, mlProject);
  const roadmapSteps = getRoadmap(activeCareer, profile, mlProject);

  const matchedSkills = useMemo(() => {
    return getMatchedSkills(activeCareer, profile, mlProject);
  }, [activeCareer, profile, mlProject]);

  // Genuine completion progress calculation (completed / total * 100)
  const careerProgress = useMemo(() => {
    return calculateCareerProgress(activeCareer, profile, mlProject, roadmapProgress);
  }, [activeCareer, profile, mlProject, roadmapProgress]);

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
        message: `Saved to database: "${milestoneTitle}" is now ${newStatus.replace("_", " ")}.`,
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

  return (
    <div className="roadmap-page-container">
      {/* 1. Header */}
      <section className="roadmap-page-header">
        <div>
          <p className="eyebrow">PREPARATION BLUEPRINT</p>
          <h1>
            Your Career <span>Roadmap</span>
          </h1>
          <p className="explorer-header-desc">
            Personalized learning trajectory with interactive milestone tracking for <strong>{activeCareer}</strong>.
            Mark milestones as in progress or completed to track your journey.
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
            onChange={(e) => setSelectedCareer(e.target.value)}
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

      <GlowSeparator />

      {/* 2. Roadmap Overview */}
      <section className="roadmap-overview-grid">
        <div className="roadmap-overview-card">
          <span className="roadmap-overview-label">Target Career</span>
          <div className="roadmap-overview-val" style={{ color: "#60A5FA" }}>
            {activeCareer}
          </div>
        </div>

        <div className="roadmap-overview-card">
          <span className="roadmap-overview-label">Current Role</span>
          <div className="roadmap-overview-val">{role}</div>
        </div>

        <div className="roadmap-overview-card">
          <span className="roadmap-overview-label">Profile Readiness</span>
          <div className="roadmap-overview-val" style={{ color: "#60A5FA" }}>
            {score}%
          </div>
        </div>

        <div className="roadmap-overview-card">
          <span className="roadmap-overview-label">Roadmap Completion</span>
          <div className="roadmap-overview-val" style={{ color: careerProgress.completionPercent === 100 ? "#10B981" : "#60A5FA" }}>
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

      {/* Real Milestone Progress Summary Card */}
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
                🎉 All roadmap milestones completed!
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ML Project Integration Notice */}
      {mlProject && careerInfo.skills.includes("Machine Learning") && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "12px",
            background: "rgba(59, 130, 246, 0.12)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            color: "#60A5FA",
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

      {/* Existing Skills Section */}
      <section className="existing-skills-card">
        <div>
          <span className="timeline-stage-badge">FOUNDATION</span>
          <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#FFFFFF", margin: "4px 0" }}>
            Skills Already in Your Profile
          </h3>
          <p style={{ color: "#94A3B8", fontSize: "13px" }}>
            These competencies are already demonstrated in your profile and do not need to be retrained.
          </p>
        </div>

        {matchedSkills.length > 0 ? (
          <div className="skill-list">
            {matchedSkills.map((skill) => (
              <span key={skill} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                ✓ {skill} <small style={{ opacity: 0.7 }}>(Verified)</small>
              </span>
            ))}
          </div>
        ) : (
          <p style={{ color: "#64748B", fontSize: "13px", fontStyle: "italic", margin: "10px 0 0" }}>
            No verified matching competencies yet for this destination. Add relevant skills in your profile to establish your foundation.
          </p>
        )}
      </section>

      <GlowSeparator />

      {/* 3. Roadmap Timeline (Stage 1, Stage 2, Stage 3) */}
      <section className="roadmap-timeline-wrapper">
        {/* Stage 1: Current Position */}
        <div className="timeline-stage-card">
          <span className="timeline-stage-badge">STAGE 01</span>
          <h2 className="timeline-stage-title">Current Baseline: {role}</h2>
          <p style={{ color: "#64748B", fontSize: "14px", lineHeight: "1.6", maxWidth: "700px" }}>
            Your current career baseline and verified skill inventory. The roadmap builds systematically upon
            these existing qualifications toward your destination.
          </p>

          <div style={{ marginTop: "16px" }} className="skill-list">
            {userSkillsList.length > 0 ? (
              userSkillsList.map((skill) => (
                <span key={skill}>✓ {skill}</span>
              ))
            ) : (
              <p style={{ color: "#64748B", fontSize: "13px", fontStyle: "italic" }}>
                No verified skills recorded in your active profile yet. Add skills in My Profile to establish your baseline.
              </p>
            )}
          </div>
        </div>

        {/* Stage 2: Build Missing Skills */}
        <div className="timeline-stage-card">
          <span className="timeline-stage-badge">STAGE 02</span>
          <h2 className="timeline-stage-title">Bridge Missing Skills</h2>
          <p style={{ color: "#64748B", fontSize: "14px", lineHeight: "1.6", maxWidth: "700px" }}>
            Specific competency gaps that must be acquired to qualify for <strong>{activeCareer}</strong>.
            Mark each milestone to track your learning progress.
          </p>

          {missingSkills.length === 0 ? (
            <div className="roadmap-completed-card" style={{ marginTop: "20px" }}>
              <div style={{ fontSize: "32px" }}>🎉</div>
              <h3 style={{ fontSize: "18px", color: "#60A5FA", fontWeight: "800" }}>
                You have covered the key skills for this career path.
              </h3>
              <p style={{ color: "#64748B", fontSize: "13px", maxWidth: "560px" }}>
                Your profile demonstrates all core competencies required for {activeCareer} ({score}% Overall Readiness).
                You can proceed directly to portfolio and interview preparation in Stage 03.
              </p>
            </div>
          ) : (
            <div className="timeline-step-list">
              {missingSkills.map((skill, index) => {
                const milestoneTitle = `Learn ${skill}`;
                const milestoneRecord = careerProgress.milestones.find((m) => m.title === milestoneTitle);
                const status = milestoneRecord?.status || "NOT_STARTED";
                const isSaving = savingMilestone === milestoneTitle;

                return (
                  <div
                    className={`timeline-step-item ${status === "COMPLETED" ? "is-completed" : status === "IN_PROGRESS" ? "is-in-progress" : ""}`}
                    key={skill}
                  >
                    <div className="timeline-step-num">
                      {status === "COMPLETED" ? "✓" : String(index + 1).padStart(2, "0")}
                    </div>

                    <div style={{ flexGrow: 1 }}>
                      <div className="timeline-step-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                        <div>
                          <span className="timeline-step-name">{milestoneTitle}</span>
                          <span className="timeline-step-tag">Skill Gap</span>
                        </div>

                        <div>
                          {status === "COMPLETED" && <span className="milestone-state-badge completed">✓ Completed</span>}
                          {status === "IN_PROGRESS" && <span className="milestone-state-badge in-progress">⏳ In Progress</span>}
                          {status === "NOT_STARTED" && <span className="milestone-state-badge not-started">○ Not Started</span>}
                        </div>
                      </div>

                      <p className="timeline-step-desc">
                        {skillExplanations[skill] ||
                          "Acquire fundamental theory, practical frameworks, and implementation skills for this competency."}
                      </p>

                      {/* Interactive Status Selector */}
                      <div className="milestone-status-control">
                        <span style={{ fontSize: "12px", color: "#94A3B8", marginRight: "4px" }}>Status:</span>
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

        {/* Stage 3: Target Career Destination */}
        <div className="timeline-stage-card">
          <span className="timeline-stage-badge">STAGE 03</span>
          <h2 className="timeline-stage-title">Target Destination: {activeCareer}</h2>
          <p style={{ color: "#64748B", fontSize: "14px", lineHeight: "1.6", maxWidth: "700px" }}>
            Capstones, project synthesis, and interview readiness milestones to finalize your transition into
            the <strong>{activeCareer}</strong> role.
          </p>

          <div className="timeline-step-list">
            {roadmapSteps
              .filter(
                (step) =>
                  !missingSkills.some((s) => step.title.toLowerCase().includes(s.toLowerCase()))
              )
              .map((step, index) => {
                const milestoneRecord = careerProgress.milestones.find((m) => m.title === step.title);
                const status = milestoneRecord?.status || "NOT_STARTED";
                const isSaving = savingMilestone === step.title;

                return (
                  <div
                    className={`timeline-step-item ${status === "COMPLETED" ? "is-completed" : status === "IN_PROGRESS" ? "is-in-progress" : ""}`}
                    key={step.title}
                  >
                    <div
                      className="timeline-step-num"
                      style={{
                        borderColor: status === "COMPLETED" ? "#10B981" : "#3B82F6",
                        color: status === "COMPLETED" ? "#10B981" : "#60A5FA",
                      }}
                    >
                      {status === "COMPLETED" ? "✓" : String(missingSkills.length + index + 1).padStart(2, "0")}
                    </div>

                    <div style={{ flexGrow: 1 }}>
                      <div className="timeline-step-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                        <div>
                          <span className="timeline-step-name">{step.title}</span>
                          <span className="timeline-step-tag milestone">Destination Milestone</span>
                        </div>

                        <div>
                          {status === "COMPLETED" && <span className="milestone-state-badge completed">✓ Completed</span>}
                          {status === "IN_PROGRESS" && <span className="milestone-state-badge in-progress">⏳ In Progress</span>}
                          {status === "NOT_STARTED" && <span className="milestone-state-badge not-started">○ Not Started</span>}
                        </div>
                      </div>

                      <p className="timeline-step-desc">{step.description}</p>

                      {/* Interactive Status Selector */}
                      <div className="milestone-status-control">
                        <span style={{ fontSize: "12px", color: "#94A3B8", marginRight: "4px" }}>Status:</span>
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

      {/* 8. Actions */}
      <section className="roadmap-actions-row">
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
          Track Progress →
        </button>

        <button
          className="secondary-button"
          onClick={() => navigate("/explorer")}
        >
          Explore Careers →
        </button>
      </section>
    </div>
  );
}
