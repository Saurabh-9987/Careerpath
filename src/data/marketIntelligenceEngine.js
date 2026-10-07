import {
  MARKET_DEMAND_SUMMARY,
  ROLE_MARKET_EVIDENCE,
  TOP_HIRING_COMPANIES,
  MARKET_SKILL_FREQUENCIES,
  TOP_MARKET_LOCATIONS,
  TOTAL_ANALYTICS_JOBS,
} from "./marketEvidenceData.js";
import {
  CAREER_TO_DATASET_ROLE_MAP,
  getCareerMarketData,
} from "./careerIntelligence.js";
import { predictSalary } from "./careerMLEngine.js";

/**
 * CareerPath Market Intelligence Engine
 * =====================================
 * Generates verified empirical market intelligence across:
 * - DataScience Jobs (1,602 cluster records, 93,005 aggregated postings, 10 standardized roles)
 * - Analytics Jobs (15,841 raw postings, skill frequencies, locations)
 * 
 * Strict Data Integrity Boundaries:
 * 1. Zero synthetic or fabricated values.
 * 2. Unsupported catalog roles return explicit unobserved states.
 * 3. MODEL PREDICTION is kept strictly separated from MARKET EVIDENCE.
 * 4. Non-causal disclaimer on all empirical evidence.
 */

/**
 * 1. Market Overview Headline Metrics
 */
export function getMarketOverviewMetrics() {
  const supportedRolesList = Object.keys(ROLE_MARKET_EVIDENCE);
  const mostDemandedRole = Object.values(ROLE_MARKET_EVIDENCE).reduce(
    (max, curr) => (curr.postingVolume > max.postingVolume ? curr : max),
    { postingVolume: 0 }
  );

  return {
    totalAggregatedPostings: MARKET_DEMAND_SUMMARY.totalAggregatedPostings,
    formattedPostings: MARKET_DEMAND_SUMMARY.totalAggregatedPostings.toLocaleString(),
    totalAnalyticsRawPostings: TOTAL_ANALYTICS_JOBS,
    formattedAnalyticsPostings: TOTAL_ANALYTICS_JOBS.toLocaleString(),
    supportedStandardizedRolesCount: MARKET_DEMAND_SUMMARY.uniqueStandardRoles,
    uniqueCompaniesCount: MARKET_DEMAND_SUMMARY.uniqueCompanies,
    majorLocationsCount: TOP_MARKET_LOCATIONS.length,
    overallAvgSalaryLPA: MARKET_DEMAND_SUMMARY.overallAvgSalaryLPA,
    formattedOverallAvgSalary: `₹${MARKET_DEMAND_SUMMARY.overallAvgSalaryLPA.toFixed(2)} LPA`,
    postingWeightedAvgSalaryLPA: MARKET_DEMAND_SUMMARY.postingWeightedAvgSalaryLPA,
    formattedWeightedAvgSalary: `₹${MARKET_DEMAND_SUMMARY.postingWeightedAvgSalaryLPA.toFixed(2)} LPA`,
    mostDemandedRole: {
      roleName: mostDemandedRole.roleName,
      postingVolume: mostDemandedRole.postingVolume,
      formattedVolume: mostDemandedRole.postingVolume.toLocaleString(),
      marketSharePercent: mostDemandedRole.marketSharePercent,
      formattedShare: `${mostDemandedRole.marketSharePercent}%`,
    },
    supportedRoles: supportedRolesList,
    dataSources: [
      "DataScience Jobs.csv (1,602 records, 93,005 aggregated postings)",
      "Analytics Jobs.csv (15,841 raw posting records)",
    ],
  };
}

/**
 * 2. Ranked Career Demand
 * Returns ranked supported roles, with demand tier, volume, and share.
 * Non-supported roles are provided in a distinct 'unobserved' list.
 */
export function getRankedCareerDemand() {
  const rankedSupported = Object.values(ROLE_MARKET_EVIDENCE)
    .sort((a, b) => b.postingVolume - a.postingVolume)
    .map((item, index) => {
      let tier = "Moderate";
      if (item.postingVolume >= 15000) tier = "Very High";
      else if (item.postingVolume >= 5000) tier = "High";
      else if (item.postingVolume >= 2000) tier = "Moderate";
      else if (item.postingVolume >= 800) tier = "Emerging";
      else tier = "Niche / Senior";

      return {
        rank: index + 1,
        roleName: item.roleName,
        postingVolume: item.postingVolume,
        formattedVolume: item.postingVolume.toLocaleString(),
        marketSharePercent: item.marketSharePercent,
        formattedShare: `${item.marketSharePercent}%`,
        demandTier: tier,
        avgExperienceYears: item.avgMinExperienceYears,
        evidenceStatus: "Observed in provided dataset",
      };
    });

  const unobservedCatalogRoles = Object.entries(CAREER_TO_DATASET_ROLE_MAP)
    .filter(([, mapped]) => mapped === null)
    .map(([role]) => ({
      roleName: role,
      evidenceStatus: "Not observed in provided dataset",
      postingVolume: null,
      marketSharePercent: null,
      demandTier: "Unobserved in Dataset",
      note: "No empirical posting evidence in the provided DataScience Jobs dataset.",
    }));

  return {
    supportedRoles: rankedSupported,
    unobservedRoles: unobservedCatalogRoles,
    totalObservedPostings: MARKET_DEMAND_SUMMARY.totalAggregatedPostings,
  };
}

/**
 * 3. Salary Intelligence
 * Returns empirical compensation benchmarks sorted descending by average salary.
 */
export function getSalaryIntelligence() {
  const rankedSalaries = Object.values(ROLE_MARKET_EVIDENCE)
    .sort((a, b) => b.avgSalaryLPA - a.avgSalaryLPA)
    .map((item, index) => ({
      rank: index + 1,
      roleName: item.roleName,
      avgSalaryLPA: item.avgSalaryLPA,
      formattedAvgSalary: `₹${item.avgSalaryLPA.toFixed(2)} LPA`,
      minSalaryLPA: item.minSalaryLPA,
      maxSalaryLPA: item.maxSalaryLPA,
      formattedRange: `₹${item.minSalaryLPA.toFixed(1)}–₹${item.maxSalaryLPA.toFixed(1)} LPA`,
      avgExperienceYears: item.avgMinExperienceYears,
      postingVolume: item.postingVolume,
      evidenceType: "MARKET EVIDENCE",
      source: "DataScience Jobs.csv",
    }));

  return {
    evidenceLabel: "MARKET EVIDENCE",
    roles: rankedSalaries,
    highestPaidRole: rankedSalaries[0],
    entryBenchmarkRole: rankedSalaries.find((r) => r.roleName === "Data Analyst") || rankedSalaries[rankedSalaries.length - 1],
    overallAvgSalaryLPA: MARKET_DEMAND_SUMMARY.overallAvgSalaryLPA,
  };
}

/**
 * 4. Skill Market Evidence
 * Returns frequency and relative percentage from Analytics Jobs.csv.
 */
export function getSkillMarketIntelligence() {
  return {
    totalJobPostings: TOTAL_ANALYTICS_JOBS,
    skills: MARKET_SKILL_FREQUENCIES.map((s, idx) => ({
      rank: idx + 1,
      skillName: s.skillName,
      mentionCount: s.mentionCount,
      formattedMentions: s.mentionCount.toLocaleString(),
      demandPercentage: s.demandPercentage,
      formattedPercentage: `${s.demandPercentage.toFixed(2)}%`,
      category: s.category,
      evidenceType: "MARKET EVIDENCE",
      source: "Analytics Jobs.csv (15,841 postings)",
    })),
  };
}

/**
 * 5. Company Intelligence
 * Returns top hiring organizations by observed posting volume.
 */
export function getCompanyIntelligence() {
  return {
    wording: "Observed posting volume in dataset",
    companies: TOP_HIRING_COMPANIES.map((c, idx) => ({
      rank: idx + 1,
      companyName: c.companyName,
      jobVolume: c.jobVolume,
      formattedVolume: c.jobVolume.toLocaleString(),
      marketSharePercent: c.marketSharePercent,
      formattedShare: `${c.marketSharePercent.toFixed(2)}%`,
      source: "DataScience Jobs.csv",
    })),
  };
}

/**
 * 6. Location Intelligence
 * Returns geographic hiring concentration from Analytics Jobs dataset.
 */
export function getLocationIntelligence() {
  return {
    wording: "Observed hiring locations in dataset",
    sourceNote: "City frequency in Analytics Jobs postings (multi-city mentions parsed accurately)",
    totalPostings: TOTAL_ANALYTICS_JOBS,
    locations: TOP_MARKET_LOCATIONS.map((loc, idx) => ({
      rank: idx + 1,
      city: loc.city,
      jobCount: loc.jobCount,
      formattedCount: loc.jobCount.toLocaleString(),
      marketSharePercent: loc.marketSharePercent,
      formattedShare: `${loc.marketSharePercent.toFixed(2)}%`,
    })),
  };
}

/**
 * 7. Role Comparison Helper
 * Compares two catalog roles across demand, compensation, and experience.
 * Explicitly guards against fabricating numbers for unsupported roles.
 */
export function compareMarketRoles(roleA, roleB) {
  const getRoleMetrics = (roleName) => {
    const data = getCareerMarketData(roleName);
    if (!data || !data.available) {
      return {
        roleName: roleName || "Unknown",
        available: false,
        evidenceStatus: "Not observed in provided dataset",
        postingVolume: null,
        formattedVolume: "Unavailable",
        marketSharePercent: null,
        formattedShare: "Unavailable",
        avgSalaryLPA: null,
        formattedAvgSalary: "Unavailable",
        salaryRange: "Unavailable",
        minExperience: null,
        demandTier: "Unobserved",
        topSkills: [],
        topCompanies: [],
      };
    }

    return {
      roleName: data.roleName,
      available: true,
      evidenceStatus: "Observed in provided dataset",
      postingVolume: data.postingVolume,
      formattedVolume: data.postingVolume.toLocaleString(),
      marketSharePercent: data.postingShare,
      formattedShare: `${data.postingShare}%`,
      avgSalaryLPA: data.avgSalary,
      formattedAvgSalary: data.salary.formattedAvg,
      salaryRange: data.salary.formattedRange,
      minSalaryLPA: data.minSalary,
      maxSalaryLPA: data.maxSalary,
      minExperience: data.minExperience,
      demandTier: data.demandTier,
      topSkills: data.topSkills || [],
      topCompanies: data.topCompanies || [],
    };
  };

  const a = getRoleMetrics(roleA);
  const b = getRoleMetrics(roleB);

  // Calculate comparisons only if both have observed metrics
  let demandComparison = null;
  let salaryComparison = null;
  let experienceComparison = null;

  if (a.available && b.available) {
    const volumeDelta = a.postingVolume - b.postingVolume;
    demandComparison = {
      higherRole: volumeDelta >= 0 ? a.roleName : b.roleName,
      ratio: Number((Math.max(a.postingVolume, b.postingVolume) / Math.min(a.postingVolume, b.postingVolume)).toFixed(2)),
      difference: Math.abs(volumeDelta),
    };

    const salaryDelta = a.avgSalaryLPA - b.avgSalaryLPA;
    salaryComparison = {
      higherRole: salaryDelta >= 0 ? a.roleName : b.roleName,
      differenceLPA: Number(Math.abs(salaryDelta).toFixed(2)),
    };

    const expDelta = a.minExperience - b.minExperience;
    experienceComparison = {
      higherRole: expDelta >= 0 ? a.roleName : b.roleName,
      differenceYears: Number(Math.abs(expDelta).toFixed(1)),
    };
  }

  return {
    roleA: a,
    roleB: b,
    bothObserved: a.available && b.available,
    demandComparison,
    salaryComparison,
    experienceComparison,
  };
}

/**
 * 8. Factual Insight Cards Generation
 * Generates verified statements directly derived from the hackathon datasets.
 */
export function getMarketFactualInsights() {
  const topDemand = Object.values(ROLE_MARKET_EVIDENCE).reduce(
    (max, curr) => (curr.postingVolume > max.postingVolume ? curr : max),
    { postingVolume: 0 }
  );
  const highestSal = Object.values(ROLE_MARKET_EVIDENCE).reduce(
    (max, curr) => (curr.avgSalaryLPA > max.avgSalaryLPA ? curr : max),
    { avgSalaryLPA: 0 }
  );
  const topCompany = TOP_HIRING_COMPANIES[0];
  const topLocation = TOP_MARKET_LOCATIONS[0];
  const topSkill = MARKET_SKILL_FREQUENCIES[0];

  return [
    {
      category: "CAREER DEMAND",
      title: "Strongest Observed Volume",
      text: `${topDemand.roleName} has the highest observed posting volume among standardized roles with ${topDemand.postingVolume.toLocaleString()} postings (${topDemand.marketSharePercent}% share).`,
      badge: "DEMAND LEADER",
    },
    {
      category: "COMPENSATION BENCHMARK",
      title: "Highest Observed Average Salary",
      text: `${highestSal.roleName} commands the highest observed average salary benchmark among standardized roles at ₹${highestSal.avgSalaryLPA.toFixed(2)} LPA (requiring ${highestSal.avgMinExperienceYears} years average seniority).`,
      badge: "SALARY BENCHMARK",
    },
    {
      category: "TECHNICAL SKILLS",
      title: "Dominant Skill Requirements",
      text: `${topSkill.skillName} leads overall analytical mentions (${topSkill.mentionCount.toLocaleString()} postings, ${topSkill.demandPercentage.toFixed(2)}%), while SQL and Python represent the two most common query & programming competencies.`,
      badge: "SKILL FREQUENCY",
    },
    {
      category: "ENTERPRISE HIRING",
      title: "Top Hiring Organization",
      text: `${topCompany.companyName} represents the highest observed volume in the dataset with ${topCompany.jobVolume.toLocaleString()} postings (${topCompany.marketSharePercent.toFixed(2)}% market share).`,
      badge: "ENTERPRISE VOLUME",
    },
    {
      category: "GEOGRAPHIC CONCENTRATION",
      title: "Primary Market Location",
      text: `${topLocation.city} represents the leading hub in the dataset, accounting for ${topLocation.jobCount.toLocaleString()} postings (${topLocation.marketSharePercent.toFixed(2)}% of observed postings).`,
      badge: "GEOGRAPHY",
    },
  ];
}

/**
 * 9. ML Model Prediction Separation
 * Strictly provides trained ML salary regression alongside observed market evidence,
 * keeping the two completely distinct.
 */
export function getMarketModelSeparation(roleName, userExperience) {
  const marketData = getCareerMarketData(roleName);
  const expNum = typeof userExperience === "number" ? userExperience : parseFloat(String(userExperience || "").replace(/[^0-9.]/g, ""));
  const validExp = !isNaN(expNum) && expNum >= 0 ? expNum : null;

  let modelPrediction = null;
  if (validExp !== null) {
    const predResult = predictSalary(validExp, roleName);
    if (predResult.available) {
      modelPrediction = {
        available: true,
        predictedSalaryLPA: predResult.predictedSalaryLPA,
        formattedSalary: `₹${predResult.predictedSalaryLPA} LPA`,
        inputExperience: validExp,
        modelType: "MODEL PREDICTION (Linear Regression)",
        datasetTrainedOn: "DataScience Jobs.csv (1,602 cluster records)",
        note: "Inferred from regression coefficients based on candidate experience and target role.",
      };
    } else {
      modelPrediction = {
        available: false,
        message: predResult.message || "Model estimate unavailable for this role.",
      };
    }
  } else {
    modelPrediction = {
      available: false,
      message: "Candidate experience not provided. Enter experience to evaluate model salary prediction.",
    };
  }

  const marketEvidence = marketData.available
    ? {
        available: true,
        avgSalaryLPA: marketData.avgSalary,
        formattedAvgSalary: marketData.salary.formattedAvg,
        salaryRange: marketData.salary.formattedRange,
        postingVolume: marketData.postingVolume,
        evidenceType: "MARKET EVIDENCE (Empirical Distribution)",
        source: "DataScience Jobs.csv",
        note: "Empirical arithmetic mean and observed range of compensation across dataset job records.",
      }
    : {
        available: false,
        message: "Market evidence unavailable for this role in the provided dataset.",
      };

  return {
    roleName,
    marketEvidence,
    modelPrediction,
    separationRule: "Observed market salaries and trained ML predictions must never be blended or conflated.",
  };
}
