/**
 * CareerPath Single Data Access Layer & Market Intelligence
 * ==========================================================
 * Connects the processed SAS Hackathon datasets to the CareerPath application:
 * 1. DataScience Jobs (1,602 cluster records, 93,005 aggregated postings across 10 roles)
 * 2. Analytics Jobs (15,841 raw job postings, 78,934 skill mentions)
 * 3. JDS Skill Traits (139 candidate technical evaluations vs salary hike)
 * 4. SDS Personality Traits (161 candidate Big Five evaluations vs career success)
 * 
 * Non-causation boundary:
 * Metrics are observational historical data from the official hackathon datasets.
 * They represent empirical market signals, not employment or salary guarantees.
 */

import careerFeaturesData from "./analysis/careerFeatures.json" with { type: "json" };
import roleFeaturesData from "./analysis/roleFeatures.json" with { type: "json" };
import skillFeaturesData from "./analysis/skillFeatures.json" with { type: "json" };
import { careerData } from "./careerData.js";

// ============================================================================
// 1. CAREER CATALOG TO DATASET ROLE MAPPING
// ============================================================================

/**
 * Explicit mapping between CareerPath's 20-career catalog and the 10 standardized
 * roles present in the DataScience Jobs dataset.
 * Careers without a direct dataset counterpart map to null (no fabricated values).
 */
export const CAREER_TO_DATASET_ROLE_MAP = {
  // Direct supported dataset roles
  "Data Scientist": "Data Scientist",
  "Data Analyst": "Data Analyst",
  "Data Engineer": "Data Engineer",
  "ML Engineer": "Machine Learning Engineer",
  "Machine Learning Engineer": "Machine Learning Engineer",
  "Business Analyst": "Business Analyst",
  "Senior Business Analyst": "Senior Business Analyst",
  "Senior Data Analyst": "Senior Data Analyst",
  "Senior Data Scientist": "Senior Data Scientist",
  "Senior Data Engineer": "Senior Data Engineer",
  "Data Architect": "Data Architect",
  // Standardized domain alias
  "Business Intelligence Analyst": "Business Analyst",

  // Explicitly unsupported roles in supplied dataset (no fabricated numbers)
  "Software Engineer": null,
  "Full Stack Developer": null,
  "Frontend Developer": null,
  "Backend Developer": null,
  "AI Engineer": null,
  "NLP Engineer": null,
  "Computer Vision Engineer": null,
  "Cloud Engineer": null,
  "DevOps Engineer": null,
  "Site Reliability Engineer (SRE)": null,
  "Cybersecurity Engineer": null,
  "Security Analyst": null,
  "UI/UX Designer": null,
  "Mobile App Developer": null,
  "Game Developer": null,
};

// ============================================================================
// 2. OVERALL MARKET SUMMARY
// ============================================================================

export const TOTAL_AGGREGATED_POSTINGS = 93005;

const MARKET_SUMMARY = {
  totalAggregatedPostings: TOTAL_AGGREGATED_POSTINGS,
  totalDatasetRecords: 1602,
  uniqueCompanies: 642,
  uniqueStandardRoles: 10,
  totalAnalyticsJobsRecords: 15841,
  overallAvgSalaryLPA: 13.23,
  postingWeightedAvgSalaryLPA: 9.69,
  datasetScope: "Empirical market benchmark derived from official SAS hackathon datasets (DataScience Jobs & Analytics Jobs)",
};

export function getMarketSummary() {
  return { ...MARKET_SUMMARY };
}

// ============================================================================
// 3. CAREER MARKET INTELLIGENCE SELECTORS
// ============================================================================

/**
 * Returns observed job-market demand intelligence for a career.
 * For unsupported roles, returns available: false without fabricated numbers.
 */
export function getCareerDemand(careerName) {
  if (!careerName || typeof careerName !== "string") {
    return {
      available: false,
      postingVolume: null,
      postingShare: null,
      source: "DataScience Jobs dataset",
      interpretation: "Observed aggregated job posting volume",
      message: "Market demand unavailable. No direct demand evidence for this role in the supplied datasets.",
    };
  }

  const datasetRole = CAREER_TO_DATASET_ROLE_MAP[careerName.trim()];
  if (!datasetRole || !careerFeaturesData[datasetRole]) {
    return {
      available: false,
      postingVolume: null,
      postingShare: null,
      source: "DataScience Jobs dataset",
      interpretation: "Observed aggregated job posting volume",
      message: "Market demand unavailable. No direct demand evidence for this role in the supplied datasets.",
    };
  }

  const rawRole = careerFeaturesData[datasetRole];
  const postingVolume = rawRole.posting_volume;
  const postingShare = Number(((postingVolume / TOTAL_AGGREGATED_POSTINGS) * 100).toFixed(2));

  return {
    available: true,
    postingVolume,
    postingShare,
    formattedVolume: postingVolume.toLocaleString(),
    formattedShare: `${postingShare}%`,
    source: "DataScience Jobs dataset",
    interpretation: "Observed aggregated job posting volume",
  };
}

/**
 * Returns complete empirical market intelligence for a given career name.
 * If the career is not in the dataset, returns marketDataAvailable: false.
 */
export function getCareerMarketData(careerName) {
  if (!careerName || typeof careerName !== "string") {
    return {
      available: false,
      marketDataAvailable: false,
      roleName: careerName || "Unknown",
      salary: null,
      demand: {
        available: false,
        postingVolume: null,
        postingShare: null,
        source: "DataScience Jobs dataset",
        interpretation: "Observed aggregated job posting volume",
        message: "Market demand unavailable. No direct demand evidence for this role in the supplied datasets.",
      },
      message: "Salary data unavailable. No direct salary evidence for this role in the supplied datasets. Market evidence unavailable for this role.",
    };
  }

  const datasetRole = CAREER_TO_DATASET_ROLE_MAP[careerName.trim()];
  if (!datasetRole || !careerFeaturesData[datasetRole]) {
    return {
      available: false,
      marketDataAvailable: false,
      roleName: careerName,
      salary: null,
      demand: {
        available: false,
        postingVolume: null,
        postingShare: null,
        source: "DataScience Jobs dataset",
        interpretation: "Observed aggregated job posting volume",
        message: "Market demand unavailable. No direct demand evidence for this role in the supplied datasets.",
      },
      message: "Salary data unavailable. No direct salary evidence for this role in the supplied datasets. Market evidence unavailable for this role.",
    };
  }

  const rawRole = careerFeaturesData[datasetRole];
  const topSkillsList = (rawRole.top_associated_skills || []).map((s) => s.skill);

  const avgSal = rawRole.compensation?.unweighted_avg_lpa || 0;
  const minSal = rawRole.compensation?.min_lpa || 0;
  const maxSal = rawRole.compensation?.max_lpa || 0;

  const salaryObject = {
    avg: avgSal,
    min: minSal,
    max: maxSal,
    avgSalary: avgSal,
    minSalary: minSal,
    maxSalary: maxSal,
    formattedAvg: `₹${avgSal.toFixed(2)} LPA`,
    formattedRange: `₹${minSal.toFixed(1)}–₹${maxSal.toFixed(1)} LPA`,
    currency: "INR",
    unit: "LPA",
    source: "DataScience Jobs dataset",
    interpretation: "Observed average salary in supplied job dataset",
  };

  const demandObject = getCareerDemand(careerName);

  return {
    available: true,
    marketDataAvailable: true,
    roleName: careerName,
    datasetRoleName: datasetRole,
    demand: demandObject,
    postingVolume: demandObject.postingVolume,
    postingShare: demandObject.postingShare,
    salary: salaryObject,
    avgSalary: avgSal,
    weightedAvgSalary: rawRole.compensation?.posting_weighted_avg_lpa || 0,
    minSalary: minSal,
    maxSalary: maxSal,
    minExperience: rawRole.experience_requirement?.mean_min_years || 0,
    medianExperience: rawRole.experience_requirement?.median_min_years || 0,
    topSkills: topSkillsList,
    topSkillsDetailed: rawRole.top_associated_skills || [],
    topCompanies: (rawRole.top_hiring_organizations || []).map((c) => ({
      companyName: c.company,
      jobVolume: c.posting_volume,
    })),
    demandTier: rawRole.market_demand_tier || "Standard",
    sourceNote: `Observed in ${rawRole.posting_volume.toLocaleString()} job postings across 642 hiring companies in DataScience Jobs benchmark.`,
  };
}

/**
 * Returns observed job posting volume for a career, or null if unsupported.
 */
export function getCareerPostingVolume(careerName) {
  const demand = getCareerDemand(careerName);
  return demand.available ? demand.postingVolume : null;
}

/**
 * Returns compensation benchmarks (LPA) for a career, or null if unsupported.
 */
export function getCareerSalary(careerName) {
  const data = getCareerMarketData(careerName);
  if (!data.available) return null;
  return data.salary;
}

/**
 * Returns experience benchmark (years) for a career, or null if unsupported.
 */
export function getCareerExperience(careerName) {
  const data = getCareerMarketData(careerName);
  if (!data.available) return null;
  return {
    minExperience: data.minExperience,
    medianExperience: data.medianExperience,
  };
}

/**
 * Returns detailed role feature card.
 */
export function getRoleFeatures(careerName) {
  if (!careerName) return roleFeaturesData;
  const datasetRole = CAREER_TO_DATASET_ROLE_MAP[careerName.trim()];
  if (!datasetRole) return null;
  return roleFeaturesData.find((r) => r.role_name === datasetRole) || null;
}

// ============================================================================
// 4. TOP COMPANIES & LOCATIONS SELECTORS
// ============================================================================

const GLOBAL_TOP_COMPANIES = [
  { companyName: "TCS", jobVolume: 9064, marketSharePercent: 9.75 },
  { companyName: "Accenture", jobVolume: 5425, marketSharePercent: 5.83 },
  { companyName: "Cognizant", jobVolume: 3813, marketSharePercent: 4.10 },
  { companyName: "Wipro", jobVolume: 2566, marketSharePercent: 2.76 },
  { companyName: "IBM", jobVolume: 2480, marketSharePercent: 2.67 },
  { companyName: "Genpact", jobVolume: 2147, marketSharePercent: 2.31 },
  { companyName: "Capgemini", jobVolume: 1994, marketSharePercent: 2.14 },
  { companyName: "L&T Infotech", jobVolume: 1873, marketSharePercent: 2.01 },
  { companyName: "Tech Mahindra", jobVolume: 1830, marketSharePercent: 1.97 },
  { companyName: "HCL Technologies", jobVolume: 1783, marketSharePercent: 1.92 },
];

export function getTopCompanies(careerName = null) {
  if (!careerName) return [...GLOBAL_TOP_COMPANIES];
  const data = getCareerMarketData(careerName);
  return data.available ? data.topCompanies : [...GLOBAL_TOP_COMPANIES];
}

const TOP_MARKET_LOCATIONS = [
  { city: "Bengaluru", jobCount: 4108, marketSharePercent: 20.17 },
  { city: "Mumbai", jobCount: 2643, marketSharePercent: 12.97 },
  { city: "Gurgaon", jobCount: 2129, marketSharePercent: 10.45 },
  { city: "Delhi NCR", jobCount: 1363, marketSharePercent: 6.69 },
  { city: "Pune", jobCount: 1253, marketSharePercent: 6.15 },
  { city: "Hyderabad", jobCount: 1179, marketSharePercent: 5.79 },
  { city: "Chennai", jobCount: 1083, marketSharePercent: 5.32 },
  { city: "Noida", jobCount: 682, marketSharePercent: 3.35 },
  { city: "Delhi", jobCount: 382, marketSharePercent: 1.88 },
  { city: "Kolkata", jobCount: 274, marketSharePercent: 1.35 },
];

export function getLocationMarketData() {
  return [...TOP_MARKET_LOCATIONS];
}

// ============================================================================
// 5. SKILL MARKET EVIDENCE SELECTORS
// ============================================================================

// Build fast lookup map for normalized skill features
const SKILL_LOOKUP_MAP = {};
skillFeaturesData.forEach((s) => {
  SKILL_LOOKUP_MAP[s.skill_name.toLowerCase()] = s;
});

/**
 * Returns list of top market skills with frequency and posting coverage.
 */
export function getTopSkills(limit = 20) {
  return skillFeaturesData.slice(0, limit).map((s) => ({
    skillName: s.skill_name,
    mentionCount: s.mention_count,
    postingCoverage: s.posting_coverage_pct,
    category: s.domain_category,
    primaryRoleAffinity: s.primary_role_affinity,
  }));
}

/**
 * Returns empirical market evidence for a specific skill.
 * Formulates non-causational signals ("Observed in X job postings").
 */
export function getSkillMarketData(skillName) {
  if (!skillName || typeof skillName !== "string") return null;
  const key = skillName.trim().toLowerCase();
  const raw = SKILL_LOOKUP_MAP[key];

  if (!raw) {
    return {
      skillName,
      available: false,
      message: `No explicit market postings observed for '${skillName}' in the Analytics Jobs dataset.`,
    };
  }

  return {
    available: true,
    skillName: raw.skill_name,
    mentionCount: raw.mention_count,
    postingCoverage: raw.posting_coverage_pct,
    category: raw.domain_category,
    primaryRoleAffinity: raw.primary_role_affinity,
    topCoOccurringSkills: raw.top_co_occurring_skills || [],
    marketSignal: `Observed in ${raw.mention_count.toLocaleString()} job postings (${raw.posting_coverage_pct}% market coverage) across 15,841 Analytics Jobs.`,
  };
}

export function getSkillFeatures(skillName) {
  return getSkillMarketData(skillName);
}

// ============================================================================
// 6. JDS TECHNICAL CAPABILITY SIGNALS
// ============================================================================

const JDS_EMPIRICAL_SIGNALS = {
  // Empirical Pearson correlation coefficients with high salary hike
  correlations: {
    dashboardAndStorytelling: 0.5541,
    mathsAndStatistics: 0.5238,
    coding: 0.4438,
    aiAndMl: 0.4046,
    bigData: 0.1123,
  },
  // Normalized percentage weights (sum = 100%)
  normalizedWeights: {
    dashboardAndStorytelling: 0.27, // 27%
    mathsAndStatistics: 0.26,       // 26%
    coding: 0.22,                   // 22%
    aiAndMl: 0.20,                  // 20%
    bigData: 0.05,                  // 5%
  },
  displayBreakdown: [
    { label: "Dashboard & Storytelling", weight: 27, correlation: 0.5541, roleRelevance: "Executive presentation, visual BI, stakeholder translation" },
    { label: "Maths & Statistics", weight: 26, correlation: 0.5238, roleRelevance: "Hypothesis testing, probability, inference, quantitative rigor" },
    { label: "Coding", weight: 22, correlation: 0.4438, roleRelevance: "Algorithms, structured data structures, script optimization" },
    { label: "AI & ML", weight: 20, correlation: 0.4046, roleRelevance: "Supervised & unsupervised modeling, feature engineering" },
    { label: "Big Data", weight: 5, correlation: 0.1123, roleRelevance: "Distributed systems, pipeline execution, cluster compute" },
  ],
  metadata: {
    sampleEvaluations: 139,
    cleanModelingEvaluations: 136,
    targetVariable: "salary_hike_high_or_low",
    interpretationNote: "Observed salary-hike association from 139 candidate technical evaluations (JDS benchmark). Observational signal; does not constitute a guaranteed salary increase.",
  },
};

export function getJDSWeights() {
  return { ...JDS_EMPIRICAL_SIGNALS };
}

// ============================================================================
// 7. RUNTIME CAREER AUGMENTATION HELPER
// ============================================================================

/**
 * Returns an existing career object augmented with its runtime market evidence
 * without mutating or removing any original career definitions.
 */
/**
 * Returns an existing career object augmented with its runtime market evidence
 * without mutating or removing any original career definitions.
 */
export function getAugmentedCareer(careerName) {
  const baseCareer = careerData[careerName];
  if (!baseCareer) return null;
  return {
    ...baseCareer,
    market: getCareerMarketData(careerName),
  };
}

/**
 * Returns all 20 careers augmented with their runtime market evidence.
 */
export function getAllAugmentedCareers() {
  const result = {};
  Object.keys(careerData).forEach((c) => {
    result[c] = getAugmentedCareer(c);
  });
  return result;
}

export function augmentCareerWithMarket(careerName, careerObject) {
  if (!careerObject) return null;
  return {
    ...careerObject,
    market: getCareerMarketData(careerName),
  };
}

// Re-export ML Engine methods
export {
  getModelRegistry,
  getMLTrainingSummary,
  predictJuniorSalaryHike,
  predictSeniorLeadershipSuccess,
  predictMarketSalary,
  getMarketSkillArchetypes,
} from "./careerMLEngine.js";

// Default export object for convenient consumption
const careerIntelligence = {
  getMarketSummary,
  getCareerMarketData,
  getCareerPostingVolume,
  getCareerSalary,
  getCareerExperience,
  getRoleFeatures,
  getTopCompanies,
  getLocationMarketData,
  getTopSkills,
  getSkillMarketData,
  getSkillFeatures,
  getJDSWeights,
  getAugmentedCareer,
  getAllAugmentedCareers,
  augmentCareerWithMarket,
  CAREER_TO_DATASET_ROLE_MAP,
};

export default careerIntelligence;
