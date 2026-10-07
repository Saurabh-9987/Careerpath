import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlowSeparator from "../components/GlowSeparator";
import { useCareer } from "../context/CareerContextCore";
import { careerData } from "../data/careerData";
import { getScore, getProfileSkills } from "../utils/careerScoring";
import { calculateCareerProgress } from "../utils/roadmapProgress";

export default function ProgressPage() {
  const navigate = useNavigate();
  const {
    role,
    profile,
    mlProject,
    selectedCareer,
    setSelectedCareer,
    roadmapProgress,
  } = useCareer();

  const userSkills = getProfileSkills(profile);
  const targets = useMemo(() => Object.keys(careerData), []);
  const activeCareer = selectedCareer || "Data Scientist";

  // Calculate genuine progress stats for every career
  const progressByCareer = useMemo(() => {
    const map = {};
    targets.forEach((c) => {
      map[c] = calculateCareerProgress(c, profile, mlProject, roadmapProgress);
    });
    return map;
  }, [targets, profile, mlProject, roadmapProgress]);

  const activeStats = progressByCareer[activeCareer] || progressByCareer["Data Scientist"];

  // Check if any milestone has been started across all career trajectories
  const anyMilestonesStarted = useMemo(() => {
    return Object.values(progressByCareer).some((stats) => stats.hasStarted);
  }, [progressByCareer]);

  return (
    <div style={{ paddingTop: "60px", paddingBottom: "100px" }}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">CAREER PROGRESS</p>
          <h2>Roadmap & Milestone Tracking</h2>
          <p style={{ color: "#94A3B8", fontSize: "14px", marginTop: "8px", maxWidth: "680px" }}>
            Track actual progress along your learning trajectory. Milestones completed in your interactive
            roadmap directly update your completion metrics here.
          </p>
        </div>
      </div>

      <GlowSeparator style={{ margin: "24px auto 36px" }} />

      {/* Helpful Empty State if student hasn't started any roadmap milestone yet */}
      {!anyMilestonesStarted && (
        <div
          style={{
            maxWidth: "960px",
            margin: "0 auto 36px",
            padding: "28px 32px",
            borderRadius: "16px",
            background: "rgba(10, 12, 16, 0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderTop: "1px solid rgba(255, 255, 255, 0.18)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🎯</div>
          <h3 style={{ fontSize: "19px", fontWeight: "800", color: "#FFFFFF", marginBottom: "8px" }}>
            No Roadmap Milestones Started Yet
          </h3>
          <p style={{ color: "#94A3B8", fontSize: "14px", maxWidth: "620px", margin: "0 auto 20px", lineHeight: "1.6" }}>
            You have not marked any learning milestones as in progress or completed yet.
            Visit your personalized roadmap for <strong>{activeCareer}</strong> to start marking milestones as you learn.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/roadmap")}
          >
            Start {activeCareer} Roadmap →
          </button>
        </div>
      )}

      {/* Active Trajectory Focus Card */}
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto 40px",
          padding: "28px 32px",
          borderRadius: "16px",
          background: "rgba(10, 12, 16, 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderTop: "1px solid rgba(59, 130, 246, 0.4)",
          boxShadow: "0 14px 40px -10px rgba(0, 0, 0, 0.7)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="timeline-stage-badge" style={{ marginBottom: "6px" }}>ACTIVE TARGET FOCUS</span>
            <h3 style={{ fontSize: "22px", fontWeight: "800", color: "#FFFFFF", margin: "6px 0 4px" }}>
              {activeCareer} Trajectory
            </h3>
            <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0 }}>
              Calculated completion: {activeStats.completedCount} of {activeStats.totalCount} milestones finished.
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "32px", fontWeight: "900", color: activeStats.completionPercent === 100 ? "#10B981" : "#60A5FA" }}>
              {activeStats.completionPercent}%
            </span>
            <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "700", textTransform: "uppercase" }}>
              Roadmap Completed
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="milestone-progress-bar-track" style={{ height: "12px", margin: "20px 0" }}>
          <div
            className="milestone-progress-bar-fill"
            style={{ width: `${activeStats.completionPercent}%` }}
          />
        </div>

        {/* 3 Metric Pills */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", margin: "20px 0" }}>
          <div style={{ padding: "14px 18px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#34D399", textTransform: "uppercase", letterSpacing: "1px" }}>Completed</span>
            <div style={{ fontSize: "20px", fontWeight: "900", color: "#10B981", marginTop: "4px" }}>
              {activeStats.completedCount} / {activeStats.totalCount}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#60A5FA", textTransform: "uppercase", letterSpacing: "1px" }}>In Progress</span>
            <div style={{ fontSize: "20px", fontWeight: "900", color: "#60A5FA", marginTop: "4px" }}>
              {activeStats.inProgressCount}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRadius: "10px", background: "rgba(148, 163, 184, 0.08)", border: "1px solid rgba(148, 163, 184, 0.2)" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px" }}>Remaining</span>
            <div style={{ fontSize: "20px", fontWeight: "900", color: "#CBD5E1", marginTop: "4px" }}>
              {activeStats.remainingCount}
            </div>
          </div>
        </div>

        {/* Next Action Callout */}
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "12px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <div>
            <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "700", textTransform: "uppercase" }}>Next Actionable Step:</span>
            <div style={{ fontSize: "15px", fontWeight: "800", color: "#FFFFFF", marginTop: "2px" }}>
              {activeStats.nextMilestone ? (
                <span>
                  {activeStats.nextMilestone.title}{" "}
                  <small style={{ color: "#60A5FA", fontWeight: "600", fontSize: "12px" }}>
                    ({activeStats.nextMilestone.type === "SKILL_GAP" ? "Skill Gap" : "Destination Capstone"})
                  </small>
                </span>
              ) : (
                <span style={{ color: "#10B981" }}>🎉 All milestones completed for this path!</span>
              )}
            </div>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/roadmap")}
            style={{ fontSize: "13px", padding: "8px 16px" }}
          >
            Continue in Roadmap →
          </button>
        </div>
      </div>

      <GlowSeparator style={{ margin: "24px auto 36px" }} />

      {/* Trajectories Overview Grid */}
      <div className="path-cards">
        {/* Active Profile Summary Card */}
        <div className="path-card">
          <div className="path-top">
            <span>ACTIVE PROFILE</span>
            <strong>{userSkills.length} SKILLS</strong>
          </div>
          <h3>Current: {role}</h3>
          <p>Verified profile competencies:</p>
          <div className="skill-list">
            {userSkills.length > 0 ? (
              userSkills.map((skill) => (
                <span key={skill}>✓ {skill}</span>
              ))
            ) : (
              <div style={{ width: "100%", marginTop: "6px" }}>
                <p style={{ color: "#64748B", fontSize: "13px", fontStyle: "italic", marginBottom: "12px" }}>
                  No verified skills saved in your profile yet.
                </p>
                <Link
                  to="/profile"
                  className="secondary-button"
                  style={{ display: "inline-block", fontSize: "12px", padding: "8px 14px", textDecoration: "none" }}
                >
                  Add Skills in Profile →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Real Career Progress Cards */}
        {targets.map((career) => {
          const stats = progressByCareer[career];
          const score = getScore(career, profile, mlProject);
          const isCurrentActive = career === activeCareer;

          return (
            <div
              className="path-card"
              key={career}
              style={{
                borderColor: isCurrentActive ? "rgba(59, 130, 246, 0.4)" : undefined,
              }}
            >
              <div className="path-top">
                <span>MILESTONE PROGRESS</span>
                <strong style={{ color: stats.completionPercent === 100 ? "#10B981" : "#60A5FA" }}>
                  {stats.completionPercent}%
                </strong>
              </div>
              <h3>Target: {career}</h3>
              <p style={{ color: "#94A3B8", fontSize: "13px" }}>
                Estimated preparation: {careerData[career].time}
              </p>

              {/* Progress bar in card */}
              <div className="milestone-progress-bar-track" style={{ height: "6px", margin: "14px 0 10px" }}>
                <div
                  className="milestone-progress-bar-fill"
                  style={{ width: `${stats.completionPercent}%` }}
                />
              </div>

              <div style={{ fontSize: "12px", color: "#94A3B8", display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                <span>Milestones: {stats.completedCount} / {stats.totalCount}</span>
                <span>Fit Score: {score}%</span>
              </div>

              <div style={{ marginTop: "14px", display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  type="button"
                  className={isCurrentActive ? "primary-button" : "secondary-button"}
                  style={{ fontSize: "12px", padding: "7px 14px" }}
                  onClick={() => {
                    setSelectedCareer(career);
                    navigate("/roadmap");
                  }}
                >
                  View Roadmap →
                </button>

                {!isCurrentActive && (
                  <button
                    type="button"
                    className="text-button"
                    style={{ fontSize: "12px" }}
                    onClick={() => setSelectedCareer(career)}
                  >
                    Focus Career
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
