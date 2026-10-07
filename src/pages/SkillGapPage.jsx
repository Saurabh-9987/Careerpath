import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import GlowSeparator from "../components/GlowSeparator";
import { useCareer } from "../context/CareerContextCore";
import { careerData, skillDescriptions } from "../data/careerData";
import { getCareerMarketData, getJDSWeights } from "../data/careerIntelligence";
import {
  getPathReason,
  getSkillCoveragePercent,
  getCareerScoreBreakdown,
} from "../utils/careerScoring";

const skillExplanations = {
  ...skillDescriptions,
  "Machine Learning": "Core competency for predictive modeling, supervised and unsupervised algorithms, and feature engineering required for this role.",
  "Spark": "Core competency for distributed data processing, Spark DataFrames, and large-scale pipeline data transformation.",
  "Cloud": "Core competency for cloud compute, distributed storage, and managed cloud data services.",
  "Deep Learning": "Advanced competency for neural network architectures, representation learning, and deep model workflows.",
  "Docker": "Engineering competency for application containerization, runtime packaging, and reproducible serving environments.",
  "Python": "Foundational programming competency for data structures, analytical pipelines, and system scripting.",
  "SQL": "Database competency for relational querying, schema management, and structured data extraction.",
  "Statistics": "Analytical competency for statistical modeling, probability evaluation, and hypothesis testing.",
};

export default function SkillGapPage() {
  const navigate = useNavigate();
  const {
    role,
    profile,
    selectedCareer,
    setSelectedCareer,
    mlProject,
  } = useCareer();

  const allCareers = useMemo(() => Object.keys(careerData), []);
  const activeCareer = selectedCareer || "Data Scientist";
  const careerInfo = careerData[activeCareer] || careerData["Data Scientist"];

  const roleEvidence = useMemo(() => {
    return getCareerMarketData(activeCareer);
  }, [activeCareer]);

  const jdsSignals = useMemo(() => {
    return getJDSWeights();
  }, []);

  const topMarketSkillsString = useMemo(() => {
    if (!roleEvidence || !roleEvidence.available) return "";
    if (roleEvidence.topSkills && roleEvidence.topSkills.length > 0) {
      return roleEvidence.topSkills
        .slice(0, 4)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(", ");
    }
    return (careerInfo?.skills || []).slice(0, 3).join(", ");
  }, [roleEvidence, careerInfo]);

  const breakdown = useMemo(() => {
    return getCareerScoreBreakdown(activeCareer, profile, mlProject, role);
  }, [activeCareer, profile, mlProject, role]);

  const score = breakdown.totalScore;
  const missingSkills = breakdown.missingSkills;
  const matchedSkills = breakdown.matchedSkills;
  const pathReason = getPathReason(activeCareer, profile, mlProject, role);

  const totalRequired = careerInfo.skills.length;
  const matchedCount = matchedSkills.length;
  const missingCount = missingSkills.length;
  const progressPercent = getSkillCoveragePercent(activeCareer, profile, mlProject);

  return (
    <div className="skillgap-container">
      {/* 1. Header & 2. Target Career Selector */}
      <section className="skillgap-header">
        <div>
          <p className="eyebrow">COMPETENCY BENCHMARK</p>
          <h1>
            Skill Gap <span>Analyzer</span>
          </h1>
          <p className="skillgap-header-desc">
            Compare your active profile skills against the technical competencies required for your
            selected target career. Identify deficits, evaluate match readiness, and plan your preparation.
          </p>
        </div>

        <div className="skillgap-selector-box">
          <label htmlFor="target-career-select" className="skillgap-selector-label">
            Target Career
          </label>
          <select
            id="target-career-select"
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

      <GlowSeparator />

      {/* 3. Overall Match & 6. Progress Visualization & 7. What-If Integration */}
      <section className="skillgap-overview-card">
        <div className="skillgap-score-box">
          <span className="card-label">PROFILE READINESS</span>
          <div className="skillgap-score-number">{score}%</div>
          <span className="skillgap-score-label">Overall Readiness for {activeCareer}</span>
          <p className="skillgap-score-context">{pathReason}</p>
        </div>

        <div className="skillgap-progress-section">
          <div className="skillgap-progress-header">
            <span className="card-label">REQUIREMENTS COVERAGE</span>
            <span className="skillgap-progress-ratio">
              {matchedCount} / {totalRequired} skills matched ({progressPercent}%)
            </span>
          </div>

          <div className="skillgap-progress-track">
            <div
              className="skillgap-progress-bar"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="skillgap-counts-row">
            <div className="skillgap-count-item matched">
              <span>✓</span>
              <span>{matchedCount} Matched Competencies</span>
            </div>
            <div className="skillgap-count-item missing">
              <span>✕</span>
              <span>{missingCount} Missing Competencies</span>
            </div>
            <div style={{ color: "#94A3B8", fontSize: "13px" }}>
              Baseline: <strong style={{ color: "#FFFFFF" }}>{role}</strong>
            </div>
          </div>

          {mlProject && careerInfo.skills.includes("Machine Learning") && (
            <div
              style={{
                marginTop: "10px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: "rgba(59, 130, 246, 0.12)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                color: "#60A5FA",
                fontSize: "12px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>⚡</span>
              <span>
                ML Project simulation active: Machine Learning competency fulfilled via practical project experience.
              </span>
            </div>
          )}
        </div>
      </section>

      <GlowSeparator />

      {/* Market Evidence Section */}
      <section className="skillgap-market-card" aria-label="Market Evidence">
        <div className="skillgap-market-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span className="card-label" style={{ margin: 0 }}>MARKET EVIDENCE</span>
            <span style={{ color: "#E2E8F0", fontSize: "14px", fontWeight: "700" }}>
              {activeCareer} Benchmark
            </span>
          </div>
          <span className="skillgap-market-badge">
            Based on observed job-market data
          </span>
        </div>

        {roleEvidence && roleEvidence.available ? (
          <>
            <div className="skillgap-market-grid">
              <div className="skillgap-market-stat">
                <span className="skillgap-market-stat-label" style={{ color: "#94A3B8", fontWeight: "700" }}>
                  Market Demand
                </span>
                <span className="skillgap-market-stat-val" style={{ color: "#60A5FA", fontSize: "22px", margin: "3px 0" }}>
                  {(roleEvidence.demand?.postingVolume || roleEvidence.postingVolume).toLocaleString()}
                </span>
                <span className="skillgap-market-stat-label" style={{ fontSize: "11px", color: "#CBD5E1" }}>
                  observed postings
                </span>
              </div>

              <div className="skillgap-market-stat">
                <span className="skillgap-market-stat-label" style={{ color: "#94A3B8", fontWeight: "700" }}>
                  Market Share
                </span>
                <span className="skillgap-market-stat-val" style={{ color: "#A78BFA", fontSize: "22px", margin: "3px 0" }}>
                  {roleEvidence.demand?.formattedShare || `${roleEvidence.postingShare}%`}
                </span>
                <span className="skillgap-market-stat-label" style={{ fontSize: "11px", color: "#CBD5E1" }}>
                  of observed aggregated postings
                </span>
              </div>

              <div className="skillgap-market-stat" style={{ borderLeft: "2px solid #10B981" }}>
                <span className="skillgap-market-stat-label" style={{ color: "#34D399", fontWeight: "700" }}>
                  Average Salary
                </span>
                <span className="skillgap-market-stat-val" style={{ color: "#10B981", fontSize: "22px", margin: "3px 0" }}>
                  {roleEvidence.salary?.formattedAvg || `₹${roleEvidence.avgSalary.toFixed(2)} LPA`}
                </span>
                <span className="skillgap-market-stat-label" style={{ fontSize: "11px", color: "#CBD5E1" }}>
                  Salary Range: <strong>{roleEvidence.salary?.formattedRange || `₹${roleEvidence.minSalary}–₹${roleEvidence.maxSalary} LPA`}</strong>
                </span>
                <small style={{ color: "#64748B", fontSize: "10px", marginTop: "2px", display: "block" }}>
                  Observed in supplied job dataset
                </small>
              </div>

              <div className="skillgap-market-stat">
                <span className="skillgap-market-stat-val" style={{ color: "#60A5FA" }}>
                  {roleEvidence.minExperience.toFixed(1)} yrs
                </span>
                <span className="skillgap-market-stat-label">average minimum experience</span>
              </div>

              <div className="skillgap-market-stat">
                <span className="skillgap-market-stat-label">Top market skills</span>
                <span className="skillgap-market-skills-val">
                  {topMarketSkillsString}
                </span>
              </div>
            </div>

            {/* JDS Empirical Technical Signal */}
            <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Observed Salary-Hike Association (JDS Technical Benchmark)
                </span>
                <span style={{ fontSize: "11px", color: "#64748B" }}>
                  Empirical Pearson correlation weighting
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {jdsSignals.displayBreakdown.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: "6px 10px",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ color: "#E2E8F0" }}>{item.label}:</span>
                    <strong style={{ color: "#3B82F6" }}>{item.weight}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="skillgap-market-empty" style={{ padding: "24px 16px", textAlign: "center" }}>
            <p style={{ margin: "0 0 6px", fontWeight: "700", color: "#E2E8F0", fontSize: "15px" }}>
              Market demand unavailable
            </p>
            <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#94A3B8" }}>
              No direct demand evidence for this role in the supplied datasets.
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#64748B" }}>
              Salary data unavailable — No direct salary evidence for this role in the supplied datasets.
            </p>
          </div>
        )}

        <div className="skillgap-market-disclaimer">
          Observational statistical signals from SAS Hackathon datasets; does not constitute a guarantee of employment or salary.
        </div>
      </section>

      <GlowSeparator />

      {/* Multi-Factor Profile Readiness Mathematical Breakdown */}
      <section className="skillgap-breakdown-section" aria-label="Profile Readiness Scoring Breakdown">
        <div className="skillgap-breakdown-header">
          <div>
            <span className="card-label">SCORING MODEL BREAKDOWN</span>
            <h3 className="skillgap-breakdown-title">
              Profile Readiness Breakdown ({score} / 100 pts)
            </h3>
            <p className="skillgap-breakdown-subtitle">
              Overall readiness is evaluated across 5 key dimensions on a 100-point scale: Core Skills (60 pts), Role Proximity & Experience (12 pts), Education Alignment (10 pts), Hands-on Projects (10 pts), and Career Interests (8 pts).
            </p>
          </div>
          <div className="skillgap-breakdown-total-pill" title="Sum of category scores">
            <span>Formula:</span>
            <strong>{breakdown.skillsScore}</strong> (Skills) + <strong>{breakdown.experienceScore}</strong> (Exp) + <strong>{breakdown.educationScore}</strong> (Edu) + <strong>{breakdown.projectScore}</strong> (Projects) + <strong>{breakdown.interestScore}</strong> (Interests) = <strong>{score}%</strong>
          </div>
        </div>

        {progressPercent === 100 && score < 100 && (
          <div className="skillgap-breakdown-callout">
            <span style={{ fontSize: "18px" }}>ℹ️</span>
            <div>
              <strong>Why {score}% readiness with 100% skill coverage?</strong>
              <div style={{ marginTop: "4px" }}>
                All {totalRequired} required technical competencies are fully verified, contributing the maximum possible skills credit (<strong>{breakdown.skillsScore}/60 pts</strong>). The remaining {100 - breakdown.skillsScore} points evaluate holistic career readiness: your baseline role (<strong>{role}</strong>) contributes <strong>{breakdown.experienceScore}/12 pts</strong> for trajectory proximity, education provides <strong>{breakdown.educationScore}/10 pts</strong>, while projects ({breakdown.projectScore}/10 pts) and interests ({breakdown.interestScore}/8 pts) can be expanded to achieve full 100% readiness.
              </div>
            </div>
          </div>
        )}

        <div className="skillgap-breakdown-grid">
          {/* Dimension 1: Core Skills */}
          <div className="skillgap-breakdown-item">
            <div className="breakdown-item-header">
              <span className="breakdown-item-name">Core Skills</span>
              <span className={`breakdown-item-score ${breakdown.skillsScore === 60 ? "full" : ""}`}>
                {breakdown.skillsScore} / 60 pts
              </span>
            </div>
            <div className="breakdown-progress-track">
              <div
                className="breakdown-progress-fill breakdown-fill-skills"
                style={{ width: `${(breakdown.skillsScore / 60) * 100}%` }}
              />
            </div>
            <div className="breakdown-item-detail">
              {matchedCount} of {totalRequired} required skills verified ({progressPercent}% coverage).
            </div>
          </div>

          {/* Dimension 2: Experience & Role Proximity */}
          <div className="skillgap-breakdown-item">
            <div className="breakdown-item-header">
              <span className="breakdown-item-name">Experience & Role Proximity</span>
              <span className={`breakdown-item-score ${breakdown.experienceScore === 12 ? "full" : ""}`}>
                {breakdown.experienceScore} / 12 pts
              </span>
            </div>
            <div className="breakdown-progress-track">
              <div
                className="breakdown-progress-fill breakdown-fill-exp"
                style={{ width: `${(breakdown.experienceScore / 12) * 100}%` }}
              />
            </div>
            <div className="breakdown-item-detail">
              Baseline: {role} → {activeCareer} trajectory proximity.
            </div>
          </div>

          {/* Dimension 3: Education Alignment */}
          <div className="skillgap-breakdown-item">
            <div className="breakdown-item-header">
              <span className="breakdown-item-name">Education Alignment</span>
              <span className={`breakdown-item-score ${breakdown.educationScore === 10 ? "full" : ""}`}>
                {breakdown.educationScore} / 10 pts
              </span>
            </div>
            <div className="breakdown-progress-track">
              <div
                className="breakdown-progress-fill breakdown-fill-edu"
                style={{ width: `${(breakdown.educationScore / 10) * 100}%` }}
              />
            </div>
            <div className="breakdown-item-detail">
              {profile?.education ? `Academic foundation in "${profile.education.trim()}".` : "No degree/field specified in profile."}
            </div>
          </div>

          {/* Dimension 4: Hands-on Projects */}
          <div className="skillgap-breakdown-item">
            <div className="breakdown-item-header">
              <span className="breakdown-item-name">Hands-on Projects</span>
              <span className={`breakdown-item-score ${breakdown.projectScore === 10 ? "full" : ""}`}>
                {breakdown.projectScore} / 10 pts
              </span>
            </div>
            <div className="breakdown-progress-track">
              <div
                className="breakdown-progress-fill breakdown-fill-proj"
                style={{ width: `${(breakdown.projectScore / 10) * 100}%` }}
              />
            </div>
            <div className="breakdown-item-detail">
              {mlProject ? "Applied What-If project boost applied." : (profile?.projects ? "Documented portfolio projects." : "No projects or What-If simulation active.")}
            </div>
          </div>

          {/* Dimension 5: Career Interests */}
          <div className="skillgap-breakdown-item">
            <div className="breakdown-item-header">
              <span className="breakdown-item-name">Career Interests</span>
              <span className={`breakdown-item-score ${breakdown.interestScore === 8 ? "full" : ""}`}>
                {breakdown.interestScore} / 8 pts
              </span>
            </div>
            <div className="breakdown-progress-track">
              <div
                className="breakdown-progress-fill breakdown-fill-int"
                style={{ width: `${(breakdown.interestScore / 8) * 100}%` }}
              />
            </div>
            <div className="breakdown-item-detail">
              {profile?.interests ? `Domain interests: "${profile.interests.trim()}".` : "No target domains specified in profile."}
            </div>
          </div>
        </div>
      </section>

      <GlowSeparator />

      {/* 4. Skill Comparison & 5. Skill Priority */}
      <section className="skillgap-columns">
        {/* Skills You Have */}
        <div className="skillgap-column-card">
          <div className="skillgap-column-title">
            <span>✓ Skills You Have</span>
            <span style={{ color: "#60A5FA", fontSize: "14px", fontWeight: "800" }}>
              {matchedCount} verified
            </span>
          </div>

          <p style={{ color: "#64748B", fontSize: "13px", lineHeight: "1.5" }}>
            Competencies from your active profile that directly satisfy requirements for <strong>{activeCareer}</strong>.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {matchedSkills.length > 0 ? (
              matchedSkills.map((skill) => (
                <div className="skillgap-item-card" key={skill}>
                  <div className="skillgap-item-header">
                    <span className="skillgap-item-name" style={{ color: "#10B981" }}>
                      ✓ {skill}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#60A5FA",
                        background: "rgba(59, 130, 246, 0.12)",
                        padding: "3px 8px",
                        borderRadius: "10px",
                        fontWeight: "700",
                      }}
                    >
                      Verified
                    </span>
                  </div>
                  <p className="skillgap-item-desc">
                    {skillExplanations[skill] ||
                      "Satisfies one of the core competency requirements for this career track."}
                  </p>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: "24px 20px",
                  textAlign: "center",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px dashed rgba(255, 255, 255, 0.16)",
                  borderRadius: "14px",
                }}
              >
                <p style={{ color: "#94A3B8", fontSize: "13px", margin: "0 0 12px 0" }}>
                  No matching skills documented in your active profile yet for this pathway.
                </p>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ fontSize: "12px", padding: "8px 14px" }}
                  onClick={() => navigate("/profile")}
                >
                  Update Profile Skills →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Skills Missing & Priority */}
        <div className="skillgap-column-card">
          <div className="skillgap-column-title">
            <span>✕ Skills You Are Missing</span>
            <span style={{ color: missingCount > 0 ? "#EF4444" : "#10B981", fontSize: "14px", fontWeight: "800" }}>
              {missingCount} missing
            </span>
          </div>

          <p style={{ color: "#64748B", fontSize: "13px", lineHeight: "1.5" }}>
            Required competencies not yet documented in your profile. These represent your primary preparation gaps.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {missingSkills.length > 0 ? (
              missingSkills.map((skill) => (
                <div
                  className="skillgap-item-card"
                  key={skill}
                  style={{ borderColor: "rgba(239, 68, 68, 0.3)" }}
                >
                  <div className="skillgap-item-header">
                    <span className="skillgap-item-name" style={{ color: "#EF4444" }}>
                      ✕ {skill}
                    </span>
                    <span className="priority-badge">Priority Skill</span>
                  </div>
                  <p className="skillgap-item-desc">
                    {skillExplanations[skill] ||
                      "Core technical competency required for transition to this career path."}
                  </p>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: "30px 20px",
                  textAlign: "center",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: "14px",
                }}
              >
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>🎉</div>
                <h4 style={{ color: "#10B981", fontSize: "16px", marginBottom: "6px" }}>
                  All Core Skills Covered!
                </h4>
                <p style={{ color: "#64748B", fontSize: "13px" }}>
                  Your profile meets all core competency requirements for {activeCareer}.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <GlowSeparator />

      {/* 8. Action Navigation */}
      <section className="skillgap-actions">
        <button
          className="primary-button"
          onClick={() => navigate("/roadmap")}
        >
          Build My Roadmap →
        </button>

        <button
          className="secondary-button"
          onClick={() => navigate("/explorer")}
        >
          Explore Other Careers →
        </button>
      </section>
    </div>
  );
}
