/**
 * CareerPath Data-Driven Career Mobility Intelligence Engine
 * ==========================================================
 * Connects trained ML intelligence, empirical SAS hackathon market evidence,
 * career catalog skill requirements, skill-gap analysis, and the Career Escape Route
 * into a unified decision-support engine.
 *
 * Core User Question:
 * "I am here. I want to move there. What is stopping me? What is the smartest route?"
 *
 * Data Classification Boundaries:
 * - USER-PROVIDED DATA: Explicit candidate inputs (skills, experience, current role, personality)
 * - PROFILE-DERIVED FEATURE: Deterministic feature transformations (keyword coverage, skill matches)
 * - MARKET EVIDENCE: Empirical counts, averages, and company distributions from hackathon datasets
 * - MODEL PREDICTION: Statistical probabilities and regression estimates from trained ML models
 *
 * Rules:
 * - Deterministic, explainable calculations only (observational signals, not employment guarantees)
 * - Zero fabricated market data, salaries, or experience requirements
 * - Reuses existing careerData, careerIntelligence, careerEscapeRoute, and careerMLEngine
 */

import { careerData } from "./careerData.js";
import {
  getCareerMarketData,
  getCareerExperience,
  getLocationMarketData,
} from "./careerIntelligence.js";
import {
  getCareerEscapeRoute,
} from "./careerEscapeRoute.js";
import {
  parseProfileSkills,
  isSkillMatched,
} from "../utils/careerScoring.js";
import {
  parseProfileExperience,
  mapProfileToJdsScores,
  mapProfileToPersonality,
  predictJuniorSalaryHike,
  predictSeniorLeadershipSuccess,
  predictMarketSalary,
} from "./careerMLEngine.js";

// ============================================================================
// 1. CORE SKILL GAP ANALYSIS
// ============================================================================

/**
 * Evaluates skill fit and gap between a candidate's profile and the target role.
 * Reuses existing canonical career catalog definitions and scoring normalization.
 */
export function calculateSkillGap(targetRole, profile = {}) {
  const targetObj = careerData[targetRole];
  if (!targetObj) {
    return {
      available: false,
      targetRole: targetRole || null,
      matchedSkills: [],
      missingSkills: [],
      recommendedSkills: [],
      missingRecommendedSkills: [],
      coreSkillCount: 0,
      matchedSkillCount: 0,
      missingSkillCount: 0,
      coveragePercentage: 0,
      highestPriorityMissingSkills: [],
      message: "Target career not found in existing catalog.",
    };
  }

  const userSkills = parseProfileSkills(profile?.skills);
  const coreSkills = targetObj.skills || [];
  const recommendedSkills = targetObj.recommendedSkills || [];

  const matchedSkills = [];
  const missingSkills = [];

  coreSkills.forEach((skill) => {
    if (isSkillMatched(skill, userSkills)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  const missingRecommendedSkills = recommendedSkills.filter(
    (skill) => !isSkillMatched(skill, userSkills)
  );

  const coreCount = coreSkills.length || 1;
  const coveragePercentage = Math.round((matchedSkills.length / coreCount) * 100);

  // Rank missing skills: prioritize core catalog skills weighted by target skill weights if present
  const weights = targetObj.skillWeights || {};
  const highestPriorityMissingSkills = [...missingSkills].sort((a, b) => {
    const wA = weights[a] || 10;
    const wB = weights[b] || 10;
    return wB - wA;
  });

  return {
    available: true,
    targetRole,
    matchedSkills,
    missingSkills,
    recommendedSkills,
    missingRecommendedSkills,
    coreSkillCount: coreSkills.length,
    matchedSkillCount: matchedSkills.length,
    missingSkillCount: missingSkills.length,
    coveragePercentage,
    highestPriorityMissingSkills,
  };
}

// ============================================================================
// 2. EXPERIENCE GAP ANALYSIS
// ============================================================================

/**
 * Calculates current candidate experience vs target role benchmark.
 * Never invents experience requirements; explicitly returns unavailable if data is absent.
 */
export function calculateExperienceGap(targetRole, profile = {}) {
  const parsedExp = parseProfileExperience(profile?.experience);
  const targetMarketExp = getCareerExperience(targetRole);

  const currentExperience = {
    available: parsedExp.available,
    source: "USER-PROVIDED DATA",
    years: parsedExp.available ? parsedExp.experienceYears : null,
    message: parsedExp.available
      ? null
      : "Candidate experience not provided or unparseable. Add experience to calculate gap.",
  };

  const targetExperience = {
    available: Boolean(targetMarketExp && typeof targetMarketExp.minExperience === "number"),
    source: targetMarketExp ? "MARKET EVIDENCE (DataScience Jobs dataset)" : "MARKET EVIDENCE",
    minYears: targetMarketExp ? targetMarketExp.minExperience : null,
    medianYears: targetMarketExp ? targetMarketExp.medianExperience : null,
    message: targetMarketExp
      ? null
      : "Target experience benchmark unavailable for this role in the provided dataset.",
  };

  let gapYears = null;
  let surplusYears = null;
  let status = "Unavailable";

  if (currentExperience.available && targetExperience.available) {
    const diff = Math.round((targetExperience.minYears - currentExperience.years) * 10) / 10;
    if (diff > 0) {
      gapYears = diff;
      surplusYears = 0;
      status = "Deficit / Gap Exists";
    } else {
      gapYears = 0;
      surplusYears = Math.abs(diff);
      status = "Qualified / Meets Benchmark";
    }
  }

  return {
    available: currentExperience.available && targetExperience.available,
    currentExperience,
    targetExperience,
    gapYears,
    surplusYears,
    status,
  };
}

// ============================================================================
// 3. MARKET OPPORTUNITY EXTRACTION
// ============================================================================

/**
 * Extracts empirical market evidence for a target role without substituting fake values.
 */
export function extractMarketOpportunity(targetRole, currentRole = null) {
  const targetMarket = getCareerMarketData(targetRole);
  const currentMarket = currentRole ? getCareerMarketData(currentRole) : null;

  if (!targetMarket || !targetMarket.available) {
    return {
      marketDataAvailable: false,
      source: "MARKET EVIDENCE",
      roleName: targetRole,
      postingVolume: null,
      postingShare: null,
      demandTier: null,
      avgSalary: null,
      formattedAvgSalary: null,
      salaryRange: null,
      minSalary: null,
      maxSalary: null,
      potentialSalaryGainLPA: null,
      topHiringCompanies: [],
      topLocations: [],
      message: "Market evidence unavailable for this role in the provided dataset.",
    };
  }

  let potentialSalaryGainLPA = null;
  if (currentMarket && currentMarket.available && typeof currentMarket.avgSalary === "number") {
    potentialSalaryGainLPA = Math.round((targetMarket.avgSalary - currentMarket.avgSalary) * 10) / 10;
  }

  return {
    marketDataAvailable: true,
    source: "MARKET EVIDENCE (DataScience Jobs dataset)",
    roleName: targetRole,
    postingVolume: targetMarket.postingVolume,
    postingShare: targetMarket.postingShare,
    formattedVolume: targetMarket.postingVolume.toLocaleString(),
    demandTier: targetMarket.demandTier || "Standard",
    avgSalary: targetMarket.avgSalary,
    formattedAvgSalary: targetMarket.salary?.formattedAvg || `₹${targetMarket.avgSalary} LPA`,
    salaryRange: targetMarket.salary?.formattedRange || null,
    minSalary: targetMarket.minSalary,
    maxSalary: targetMarket.maxSalary,
    potentialSalaryGainLPA,
    topHiringCompanies: targetMarket.topCompanies || [],
    topLocations: getLocationMarketData(),
    message: null,
  };
}

// ============================================================================
// 4. ML INTELLIGENCE INTEGRATION
// ============================================================================

/**
 * Runs trained ML models on candidate profile without conflating ML with market evidence.
 */
export function evaluateMobilityMlSignals(targetRole, profile = {}) {
  // A. JDS Technical Outcome Model
  const jdsMapping = mapProfileToJdsScores(profile);
  let technicalSignal = null;
  if (jdsMapping.sufficientData) {
    const pred = predictJuniorSalaryHike(jdsMapping.scores);
    technicalSignal = {
      ...pred,
      available: true,
      source: "MODEL PREDICTION",
      featureDerivation: "PROFILE-DERIVED FEATURE",
      dimensionMatches: jdsMapping.dimensionMatches,
    };
  } else {
    technicalSignal = {
      available: false,
      source: "MODEL PREDICTION",
      featureDerivation: "PROFILE-DERIVED FEATURE",
      message: jdsMapping.message,
    };
  }

  // B. Salary Regressor Model
  const expData = parseProfileExperience(profile?.experience);
  let salaryPrediction = null;
  if (expData.available) {
    salaryPrediction = predictMarketSalary(expData.experienceYears, targetRole);
    salaryPrediction.inputExperience = expData.experienceYears;
    salaryPrediction.inputExperienceSource = "USER-PROVIDED DATA";
  } else {
    salaryPrediction = {
      available: false,
      source: "MODEL PREDICTION",
      inputExperienceSource: "USER-PROVIDED DATA",
      message: expData.message,
      predictedSalaryLPA: null,
    };
  }

  // C. SDS Senior Personality Model
  const profileWithPersonality = profile?.personality || profile?.traits ? profile : { personality: profile };
  const personalityMapping = mapProfileToPersonality(profileWithPersonality);
  let personalitySignal = null;
  if (personalityMapping.available) {
    const sdsPred = predictSeniorLeadershipSuccess(personalityMapping.scores);
    personalitySignal = {
      ...sdsPred,
      available: true,
      source: "MODEL PREDICTION",
      traitsSource: "USER-PROVIDED DATA",
    };
  } else {
    personalitySignal = {
      available: false,
      source: "MODEL PREDICTION",
      traitsSource: "USER-PROVIDED DATA",
      message: personalityMapping.message,
    };
  }

  return {
    technicalSignal,
    salaryPrediction,
    personalitySignal,
  };
}

// ============================================================================
// 5. EXPLAINABLE MOBILITY SCORE (0–100)
// ============================================================================

/**
 * Calculates a rigorous, explainable mobility score between current and target career.
 * Broken down into 5 distinct, transparent components (Sum = 100 max points):
 * 1. Skill Fit (35 points) - Verified core competency coverage
 * 2. Experience Fit (20 points) - Experience vs dataset minimum benchmark
 * 3. Mobility Ease / Friction Inversion (20 points) - Transition proximity from Escape Route
 * 4. Market Opportunity (15 points) - Observed job posting volume and hiring liquidity
 * 5. Salary Incentive Signal (10 points) - Economic lift / compensation tier delta
 */
export function calculateMobilityScore(skillGap, experienceGap, marketOpp, frictionScore) {
  // 1. Skill Fit Component (35 points) - Always available for catalog careers
  const coverageRatio = skillGap?.available ? skillGap.coveragePercentage / 100 : 0;
  const skillFitScore = Math.round(coverageRatio * 35);

  // 2. Mobility Ease / Friction Inversion (20 points) - Always available from Escape Route
  const safeFriction = typeof frictionScore === "number" ? Math.max(0, Math.min(100, frictionScore)) : 50;
  const mobilityEaseRatio = (100 - safeFriction) / 100;
  const mobilityEaseScore = Math.round(mobilityEaseRatio * 20);

  // 3. Experience Fit Component (20 points)
  let isExperienceAvailable = false;
  let experienceFitScore = null;
  let expExplanation = "Experience benchmark unavailable for this role in the provided dataset.";

  if (experienceGap && experienceGap.available) {
    isExperienceAvailable = true;
    if (experienceGap.gapYears === 0) {
      experienceFitScore = 20;
      expExplanation = `Meets or exceeds market benchmark (${experienceGap.currentExperience.years} yrs vs ${experienceGap.targetExperience.minYears} yrs required).`;
    } else {
      const targetMin = experienceGap.targetExperience.minYears || 1;
      const curYears = experienceGap.currentExperience.years || 0;
      const ratio = Math.max(0, curYears / targetMin);
      experienceFitScore = Math.round(ratio * 20);
      expExplanation = `Experience deficit of ${experienceGap.gapYears} yrs against observed benchmark (${experienceGap.targetExperience.minYears} yrs).`;
    }
  } else if (experienceGap && !experienceGap.currentExperience?.available) {
    expExplanation = "Candidate experience not specified in profile; add experience to evaluate benchmark.";
  }

  // 4. Market Opportunity Component (15 points)
  // When market evidence is unavailable: available: false, points: null, reason: "Market evidence unavailable for this role in the provided dataset."
  const isMarketAvailable = Boolean(marketOpp && marketOpp.marketDataAvailable);
  let marketOpportunityScore = null;
  let marketExplanation = "Market evidence unavailable for this role in the provided dataset.";

  if (isMarketAvailable) {
    const vol = marketOpp.postingVolume || 0;
    if (vol >= 8000) {
      marketOpportunityScore = 15;
      marketExplanation = `Very high market demand tier (${vol.toLocaleString()} observed postings).`;
    } else if (vol >= 3000) {
      marketOpportunityScore = 12;
      marketExplanation = `Strong market demand tier (${vol.toLocaleString()} observed postings).`;
    } else if (vol >= 1000) {
      marketOpportunityScore = 9;
      marketExplanation = `Moderate market demand tier (${vol.toLocaleString()} observed postings).`;
    } else {
      marketOpportunityScore = 6;
      marketExplanation = `Specialized/niche market demand tier (${vol.toLocaleString()} observed postings).`;
    }
  }

  // 5. Salary Incentive Signal (10 points)
  // When salary evidence is unavailable: available: false, points: null, reason: "Salary evidence unavailable for this role in the provided dataset."
  const isSalaryAvailable = Boolean(
    marketOpp &&
    marketOpp.marketDataAvailable &&
    typeof marketOpp.avgSalary === "number"
  );
  let salarySignalScore = null;
  let salaryExplanation = "Salary evidence unavailable for this role in the provided dataset.";

  if (isSalaryAvailable) {
    if (marketOpp.potentialSalaryGainLPA !== null) {
      if (marketOpp.potentialSalaryGainLPA > 3.0) {
        salarySignalScore = 10;
        salaryExplanation = `High salary advancement incentive (+₹${marketOpp.potentialSalaryGainLPA} LPA observed delta).`;
      } else if (marketOpp.potentialSalaryGainLPA > 0) {
        salarySignalScore = 8;
        salaryExplanation = `Moderate salary growth potential (+₹${marketOpp.potentialSalaryGainLPA} LPA observed delta).`;
      } else {
        salarySignalScore = 5;
        salaryExplanation = "Lateral salary level compared to current career benchmark.";
      }
    } else {
      salarySignalScore = Math.min(10, Math.max(4, Math.round(marketOpp.avgSalary / 2.5)));
      salaryExplanation = `Benchmark salary of ₹${marketOpp.avgSalary} LPA observed in dataset.`;
    }
  }

  // Assemble components dictionary
  const components = {
    skillFit: {
      available: Boolean(skillGap && skillGap.available),
      points: skillFitScore,
      score: skillFitScore,
      maxPoints: 35,
      weightPercent: 35,
      coveragePercent: skillGap?.coveragePercentage ?? 0,
      matchedCount: skillGap?.matchedSkillCount ?? 0,
      totalCount: skillGap?.coreSkillCount ?? 0,
      reason: `Verified competency in ${skillGap?.matchedSkillCount ?? 0} of ${skillGap?.coreSkillCount ?? 0} core skills (${skillGap?.coveragePercentage ?? 0}%).`,
      explanation: `Verified competency in ${skillGap?.matchedSkillCount ?? 0} of ${skillGap?.coreSkillCount ?? 0} core skills (${skillGap?.coveragePercentage ?? 0}%).`,
    },
    experienceFit: {
      available: isExperienceAvailable,
      points: isExperienceAvailable ? experienceFitScore : null,
      score: isExperienceAvailable ? experienceFitScore : null,
      maxPoints: 20,
      weightPercent: 20,
      reason: expExplanation,
      explanation: expExplanation,
    },
    mobilityEase: {
      available: true,
      points: mobilityEaseScore,
      score: mobilityEaseScore,
      maxPoints: 20,
      weightPercent: 20,
      frictionScore: safeFriction,
      reason: `Transition friction measured at ${safeFriction}/100 based on skill leap distance.`,
      explanation: `Transition friction measured at ${safeFriction}/100 based on skill leap distance.`,
    },
    marketOpportunity: {
      available: isMarketAvailable,
      points: isMarketAvailable ? marketOpportunityScore : null,
      score: isMarketAvailable ? marketOpportunityScore : null,
      maxPoints: 15,
      weightPercent: 15,
      postingVolume: isMarketAvailable ? marketOpp.postingVolume : null,
      reason: marketExplanation,
      explanation: marketExplanation,
    },
    salarySignal: {
      available: isSalaryAvailable,
      points: isSalaryAvailable ? salarySignalScore : null,
      score: isSalaryAvailable ? salarySignalScore : null,
      maxPoints: 10,
      weightPercent: 10,
      avgSalary: isSalaryAvailable ? marketOpp.avgSalary : null,
      reason: salaryExplanation,
      explanation: salaryExplanation,
    },
  };

  // Identify available vs unavailable components
  const availableComponents = [];
  const unavailableComponents = [];
  let totalEarnedPoints = 0;
  let maxAvailablePoints = 0;

  Object.entries(components).forEach(([key, comp]) => {
    if (comp.available && typeof comp.points === "number") {
      availableComponents.push(key);
      totalEarnedPoints += comp.points;
      maxAvailablePoints += comp.maxPoints;
    } else {
      unavailableComponents.push(key);
    }
  });

  // Recalculate overall mobility score using ONLY available evidence components
  let normalizedScore = maxAvailablePoints > 0
    ? Math.round((totalEarnedPoints / maxAvailablePoints) * 100)
    : 0;

  // Penalty cap: if 0 verified skills match the target role, cap mobility score at 30
  if (skillGap?.matchedSkillCount === 0) {
    normalizedScore = Math.min(normalizedScore, 30);
  }

  const overallScore = Math.max(0, Math.min(100, normalizedScore));

  let ratingTier = "Moderate";
  if (overallScore >= 75) ratingTier = "High";
  else if (overallScore <= 45) ratingTier = "Low";

  const evidenceCoveragePercent = Math.round((maxAvailablePoints / 100) * 100);

  const normalization = {
    totalEarnedPoints,
    maxAvailablePoints,
    totalPossiblePoints: 100,
    evidenceCoveragePercent,
    method: unavailableComponents.length > 0
      ? `Rescaled to 100 based on available evidence components (${totalEarnedPoints}/${maxAvailablePoints} * 100).`
      : "Full 100-point evidence benchmark coverage.",
  };

  return {
    score: overallScore,
    overallScore,
    ratingTier,
    availableComponents,
    unavailableComponents,
    normalization,
    components,
  };
}

// ============================================================================
// 6. SYNTHESIS: COMPLETE CAREER MOBILITY ANALYSIS
// ============================================================================

/**
 * Answers the core user question:
 * "I am here. I want to move there. What is stopping me? What is the smartest route?"
 *
 * @param {string} currentRole - Candidate's current career title
 * @param {string} targetRole - Candidate's desired target career title
 * @param {Object} [profile] - Candidate's profile (skills, experience, personality, etc.)
 * @param {Object} [options] - Configuration { optimizationMode: "Fastest" | "Skill Fit" | "Market" }
 * @returns {Object} Comprehensive career mobility intelligence payload
 */
export function analyzeCareerMobility(currentRole, targetRole, profile = {}, options = {}) {
  const normCurrent = (currentRole || profile?.currentRole || profile?.role || "Data Analyst").trim();
  const normTarget = (targetRole || profile?.targetRole || profile?.targetCareer || "Data Scientist").trim();
  const optimizationMode = options.optimizationMode || "Fastest";

  // 1. Skill Gap Analysis
  const skillGap = calculateSkillGap(normTarget, profile);

  // 2. Experience Gap Analysis
  const experienceGap = calculateExperienceGap(normTarget, profile);

  // 3. Real Market Opportunity Evidence
  const marketOpportunity = extractMarketOpportunity(normTarget, normCurrent);

  // 4. Career Escape Route Discovery
  const escapeRouteResult = getCareerEscapeRoute(normCurrent, normTarget, profile);

  // Pick route matching optimization mode
  let selectedRoute = escapeRouteResult.directRoute;
  if (optimizationMode === "Skill Fit" && escapeRouteResult.rankings?.skillFit) {
    selectedRoute = escapeRouteResult.rankings.skillFit;
  } else if (optimizationMode === "Market" && escapeRouteResult.rankings?.market) {
    selectedRoute = escapeRouteResult.rankings.market;
  } else if (escapeRouteResult.rankings?.fastest) {
    selectedRoute = escapeRouteResult.rankings.fastest;
  }

  const frictionScore = escapeRouteResult.mobilityFriction?.score ?? 50;

  // 5. Mobility Compatibility Score (0–100)
  const mobilityScore = calculateMobilityScore(
    skillGap,
    experienceGap,
    marketOpportunity,
    frictionScore,
    profile
  );

  // 6. Trained ML Signals (Kept strictly separate from Market Evidence)
  const mlSignals = evaluateMobilityMlSignals(normTarget, profile);

  // 7. Explainability Synthesis: WHY, BLOCKERS, ROUTE
  const whyReasons = [];
  const blockers = [];

  // Positives (Why)
  if (skillGap.coveragePercentage > 0) {
    whyReasons.push(`+ ${skillGap.coveragePercentage}% core skill overlap (${skillGap.matchedSkills.join(", ")})`);
  }
  if (marketOpportunity.marketDataAvailable) {
    whyReasons.push(`+ Observed job market demand: ${marketOpportunity.formattedVolume} postings in benchmark`);
    if (marketOpportunity.avgSalary) {
      whyReasons.push(`+ Observed market average salary: ${marketOpportunity.formattedAvgSalary}`);
    }
  }
  if (experienceGap.available && experienceGap.gapYears === 0) {
    whyReasons.push(`+ Experience benchmark satisfied (${experienceGap.currentExperience.years} yrs verified)`);
  }
  if (escapeRouteResult.mobilityFriction?.level === "Low") {
    whyReasons.push("+ Low transition friction: close adjacent career competencies");
  }

  // Negatives (Blockers)
  if (skillGap.missingSkills.length > 0) {
    blockers.push(`- Missing ${skillGap.missingSkills.length} core competencies: ${skillGap.missingSkills.slice(0, 3).join(", ")}${skillGap.missingSkills.length > 3 ? "..." : ""}`);
  }
  if (experienceGap.available && experienceGap.gapYears > 0) {
    blockers.push(`- Experience gap: ${experienceGap.gapYears} yrs behind observed minimum (${experienceGap.targetExperience.minYears} yrs required)`);
  } else if (!experienceGap.currentExperience.available) {
    blockers.push("- Experience not provided: complete profile to verify seniority benchmark");
  }
  if (escapeRouteResult.mobilityFriction?.score >= 60) {
    blockers.push(`- Substantial mobility friction (${escapeRouteResult.mobilityFriction.score}/100): multi-step pathway recommended`);
  }

  const explainability = {
    targetRole: normTarget,
    currentRole: normCurrent,
    headline: `Mobility compatibility from ${normCurrent} to ${normTarget} is ${mobilityScore.ratingTier} (${mobilityScore.overallScore}/100).`,
    why: whyReasons.length > 0 ? whyReasons : ["+ Baseline catalog alignment"],
    blockers: blockers.length > 0 ? blockers : ["None: Candidate satisfies all observed target benchmarks"],
    smartestRoute: {
      routeId: selectedRoute?.id || "route-direct",
      type: selectedRoute?.type || "direct",
      careers: selectedRoute?.careers || [normCurrent, normTarget],
      pathString: (selectedRoute?.careers || [normCurrent, normTarget]).join(" → "),
      steps: selectedRoute?.steps || 1,
      mobilityFrictionScore: selectedRoute?.mobilityFriction?.score ?? frictionScore,
      mobilityFrictionLevel: selectedRoute?.mobilityFriction?.level ?? "Moderate",
      explanation: selectedRoute?.explanation || escapeRouteResult.explanation,
    },
  };

  return {
    currentRole: normCurrent,
    targetRole: normTarget,
    optimizationMode,
    mobilityScore,
    skillGap,
    experienceGap,
    marketOpportunity,
    escapeRoute: {
      available: escapeRouteResult.available,
      selectedRoute,
      directRoute: escapeRouteResult.directRoute,
      recommendedRoutes: escapeRouteResult.recommendedRoutes,
      rankings: escapeRouteResult.rankings,
      mobilityFriction: escapeRouteResult.mobilityFriction,
      explanation: escapeRouteResult.explanation,
    },
    mlSignals,
    explainability,
  };
}

// ============================================================================
// 7. WHAT-IF READINESS ENGINE
// ============================================================================

/**
 * Simulates a What-If scenario with candidate modifications (e.g., learning new skills,
 * gaining years of experience, or switching target career).
 *
 * @param {string} currentRole
 * @param {string} targetRole
 * @param {Object} baseProfile
 * @param {Object} modifications - { additionalSkills: [], additionalExperienceYears: 0, overrideExperience, overrideTargetRole }
 * @returns {Object} { baseline, simulated, delta: { scoreDelta, newMatchedSkills, remainingMissingSkills, experienceGapDelta, improvementSummary } }
 */
export function simulateWhatIf(currentRole, targetRole, baseProfile = {}, modifications = {}) {
  const normCurrent = (currentRole || baseProfile?.currentRole || baseProfile?.role || "Data Analyst").trim();
  const baselineTarget = (targetRole || baseProfile?.targetRole || baseProfile?.targetCareer || "Data Scientist").trim();
  const simulatedTarget = (modifications.overrideTargetRole || baselineTarget).trim();
  const optimizationMode = modifications.optimizationMode || "Fastest";

  // 1. Run baseline calculation with original target and profile
  const baseline = analyzeCareerMobility(normCurrent, baselineTarget, baseProfile, { optimizationMode });

  // 2. Synthesize modified profile
  const existingSkills = parseProfileSkills(baseProfile?.skills);
  const rawExtra = modifications.additionalSkills || [];
  const extraSkills = Array.isArray(rawExtra)
    ? rawExtra.map((s) => String(s).trim()).filter(Boolean)
    : typeof rawExtra === "string"
    ? rawExtra.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean)
    : [];

  const combinedSkills = Array.from(new Set([...existingSkills, ...extraSkills]));

  let modifiedExp = baseProfile?.experience;
  if (modifications.overrideExperience !== undefined) {
    modifiedExp = modifications.overrideExperience;
  } else if (modifications.additionalExperienceYears) {
    const parsedExp = parseProfileExperience(baseProfile?.experience);
    const baseYears = parsedExp.available ? parsedExp.experienceYears : 0;
    modifiedExp = baseYears + Number(modifications.additionalExperienceYears);
  }

  const modifiedProfile = {
    ...baseProfile,
    skills: combinedSkills,
    experience: modifiedExp,
  };

  // 3. Run simulated calculation with overridden target and modified profile
  const simulated = analyzeCareerMobility(normCurrent, simulatedTarget, modifiedProfile, { optimizationMode });

  const scoreDelta = simulated.mobilityScore.overallScore - baseline.mobilityScore.overallScore;

  // Calculate newly satisfied skills (skills present in simulated profile that were missing in baseline)
  const previousMissing = baseline.skillGap.missingSkills;
  const newlyAcquired = previousMissing.filter((skill) =>
    isSkillMatched(skill, combinedSkills)
  );

  let expGapDelta = null;
  if (baseline.experienceGap.available && simulated.experienceGap.available) {
    expGapDelta = Math.round((baseline.experienceGap.gapYears - simulated.experienceGap.gapYears) * 10) / 10;
  }

  const skillCoverageDelta = simulated.skillGap.coveragePercentage - baseline.skillGap.coveragePercentage;

  // Route change analysis
  const previousRoute = baseline.escapeRoute?.selectedRoute;
  const newRoute = simulated.escapeRoute?.selectedRoute;
  const previousPathString = previousRoute?.pathString || previousRoute?.careers?.join(" → ") || `${normCurrent} → ${baselineTarget}`;
  const newPathString = newRoute?.pathString || newRoute?.careers?.join(" → ") || `${normCurrent} → ${simulatedTarget}`;
  const routeChanged = previousPathString !== newPathString;

  // Specific "Next Best Action" explanations (Requirement 6)
  const skillImpactNotes = newlyAcquired.map((skill) => {
    return `Adding ${skill} improves your skill coverage because ${skill} is a required/core skill for ${simulatedTarget}.`;
  });

  let summary = "No score change observed in simulation.";
  if (scoreDelta > 0) {
    const skillText = newlyAcquired.length > 0 ? `acquiring ${newlyAcquired.join(", ")}` : "";
    const expText = modifications.additionalExperienceYears ? `adding ${modifications.additionalExperienceYears} yr(s) experience` : "";
    const targetText = baselineTarget !== simulatedTarget ? `switching target to ${simulatedTarget}` : "";
    const combinedReason = [skillText, expText, targetText].filter(Boolean).join(" and ");
    summary = `+${scoreDelta} points mobility improvement through ${combinedReason || "profile enhancements"}.`;
  } else if (scoreDelta < 0) {
    summary = `${scoreDelta} points mobility change in simulation.`;
  }

  return {
    baseline,
    simulated,
    delta: {
      scoreDelta,
      skillCoverageDelta,
      newMatchedSkills: newlyAcquired,
      remainingMissingSkills: simulated.skillGap.missingSkills,
      experienceGapDelta: expGapDelta,
      targetRoleChanged: baselineTarget !== simulatedTarget,
      baselineTarget,
      simulatedTarget,
      routeChanged,
      previousPathString,
      newPathString,
      previousRoute,
      newRoute,
      skillImpactNotes,
      improvementSummary: summary,
    },
  };
}
