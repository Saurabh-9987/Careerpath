import { useNavigate } from "react-router-dom";
import GlowSeparator from "./GlowSeparator";
import { careerData } from "../data/careerData";
import { getCareerMarketData } from "../data/careerIntelligence";
import {
  getScore,
  getPathReason,
  getMatchedSkills,
} from "../utils/careerScoring";

export default function CareerComparison({
  role,
  profile,
  mlProject,
  onSelectCareer,
}) {
  const navigate = useNavigate();
  const careers = Object.entries(careerData);

  const handleExplorePathway = (career) => {
    onSelectCareer(career);
    navigate("/simulator");
  };

  return (
    <section id="compare" className="paths">
      <div className="section-heading">
        <div>
          <p className="eyebrow">02 — COMPARE</p>
          <h2>Understand the Gap</h2>
        </div>
      </div>

      <GlowSeparator style={{ margin: "24px auto 36px" }} />

      <div className="path-cards">
        {careers.map(([career, data]) => {
          const matchedSkills = getMatchedSkills(career, profile, mlProject);
          const score = getScore(career, profile, mlProject);
          const reason = getPathReason(career, profile, mlProject);

          return (
            <div className="path-card" key={career}>
              <div className="path-top">
                <span>PATHWAY</span>
                <strong>{score}% Match</strong>
              </div>

              <h3>
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
                  Match Analysis
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

              {/* Real Salary Intelligence Comparison Field */}
              {(() => {
                const marketData = getCareerMarketData(career);
                if (marketData && marketData.available && marketData.salary) {
                  return (
                    <div
                      style={{
                        background: "rgba(16, 185, 129, 0.06)",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        margin: "-4px 0 14px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#10B981", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Observed Average Salary
                        </span>
                        <strong style={{ fontSize: "14px", color: "#34D399" }}>
                          {marketData.salary.formattedAvg}
                        </strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "3px" }}>
                        <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                          Salary Range (dataset)
                        </span>
                        <span style={{ fontSize: "11px", color: "#E2E8F0" }}>
                          {marketData.salary.formattedRange}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "5px", paddingTop: "5px", borderTop: "1px dashed rgba(255, 255, 255, 0.08)" }}>
                        <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                          Observed Demand
                        </span>
                        <strong style={{ fontSize: "13px", color: "#60A5FA" }}>
                          {(marketData.demand?.postingVolume || marketData.postingVolume).toLocaleString()} postings
                        </strong>
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px dashed rgba(255, 255, 255, 0.08)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      margin: "-4px 0 14px",
                      fontSize: "11px",
                      color: "#64748B",
                    }}
                  >
                    <div style={{ fontWeight: "600", color: "#94A3B8", marginBottom: "2px" }}>
                      Market demand unavailable
                    </div>
                    <div>No direct demand evidence for this role in the supplied datasets.</div>
                  </div>
                );
              })()}

              <p style={{ color: "#94A3B8", fontSize: "13px", marginBottom: "8px" }}>
                Required Competencies ({matchedSkills.length}/{data.skills.length} matched):
              </p>

              <div className="skill-list">
                {data.skills.map((skill) => {
                  const hasSkill = matchedSkills.includes(skill);
                  return (
                    <span
                      key={skill}
                      style={
                        hasSkill
                          ? {
                              borderColor: "rgba(16, 185, 129, 0.3)",
                              background: "rgba(16, 185, 129, 0.12)",
                              color: "#34D399",
                            }
                          : {
                              borderColor: "rgba(255, 255, 255, 0.14)",
                              background: "rgba(255, 255, 255, 0.04)",
                              color: "#94A3B8",
                            }
                      }
                    >
                      {hasSkill ? "✓ " : "✕ "}
                      {skill}
                    </span>
                  );
                })}
              </div>

              <button
                className="text-button"
                onClick={() => handleExplorePathway(career)}
                style={{ marginTop: "16px", color: "#60A5FA" }}
              >
                Explore pathway →
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
