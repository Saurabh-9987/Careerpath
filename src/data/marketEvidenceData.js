/**
 * CareerPath Market Evidence Data Layer
 * 
 * Centralized repository of empirical metrics verified during the
 * hackathon dataset audit of:
 * 1. DataScience Jobs (1,602 aggregated records representing 93,005 job postings)
 * 2. Analytics Jobs (15,841 raw posting records)
 * 3. JDS Skill Traits (139 valid candidate skill records evaluated against salary hike outcomes)
 * 
 * IMPORTANT:
 * - All salary metrics are reported in LPA (Lakhs Per Annum).
 * - All percentages are computed relative to the respective dataset totals.
 * - Non-causation boundary: These metrics reflect observational historical market data
 *   and do not constitute employment or compensation guarantees.
 */

// ============================================================================
// 1. ROLE MARKET DEMAND & SALARY BENCHMARKS
// Dataset: DataScience Jobs.csv (1,602 cluster records, 93,005 total postings)
// ============================================================================

export const MARKET_DEMAND_SUMMARY = {
  totalAggregatedPostings: 93005,
  totalDatasetRecords: 1602,
  uniqueCompanies: 642,
  uniqueStandardRoles: 10,
  overallAvgSalaryLPA: 13.23, // Unweighted mean across records
  postingWeightedAvgSalaryLPA: 9.69, // Weighted by num_of_jobs
};

/**
 * Verified role-by-role metrics from DataScience Jobs.csv
 * Keys match standardized role names used across the application.
 */
export const ROLE_MARKET_EVIDENCE = {
  "Business Analyst": {
    roleName: "Business Analyst",
    recordCount: 188,
    postingVolume: 32843,
    marketSharePercent: 35.31, // (32843 / 93005) * 100
    avgSalaryLPA: 8.95,
    minSalaryLPA: 1.2,
    maxSalaryLPA: 30.0,
    avgMinExperienceYears: 1.7,
  },
  "Data Analyst": {
    roleName: "Data Analyst",
    recordCount: 187,
    postingVolume: 18095,
    marketSharePercent: 19.46, // (18095 / 93005) * 100
    avgSalaryLPA: 5.71,
    minSalaryLPA: 0.2,
    maxSalaryLPA: 50.0,
    avgMinExperienceYears: 0.8,
  },
  "Senior Business Analyst": {
    roleName: "Senior Business Analyst",
    recordCount: 187,
    postingVolume: 14115,
    marketSharePercent: 15.18, // (14115 / 93005) * 100
    avgSalaryLPA: 13.17,
    minSalaryLPA: 2.4,
    maxSalaryLPA: 38.0,
    avgMinExperienceYears: 4.0,
  },
  "Data Scientist": {
    roleName: "Data Scientist",
    recordCount: 188,
    postingVolume: 9051,
    marketSharePercent: 9.73, // (9051 / 93005) * 100
    avgSalaryLPA: 13.53,
    minSalaryLPA: 2.0,
    maxSalaryLPA: 74.5,
    avgMinExperienceYears: 1.5,
  },
  "Data Engineer": {
    roleName: "Data Engineer",
    recordCount: 188,
    postingVolume: 8044,
    marketSharePercent: 8.65, // (8044 / 93005) * 100
    avgSalaryLPA: 11.81,
    minSalaryLPA: 1.1,
    maxSalaryLPA: 93.5,
    avgMinExperienceYears: 1.5,
  },
  "Senior Data Analyst": {
    roleName: "Senior Data Analyst",
    recordCount: 187,
    postingVolume: 3825,
    marketSharePercent: 4.11, // (3825 / 93005) * 100
    avgSalaryLPA: 9.57,
    minSalaryLPA: 1.4,
    maxSalaryLPA: 40.0,
    avgMinExperienceYears: 2.9,
  },
  "Senior Data Engineer": {
    roleName: "Senior Data Engineer",
    recordCount: 183,
    postingVolume: 3411,
    marketSharePercent: 3.67, // (3411 / 93005) * 100
    avgSalaryLPA: 19.0,
    minSalaryLPA: 2.5,
    maxSalaryLPA: 94.0,
    avgMinExperienceYears: 4.6,
  },
  "Senior Data Scientist": {
    roleName: "Senior Data Scientist",
    recordCount: 185,
    postingVolume: 2129,
    marketSharePercent: 2.29, // (2129 / 93005) * 100
    avgSalaryLPA: 22.29,
    minSalaryLPA: 1.0,
    maxSalaryLPA: 100.0,
    avgMinExperienceYears: 4.0,
  },
  "Machine Learning Engineer": {
    roleName: "Machine Learning Engineer",
    recordCount: 59,
    postingVolume: 964,
    marketSharePercent: 1.04, // (964 / 93005) * 100
    avgSalaryLPA: 9.85,
    minSalaryLPA: 2.0,
    maxSalaryLPA: 40.0,
    avgMinExperienceYears: 1.4,
  },
  "Data Architect": {
    roleName: "Data Architect",
    recordCount: 50,
    postingVolume: 528,
    marketSharePercent: 0.57, // (528 / 93005) * 100
    avgSalaryLPA: 25.09,
    minSalaryLPA: 7.5,
    maxSalaryLPA: 102.0,
    avgMinExperienceYears: 10.0,
  },
};

// ============================================================================
// 2. TOP HIRING COMPANIES
// Dataset: DataScience Jobs.csv (Aggregated posting volume across roles)
// ============================================================================

export const TOP_HIRING_COMPANIES = [
  {
    companyName: "TCS",
    jobVolume: 9064,
    marketSharePercent: 9.75, // (9064 / 93005) * 100
    recordCount: 10,
  },
  {
    companyName: "Accenture",
    jobVolume: 5425,
    marketSharePercent: 5.83, // (5425 / 93005) * 100
    recordCount: 10,
  },
  {
    companyName: "Cognizant",
    jobVolume: 3813,
    marketSharePercent: 4.10, // (3813 / 93005) * 100
    recordCount: 10,
  },
  {
    companyName: "Wipro",
    jobVolume: 2566,
    marketSharePercent: 2.76, // (2566 / 93005) * 100
    recordCount: 10,
  },
  {
    companyName: "IBM",
    jobVolume: 2480,
    marketSharePercent: 2.67, // (2480 / 93005) * 100
    recordCount: 10,
  },
];

// ============================================================================
// 3. MARKET SKILL FREQUENCY
// Dataset: Analytics Jobs.csv (15,841 raw job postings)
// ============================================================================

export const TOTAL_ANALYTICS_JOBS = 15841;

export const MARKET_SKILL_FREQUENCIES = [
  {
    skillName: "SQL",
    mentionCount: 915,
    demandPercentage: 5.78, // (915 / 15841) * 100
    category: "Data & Querying",
  },
  {
    skillName: "Python",
    mentionCount: 840,
    demandPercentage: 5.30, // (840 / 15841) * 100
    category: "Programming & Data Science",
  },
  {
    skillName: "Analytics / Data Analysis",
    mentionCount: 1522, // Combined "analytics" (904) + "data analysis" (618)
    demandPercentage: 9.61, // (1522 / 15841) * 100
    category: "Analytical Foundations",
  },
  {
    skillName: "Finance / Financial Analysis",
    mentionCount: 1001, // Combined "finance" (756) + "financial analysis" (245)
    demandPercentage: 6.32, // (1001 / 15841) * 100
    category: "Domain Expertise",
  },
  {
    skillName: "R",
    mentionCount: 655,
    demandPercentage: 4.13, // (655 / 15841) * 100
    category: "Statistical Computing",
  },
  {
    skillName: "SAS",
    mentionCount: 636,
    demandPercentage: 4.01, // (636 / 15841) * 100
    category: "Enterprise Analytics",
  },
  {
    skillName: "Business Analysis",
    mentionCount: 633,
    demandPercentage: 4.00, // (633 / 15841) * 100
    category: "Business Intelligence",
  },
  {
    skillName: "Machine Learning",
    mentionCount: 629,
    demandPercentage: 3.97, // (629 / 15841) * 100
    category: "Machine Learning & AI",
  },
  {
    skillName: "Excel",
    mentionCount: 393,
    demandPercentage: 2.48, // (393 / 15841) * 100
    category: "Productivity & Modeling",
  },
  {
    skillName: "Hadoop",
    mentionCount: 300,
    demandPercentage: 1.89, // (300 / 15841) * 100
    category: "Big Data & Distributed Systems",
  },
  {
    skillName: "Spark",
    mentionCount: 284,
    demandPercentage: 1.79, // (284 / 15841) * 100
    category: "Big Data & Distributed Systems",
  },
  {
    skillName: "Big Data",
    mentionCount: 263,
    demandPercentage: 1.66, // (263 / 15841) * 100
    category: "Big Data & Distributed Systems",
  },
];

// Map lookup helper for instant O(1) skill query
export const SKILL_DEMAND_LOOKUP = MARKET_SKILL_FREQUENCIES.reduce((acc, curr) => {
  acc[curr.skillName] = curr;
  return acc;
}, {});

// ============================================================================
// 4. LOCATION MARKET DATA
// Dataset: Analytics Jobs.csv (15,841 raw job postings)
// ============================================================================

export const TOP_MARKET_LOCATIONS = [
  {
    city: "Bengaluru",
    jobCount: 3333,
    marketSharePercent: 21.04, // (3333 / 15841) * 100
  },
  {
    city: "Mumbai",
    jobCount: 1992,
    marketSharePercent: 12.58, // (1992 / 15841) * 100
  },
  {
    city: "Gurgaon",
    jobCount: 1313,
    marketSharePercent: 8.29, // (1313 / 15841) * 100
  },
  {
    city: "Pune",
    jobCount: 945,
    marketSharePercent: 5.97, // (945 / 15841) * 100
  },
  {
    city: "Hyderabad",
    jobCount: 878,
    marketSharePercent: 5.54, // (878 / 15841) * 100
  },
  {
    city: "Chennai",
    jobCount: 786,
    marketSharePercent: 4.96, // (786 / 15841) * 100
  },
  {
    city: "Delhi NCR",
    jobCount: 593,
    marketSharePercent: 3.74, // (593 / 15841) * 100
  },
  {
    city: "Noida",
    jobCount: 403,
    marketSharePercent: 2.54, // (403 / 15841) * 100
  },
];

// ============================================================================
// 5. JDS EMPIRICAL TRAIT WEIGHTS
// Dataset: JDS Skill Traits.xlsx (139 valid candidate evaluations)
// Target: salary_hike_high_or_low (Binary 1/0 outcome)
// ============================================================================

export const JDS_EMPIRICAL_WEIGHTS = {
  // Empirical Pearson correlation coefficients with high salary hike
  correlations: {
    dashboardAndStorytelling: 0.554,
    mathsAndStatistics: 0.524,
    coding: 0.444,
    aiAndMl: 0.405,
    bigData: 0.112,
  },
  // Normalized percentage weights for simulator scoring (sum = 100%)
  normalizedWeights: {
    dashboardAndStorytelling: 0.27, // 27%
    mathsAndStatistics: 0.26,       // 26%
    coding: 0.22,                   // 22%
    aiAndMl: 0.20,                  // 20%
    bigData: 0.05,                  // 5%
  },
  // Normalized display percentages
  normalizedWeightPercents: {
    dashboardAndStorytelling: 27,
    mathsAndStatistics: 26,
    coding: 22,
    aiAndMl: 20,
    bigData: 5,
  },
  metadata: {
    validSampleCount: 139,
    targetVariable: "salary_hike_high_or_low",
    ratingScale: "1.0 - 5.0 rating scale",
    sumOfCorrelations: 2.039,
  },
};

// ============================================================================
// DEFAULT BUNDLED EXPORT
// ============================================================================

const marketEvidenceData = {
  summary: MARKET_DEMAND_SUMMARY,
  roles: ROLE_MARKET_EVIDENCE,
  topCompanies: TOP_HIRING_COMPANIES,
  skills: MARKET_SKILL_FREQUENCIES,
  skillLookup: SKILL_DEMAND_LOOKUP,
  locations: TOP_MARKET_LOCATIONS,
  jdsWeights: JDS_EMPIRICAL_WEIGHTS,
};

export default marketEvidenceData;
