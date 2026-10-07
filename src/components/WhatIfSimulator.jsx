import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { careerData } from "../data/careerData";
import { simulateWhatIf } from "../data/careerMobilityEngine";

export default function WhatIfSimulator({
  activeCareer = "Data Scientist",
  role = "Data Analyst",
  profile = {},
  _mlProject = false,
  _onToggleMlProject,
  onTargetSelect,
}) {
  const navigate = useNavigate();
  const allCareers = useMemo(() => Object.keys(careerData), []);

  // What-If scenario modifications state
  const [additionalSkills, setAdditionalSkills] = useState([]);
  const [additionalExpYears, setAdditionalExpYears] = useState(0);
  const [overrideTargetRole, setOverrideTargetRole] = useState("");
  const [skillInputText, setSkillInputText] = useState("");

  // Determine current roles and values
  const currentRole = role || profile?.role || "Data Analyst";
  const baselineTarget = activeCareer || profile?.targetCareer || "Data Scientist";
  const effectiveTarget = overrideTargetRole || baselineTarget;

  // Execute canonical simulation using simulateWhatIf engine
  const simulation = useMemo(() => {
    return simulateWhatIf(currentRole, baselineTarget, profile, {
      additionalSkills,
      additionalExperienceYears: additionalExpYears,
      overrideTargetRole: overrideTargetRole || undefined,
    });
  }, [currentRole, baselineTarget, profile, additionalSkills, additionalExpYears, overrideTargetRole]);

  const { baseline, simulated, delta } = simulation;

  // Add a skill to What-If modifications
  const handleAddSkill = useCallback(
    (skillName) => {
      const trimmed = (skillName || "").trim();
      if (!trimmed) return;
      if (!additionalSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
        setAdditionalSkills((prev) => [...prev, trimmed]);
      }
      setSkillInputText("");
    },
    [additionalSkills]
  );

  // Remove a skill from What-If modifications
  const handleRemoveSkill = useCallback((skillName) => {
    setAdditionalSkills((prev) => prev.filter((s) => s !== skillName));
  }, []);

  // Reset What-If scenario to base profile
  const handleReset = useCallback(() => {
    setAdditionalSkills([]);
    setAdditionalExpYears(0);
    setOverrideTargetRole("");
    setSkillInputText("");
  }, []);

  // Sync target override with parent if requested
  const handleTargetChange = (newTarget) => {
    setOverrideTargetRole(newTarget);
    if (onTargetSelect) {
      onTargetSelect(newTarget);
    }
  };

  const hasModifications =
    additionalSkills.length > 0 ||
    additionalExpYears > 0 ||
    (overrideTargetRole && overrideTargetRole !== baselineTarget);

  // Score color helper
  const getScoreColor = (score) => {
    if (score >= 75) return "#10B981";
    if (score >= 45) return "#F59E0B";
    return "#EF4444";
  };

  // Missing skills from baseline that user can quickly click to add
  const quickAddCandidates = useMemo(() => {
    const missing = baseline?.skillGap?.missingSkills || [];
    return missing.filter(
      (skill) => !additionalSkills.some((s) => s.toLowerCase() === skill.toLowerCase())
    );
  }, [baseline, additionalSkills]);

  return (
    <aside className="what-if-panel" aria-label="What-If Career Simulator">
      {/* 1. Header & Current Profile */}
      <div className="what-if-header">
        <div className="what-if-eyebrow-row">
          <p className="eyebrow">WHAT-IF SIMULATOR</p>
          <span className="what-if-engine-tag">STAGE 9 ENGINE</span>
        </div>
        <h3 className="what-if-title">Career Trajectory Sandbox</h3>
        <p className="what-if-desc">
          Test how acquiring new skills, gaining years of experience, or switching your target career
          changes your mobility compatibility score and escape route.
        </p>

        {/* Current Profile Summary Card */}
        <div className="what-if-profile-card">
          <div className="profile-card-top">
            <span className="profile-card-label">CURRENT PROFILE BASELINE</span>
            {hasModifications && (
              <span className="profile-active-mod-badge">Active Scenario</span>
            )}
          </div>

          <div className="profile-baseline-grid">
            <div className="profile-prop">
              <span className="prop-name">Current Career:</span>
              <strong className="prop-val">{currentRole}</strong>
            </div>

            <div className="profile-prop">
              <span className="prop-name">Target Career:</span>
              <strong className="prop-val highlight">{baselineTarget}</strong>
            </div>

            <div className="profile-prop">
              <span className="prop-name">Experience:</span>
              <span className="prop-val">
                {baseline.experienceGap?.currentExperience?.available
                  ? `${baseline.experienceGap.currentExperience.years} years`
                  : "Not provided"}
              </span>
            </div>

            <div className="profile-prop">
              <span className="prop-name">Verified Skills:</span>
              <span className="prop-val">
                {baseline.skillGap?.matchedSkillCount || 0} catalog matches
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. WHAT-IF MODIFICATIONS CONTROLS */}
      <div className="what-if-controls-section">
        <h4 className="controls-heading">SIMULATE PROFILE CHANGES</h4>

        {/* A. Override Target Career */}
        <div className="control-group">
          <label htmlFor="what-if-target-select" className="control-label">
            TARGET CAREER OVERRIDE
          </label>
          <select
            id="what-if-target-select"
            className="control-dropdown"
            value={effectiveTarget}
            onChange={(e) => handleTargetChange(e.target.value)}
          >
            {allCareers.map((career) => (
              <option key={career} value={career}>
                {career} {career === baselineTarget ? "(Baseline)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* B. Add Experience Years */}
        <div className="control-group">
          <div className="control-label-row">
            <label className="control-label">ADD EXPERIENCE YEARS</label>
            <span className="control-value-pill">+{additionalExpYears} yrs</span>
          </div>
          <div className="exp-btn-row">
            {[0, 1, 2, 3, 5].map((yrs) => (
              <button
                key={yrs}
                type="button"
                className={`exp-step-btn ${additionalExpYears === yrs ? "active" : ""}`}
                onClick={() => setAdditionalExpYears(yrs)}
              >
                +{yrs} yr{yrs === 1 ? "" : "s"}
              </button>
            ))}
          </div>
        </div>

        {/* C. Add Skills */}
        <div className="control-group">
          <label className="control-label">ADD SKILLS TO SIMULATE</label>

          {/* Quick Add Missing Skills */}
          {quickAddCandidates.length > 0 && (
            <div className="quick-add-wrap">
              <span className="quick-add-title">Quick-add missing target skills:</span>
              <div className="quick-add-pills">
                {quickAddCandidates.slice(0, 4).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    className="quick-skill-btn"
                    onClick={() => handleAddSkill(skill)}
                    title={`Add ${skill} to What-If scenario`}
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Skill Input */}
          <form
            className="skill-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleAddSkill(skillInputText);
            }}
          >
            <input
              type="text"
              className="skill-text-input"
              placeholder="e.g. Spark, AWS, PyTorch..."
              value={skillInputText}
              onChange={(e) => setSkillInputText(e.target.value)}
            />
            <button
              type="submit"
              className="skill-add-btn"
              disabled={!skillInputText.trim()}
            >
              Add
            </button>
          </form>

          {/* Active Added Skills List */}
          {additionalSkills.length > 0 && (
            <div className="added-skills-chips">
              {additionalSkills.map((skill) => (
                <span key={skill} className="added-skill-chip">
                  <span>+ {skill}</span>
                  <button
                    type="button"
                    className="remove-chip-btn"
                    onClick={() => handleRemoveSkill(skill)}
                    aria-label={`Remove ${skill}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Reset What-If Button */}
        {hasModifications && (
          <div className="what-if-reset-wrap">
            <button
              type="button"
              className="reset-what-if-btn"
              onClick={handleReset}
            >
              ↺ Reset What-If Scenario
            </button>
          </div>
        )}
      </div>

      {/* 3. BEFORE vs AFTER COMPARISON */}
      <div className="what-if-comparison-section">
        <div className="comparison-header-row">
          <h4 className="controls-heading">BEFORE vs AFTER COMPARISON</h4>
          <span
            className="score-delta-pill"
            style={{
              color: delta.scoreDelta > 0 ? "#10B981" : delta.scoreDelta < 0 ? "#EF4444" : "#94A3B8",
              backgroundColor:
                delta.scoreDelta > 0
                  ? "rgba(16, 185, 129, 0.12)"
                  : delta.scoreDelta < 0
                  ? "rgba(239, 68, 68, 0.12)"
                  : "rgba(255, 255, 255, 0.05)",
              borderColor:
                delta.scoreDelta > 0
                  ? "rgba(16, 185, 129, 0.3)"
                  : delta.scoreDelta < 0
                  ? "rgba(239, 68, 68, 0.3)"
                  : "rgba(255, 255, 255, 0.1)",
            }}
          >
            {delta.scoreDelta > 0 ? `+${delta.scoreDelta} pts` : delta.scoreDelta < 0 ? `${delta.scoreDelta} pts` : "0 pts delta"}
          </span>
        </div>

        {/* Main Score Comparison Cards */}
        <div className="before-after-score-cards">
          <div className="comparison-card before">
            <span className="card-phase-label">BEFORE (BASELINE)</span>
            <div
              className="comparison-big-score"
              style={{ color: getScoreColor(baseline.mobilityScore.overallScore) }}
            >
              {baseline.mobilityScore.overallScore}
              <span className="score-denom">/100</span>
            </div>
            <span className="comparison-tier">
              {baseline.mobilityScore.ratingTier} Compatibility
            </span>
            <small className="comparison-note">
              Target: {baselineTarget}
            </small>
          </div>

          <div className="comparison-arrow-divider">➔</div>

          <div className="comparison-card after">
            <span className="card-phase-label">AFTER (SIMULATED)</span>
            <div
              className="comparison-big-score"
              style={{ color: getScoreColor(simulated.mobilityScore.overallScore) }}
            >
              {simulated.mobilityScore.overallScore}
              <span className="score-denom">/100</span>
            </div>
            <span className="comparison-tier">
              {simulated.mobilityScore.ratingTier} Compatibility
            </span>
            <small className="comparison-note">
              Target: {effectiveTarget}
            </small>
          </div>
        </div>

        {/* Detailed Metric Deltas */}
        <div className="comparison-metrics-list">
          {/* Skill Coverage Delta */}
          <div className="metric-delta-row">
            <span className="metric-delta-name">Skill Coverage:</span>
            <div className="metric-delta-vals">
              <span className="before-val">{baseline.skillGap.coveragePercentage}%</span>
              <span className="arrow-sep">➔</span>
              <strong className="after-val highlight">{simulated.skillGap.coveragePercentage}%</strong>
              {delta.skillCoverageDelta !== 0 && (
                <small className="delta-badge green">
                  {delta.skillCoverageDelta > 0 ? `+${delta.skillCoverageDelta}%` : `${delta.skillCoverageDelta}%`}
                </small>
              )}
            </div>
          </div>

          {/* Newly Matched Skills */}
          {delta.newMatchedSkills.length > 0 && (
            <div className="metric-delta-row">
              <span className="metric-delta-name">Newly Matched:</span>
              <div className="new-matched-chips">
                {delta.newMatchedSkills.map((s) => (
                  <span key={s} className="matched-skill-tag">
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Remaining Missing Skills */}
          <div className="metric-delta-row">
            <span className="metric-delta-name">Remaining Missing:</span>
            <span className="after-val">
              {delta.remainingMissingSkills.length > 0
                ? `${delta.remainingMissingSkills.slice(0, 3).join(", ")}${delta.remainingMissingSkills.length > 3 ? "..." : ""}`
                : "None — 100% Core Match"}
            </span>
          </div>

          {/* Experience Gap Delta */}
          <div className="metric-delta-row">
            <span className="metric-delta-name">Seniority Gap:</span>
            <div className="metric-delta-vals">
              <span className="before-val">
                {baseline.experienceGap.available
                  ? baseline.experienceGap.gapYears === 0
                    ? "Qualified"
                    : `${baseline.experienceGap.gapYears} yrs gap`
                  : "Missing exp"}
              </span>
              <span className="arrow-sep">➔</span>
              <strong className="after-val">
                {simulated.experienceGap.available
                  ? simulated.experienceGap.gapYears === 0
                    ? "Meets Benchmark"
                    : `${simulated.experienceGap.gapYears} yrs gap`
                  : "Unavailable"}
              </strong>
            </div>
          </div>
        </div>

        {/* 7. ROUTE CHANGE VISUALIZER */}
        <div className="what-if-route-box">
          <div className="route-box-header">
            <span className="route-box-title">CAREER ESCAPE ROUTE</span>
            <span className={`route-status-tag ${delta.routeChanged ? "changed" : "stable"}`}>
              {delta.routeChanged ? "Pathway Evolved" : "Direct Pathway"}
            </span>
          </div>

          <div className="what-if-route-path">
            <strong className="route-path-text">{delta.newPathString}</strong>
            <span className="route-friction-text">
              Friction:{" "}
              <strong>
                {simulated.escapeRoute?.selectedRoute?.mobilityFriction?.score ?? 50}/100
              </strong>
            </span>
          </div>
          <p className="route-explanation-text">
            {simulated.escapeRoute?.selectedRoute?.explanation || simulated.explainability?.smartestRoute?.explanation}
          </p>
        </div>

        {/* 6. NEXT BEST ACTION EXPLANATION */}
        {delta.skillImpactNotes.length > 0 && (
          <div className="what-if-impact-box">
            <div className="impact-box-header">
              <span className="impact-icon">💡</span>
              <strong className="impact-title">NEXT BEST ACTION INSIGHT</strong>
            </div>
            <ul className="impact-list">
              {delta.skillImpactNotes.map((note, idx) => (
                <li key={idx} className="impact-item">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 8. MARKET EVIDENCE vs MODEL PREDICTION */}
        <div className="what-if-market-box">
          <div className="market-box-top">
            <span className="market-box-badge">MARKET EVIDENCE</span>
            <span className="market-role-name">{effectiveTarget}</span>
          </div>

          {simulated.marketOpportunity.marketDataAvailable ? (
            <div className="market-box-stats">
              <div className="stat-mini">
                <span>Observed Postings:</span>
                <strong>{simulated.marketOpportunity.formattedVolume}</strong>
              </div>
              <div className="stat-mini">
                <span>Average Salary:</span>
                <strong style={{ color: "#10B981" }}>
                  {simulated.marketOpportunity.formattedAvgSalary || `₹${simulated.marketOpportunity.avgSalary} LPA`}
                </strong>
              </div>
              <div className="stat-mini">
                <span>Demand Tier:</span>
                <strong style={{ color: "#60A5FA" }}>
                  {simulated.marketOpportunity.demandTier}
                </strong>
              </div>
            </div>
          ) : (
            <p className="market-unavail-text">
              Market evidence unavailable for this role in the provided dataset.
            </p>
          )}

          {/* Model Prediction Signal */}
          <div className="what-if-ml-strip">
            <span className="ml-strip-badge">MODEL PREDICTION</span>
            <span className="ml-strip-text">
              {simulated.mlSignals.salaryPrediction?.available
                ? `Salary Model Estimate: ₹${simulated.mlSignals.salaryPrediction.predictedSalaryLPA} LPA (${simulated.mlSignals.salaryPrediction.inputExperience} yrs exp)`
                : simulated.mlSignals.salaryPrediction?.message || "Model estimate unavailable"}
            </span>
          </div>

          {/* Actionable Roadmap Link */}
          <button
            type="button"
            className="primary-button"
            style={{ width: "100%", marginTop: "14px" }}
            onClick={() => {
              navigate("/roadmap", {
                state: {
                  targetRole: effectiveTarget,
                  whatIfScenario: hasModifications
                    ? {
                        currentRole,
                        targetRole: effectiveTarget,
                        additionalSkills,
                        additionalExpYears,
                        overrideTargetRole,
                      }
                    : null,
                },
              });
            }}
          >
            View in Actionable Roadmap →
          </button>
        </div>
      </div>
    </aside>
  );
}
