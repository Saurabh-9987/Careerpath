import { getScore } from "../utils/careerScoring";

export default function WhatIfSimulator({
  activeCareer = "Data Scientist",
  profile,
  mlProject,
  onToggleMlProject,
}) {
  const currentScore = getScore(activeCareer, profile, mlProject);
  const whatIfScore = getScore(activeCareer, profile, true);
  const baseScore = getScore(activeCareer, profile, false);
  const actualBoost = Math.max(0, whatIfScore - baseScore);

  return (
    <aside className="what-if">
      <p className="eyebrow">WHAT-IF SIMULATOR</p>

      <h3>What if you add an ML Project?</h3>

      <p>
        Add an experience and see how your potential career routes change.
      </p>

      <div
        className="what-if-score"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "16px 0 12px",
          padding: "10px 14px",
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "10px",
        }}
      >
        <span style={{ fontSize: "14px", color: "#E2E8F0", fontWeight: 500 }}>
          {activeCareer}
        </span>
        <strong style={{ fontSize: "15px", color: "#60A5FA", fontWeight: 700 }}>
          {currentScore}%
        </strong>
      </div>

      {mlProject ? (
        <div
          className="what-if-result"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "10px 0 16px",
            padding: "8px 12px",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "8px",
          }}
        >
          <span style={{ fontSize: "12px", color: "#34D399", fontWeight: 600 }}>
            ML Project Added
          </span>
          <strong style={{ fontSize: "12px", color: "#34D399", fontWeight: 700 }}>
            +{actualBoost}% boost
          </strong>
        </div>
      ) : (
        <div
          style={{
            color: "#94A3B8",
            fontSize: "13px",
            margin: "10px 0 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>What-If Potential</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <strong style={{ color: "#60A5FA", fontSize: "14px" }}>{whatIfScore}%</strong>
            <small style={{ color: "#64748B", fontSize: "12px" }}>(+{actualBoost}%)</small>
          </span>
        </div>
      )}

      <button
        type="button"
        className="secondary-button"
        style={{
          width: "100%",
          padding: "11px 16px",
          borderColor: mlProject ? "rgba(16, 185, 129, 0.4)" : undefined,
          color: mlProject ? "#34D399" : undefined,
        }}
        onClick={onToggleMlProject}
      >
        {mlProject ? "✓ ML Project Added" : "+ Add ML Project"}
      </button>

      {mlProject && (
        <div className="unlock">
          <strong>ML</strong>
          <span>project experience added to {activeCareer} simulation</span>
        </div>
      )}
    </aside>
  );
}
