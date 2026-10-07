import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import GlowSeparator from "../components/GlowSeparator";
import { useCareer } from "../context/CareerContextCore";
import { careerData } from "../data/careerData";
import { getCareerMarketData } from "../data/careerIntelligence";
import {
  getScore,
  getMissingSkills,
  getMatchedSkills,
  getPathReason,
} from "../utils/careerScoring";

export default function ExplorerPage() {
  const navigate = useNavigate();
  const {
    role,
    profile,
    mlProject,
    setSelectedCareer,
  } = useCareer();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const allCareers = useMemo(() => Object.keys(careerData), []);
  const filterOptions = useMemo(() => ["All", ...allCareers], [allCareers]);

  const filteredCareers = useMemo(() => {
    const list = allCareers.filter((career) => {
      const matchesFilter =
        selectedFilter === "All" || career === selectedFilter;
      const matchesSearch = career
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase());
      return matchesFilter && matchesSearch;
    });

    return list.sort((a, b) => {
      const scoreB = getScore(b, profile, mlProject);
      const scoreA = getScore(a, profile, mlProject);
      return scoreB - scoreA;
    });
  }, [allCareers, selectedFilter, searchTerm, profile, mlProject]);

  const handleExplorePath = (career) => {
    setSelectedCareer(career);
    navigate("/simulator");
  };

  return (
    <div className="explorer-container">
      {/* 1. Header */}
      <section className="explorer-header">
        <div>
          <p className="eyebrow">CAREER PATHFINDER</p>
          <h1>
            Explore <span>Career Paths</span>
          </h1>
          <p className="explorer-header-desc">
            Explore possible career transitions based on your current profile. Benchmark
            qualification requirements, evaluate your readiness score, and identify key skill gaps.
          </p>
        </div>

        <div className="dashboard-role-badge">
          <span>●</span> Starting Baseline: {role}
        </div>
      </section>

      <GlowSeparator />

      {/* 2. Search & 3. Career Filters */}
      <section className="explorer-controls">
        <div className="explorer-search-wrapper">
          <span className="explorer-search-icon">🔍</span>
          <input
            type="text"
            className="explorer-search-input"
            placeholder="Search careers by name (e.g. Data Scientist, ML Engineer)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="explorer-filters">
          <span className="explorer-filter-label">Filter:</span>
          {filterOptions.map((filter) => (
            <button
              key={filter}
              className={`explorer-chip ${selectedFilter === filter ? "active" : ""}`}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <GlowSeparator />

      {/* 4. Career Cards Grid or 6. Empty State */}
      {filteredCareers.length > 0 ? (
        <section className="explorer-cards-grid">
          {filteredCareers.map((career) => {
            const data = careerData[career];
            const score = getScore(career, profile, mlProject);
            const missing = getMissingSkills(career, profile, mlProject);

            const matchedSkills = getMatchedSkills(career, profile, mlProject);
            const reason = getPathReason(career, profile, mlProject);

            return (
              <div className="explorer-card" key={career}>
                <div>
                  <div className="explorer-card-top">
                    <span className="card-label">CAREER TRAJECTORY</span>
                    <strong style={{ color: "#60A5FA", fontSize: "20px", fontWeight: "900" }}>
                      {score}% Match
                    </strong>
                  </div>

                  <h2 className="explorer-card-title">{career}</h2>

                  <p className="explorer-time-badge">
                    Estimated preparation: <strong>{data.time}</strong>
                  </p>

                  {(() => {
                    const marketData = getCareerMarketData(career);
                    if (marketData && marketData.available) {
                      return (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            flexWrap: "wrap",
                            fontSize: "12px",
                            color: "#94A3B8",
                            background: "rgba(59, 130, 246, 0.08)",
                            border: "1px solid rgba(59, 130, 246, 0.2)",
                            borderRadius: "6px",
                            padding: "6px 10px",
                            margin: "8px 0 12px",
                          }}
                        >
                          <span style={{ color: "#60A5FA", fontWeight: "700" }}>Market:</span>
                          <span>{marketData.postingVolume.toLocaleString()} postings</span>
                          <span>•</span>
                          <span style={{ color: "#10B981", fontWeight: "600" }}>₹{marketData.avgSalary.toFixed(1)} LPA</span>
                          <span>•</span>
                          <span>{marketData.minExperience.toFixed(1)}y exp</span>
                        </div>
                      );
                    }
                    return (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#64748B",
                          fontStyle: "italic",
                          margin: "6px 0 10px",
                        }}
                      >
                        Market evidence unavailable in dataset
                      </div>
                    );
                  })()}

                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      borderLeft: "3px solid #3B82F6",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderLeftWidth: "3px",
                      borderLeftColor: "#3B82F6",
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
                      Match Analysis & Next Steps
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

                  {/* Required Skills */}
                  <div className="explorer-skills-group">
                    <p className="explorer-section-title">Required Competencies ({data.skills.length})</p>
                    <div className="skill-list">
                      {data.skills.map((skill) => (
                        <span key={skill} className="required-pill">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Skills User Already Has */}
                  <div className="explorer-skills-group">
                    <p className="explorer-section-title">
                      Skills You Already Have ({matchedSkills.length})
                    </p>
                    {matchedSkills.length > 0 ? (
                      <div className="skill-list">
                        {matchedSkills.map((skill) => (
                          <span key={skill} className="matched-pill">
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: "#64748B", fontSize: "12px", fontStyle: "italic" }}>
                        None documented in active profile
                      </p>
                    )}
                  </div>

                  {/* Missing Skills */}
                  <div className="explorer-skills-group">
                    <p className="explorer-section-title">
                      Missing Skills ({missing.length})
                    </p>
                    {missing.length > 0 ? (
                      <div className="skill-list">
                        {missing.map((skill) => (
                          <span key={skill} className="missing-pill">
                            ✕ {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: "#10B981", fontSize: "12px", fontWeight: "600" }}>
                        ✓ All core skills covered
                      </p>
                    )}
                  </div>
                </div>

                {/* 5. Career Detail Interaction Button */}
                <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  <button
                    className="primary-button"
                    style={{ width: "100%", textAlign: "center" }}
                    onClick={() => handleExplorePath(career)}
                  >
                    Explore Path →
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        /* 6. Empty State */
        <div className="explorer-empty-state">
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "rgba(37, 99, 235, 0.08)",
              border: "1px solid rgba(37, 99, 235, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              marginBottom: "4px",
            }}
          >
            🔍
          </div>
          <h3>No matching career paths found</h3>
          <p>
            {searchTerm
              ? `No careers matched "${searchTerm}"${selectedFilter !== "All" ? ` in the "${selectedFilter}" category` : ""}.`
              : `No careers available in the "${selectedFilter}" category.`}{" "}
            Try adjusting your search query or reset your filters.
          </p>
          <button
            type="button"
            className="secondary-button"
            style={{ marginTop: "12px" }}
            onClick={() => {
              setSearchTerm("");
              setSelectedFilter("All");
            }}
          >
            Reset Search & Filters
          </button>
        </div>
      )}
    </div>
  );
}
