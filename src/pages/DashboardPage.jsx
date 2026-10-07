import { Link } from "react-router-dom";
import { useMemo } from "react";
import GlowSeparator from "../components/GlowSeparator";
import { useCareer } from "../context/CareerContextCore";
import { careerData, careerPaths } from "../data/careerData";
import { getCareerMarketData } from "../data/careerIntelligence";
import {
  getScore,
  getMissingSkills,
  getProfileSkills,
  getPathReason,
  getMatchedSkills,
} from "../utils/careerScoring";

export default function DashboardPage() {
  const {
    role,
    profile,
    selectedCareer,
    setSelectedCareer,
    mlProject,
  } = useCareer();

  const displayName = profile?.name?.trim();
  const targetCareer = selectedCareer || "Data Scientist";
  const readinessScore = getScore(targetCareer, profile, mlProject);
  const profileSkillsList = getProfileSkills(profile);
  const missingSkills = getMissingSkills(targetCareer, profile, mlProject);

  const targetMarketData = useMemo(() => {
    return getCareerMarketData(targetCareer);
  }, [targetCareer]);

  const availablePaths = useMemo(() => {
    return careerPaths[role] || [
      "Data Scientist",
      "Data Engineer",
      "ML Engineer",
    ];
  }, [role]);

  // Rank recommended pathways by highest calculated competency score
  const recommendedPaths = useMemo(() => {
    return [...availablePaths].sort((a, b) => {
      const scoreB = getScore(b, profile, mlProject);
      const scoreA = getScore(a, profile, mlProject);
      return scoreB - scoreA;
    });
  }, [availablePaths, profile, mlProject]);

  return (
    <div className="dashboard-container">
      {/* 1. Welcome Section */}
      <section className="dashboard-welcome">
        <div>
          <p className="eyebrow">CAREERPATH DASHBOARD</p>
          <h1>
            {displayName ? (
              <>
                Welcome back, <span>{displayName}</span>
              </>
            ) : (
              <>
                Welcome to <span>CareerPath</span>
              </>
            )}
          </h1>
          <p style={{ color: "#64748B", marginTop: "6px", fontSize: "15px" }}>
            Monitor your skill profile, track career trajectory readiness, and explore optimal transitions.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div className="dashboard-role-badge">
            <span>●</span> Current Role: {role}
          </div>
          <Link to="/profile" className="profile-button">
            Edit Profile
          </Link>
        </div>
      </section>

      <GlowSeparator />

      {/* Primary Highlights: 2. Career Readiness, 3. Current Skills, 4. Skill Gap Summary */}
      <section className="dashboard-hero-grid">
        {/* 2. Career Readiness Card */}
        <div className="dashboard-panel">
          <div>
            <div className="dashboard-panel-header">
              <span className="card-label">PATHWAY READINESS</span>
              <span style={{ color: "#60A5FA", fontSize: "12px", fontWeight: "700" }}>
                Target: {targetCareer}
              </span>
            </div>

            <h2 className="dashboard-panel-title">{targetCareer}</h2>
            <p className="dashboard-panel-desc">
              Overall profile qualification calculated against {careerData[targetCareer]?.skills?.length || 4} core industry competencies.
            </p>

            <div className="readiness-metric">
              <span className="readiness-score-number">{readinessScore}%</span>
              <span className="readiness-score-label">Profile Readiness</span>
            </div>

            <p style={{ color: "#94A3B8", fontSize: "13px" }}>
              Estimated preparation timeline: <strong style={{ color: "#FFFFFF" }}>{careerData[targetCareer]?.time || "4–6 months"}</strong>
            </p>
          </div>

          <div style={{ marginTop: "24px" }}>
            <Link to="/simulator" className="primary-button" style={{ display: "inline-block", textDecoration: "none" }}>
              Simulate Pathway →
            </Link>
          </div>
        </div>

        {/* 3. Current Skills Section */}
        <div className="dashboard-panel">
          <div>
            <div className="dashboard-panel-header">
              <span className="card-label">PROFILE CAPABILITIES</span>
              <span style={{ color: "#64748B", fontSize: "12px" }}>
                {profileSkillsList.length} Documented
              </span>
            </div>

            <h2 className="dashboard-panel-title">Current Skills</h2>
            <p className="dashboard-panel-desc">
              Skills currently registered in your profile. These are evaluated across all career trajectory routes.
            </p>

            <div className="skill-list" style={{ maxHeight: "170px", overflowY: "auto" }}>
              {profileSkillsList.length > 0 ? (
                profileSkillsList.map((skill) => (
                  <span key={skill}>✓ {skill}</span>
                ))
              ) : (
                <p style={{ color: "#64748B", fontSize: "13px", fontStyle: "italic", margin: "14px 0" }}>
                  No verified skills registered yet. Add skills in My Profile to calculate accurate matches.
                </p>
              )}
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            <Link to="/profile" className="secondary-button" style={{ display: "inline-block", textDecoration: "none" }}>
              Update Skills →
            </Link>
          </div>
        </div>

        {/* 4. Skill Gap Summary */}
        <div className="dashboard-panel">
          <div>
            <div className="dashboard-panel-header">
              <span className="card-label">GAP ANALYSIS</span>
              <span style={{ color: missingSkills.length > 0 ? "#EF4444" : "#10B981", fontSize: "12px", fontWeight: "700" }}>
                {missingSkills.length} Deficit{missingSkills.length === 1 ? "" : "s"}
              </span>
            </div>

            <h2 className="dashboard-panel-title">Skill Gap Summary</h2>
            <p className="dashboard-panel-desc">
              High-priority skills required for <strong>{targetCareer}</strong> that are not yet verified in your profile.
            </p>

            {missingSkills.length > 0 ? (
              <div className="missing-pill-list">
                {missingSkills.map((skill) => (
                  <span key={skill} className="missing-pill">
                    ✕ {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: "#10B981", fontSize: "14px", fontWeight: "600", margin: "16px 0" }}>
                ✓ No critical skill gaps detected for this path
              </p>
            )}
          </div>

          <div style={{ marginTop: "24px" }}>
            <Link to="/skill-gap" className="secondary-button" style={{ display: "inline-block", textDecoration: "none" }}>
              View Skill Gap →
            </Link>
          </div>
        </div>
      </section>

      {/* Market Intelligence Evidence (when underlying dataset evidence exists) */}
      {targetMarketData?.available && (
        <>
          <GlowSeparator />
          <section>
            <div className="section-heading" style={{ marginBottom: "16px" }}>
              <div>
                <p className="eyebrow">EMPIRICAL BENCHMARK</p>
                <h2 style={{ fontSize: "22px", margin: 0 }}>
                  Observed Market Evidence: <span style={{ color: "#60A5FA" }}>{targetCareer}</span>
                </h2>
              </div>
              <span style={{ fontSize: "12px", color: "#94A3B8", background: "rgba(255, 255, 255, 0.04)", padding: "4px 10px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                DataScience Jobs Benchmark
              </span>
            </div>

            <div className="dashboard-stats-grid">
              <div className="dashboard-stat-card">
                <span>MARKET DEMAND</span>
                <strong style={{ color: "#60A5FA" }}>
                  {(targetMarketData.demand?.postingVolume || targetMarketData.postingVolume).toLocaleString()} Postings
                </strong>
                <small>{targetMarketData.demand?.formattedShare || `${targetMarketData.postingShare}%`} of observed aggregated postings</small>
              </div>

              <div className="dashboard-stat-card">
                <span>AVERAGE SALARY</span>
                <strong style={{ color: "#10B981" }}>
                  {targetMarketData.salary?.formattedAvg || `₹${targetMarketData.avgSalary.toFixed(2)} LPA`}
                </strong>
                <small>Observed range: {targetMarketData.salary?.formattedRange || `₹${targetMarketData.minSalary}–₹${targetMarketData.maxSalary} LPA`}</small>
              </div>

              <div className="dashboard-stat-card">
                <span>EXPERIENCE REQUIREMENT</span>
                <strong style={{ color: "#F59E0B" }}>
                  {targetMarketData.minExperience.toFixed(1)} Years
                </strong>
                <small>Average minimum observed</small>
              </div>

              <div className="dashboard-stat-card">
                <span>TOP MARKET SKILLS</span>
                <strong style={{ fontSize: "14px", color: "#E2E8F0", marginTop: "4px" }}>
                  {targetMarketData.topSkills.slice(0, 3).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")}
                </strong>
                <small>Observed in Analytics Jobs</small>
              </div>
            </div>
          </section>
        </>
      )}

      <GlowSeparator />

      {/* 5. Recommended Career Paths */}
      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">TARGET TRAJECTORIES</p>
            <h2>Recommended Career Paths</h2>
          </div>
          <Link to="/explorer" className="text-button" style={{ textDecoration: "none" }}>
            View all paths →
          </Link>
        </div>

        <div className="path-cards">
          {recommendedPaths.map((career) => {
            const score = getScore(career, profile, mlProject);
            const careerInfo = careerData[career];
            const isSelected = targetCareer === career;
            const matchedSkills = getMatchedSkills(career, profile, mlProject);
            const reason = getPathReason(career, profile, mlProject);

            return (
              <div
                className="path-card"
                key={career}
                style={
                  isSelected
                    ? { borderColor: "#3B82F6", background: "#111111", boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.4)" }
                    : {}
                }
              >
                <div className="path-top">
                  <span>{isSelected ? "ACTIVE TARGET" : "POTENTIAL PATH"}</span>
                  <strong style={{ color: "#60A5FA", fontSize: "18px" }}>{score}% Match</strong>
                </div>

                <h3 style={{ margin: "20px 0 10px", fontSize: "20px" }}>
                  {role} → {career}
                </h3>

                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    borderLeft: "3px solid #3B82F6",
                    margin: "12px 0 16px",
                  }}
                >
                  <p
                    style={{
                      color: "#60A5FA",
                      fontSize: "11px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      margin: "0 0 4px 0",
                    }}
                  >
                    Match Rationale
                  </p>
                  <p
                    style={{
                      color: "#E2E8F0",
                      fontSize: "13px",
                      lineHeight: "1.5",
                      margin: 0,
                    }}
                  >
                    {reason}
                  </p>
                </div>

                <p style={{ color: "#94A3B8", fontSize: "13px", marginBottom: "12px" }}>
                  Estimated preparation time: <strong style={{ color: "#FFFFFF" }}>{careerInfo?.time || "4–6 months"}</strong>
                </p>

                <div className="skill-list" style={{ marginBottom: "20px" }}>
                  {careerInfo?.skills.map((skill) => {
                    const hasSkill = matchedSkills.includes(skill);
                    return (
                      <span
                        key={skill}
                        style={
                          hasSkill
                            ? {}
                            : { borderColor: "rgba(255, 255, 255, 0.14)", background: "rgba(255, 255, 255, 0.04)", color: "#94A3B8" }
                        }
                      >
                        {hasSkill ? "✓ " : "✕ "}
                        {skill}
                      </span>
                    );
                  })}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    className="text-button"
                    onClick={() => setSelectedCareer(career)}
                    style={{ padding: 0 }}
                  >
                    {isSelected ? "✓ Selected" : "Select Path"}
                  </button>

                  <Link
                    to="/explorer"
                    onClick={() => setSelectedCareer(career)}
                    className="text-button"
                    style={{ textDecoration: "none", color: "#60A5FA", fontWeight: "700" }}
                  >
                    Explore →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <GlowSeparator />

      {/* 6. Quick Actions */}
      <section>
        <p className="eyebrow">QUICK NAVIGATOR</p>
        <h2 style={{ fontSize: "28px", marginBottom: "24px" }}>Quick Actions</h2>

        <div className="quick-actions-grid">
          <Link to="/simulator" className="quick-action-card">
            <div>
              <span className="quick-action-icon">⚡</span>
              <h3>Simulate Career</h3>
              <p>Run node graph transition simulations and test What-If experience scenarios.</p>
            </div>
            <span className="quick-action-arrow">Open Simulator →</span>
          </Link>

          <Link to="/explorer" className="quick-action-card">
            <div>
              <span className="quick-action-icon">🧭</span>
              <h3>Explore Careers</h3>
              <p>Benchmark qualifications, requirements, and multi-role transitions.</p>
            </div>
            <span className="quick-action-arrow">Open Explorer →</span>
          </Link>

          <Link to="/roadmap" className="quick-action-card">
            <div>
              <span className="quick-action-icon">🗺️</span>
              <h3>View Roadmap</h3>
              <p>Check ordered learning milestones, project goals, and interview preparation steps.</p>
            </div>
            <span className="quick-action-arrow">Open Roadmap →</span>
          </Link>

          <Link to="/progress" className="quick-action-card">
            <div>
              <span className="quick-action-icon">📈</span>
              <h3>Track Progress</h3>
              <p>Review active competency coverage, verified skills, and roadmap readiness metrics.</p>
            </div>
            <span className="quick-action-arrow">Open Progress →</span>
          </Link>
        </div>
      </section>

      {/* 7. Recent Progress (Profile-based factual metrics only) */}
      <section>
        <p className="eyebrow">METRICS SNAPSHOT</p>
        <h2 style={{ fontSize: "28px", marginBottom: "24px" }}>Profile Status & Progress</h2>

        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <span>CURRENT POSITION</span>
            <strong>{role}</strong>
            <small>Active starting baseline</small>
          </div>

          <div className="dashboard-stat-card">
            <span>TARGET TRAJECTORY</span>
            <strong>{targetCareer}</strong>
            <small>{readinessScore}% current qualification</small>
          </div>

          <div className="dashboard-stat-card">
            <span>DOCUMENTED SKILLS</span>
            <strong>{profileSkillsList.length} Skills</strong>
            <small>Verified in user profile</small>
          </div>

          <div className="dashboard-stat-card">
            <span>UNRESOLVED SKILL GAPS</span>
            <strong style={{ color: missingSkills.length > 0 ? "#EF4444" : "#10B981" }}>
              {missingSkills.length} Gap{missingSkills.length === 1 ? "" : "s"}
            </strong>
            <small>Required for {targetCareer}</small>
          </div>
        </div>
      </section>
    </div>
  );
}
