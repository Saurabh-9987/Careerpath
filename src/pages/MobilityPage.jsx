import { useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlowSeparator from "../components/GlowSeparator";
import { useCareer } from "../context/CareerContextCore";
import { careerData } from "../data/careerData";
import { analyzeCareerMobility } from "../data/careerMobilityEngine";

export default function MobilityPage() {
  const navigate = useNavigate();
  const {
    role,
    setRole,
    profile,
    selectedCareer,
    setSelectedCareer,
  } = useCareer();

  const allCareers = useMemo(() => Object.keys(careerData), []);

  // Prefer existing profile/context defaults
  const [currentRole, setCurrentRole] = useState(() => {
    return profile?.role || role || "Data Analyst";
  });

  const [targetRole, setTargetRole] = useState(() => {
    if (selectedCareer && selectedCareer !== (profile?.role || role)) {
      return selectedCareer;
    }
    if (profile?.targetCareer && profile.targetCareer !== (profile?.role || role)) {
      return profile.targetCareer;
    }
    return (profile?.role || role) === "Data Scientist" ? "Machine Learning Engineer" : "Data Scientist";
  });

  const [optimizationMode, setOptimizationMode] = useState("Fastest");

  // Keep contextual target synced if changed
  const handleTargetChange = useCallback((newTarget) => {
    setTargetRole(newTarget);
    if (setSelectedCareer) {
      setSelectedCareer(newTarget);
    }
  }, [setSelectedCareer]);

  // Keep contextual current role synced if changed
  const handleCurrentChange = useCallback((newCurrent) => {
    setCurrentRole(newCurrent);
    if (setRole) {
      setRole(newCurrent);
    }
  }, [setRole]);

  // Swap current and target roles
  const handleSwapRoles = useCallback(() => {
    const temp = currentRole;
    setCurrentRole(targetRole);
    setTargetRole(temp);
    if (setRole) setRole(targetRole);
    if (setSelectedCareer) setSelectedCareer(temp);
  }, [currentRole, targetRole, setRole, setSelectedCareer]);

  // Compute comprehensive mobility analysis using the canonical engine
  const mobility = useMemo(() => {
    return analyzeCareerMobility(currentRole, targetRole, profile, {
      optimizationMode,
    });
  }, [currentRole, targetRole, profile, optimizationMode]);

  const {
    mobilityScore,
    skillGap,
    experienceGap,
    marketOpportunity,
    escapeRoute,
    mlSignals,
    explainability,
  } = mobility;

  // Incomplete profile detection
  const isProfileIncomplete = useMemo(() => {
    const hasRole = Boolean(profile?.role || role);
    const hasSkills = Boolean(profile?.skills && profile.skills.trim().length > 0);
    const hasExp = Boolean(profile?.experience && profile.experience.trim().length > 0);
    return !hasRole || !hasSkills || !hasExp;
  }, [profile, role]);

  const missingProfileAspects = useMemo(() => {
    const missing = [];
    if (!profile?.role && !role) missing.push("current career");
    if (!profile?.skills || !profile.skills.trim()) missing.push("skills");
    if (!profile?.experience || !profile.experience.trim()) missing.push("experience");
    return missing;
  }, [profile, role]);

  // Priority color helpers
  const getScoreColor = (score) => {
    if (score >= 75) return "#10B981"; // Emerald
    if (score >= 45) return "#F59E0B"; // Amber
    return "#EF4444"; // Rose
  };

  const getFrictionColor = (level) => {
    if (level === "Low") return "#10B981";
    if (level === "Moderate") return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div className="mobility-page-container">
      {/* 1. Header & Career Selectors */}
      <section className="mobility-header-section">
        <div>
          <div className="mobility-badge-row">
            <p className="eyebrow">CAREER MOBILITY INTELLIGENCE</p>
            <span className="mobility-system-badge">DATA-DRIVEN ENGINE</span>
          </div>
          <h1 className="mobility-title">
            Career Mobility <span>Simulator</span>
          </h1>
          <p className="mobility-subtitle">
            Evaluate empirical transition feasibility, benchmark skill and experience gaps against
            hackathon datasets, and discover optimized multi-step escape routes.
          </p>
        </div>

        {/* Profile incomplete warning banner if applicable */}
        {isProfileIncomplete && (
          <div className="mobility-incomplete-banner" role="alert">
            <div className="incomplete-banner-icon">ℹ</div>
            <div className="incomplete-banner-content">
              <strong>Incomplete Profile Notice:</strong> Your profile is missing{" "}
              {missingProfileAspects.join(", ")}. The mobility engine evaluates catalog benchmarks with
              explicit unavailable states where candidate inputs are absent.
            </div>
            <Link to="/profile" className="incomplete-banner-link">
              Complete Profile →
            </Link>
          </div>
        )}

        {/* Career Transition Selectors Box */}
        <div className="mobility-transition-selector-card">
          <div className="mobility-selector-group">
            <label htmlFor="current-career-select" className="mobility-selector-label">
              CURRENT CAREER
            </label>
            <select
              id="current-career-select"
              className="mobility-selector-dropdown"
              value={currentRole}
              onChange={(e) => handleCurrentChange(e.target.value)}
            >
              {allCareers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="mobility-selector-hint">Source baseline role</span>
          </div>

          <div className="mobility-swap-wrapper">
            <button
              type="button"
              className="mobility-swap-btn"
              onClick={handleSwapRoles}
              title="Swap current and target roles"
              aria-label="Swap current and target roles"
            >
              ⇄
            </button>
          </div>

          <div className="mobility-selector-group">
            <label htmlFor="target-career-select" className="mobility-selector-label">
              TARGET CAREER
            </label>
            <select
              id="target-career-select"
              className="mobility-selector-dropdown"
              value={targetRole}
              onChange={(e) => handleTargetChange(e.target.value)}
            >
              {allCareers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="mobility-selector-hint">Desired destination role</span>
          </div>
        </div>
      </section>

      <GlowSeparator />

      {/* 2. Mobility Score Hero */}
      <section className="mobility-hero-score-section">
        <div className="mobility-hero-card">
          <div className="mobility-hero-score-display">
            <div className="mobility-hero-score-header">
              <span className="card-label">COMPATIBILITY RATING</span>
              <span
                className="mobility-tier-pill"
                style={{
                  color: getScoreColor(mobilityScore.overallScore),
                  borderColor: `${getScoreColor(mobilityScore.overallScore)}40`,
                  backgroundColor: `${getScoreColor(mobilityScore.overallScore)}15`,
                }}
              >
                {mobilityScore.ratingTier} Compatibility
              </span>
            </div>

            <h2 className="mobility-hero-headline">Career Mobility Compatibility</h2>

            <div className="mobility-score-circle-row">
              <div
                className="mobility-big-score"
                style={{ color: getScoreColor(mobilityScore.overallScore) }}
              >
                {mobilityScore.overallScore}
                <span className="mobility-score-denom">/100</span>
              </div>
              <div className="mobility-coverage-box">
                <span className="mobility-coverage-title">Evidence coverage:</span>
                <span className="mobility-coverage-value">
                  {mobilityScore.normalization.evidenceCoveragePercent}%
                </span>
                <span className="mobility-coverage-note">
                  {mobilityScore.normalization.method}
                </span>
              </div>
            </div>

            <p className="mobility-score-summary-text">{explainability.headline}</p>
          </div>

          {/* 5 Component Breakdown Cards */}
          <div className="mobility-components-grid">
            {/* Component 1: Skill Fit */}
            <div className="mobility-component-card">
              <div className="component-card-top">
                <span className="component-title">Skill Fit</span>
                <span className="component-badge measured">MEASURED</span>
              </div>
              <div className="component-points-row">
                <span className="component-points">
                  {mobilityScore.components.skillFit.score}
                </span>
                <span className="component-max">/ {mobilityScore.components.skillFit.maxPoints} pts</span>
              </div>
              <div className="component-bar-track">
                <div
                  className="component-bar-fill"
                  style={{
                    width: `${Math.round(
                      (mobilityScore.components.skillFit.score /
                        mobilityScore.components.skillFit.maxPoints) *
                        100
                    )}%`,
                    backgroundColor: "#3B82F6",
                  }}
                />
              </div>
              <p className="component-explanation">
                {mobilityScore.components.skillFit.explanation}
              </p>
            </div>

            {/* Component 2: Experience Fit */}
            <div className="mobility-component-card">
              <div className="component-card-top">
                <span className="component-title">Experience Fit</span>
                <span
                  className={`component-badge ${
                    mobilityScore.components.experienceFit.available ? "measured" : "unmeasured"
                  }`}
                >
                  {mobilityScore.components.experienceFit.available ? "MEASURED" : "UNAVAILABLE"}
                </span>
              </div>
              <div className="component-points-row">
                <span className="component-points">
                  {mobilityScore.components.experienceFit.available
                    ? mobilityScore.components.experienceFit.score
                    : "--"}
                </span>
                <span className="component-max">
                  / {mobilityScore.components.experienceFit.maxPoints} pts
                </span>
              </div>
              <div className="component-bar-track">
                <div
                  className="component-bar-fill"
                  style={{
                    width: mobilityScore.components.experienceFit.available
                      ? `${Math.round(
                          (mobilityScore.components.experienceFit.score /
                            mobilityScore.components.experienceFit.maxPoints) *
                            100
                        )}%`
                      : "0%",
                    backgroundColor: "#10B981",
                  }}
                />
              </div>
              <p className="component-explanation">
                {mobilityScore.components.experienceFit.explanation}
              </p>
            </div>

            {/* Component 3: Mobility Ease */}
            <div className="mobility-component-card">
              <div className="component-card-top">
                <span className="component-title">Mobility Ease</span>
                <span className="component-badge measured">MEASURED</span>
              </div>
              <div className="component-points-row">
                <span className="component-points">
                  {mobilityScore.components.mobilityEase.score}
                </span>
                <span className="component-max">
                  / {mobilityScore.components.mobilityEase.maxPoints} pts
                </span>
              </div>
              <div className="component-bar-track">
                <div
                  className="component-bar-fill"
                  style={{
                    width: `${Math.round(
                      (mobilityScore.components.mobilityEase.score /
                        mobilityScore.components.mobilityEase.maxPoints) *
                        100
                    )}%`,
                    backgroundColor: "#8B5CF6",
                  }}
                />
              </div>
              <p className="component-explanation">
                {mobilityScore.components.mobilityEase.explanation}
              </p>
            </div>

            {/* Component 4: Market Opportunity */}
            <div className="mobility-component-card">
              <div className="component-card-top">
                <span className="component-title">Market Opportunity</span>
                <span
                  className={`component-badge ${
                    mobilityScore.components.marketOpportunity.available ? "measured" : "unmeasured"
                  }`}
                >
                  {mobilityScore.components.marketOpportunity.available ? "MEASURED" : "NOT OBSERVED"}
                </span>
              </div>
              <div className="component-points-row">
                <span className="component-points">
                  {mobilityScore.components.marketOpportunity.available
                    ? mobilityScore.components.marketOpportunity.score
                    : "--"}
                </span>
                <span className="component-max">
                  / {mobilityScore.components.marketOpportunity.maxPoints} pts
                </span>
              </div>
              <div className="component-bar-track">
                <div
                  className="component-bar-fill"
                  style={{
                    width: mobilityScore.components.marketOpportunity.available
                      ? `${Math.round(
                          (mobilityScore.components.marketOpportunity.score /
                            mobilityScore.components.marketOpportunity.maxPoints) *
                            100
                        )}%`
                      : "0%",
                    backgroundColor: "#06B6D4",
                  }}
                />
              </div>
              <p className="component-explanation">
                {mobilityScore.components.marketOpportunity.explanation}
              </p>
            </div>

            {/* Component 5: Salary Signal */}
            <div className="mobility-component-card">
              <div className="component-card-top">
                <span className="component-title">Salary Signal</span>
                <span
                  className={`component-badge ${
                    mobilityScore.components.salarySignal.available ? "measured" : "unmeasured"
                  }`}
                >
                  {mobilityScore.components.salarySignal.available ? "MEASURED" : "NOT OBSERVED"}
                </span>
              </div>
              <div className="component-points-row">
                <span className="component-points">
                  {mobilityScore.components.salarySignal.available
                    ? mobilityScore.components.salarySignal.score
                    : "--"}
                </span>
                <span className="component-max">
                  / {mobilityScore.components.salarySignal.maxPoints} pts
                </span>
              </div>
              <div className="component-bar-track">
                <div
                  className="component-bar-fill"
                  style={{
                    width: mobilityScore.components.salarySignal.available
                      ? `${Math.round(
                          (mobilityScore.components.salarySignal.score /
                            mobilityScore.components.salarySignal.maxPoints) *
                            100
                        )}%`
                      : "0%",
                    backgroundColor: "#F59E0B",
                  }}
                />
              </div>
              <p className="component-explanation">
                {mobilityScore.components.salarySignal.explanation}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Current -> Target Summary */}
      <section className="mobility-summary-strip">
        <div className="summary-transition-pill">
          <span className="summary-role current">{currentRole}</span>
          <span className="summary-arrow">➔</span>
          <span className="summary-role target">{targetRole}</span>
        </div>

        <div className="mobility-metrics-chips-grid">
          <div className="metric-chip">
            <span className="metric-chip-label">SKILL COVERAGE</span>
            <strong className="metric-chip-value">
              {skillGap.coveragePercentage}%
            </strong>
            <small className="metric-chip-sub">
              {skillGap.matchedSkillCount} / {skillGap.coreSkillCount} core skills
            </small>
          </div>

          <div className="metric-chip">
            <span className="metric-chip-label">EXPERIENCE GAP</span>
            <strong
              className="metric-chip-value"
              style={{
                color:
                  experienceGap.available && experienceGap.gapYears === 0
                    ? "#10B981"
                    : experienceGap.available
                    ? "#F59E0B"
                    : "#94A3B8",
              }}
            >
              {experienceGap.available
                ? experienceGap.gapYears === 0
                  ? "Meets Benchmark"
                  : `${experienceGap.gapYears} yrs deficit`
                : experienceGap.targetExperience?.available
                ? "Experience Missing"
                : "Unavailable"}
            </strong>
            <small className="metric-chip-sub">
              {experienceGap.targetExperience?.available
                ? `Benchmark: ${experienceGap.targetExperience.minYears} yrs`
                : "No dataset benchmark"}
            </small>
          </div>

          <div className="metric-chip">
            <span className="metric-chip-label">MARKET DEMAND</span>
            <strong className="metric-chip-value">
              {marketOpportunity.marketDataAvailable
                ? marketOpportunity.demandTier
                : "Unobserved"}
            </strong>
            <small className="metric-chip-sub">
              {marketOpportunity.marketDataAvailable
                ? `${marketOpportunity.formattedVolume} postings`
                : "Role outside dataset"}
            </small>
          </div>

          <div className="metric-chip">
            <span className="metric-chip-label">OBSERVED SALARY</span>
            <strong className="metric-chip-value" style={{ color: "#10B981" }}>
              {marketOpportunity.marketDataAvailable && marketOpportunity.avgSalary
                ? marketOpportunity.formattedAvgSalary
                : "Unobserved"}
            </strong>
            <small className="metric-chip-sub">
              {marketOpportunity.marketDataAvailable && marketOpportunity.salaryRange
                ? marketOpportunity.salaryRange
                : "No empirical salary"}
            </small>
          </div>

          <div className="metric-chip">
            <span className="metric-chip-label">MOBILITY FRICTION</span>
            <strong
              className="metric-chip-value"
              style={{
                color: getFrictionColor(escapeRoute.mobilityFriction?.level),
              }}
            >
              {escapeRoute.mobilityFriction?.score ?? 50}/100
            </strong>
            <small className="metric-chip-sub">
              {escapeRoute.mobilityFriction?.level || "Moderate"} transition friction
            </small>
          </div>
        </div>
      </section>

      <GlowSeparator />

      {/* 4. Skill Gap Section */}
      <section className="mobility-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CANONICAL COMPETENCY GAP</p>
            <h2>Skill Gap Analysis</h2>
            <p className="section-desc">
              Deterministic comparison between candidate profile skills and the target catalog
              requirements for <strong>{targetRole}</strong>.
            </p>
          </div>
          <span className="coverage-badge">
            {skillGap.coveragePercentage}% Covered
          </span>
        </div>

        <div className="mobility-skillgap-grid">
          {/* Matched Skills */}
          <div className="skill-category-card matched">
            <div className="skill-category-header">
              <span className="category-title">MATCHED SKILLS</span>
              <span className="category-count">{skillGap.matchedSkills.length}</span>
            </div>
            <p className="skill-category-desc">Verified skills present in your candidate profile.</p>
            <div className="skill-pills-wrap">
              {skillGap.matchedSkills.length > 0 ? (
                skillGap.matchedSkills.map((skill) => (
                  <span key={skill} className="skill-pill matched">
                    ✓ {skill}
                  </span>
                ))
              ) : (
                <p className="empty-skill-msg">No verified profile skills match the target role requirements.</p>
              )}
            </div>
          </div>

          {/* Missing Core Skills */}
          <div className="skill-category-card missing">
            <div className="skill-category-header">
              <span className="category-title">MISSING CORE SKILLS</span>
              <span className="category-count deficit">{skillGap.missingSkills.length}</span>
            </div>
            <p className="skill-category-desc">Mandatory competencies required for baseline role proficiency.</p>
            <div className="skill-pills-wrap">
              {skillGap.missingSkills.length > 0 ? (
                skillGap.missingSkills.map((skill) => (
                  <span key={skill} className="skill-pill missing">
                    ✕ {skill}
                  </span>
                ))
              ) : (
                <p className="complete-skill-msg">✓ All core catalog skills are satisfied by your profile!</p>
              )}
            </div>
          </div>

          {/* Recommended Skills */}
          <div className="skill-category-card recommended">
            <div className="skill-category-header">
              <span className="category-title">RECOMMENDED SKILLS</span>
              <span className="category-count">{skillGap.recommendedSkills?.length || 0}</span>
            </div>
            <p className="skill-category-desc">Secondary toolsets and frameworks that boost competitiveness.</p>
            <div className="skill-pills-wrap">
              {skillGap.recommendedSkills && skillGap.recommendedSkills.length > 0 ? (
                skillGap.recommendedSkills.map((skill) => (
                  <span key={skill} className="skill-pill recommended">
                    ✦ {skill}
                  </span>
                ))
              ) : (
                <p className="empty-skill-msg">No additional recommended skills defined in catalog.</p>
              )}
            </div>
          </div>

          {/* Priority Skills */}
          <div className="skill-category-card priority">
            <div className="skill-category-header">
              <span className="category-title">PRIORITY SKILLS</span>
              <span className="category-count highlight">{skillGap.highestPriorityMissingSkills.length}</span>
            </div>
            <p className="skill-category-desc">Ordered by impact weights to maximize mobility velocity.</p>
            <div className="priority-skills-list">
              {skillGap.highestPriorityMissingSkills.length > 0 ? (
                skillGap.highestPriorityMissingSkills.map((skill, idx) => (
                  <div key={skill} className="priority-item">
                    <span className="priority-rank">#{idx + 1}</span>
                    <span className="priority-name">{skill}</span>
                    <span className="priority-tag">Immediate Focus</span>
                  </div>
                ))
              ) : (
                <p className="complete-skill-msg">✓ No priority skill deficits identified.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <GlowSeparator />

      {/* 5. Experience Gap Section */}
      <section className="mobility-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">SENIORITY BENCHMARK</p>
            <h2>Experience Gap Evaluation</h2>
            <p className="section-desc">
              Candidate experience verified against empirical minimum requirements from dataset job postings.
            </p>
          </div>
        </div>

        <div className="experience-evaluation-grid">
          <div className="experience-stat-card">
            <span className="stat-card-label">YOUR EXPERIENCE</span>
            <div className="stat-card-main">
              {experienceGap.currentExperience?.available ? (
                <>
                  <span className="stat-card-number">{experienceGap.currentExperience.years}</span>
                  <span className="stat-card-unit">years</span>
                </>
              ) : (
                <span className="stat-card-text">Not provided in profile</span>
              )}
            </div>
            <small className="stat-card-footnote">Source: USER-PROVIDED DATA</small>
          </div>

          <div className="experience-stat-card">
            <span className="stat-card-label">TARGET BENCHMARK</span>
            <div className="stat-card-main">
              {experienceGap.targetExperience?.available ? (
                <>
                  <span className="stat-card-number">{experienceGap.targetExperience.minYears}</span>
                  <span className="stat-card-unit">years</span>
                </>
              ) : (
                <span className="stat-card-text unavailable">
                  Experience benchmark unavailable in the provided dataset.
                </span>
              )}
            </div>
            <small className="stat-card-footnote">
              {experienceGap.targetExperience?.source || "MARKET EVIDENCE"}
            </small>
          </div>

          <div className="experience-stat-card highlight">
            <span className="stat-card-label">STATUS</span>
            <div className="stat-card-main">
              {experienceGap.available ? (
                experienceGap.gapYears === 0 ? (
                  <span className="status-badge success">
                    ✓ Meets Benchmark {experienceGap.surplusYears > 0 ? `(+${experienceGap.surplusYears} yrs)` : ""}
                  </span>
                ) : (
                  <span className="status-badge deficit">
                    ✕ Experience Gap: {experienceGap.gapYears} years
                  </span>
                )
              ) : !experienceGap.targetExperience?.available ? (
                <span className="status-badge neutral">
                  Experience benchmark unavailable in the provided dataset.
                </span>
              ) : (
                <span className="status-badge warning">
                  Candidate experience not provided or unparseable.
                </span>
              )}
            </div>
            <small className="stat-card-footnote">
              {experienceGap.available && experienceGap.gapYears > 0
                ? "Seniority gap may increase transition friction"
                : "Evaluated without synthetic padding"}
            </small>
          </div>
        </div>
      </section>

      <GlowSeparator />

      {/* 6. Market Evidence vs 7. ML Signals (Visually Separate) */}
      <section className="mobility-split-section">
        {/* Left: 6. Market Evidence */}
        <div className="market-evidence-panel">
          <div className="evidence-panel-header">
            <div>
              <span className="panel-category-tag market">MARKET EVIDENCE</span>
              <h3 className="evidence-panel-title">Empirical Market Data</h3>
              <p className="evidence-panel-desc">
                Observed statistics extracted strictly from hackathon job postings (DataScience Jobs & Analytics Jobs).
              </p>
            </div>
            <span className="evidence-source-tag">OBSERVED POSTINGS</span>
          </div>

          {marketOpportunity.marketDataAvailable ? (
            <div className="market-details-body">
              <div className="market-stats-row">
                <div className="market-metric-box">
                  <span className="metric-box-label">Observed Job Postings</span>
                  <span className="metric-box-val">{marketOpportunity.formattedVolume}</span>
                  <small className="metric-box-sub">
                    {marketOpportunity.postingShare}% of analyzed market
                  </small>
                </div>

                <div className="market-metric-box">
                  <span className="metric-box-label">Demand Tier</span>
                  <span className="metric-box-val highlight">{marketOpportunity.demandTier}</span>
                  <small className="metric-box-sub">Posting liquidity index</small>
                </div>

                <div className="market-metric-box">
                  <span className="metric-box-label">Observed Average Salary</span>
                  <span className="metric-box-val green">
                    {marketOpportunity.formattedAvgSalary || `₹${marketOpportunity.avgSalary} LPA`}
                  </span>
                  <small className="metric-box-sub">Empirical compensation average</small>
                </div>

                <div className="market-metric-box">
                  <span className="metric-box-label">Salary Range</span>
                  <span className="metric-box-val">
                    {marketOpportunity.salaryRange ||
                      `₹${marketOpportunity.minSalary}–₹${marketOpportunity.maxSalary} LPA`}
                  </span>
                  <small className="metric-box-sub">Min–max observed bracket</small>
                </div>
              </div>

              {/* Top Companies */}
              {marketOpportunity.topHiringCompanies &&
                marketOpportunity.topHiringCompanies.length > 0 && (
                  <div className="market-sublist">
                    <span className="sublist-heading">TOP HIRING COMPANIES:</span>
                    <div className="sublist-chips">
                      {marketOpportunity.topHiringCompanies.slice(0, 6).map((co) => {
                        const name = typeof co === "object" ? (co.companyName || co.name || "Company") : co;
                        const vol = typeof co === "object" && typeof co.jobVolume === "number" ? ` (${co.jobVolume.toLocaleString()})` : "";
                        return (
                          <span key={name} className="market-chip">
                            🏢 {name}{vol}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Top Locations */}
              {marketOpportunity.topLocations && marketOpportunity.topLocations.length > 0 && (
                <div className="market-sublist">
                  <span className="sublist-heading">TOP HIRING HUBS:</span>
                  <div className="sublist-chips">
                    {marketOpportunity.topLocations.slice(0, 5).map((loc) => {
                      const cityName = loc.city || loc.location || "Regional Hub";
                      const volume = typeof loc.jobCount === "number" ? loc.jobCount : (typeof loc.postingVolume === "number" ? loc.postingVolume : null);
                      return (
                        <span key={cityName} className="market-chip">
                          📍 {cityName}{volume !== null ? ` (${volume.toLocaleString()})` : ""}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="market-unavailable-box">
              <div className="unavailable-icon">📊</div>
              <h4>Market evidence unavailable for this role in the provided dataset.</h4>
              <p>
                The hackathon datasets do not contain empirical job postings for <strong>{targetRole}</strong>.
                No proxy values, synthetic estimates, or fabricated postings are displayed.
              </p>
            </div>
          )}
        </div>

        {/* Right: 7. ML Signals */}
        <div className="ml-signals-panel">
          <div className="evidence-panel-header">
            <div>
              <span className="panel-category-tag ml">MODEL PREDICTION</span>
              <h3 className="evidence-panel-title">Trained ML Signals</h3>
              <p className="evidence-panel-desc">
                Supervised classification and regression models trained on hackathon skill & personality datasets.
              </p>
            </div>
            <span className="evidence-source-tag ml">STATISTICAL INFERENCE</span>
          </div>

          <div className="ml-cards-stack">
            {/* JDS Technical Capability Signal */}
            <div className="ml-signal-card">
              <div className="ml-card-header">
                <span className="ml-card-name">Technical Capability Signal</span>
                <span className="ml-model-pill">JDS Model (Logistic Reg)</span>
              </div>
              <p className="ml-card-desc">
                Observational salary-hike probability inferred from 5 technical skill dimensions.
              </p>

              {mlSignals.technicalSignal?.available ? (
                <div className="ml-signal-result">
                  <div className="ml-prob-row">
                    <span className="ml-prob-val">
                      {mlSignals.technicalSignal.confidencePercent}%
                    </span>
                    <span
                      className={`ml-prob-pill ${
                        mlSignals.technicalSignal.predictedClass === 1 ? "positive" : "standard"
                      }`}
                    >
                      {mlSignals.technicalSignal.likelihoodBand}
                    </span>
                  </div>
                  <div className="ml-dims-summary">
                    <span>Dimension coverage:</span>
                    <strong style={{ color: "#E2E8F0" }}>
                      {" "}
                      {
                        Object.values(mlSignals.technicalSignal.dimensionMatches || {}).filter(
                          (m) => m.matched
                        ).length
                      }{" "}
                      of 5 dimensions mapped
                    </strong>
                  </div>
                </div>
              ) : (
                <p className="ml-unavail-note">
                  {mlSignals.technicalSignal?.message ||
                    "Add technical skills to your profile to calculate model probability."}
                </p>
              )}
            </div>

            {/* Salary Regressor Estimate */}
            <div className="ml-signal-card">
              <div className="ml-card-header">
                <span className="ml-card-name">Salary Model Estimate</span>
                <span className="ml-model-pill">Linear Regressor (CV R²: 0.835)</span>
              </div>
              <p className="ml-card-desc">
                Statistical regression estimate based on role benchmark and candidate experience.
              </p>

              {mlSignals.salaryPrediction?.available ? (
                <div className="ml-signal-result">
                  <div className="ml-prob-row">
                    <span className="ml-prob-val green">
                      ₹{mlSignals.salaryPrediction.predictedSalaryLPA} LPA
                    </span>
                    <span className="ml-prob-pill standard">Regression Estimate</span>
                  </div>
                  <small style={{ color: "#94A3B8", fontSize: "11px" }}>
                    Evaluated at {mlSignals.salaryPrediction.inputExperience} yrs experience (user-provided)
                  </small>
                </div>
              ) : (
                <p className="ml-unavail-note">
                  {mlSignals.salaryPrediction?.message ||
                    "Add candidate experience in profile to generate model salary estimate."}
                </p>
              )}
            </div>

            {/* SDS Personality Signal */}
            <div className="ml-signal-card">
              <div className="ml-card-header">
                <span className="ml-card-name">Personality Signal</span>
                <span className="ml-model-pill">SDS Leadership Model</span>
              </div>
              <p className="ml-card-desc">
                Senior leadership classification inferred from Big Five personality traits.
              </p>

              {mlSignals.personalitySignal?.available ? (
                <div className="ml-signal-result">
                  <div className="ml-prob-row">
                    <span className="ml-prob-val purple">
                      {mlSignals.personalitySignal.confidencePercent}%
                    </span>
                    <span className="ml-prob-pill purple">
                      {mlSignals.personalitySignal.outcomeLabel}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="ml-unavail-note">
                  {mlSignals.personalitySignal?.message ||
                    "Personality traits not completed. Complete assessment in profile to unlock."}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <GlowSeparator />

      {/* 8. Career Escape Route & 9. "Why This Route?" Explanation */}
      <section className="mobility-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">INTELLIGENT TRANSITION PATHWAY</p>
            <h2>Career Escape Route</h2>
            <p className="section-desc">
              Algorithmic graph routing to discover optimal single or multi-step transition pathways.
            </p>
          </div>

          {/* Route Optimization Tabs */}
          <div className="route-opt-tabs" role="tablist">
            {["Fastest", "Skill Fit", "Market"].map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={optimizationMode === mode}
                className={`route-opt-tab ${optimizationMode === mode ? "active" : ""}`}
                onClick={() => setOptimizationMode(mode)}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="escape-route-main-card">
          <div className="route-card-top-row">
            <div className="route-type-badge">
              <span className="type-dot" />
              <span>
                {escapeRoute.selectedRoute?.type === "direct"
                  ? "Direct Transition (1 Step)"
                  : `Multi-Step Route (${escapeRoute.selectedRoute?.steps || 2} Transitions)`}
              </span>
            </div>

            <div className="route-stats-strip">
              <span className="route-stat-item">
                Optimization: <strong>{optimizationMode}</strong>
              </span>
              <span className="route-stat-item">
                Friction:{" "}
                <strong
                  style={{
                    color: getFrictionColor(escapeRoute.selectedRoute?.mobilityFriction?.level),
                  }}
                >
                  {escapeRoute.selectedRoute?.mobilityFriction?.score ?? 50}/100
                </strong>
              </span>
              <span className="route-stat-item">
                Transitions: <strong>{escapeRoute.selectedRoute?.steps || 1}</strong>
              </span>
            </div>
          </div>

          {/* Stepper / Nodes Pathway */}
          <div className="route-stepper-visual">
            {(escapeRoute.selectedRoute?.careers || [currentRole, targetRole]).map(
              (career, index, arr) => (
                <div key={career} className="stepper-node-wrap">
                  <div
                    className={`stepper-node ${
                      index === 0
                        ? "source"
                        : index === arr.length - 1
                        ? "target"
                        : "intermediate"
                    }`}
                  >
                    <span className="node-index">{index + 1}</span>
                    <span className="node-title">{career}</span>
                    <span className="node-role-type">
                      {index === 0
                        ? "Current Role"
                        : index === arr.length - 1
                        ? "Target Role"
                        : "Bridge Role"}
                    </span>
                  </div>
                  {index < arr.length - 1 && (
                    <div className="stepper-connector">
                      <div className="connector-line" />
                      <span className="connector-arrow">➔</span>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* 9. "Why This Route?" Explanation */}
          <div className="why-route-container">
            <h4 className="why-route-heading">Why this route?</h4>
            <div className="why-blockers-grid">
              <div className="why-column">
                <span className="why-col-title">SUPPORTING FACTORS</span>
                <ul className="why-list">
                  {explainability.why.map((reason, idx) => (
                    <li key={idx} className="why-item positive">
                      <span className="why-bullet">✓</span>
                      <span>{reason.replace(/^\+\s*/, "")}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="why-column blockers">
                <span className="why-col-title">MAIN BLOCKERS & DEFICITS</span>
                <ul className="why-list">
                  {explainability.blockers.map((blocker, idx) => (
                    <li key={idx} className="why-item deficit">
                      <span className="why-bullet">•</span>
                      <span>{blocker.replace(/^-\s*/, "")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Turn Route into Actionable Roadmap Button */}
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="primary-button"
                onClick={() => navigate("/roadmap", { state: { selectedCareer: targetRole } })}
              >
                Turn Route into Actionable Roadmap →
              </button>
            </div>
          </div>
        </div>
      </section>

      <GlowSeparator />

      {/* 10. Next Best Actions & 11. What-If Entry Point */}
      <section className="mobility-action-strip">
        <div className="next-actions-panel">
          <div className="actions-header">
            <p className="eyebrow">ACTIONABLE PREPARATION</p>
            <h3 className="actions-title">Your Next Best Actions</h3>
            <p className="actions-subtitle">
              Prioritized recommendations to bridge identified competency gaps and accelerate transition velocity.
            </p>
          </div>

          <div className="actions-list">
            {skillGap.highestPriorityMissingSkills.length > 0 ? (
              skillGap.highestPriorityMissingSkills.slice(0, 3).map((skill, index) => (
                <div key={skill} className="action-row">
                  <span className="action-num">{index + 1}</span>
                  <div className="action-text-wrap">
                    <strong className="action-headline">
                      Learn {skill}
                    </strong>
                    <p className="action-detail">
                      Core competency deficit for {targetRole}. Complete targeted coursework and add verified projects.
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="action-row">
                <span className="action-num">1</span>
                <div className="action-text-wrap">
                  <strong className="action-headline">Polish Domain Portfolio</strong>
                  <p className="action-detail">
                    All core catalog competencies are matched. Focus on end-to-end domain artifacts.
                  </p>
                </div>
              </div>
            )}

            {/* Experience deficit action if applicable */}
            {experienceGap.available && experienceGap.gapYears > 0 && (
              <div className="action-row">
                <span className="action-num">
                  {Math.min(4, skillGap.highestPriorityMissingSkills.length + 1)}
                </span>
                <div className="action-text-wrap">
                  <strong className="action-headline">
                    Gain {experienceGap.gapYears} Year(s) Applied Experience
                  </strong>
                  <p className="action-detail">
                    Target dataset benchmark requires {experienceGap.targetExperience.minYears} years minimum industry experience.
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="action-disclaimer">
            Disclaimer: These actions are derived from empirical skill deficits and observational dataset distributions.
            They are intended for career preparation guidance and do not guarantee employment, interviews, or compensation levels.
          </p>
        </div>

        {/* 11. What-If Entry Point Card */}
        <div className="what-if-gateway-card">
          <span className="gateway-label">SIMULATE PROGRESSION</span>
          <h3 className="gateway-title">Test What-If Scenarios</h3>
          <p className="gateway-desc">
            Want to see how acquiring <strong>{skillGap.highestPriorityMissingSkills[0] || "new skills"}</strong> or
            adding experience impacts your mobility score and qualification before committing?
          </p>
          <div className="gateway-btn-wrap">
            <button
              type="button"
              className="primary-button what-if-btn"
              onClick={() => navigate("/simulator")}
            >
              Try What-If Simulator →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
