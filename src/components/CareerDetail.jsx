import { useNavigate } from "react-router-dom";
import { useCareer } from "../context/CareerContextCore";
import { careerData } from "../data/careerData";
import { getCareerMarketData } from "../data/careerIntelligence";
import {
  getScore,
  getPathReason,
  getMissingSkills,
  getMatchedSkills,
} from "../utils/careerScoring";

export default function CareerDetail({
  selectedCareer,
  profile,
  mlProject,
  onBuildRoadmap,
}) {
  const navigate = useNavigate();
  const { handleTriggerRoadmapAnimation } = useCareer();
  const selectedData = selectedCareer ? careerData[selectedCareer] : null;

  if (!selectedData) return null;

  const score = getScore(selectedCareer, profile, mlProject);
  const pathReason = getPathReason(selectedCareer, profile, mlProject);
  const matchedSkills = getMatchedSkills(selectedCareer, profile, mlProject);
  const missingSkills = getMissingSkills(selectedCareer, profile, mlProject);

  const handleBuildRoadmapClick = () => {
    if (onBuildRoadmap) {
      onBuildRoadmap();
    } else {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        navigate("/roadmap");
        return;
      }

      if (handleTriggerRoadmapAnimation) {
        handleTriggerRoadmapAnimation(selectedCareer);
      }

      setTimeout(() => {
        navigate("/roadmap");
      }, 550);
    }
  };

  return (
    <div className="career-detail">
      <div>
        <p className="eyebrow">SELECTED PATH</p>
        <h2>{selectedCareer}</h2>
        <div className="score">{score}%</div>
      </div>

      <div>
        <h3>Why this path?</h3>
        <p>{pathReason}</p>
      </div>

      <div>
        <h3>Required Skills</h3>
        <div className="skill-list">
          {selectedData.skills.map((skill) => {
            const hasSkill = matchedSkills.includes(skill);
            return (
              <span
                key={skill}
                className={hasSkill ? "matched-pill" : "missing-pill"}
              >
                {hasSkill ? "✓ " : "✕ "}
                {skill}
              </span>
            );
          })}
        </div>
      </div>

      <div>
        <h3>Skill Gap</h3>
        {missingSkills.length > 0 ? (
          missingSkills.map((skill) => (
            <p className="missing" key={skill}>
              ✕ {skill}
            </p>
          ))
        ) : (
          <p>✓ No missing skills detected</p>
        )}
      </div>

      <div>
        <h3>Estimated Preparation</h3>
        <p>{selectedData.time}</p>
      </div>

      {(() => {
        const marketData = getCareerMarketData(selectedCareer);
        if (!marketData || !marketData.available) return null;
        return (
          <div style={{ marginTop: "12px", padding: "10px 12px", background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "8px" }}>
            <h3 style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#60A5FA", margin: "0 0 4px" }}>
              Observed Market Evidence
            </h3>
            <p style={{ color: "#E2E8F0", fontSize: "13px", margin: "0 0 4px" }}>
              <strong>{(marketData.demand?.postingVolume || marketData.postingVolume).toLocaleString()}</strong> observed postings • <strong style={{ color: "#10B981" }}>{marketData.salary?.formattedAvg}</strong> observed average
            </p>
            <p style={{ color: "#94A3B8", fontSize: "11px", margin: 0 }}>
              {marketData.demand?.formattedShare || `${marketData.postingShare}%`} of aggregated postings • Salary range: {marketData.salary?.formattedRange}
            </p>
          </div>
        );
      })()}

      <button
        className="primary-button"
        onClick={handleBuildRoadmapClick}
      >
        Build Roadmap →
      </button>
    </div>
  );
}
