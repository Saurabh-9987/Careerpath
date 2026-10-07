import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import GlowSeparator from "../components/GlowSeparator";
import { useCareer } from "../context/CareerContextCore";
import { careerData } from "../data/careerData";
import {
  getMarketOverviewMetrics,
  getRankedCareerDemand,
  getSalaryIntelligence,
  getSkillMarketIntelligence,
  getCompanyIntelligence,
  getLocationIntelligence,
  compareMarketRoles,
  getMarketFactualInsights,
  getMarketModelSeparation,
} from "../data/marketIntelligenceEngine";

export default function MarketPage() {
  const navigate = useNavigate();
  const { profile, selectedCareer, setSelectedCareer } = useCareer();

  // Tab navigation
  const [activeTab, setActiveTab] = useState("all");

  // Comparison State
  const allCareers = useMemo(() => Object.keys(careerData), []);
  const [compareRoleA, setCompareRoleA] = useState(selectedCareer || "Data Analyst");
  const [compareRoleB, setCompareRoleB] = useState("Data Scientist");

  // ML Simulation Input
  const parsedExp = parseFloat(String(profile?.experience || "").replace(/[^0-9.]/g, "")) || 2;
  const [simulatedExp, setSimulatedExp] = useState(parsedExp);
  const [simulatedRole, setSimulatedRole] = useState(selectedCareer || "Data Scientist");

  // Static Data Selectors
  const overview = useMemo(() => getMarketOverviewMetrics(), []);
  const demand = useMemo(() => getRankedCareerDemand(), []);
  const salary = useMemo(() => getSalaryIntelligence(), []);
  const skillData = useMemo(() => getSkillMarketIntelligence(), []);
  const companyData = useMemo(() => getCompanyIntelligence(), []);
  const locationData = useMemo(() => getLocationIntelligence(), []);
  const insights = useMemo(() => getMarketFactualInsights(), []);

  // Comparison computation
  const comparison = useMemo(() => {
    return compareMarketRoles(compareRoleA, compareRoleB);
  }, [compareRoleA, compareRoleB]);

  // ML Separation computation
  const mlSeparation = useMemo(() => {
    return getMarketModelSeparation(simulatedRole, simulatedExp);
  }, [simulatedRole, simulatedExp]);

  return (
    <div className="roadmap-page-container" style={{ maxWidth: "1280px", margin: "0 auto", padding: "30px 24px 80px" }}>
      {/* 1. Header */}
      <section className="roadmap-page-header" style={{ marginBottom: "28px" }}>
        <div>
          <p className="eyebrow">STAGE 11 — REAL HACKATHON DATASETS</p>
          <h1 style={{ fontSize: "36px", fontWeight: "900", color: "#FFFFFF", margin: "6px 0 12px" }}>
            Career <span style={{ color: "#60A5FA" }}>Market Intelligence</span>
          </h1>
          <p className="explorer-header-desc" style={{ color: "#94A3B8", fontSize: "15px", maxWidth: "760px", lineHeight: "1.6" }}>
            Empirical demand distributions, compensation benchmarks, and skill frequencies verified directly from the
            official hackathon datasets (<strong>DataScience Jobs.csv</strong> & <strong>Analytics Jobs.csv</strong>).
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/mobility")}
          >
            ← Mobility Engine
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/roadmap")}
          >
            Actionable Roadmap →
          </button>
        </div>
      </section>

      {/* Responsible Interpretation Banner */}
      <div
        className="dark-card"
        style={{
          borderRadius: "12px",
          padding: "12px 18px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "13px",
          color: "#94A3B8",
        }}
      >
        <span style={{ fontSize: "16px" }}>ℹ️</span>
        <span>
          <strong style={{ color: "#FFFFFF" }}>Responsible Interpretation:</strong> Market Intelligence reflects observed patterns in the provided hackathon datasets.
          It is not a guarantee of current vacancies, employment, or compensation.
        </span>
      </div>

      {/* Navigation Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "28px",
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "6px",
          borderRadius: "12px",
        }}
      >
        {[
          { id: "all", label: "Full Dashboard" },
          { id: "demand", label: "Career Demand" },
          { id: "salary", label: "Salary Benchmarks" },
          { id: "skills", label: "Skill Frequency" },
          { id: "companies", label: "Company Hiring" },
          { id: "locations", label: "Locations" },
          { id: "compare", label: "Role Comparison" },
          { id: "ml", label: "ML Model Signals" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? "rgba(59, 130, 246, 0.2)" : "transparent",
              color: activeTab === tab.id ? "#60A5FA" : "#94A3B8",
              fontWeight: activeTab === tab.id ? "800" : "600",
              border: activeTab === tab.id ? "1px solid rgba(59, 130, 246, 0.4)" : "1px solid transparent",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: activeTab === tab.id ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "none",
              transition: "all 150ms ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2. Headline Overview Grid */}
      {(activeTab === "all" || activeTab === "demand") && (
        <section style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#FFFFFF", margin: 0 }}>
              Market Overview Metrics
            </h2>
            <span style={{ fontSize: "12px", color: "#94A3B8", fontStyle: "italic" }}>
              DataScience Jobs.csv (1,602 records) & Analytics Jobs.csv (15,841 records)
            </span>
          </div>

          <div className="roadmap-overview-grid">
            <div className="roadmap-overview-card">
              <span className="roadmap-overview-label">Total Job Postings</span>
              <div className="roadmap-overview-val" style={{ color: "#60A5FA" }}>
                {overview.formattedPostings}
              </div>
              <small style={{ color: "#94A3B8", fontSize: "11px", marginTop: "4px" }}>
                DataScience Jobs benchmark
              </small>
            </div>

            <div className="roadmap-overview-card">
              <span className="roadmap-overview-label">Analytics Postings</span>
              <div className="roadmap-overview-val">
                {overview.formattedAnalyticsPostings}
              </div>
              <small style={{ color: "#94A3B8", fontSize: "11px", marginTop: "4px" }}>
                Raw skill posting records
              </small>
            </div>

            <div className="roadmap-overview-card">
              <span className="roadmap-overview-label">Standardized Roles</span>
              <div className="roadmap-overview-val" style={{ color: "#10B981" }}>
                {overview.supportedStandardizedRolesCount}
              </div>
              <small style={{ color: "#94A3B8", fontSize: "11px", marginTop: "4px" }}>
                Direct dataset clusters
              </small>
            </div>

            <div className="roadmap-overview-card">
              <span className="roadmap-overview-label">Unique Companies</span>
              <div className="roadmap-overview-val">
                {overview.uniqueCompaniesCount}
              </div>
              <small style={{ color: "#94A3B8", fontSize: "11px", marginTop: "4px" }}>
                Observed organizations
              </small>
            </div>

            <div className="roadmap-overview-card">
              <span className="roadmap-overview-label">Most Demanded Role</span>
              <div className="roadmap-overview-val" style={{ fontSize: "16px", color: "#60A5FA" }}>
                {overview.mostDemandedRole.roleName}
              </div>
              <small style={{ color: "#10B981", fontSize: "11px", fontWeight: "700", marginTop: "4px" }}>
                {overview.mostDemandedRole.formattedVolume} postings ({overview.mostDemandedRole.formattedShare})
              </small>
            </div>

            <div className="roadmap-overview-card">
              <span className="roadmap-overview-label">Average Salary</span>
              <div className="roadmap-overview-val" style={{ color: "#10B981" }}>
                {overview.formattedOverallAvgSalary}
              </div>
              <small style={{ color: "#94A3B8", fontSize: "11px", marginTop: "4px" }}>
                Weighted: {overview.formattedWeightedAvgSalary}
              </small>
            </div>
          </div>
        </section>
      )}

      {/* 3. Factual Insight Cards */}
      {(activeTab === "all" || activeTab === "demand") && (
        <section style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#FFFFFF", marginBottom: "14px" }}>
            Factual Dataset Findings
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className="dark-card"
                style={{
                  borderRadius: "14px",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "10px", fontWeight: "800", color: "#60A5FA", letterSpacing: "1px", textTransform: "uppercase" }}>
                      {insight.category}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "800",
                        background: "rgba(59, 130, 246, 0.15)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        color: "#60A5FA",
                        padding: "2px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      {insight.badge}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#FFFFFF", margin: "4px 0 8px" }}>
                    {insight.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: "1.5", margin: 0 }}>
                    {insight.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <GlowSeparator />

      {/* 4. Ranked Career Demand Section */}
      {(activeTab === "all" || activeTab === "demand") && (
        <section style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <span className="timeline-stage-badge">EMPIRICAL POSTING DISTRIBUTION</span>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#FFFFFF", margin: "4px 0" }}>
                Ranked Career Demand
              </h2>
              <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0 }}>
                Aggregated posting volume across the 10 standardized roles in DataScience Jobs.csv.
              </p>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "800",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "#34D399",
                padding: "4px 10px",
                borderRadius: "8px",
              }}
            >
              10 ROLES OBSERVED IN DATASET
            </span>
          </div>

          <div className="dark-card" style={{ borderRadius: "16px", overflow: "hidden", padding: 0 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94A3B8", fontWeight: "700" }}>
                    <th style={{ padding: "14px 18px", width: "60px" }}>Rank</th>
                    <th style={{ padding: "14px 18px" }}>Role Name</th>
                    <th style={{ padding: "14px 18px" }}>Observed Postings</th>
                    <th style={{ padding: "14px 18px" }}>Market Share</th>
                    <th style={{ padding: "14px 18px" }}>Demand Tier</th>
                    <th style={{ padding: "14px 18px" }}>Avg Experience</th>
                    <th style={{ padding: "14px 18px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {demand.supportedRoles.map((role) => (
                    <tr
                      key={role.roleName}
                      style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", transition: "background 150ms ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "14px 18px", fontWeight: "800", color: "#60A5FA" }}>
                        #{role.rank}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <strong style={{ color: "#FFFFFF", fontSize: "14px" }}>{role.roleName}</strong>
                      </td>
                      <td style={{ padding: "14px 18px", fontWeight: "700", color: "#FFFFFF" }}>
                        {role.formattedVolume}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "90px", height: "6px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(100, role.marketSharePercent * 2.5)}%`, height: "100%", background: "#3B82F6", borderRadius: "3px" }} />
                          </div>
                          <span style={{ fontWeight: "700", color: "#94A3B8" }}>{role.formattedShare}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "800",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background:
                              role.demandTier === "Very High"
                                ? "rgba(16, 185, 129, 0.15)"
                                : role.demandTier === "High"
                                ? "rgba(59, 130, 246, 0.15)"
                                : "rgba(245, 158, 11, 0.15)",
                            color:
                              role.demandTier === "Very High"
                                ? "#34D399"
                                : role.demandTier === "High"
                                ? "#60A5FA"
                                : "#FBBF24",
                            border: `1px solid ${
                              role.demandTier === "Very High"
                                ? "rgba(16, 185, 129, 0.3)"
                                : role.demandTier === "High"
                                ? "rgba(59, 130, 246, 0.3)"
                                : "rgba(245, 158, 11, 0.3)"
                            }`,
                          }}
                        >
                          {role.demandTier}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", color: "#94A3B8" }}>
                        {role.avgExperienceYears} years
                      </td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (setSelectedCareer) setSelectedCareer(role.roleName);
                            navigate("/roadmap");
                          }}
                          style={{
                            background: "rgba(59, 130, 246, 0.1)",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                            borderRadius: "6px",
                            padding: "4px 10px",
                            fontSize: "12px",
                            fontWeight: "700",
                            color: "#60A5FA",
                            cursor: "pointer",
                          }}
                        >
                          Roadmap →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Unobserved Catalog Roles Card */}
          <div
            className="dark-card"
            style={{
              marginTop: "20px",
              border: "1px dashed rgba(255, 255, 255, 0.18)",
              borderRadius: "14px",
              padding: "18px 22px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", background: "rgba(255, 255, 255, 0.08)", color: "#CBD5E1", padding: "2px 8px", borderRadius: "4px" }}>
                CATALOG SCOPE BOUNDARY
              </span>
              <strong style={{ fontSize: "14px", color: "#FFFFFF" }}>
                Roles Not Observed in the Supplied Dataset ({demand.unobservedRoles.length} roles)
              </strong>
            </div>
            <p style={{ fontSize: "13px", color: "#94A3B8", margin: "0 0 12px", lineHeight: "1.5" }}>
              The following catalog roles do not have direct posting records in the provided DataScience Jobs benchmark.
              In accordance with strict empirical integrity guidelines, they are not assigned zero demand or synthetic estimates:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {demand.unobservedRoles.map((role) => (
                <span
                  key={role.roleName}
                  className="dark-inner-box"
                  style={{
                    fontSize: "12px",
                    padding: "4px 10px",
                    color: "#CBD5E1",
                  }}
                >
                  {role.roleName} <small style={{ color: "#94A3B8" }}>(Unobserved)</small>
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Salary Benchmarks Section */}
      {(activeTab === "all" || activeTab === "salary") && (
        <section style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <span className="timeline-stage-badge" style={{ color: "#34D399" }}>COMPENSATION BENCHMARKS</span>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#FFFFFF", margin: "4px 0" }}>
                Observed Salary Benchmarks
              </h2>
              <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0 }}>
                Arithmetic averages and observed ranges from dataset job records. Strictly labeled <strong>MARKET EVIDENCE</strong>.
              </p>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "900",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "#34D399",
                padding: "4px 12px",
                borderRadius: "8px",
                letterSpacing: "0.5px",
              }}
            >
              MARKET EVIDENCE
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {salary.roles.map((item) => (
              <div
                key={item.roleName}
                className="dark-card"
                style={{
                  borderRadius: "14px",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#94A3B8" }}>
                      RANK #{item.rank}
                    </span>
                    <span style={{ fontSize: "11px", color: "#34D399", fontWeight: "700" }}>
                      {item.postingVolume.toLocaleString()} postings
                    </span>
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#FFFFFF", margin: "0 0 10px" }}>
                    {item.roleName}
                  </h3>

                  <div className="dark-inner-box" style={{ padding: "10px 14px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", fontWeight: "700" }}>
                      Observed Average
                    </span>
                    <div style={{ fontSize: "22px", fontWeight: "900", color: "#10B981", marginTop: "2px" }}>
                      {item.formattedAvgSalary}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94A3B8", marginBottom: "4px" }}>
                    <span>Observed Range:</span>
                    <strong style={{ color: "#FFFFFF" }}>{item.formattedRange}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94A3B8" }}>
                    <span>Avg Seniority:</span>
                    <strong style={{ color: "#FFFFFF" }}>{item.avgExperienceYears} yrs</strong>
                  </div>
                </div>

                <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: "800", color: "#64748B" }}>NOT A PREDICTION</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCompareRoleA(item.roleName);
                      setActiveTab("compare");
                    }}
                    style={{ background: "none", border: "none", color: "#60A5FA", fontSize: "12px", fontWeight: "700", cursor: "pointer", padding: 0 }}
                  >
                    Compare Role →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Skill Market Evidence Section */}
      {(activeTab === "all" || activeTab === "skills") && (
        <section style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "gap", gap: "8px" }}>
            <div>
              <span className="timeline-stage-badge">ANALYTICS JOBS (15,841 POSTINGS)</span>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#FFFFFF", margin: "4px 0" }}>
                Skill Market Frequency
              </h2>
              <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0 }}>
                Most frequently observed competencies and relative percentages in Analytics Jobs postings.
              </p>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "900",
                background: "rgba(59, 130, 246, 0.15)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                color: "#60A5FA",
                padding: "4px 10px",
                borderRadius: "8px",
              }}
            >
              12 VERIFIED TECHNICAL SKILLS
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
            {skillData.skills.map((s) => (
              <div
                key={s.skillName}
                className="dark-card"
                style={{
                  borderRadius: "12px",
                  padding: "16px 18px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <strong style={{ fontSize: "15px", color: "#FFFFFF" }}>{s.skillName}</strong>
                  <span style={{ fontSize: "10px", background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.08)", color: "#CBD5E1", padding: "2px 6px", borderRadius: "4px" }}>
                    {s.category}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                  <span style={{ fontSize: "20px", fontWeight: "800", color: "#60A5FA" }}>
                    {s.formattedPercentage}
                  </span>
                  <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "600" }}>
                    {s.formattedMentions} postings
                  </span>
                </div>

                <div style={{ width: "100%", height: "6px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "3px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.min(100, s.demandPercentage * 10)}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #3B82F6, #60A5FA)",
                      borderRadius: "3px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Company & Location Intelligence Grid */}
      {(activeTab === "all" || activeTab === "companies" || activeTab === "locations") && (
        <section style={{ marginBottom: "40px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
          {/* Company Intelligence */}
          {(activeTab === "all" || activeTab === "companies") && (
            <div className="dark-card" style={{ borderRadius: "16px", padding: "22px 24px" }}>
              <div style={{ marginBottom: "16px" }}>
                <span className="timeline-stage-badge">ENTERPRISE VOLUME</span>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#FFFFFF", margin: "4px 0" }}>
                  Top Hiring Organizations
                </h3>
                <p style={{ color: "#94A3B8", fontSize: "12px", margin: 0 }}>
                  {companyData.wording} across 642 companies in DataScience Jobs.csv.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {companyData.companies.map((c) => (
                  <div
                    key={c.companyName}
                    className="dark-inner-box"
                    style={{
                      padding: "10px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "800", color: "#60A5FA", width: "24px" }}>
                        #{c.rank}
                      </span>
                      <strong style={{ fontSize: "14px", color: "#FFFFFF" }}>{c.companyName}</strong>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <strong style={{ fontSize: "13px", color: "#FFFFFF" }}>{c.formattedVolume}</strong>
                      <span style={{ fontSize: "11px", color: "#94A3B8", marginLeft: "6px" }}>({c.formattedShare})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Intelligence */}
          {(activeTab === "all" || activeTab === "locations") && (
            <div className="dark-card" style={{ borderRadius: "16px", padding: "22px 24px" }}>
              <div style={{ marginBottom: "16px" }}>
                <span className="timeline-stage-badge" style={{ color: "#34D399" }}>GEOGRAPHIC CONCENTRATION</span>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#FFFFFF", margin: "4px 0" }}>
                  Top Hiring Locations
                </h3>
                <p style={{ color: "#94A3B8", fontSize: "12px", margin: 0 }}>
                  {locationData.wording} (multi-city mentions parsed accurately; represents mentions across location fields).
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {locationData.locations.map((loc) => (
                  <div
                    key={loc.city}
                    className="dark-inner-box"
                    style={{
                      padding: "10px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "800", color: "#34D399", width: "24px" }}>
                        #{loc.rank}
                      </span>
                      <strong style={{ fontSize: "14px", color: "#FFFFFF" }}>{loc.city}</strong>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <strong style={{ fontSize: "13px", color: "#FFFFFF" }}>{loc.formattedCount}</strong>
                      <span style={{ fontSize: "11px", color: "#94A3B8", marginLeft: "6px" }}>({loc.formattedShare})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 8. Role Comparison Section */}
      {(activeTab === "all" || activeTab === "compare") && (
        <section style={{ marginBottom: "40px" }}>
          <div style={{ marginBottom: "16px" }}>
            <span className="timeline-stage-badge">SIDE-BY-SIDE BENCHMARKING</span>
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#FFFFFF", margin: "4px 0" }}>
              Role Comparison
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0 }}>
              Compare observed demand, compensation benchmarks, and seniority across catalog roles. Unsupported roles return explicit unobserved states.
            </p>
          </div>

          {/* Role Selectors */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 240px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#94A3B8", marginBottom: "6px" }}>
                First Role
              </label>
              <select
                value={compareRoleA}
                onChange={(e) => setCompareRoleA(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#080D1A", border: "1px solid rgba(255, 255, 255, 0.16)", fontSize: "14px", fontWeight: "600", color: "#FFFFFF" }}
              >
                {allCareers.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: "1 1 240px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#94A3B8", marginBottom: "6px" }}>
                Second Role
              </label>
              <select
                value={compareRoleB}
                onChange={(e) => setCompareRoleB(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#080D1A", border: "1px solid rgba(255, 255, 255, 0.16)", fontSize: "14px", fontWeight: "600", color: "#FFFFFF" }}
              >
                {allCareers.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {/* Role A Card */}
            <div className="dark-card" style={{ borderRadius: "14px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#FFFFFF", margin: 0 }}>{comparison.roleA.roleName}</h3>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "800",
                    background: comparison.roleA.available ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.1)",
                    border: comparison.roleA.available ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(148, 163, 184, 0.2)",
                    color: comparison.roleA.available ? "#34D399" : "#94A3B8",
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {comparison.roleA.evidenceStatus}
                </span>
              </div>

              {comparison.roleA.available ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <span style={{ color: "#94A3B8", fontSize: "13px" }}>Observed Postings:</span>
                    <strong style={{ color: "#FFFFFF", fontSize: "14px" }}>{comparison.roleA.formattedVolume} ({comparison.roleA.formattedShare})</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <span style={{ color: "#94A3B8", fontSize: "13px" }}>Average Salary:</span>
                    <strong style={{ color: "#10B981", fontSize: "14px" }}>{comparison.roleA.formattedAvgSalary}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <span style={{ color: "#94A3B8", fontSize: "13px" }}>Salary Range:</span>
                    <strong style={{ color: "#FFFFFF", fontSize: "13px" }}>{comparison.roleA.salaryRange}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <span style={{ color: "#94A3B8", fontSize: "13px" }}>Avg Seniority:</span>
                    <strong style={{ color: "#FFFFFF", fontSize: "13px" }}>{comparison.roleA.minExperience} years</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                    <span style={{ color: "#94A3B8", fontSize: "13px" }}>Demand Tier:</span>
                    <strong style={{ color: "#60A5FA", fontSize: "13px" }}>{comparison.roleA.demandTier}</strong>
                  </div>
                </div>
              ) : (
                <p style={{ color: "#94A3B8", fontSize: "13px", fontStyle: "italic", margin: "10px 0" }}>
                  Not observed in provided dataset. No empirical market metrics are fabricated.
                </p>
              )}
            </div>

            {/* Role B Card */}
            <div className="dark-card" style={{ borderRadius: "14px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#FFFFFF", margin: 0 }}>{comparison.roleB.roleName}</h3>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "800",
                    background: comparison.roleB.available ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.1)",
                    border: comparison.roleB.available ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(148, 163, 184, 0.2)",
                    color: comparison.roleB.available ? "#34D399" : "#94A3B8",
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {comparison.roleB.evidenceStatus}
                </span>
              </div>

              {comparison.roleB.available ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <span style={{ color: "#94A3B8", fontSize: "13px" }}>Observed Postings:</span>
                    <strong style={{ color: "#FFFFFF", fontSize: "14px" }}>{comparison.roleB.formattedVolume} ({comparison.roleB.formattedShare})</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <span style={{ color: "#94A3B8", fontSize: "13px" }}>Average Salary:</span>
                    <strong style={{ color: "#10B981", fontSize: "14px" }}>{comparison.roleB.formattedAvgSalary}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <span style={{ color: "#94A3B8", fontSize: "13px" }}>Salary Range:</span>
                    <strong style={{ color: "#FFFFFF", fontSize: "13px" }}>{comparison.roleB.salaryRange}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <span style={{ color: "#94A3B8", fontSize: "13px" }}>Avg Seniority:</span>
                    <strong style={{ color: "#FFFFFF", fontSize: "13px" }}>{comparison.roleB.minExperience} years</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                    <span style={{ color: "#94A3B8", fontSize: "13px" }}>Demand Tier:</span>
                    <strong style={{ color: "#60A5FA", fontSize: "13px" }}>{comparison.roleB.demandTier}</strong>
                  </div>
                </div>
              ) : (
                <p style={{ color: "#94A3B8", fontSize: "13px", fontStyle: "italic", margin: "10px 0" }}>
                  Not observed in provided dataset. No empirical market metrics are fabricated.
                </p>
              )}
            </div>
          </div>

          {/* Comparison Delta Summary */}
          {comparison.bothObserved && (
            <div className="dark-inner-box" style={{ marginTop: "16px", padding: "14px 18px", fontSize: "13px", color: "#CBD5E1" }}>
              <strong style={{ color: "#FFFFFF" }}>Comparative Delta: </strong>
              <span>
                <strong style={{ color: "#60A5FA" }}>{comparison.demandComparison.higherRole}</strong> exhibits higher observed demand by {comparison.demandComparison.difference.toLocaleString()} postings ({comparison.demandComparison.ratio}x).
                {" "}<strong style={{ color: "#10B981" }}>{comparison.salaryComparison.higherRole}</strong> commands a higher observed average benchmark by ₹{comparison.salaryComparison.differenceLPA} LPA.
              </span>
            </div>
          )}
        </section>
      )}

      {/* 9. ML Model Signals & Separation Section */}
      {(activeTab === "all" || activeTab === "ml") && (
        <section style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <span className="timeline-stage-badge" style={{ color: "#A78BFA" }}>STRICT DATA SEPARATION</span>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#FFFFFF", margin: "4px 0" }}>
                Model Prediction vs Market Evidence
              </h2>
              <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0 }}>
                {mlSeparation.separationRule}
              </p>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "900",
                background: "rgba(139, 92, 246, 0.15)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                color: "#A78BFA",
                padding: "4px 12px",
                borderRadius: "8px",
                letterSpacing: "0.5px",
              }}
            >
              MODEL PREDICTION
            </span>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="dark-card" style={{ borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#94A3B8", marginBottom: "6px" }}>
                Target Evaluation Role
              </label>
              <select
                value={simulatedRole}
                onChange={(e) => setSimulatedRole(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", background: "#080D1A", border: "1px solid rgba(255, 255, 255, 0.16)", fontSize: "13px", fontWeight: "600", color: "#FFFFFF" }}
              >
                {allCareers.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#94A3B8", marginBottom: "6px" }}>
                Candidate Seniority: {simulatedExp} Year(s)
              </label>
              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={simulatedExp}
                onChange={(e) => setSimulatedExp(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "#8B5CF6" }}
              />
            </div>
          </div>

          {/* Side-by-Side: Market Evidence vs Model Prediction */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {/* Left: Market Evidence */}
            <div className="dark-card" style={{ borderRadius: "14px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: "900", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#34D399", padding: "3px 8px", borderRadius: "6px" }}>
                  MARKET EVIDENCE
                </span>
                <span style={{ fontSize: "11px", color: "#94A3B8" }}>Empirical Distribution</span>
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#FFFFFF", margin: "0 0 10px" }}>
                {simulatedRole} Benchmark
              </h3>

              {mlSeparation.marketEvidence.available ? (
                <>
                  <div className="dark-inner-box" style={{ padding: "12px 16px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: "700" }}>Observed Market Average</span>
                    <div style={{ fontSize: "22px", fontWeight: "900", color: "#10B981", marginTop: "2px" }}>
                      {mlSeparation.marketEvidence.formattedAvgSalary}
                    </div>
                  </div>
                  <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0, lineHeight: "1.5" }}>
                    {mlSeparation.marketEvidence.note}
                  </p>
                </>
              ) : (
                <p style={{ color: "#94A3B8", fontSize: "13px", fontStyle: "italic", margin: 0 }}>
                  {mlSeparation.marketEvidence.message}
                </p>
              )}
            </div>

            {/* Right: Model Prediction */}
            <div className="dark-card" style={{ borderRadius: "14px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: "900", background: "rgba(139, 92, 246, 0.15)", border: "1px solid rgba(139, 92, 246, 0.3)", color: "#A78BFA", padding: "3px 8px", borderRadius: "6px" }}>
                  MODEL PREDICTION
                </span>
                <span style={{ fontSize: "11px", color: "#94A3B8" }}>Trained ML Inference</span>
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#FFFFFF", margin: "0 0 10px" }}>
                {simulatedRole} ({simulatedExp} yrs exp)
              </h3>

              {mlSeparation.modelPrediction.available ? (
                <>
                  <div className="dark-inner-box" style={{ padding: "12px 16px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: "700" }}>Regression Estimated Salary</span>
                    <div style={{ fontSize: "22px", fontWeight: "900", color: "#A78BFA", marginTop: "2px" }}>
                      {mlSeparation.modelPrediction.formattedSalary}
                    </div>
                  </div>
                  <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0, lineHeight: "1.5" }}>
                    {mlSeparation.modelPrediction.note}
                  </p>
                </>
              ) : (
                <p style={{ color: "#94A3B8", fontSize: "13px", fontStyle: "italic", margin: 0 }}>
                  {mlSeparation.modelPrediction.message}
                </p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
