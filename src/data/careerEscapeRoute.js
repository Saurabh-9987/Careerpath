/**
 * CareerPath Career Escape Route Intelligence Layer
 * ==================================================
 * Calculates transition pathways between careers using strictly existing
 * CareerPath career catalog and verified empirical SAS hackathon dataset intelligence.
 *
 * Rules:
 * - Deterministic decision-support calculation only (no employment or salary guarantees)
 * - Zero fabricated careers, skills, salaries, or demand
 * - Reuses existing careerData, careerIntelligence, and careerScoring utilities
 */

import { careerData } from "./careerData.js";
import {
  getCareerMarketData,
  getCareerExperience,
} from "./careerIntelligence.js";
import {
  normalizeSkill,
  parseProfileSkills,
  isSkillMatched,
} from "../utils/careerScoring.js";

// ============================================================================
// 1. SKILL TRANSITION ANALYSIS
// ============================================================================

/**
 * Evaluates skill overlap and gaps for a specific transition step.
 *
 * @param {string} fromCareer - Source career title
 * @param {string} toCareer - Target career title
 * @param {Object} [profile] - User profile with existing verified skills
 * @returns {Object} Skill breakdown: existingSkills, overlappingSkills, missingSkills
 */
export function analyzeTransitionSkills(fromCareer, toCareer, profile = {}) {
  const fromObj = careerData[fromCareer];
  const toObj = careerData[toCareer];

  const profileSkills = parseProfileSkills(profile?.skills);
  const fromSkills = [
    ...(fromObj?.skills || []),
    ...(fromObj?.technicalSkills || []),
  ];
  const targetSkills = toObj?.skills || [];

  // Deduplicate pool of existing competencies (from source career + user profile)
  const existingSkillsMap = new Map();
  [...fromSkills, ...profileSkills].forEach((skill) => {
    if (skill && typeof skill === "string") {
      const norm = normalizeSkill(skill);
      if (!existingSkillsMap.has(norm)) {
        existingSkillsMap.set(norm, skill.trim());
      }
    }
  });

  const existingSkills = Array.from(existingSkillsMap.values());

  const overlappingSkills = [];
  const missingSkills = [];

  targetSkills.forEach((targetSkill) => {
    const isMatched = isSkillMatched(targetSkill, existingSkills);
    if (isMatched) {
      overlappingSkills.push(targetSkill);
    } else {
      missingSkills.push(targetSkill);
    }
  });

  const targetCount = targetSkills.length || 1;
  const coverageRatio = overlappingSkills.length / targetCount;

  return {
    existingSkills,
    overlappingSkills,
    missingSkills,
    coverageRatio,
    coveragePercent: Math.round(coverageRatio * 100),
  };
}

// ============================================================================
// 2. MOBILITY FRICTION CALCULATION
// ============================================================================

/**
 * Calculates transition friction between two careers on a 0–100 scale.
 * Lower = easier transition; Higher = harder transition.
 * 0–30 = Low, 31–60 = Moderate, 61–100 = High.
 *
 * @param {string} currentCareer
 * @param {string} targetCareer
 * @param {Object} [profile]
 * @returns {Object} { score, level, factors }
 */
export function calculateMobilityFriction(currentCareer, targetCareer, profile = {}) {
  if (!careerData[currentCareer] || !careerData[targetCareer]) {
    return {
      score: 100,
      level: "High",
      factors: ["Career not found in existing catalog"],
    };
  }

  if (currentCareer === targetCareer) {
    return {
      score: 0,
      level: "Low",
      factors: ["Current career matches target career"],
    };
  }

  const { overlappingSkills, missingSkills, coverageRatio } = analyzeTransitionSkills(
    currentCareer,
    targetCareer,
    profile
  );

  const targetTotal = (careerData[targetCareer]?.skills || []).length || 1;
  const missingRatio = missingSkills.length / targetTotal;

  // 1. Skill friction component (accounts for up to 70 points)
  const skillFrictionPoints = missingRatio * 70;

  // 2. Experience gap component (accounts for up to 30 points)
  const currentExp = getCareerExperience(currentCareer);
  const targetExp = getCareerExperience(targetCareer);

  let expFrictionPoints = 0;
  let expDiffYears = null;

  if (currentExp && targetExp && typeof currentExp.minExperience === "number" && typeof targetExp.minExperience === "number") {
    expDiffYears = Math.max(0, targetExp.minExperience - currentExp.minExperience);
    // 3 years experience gap represents maximum 30 points friction
    expFrictionPoints = Math.min(30, (expDiffYears / 3) * 30);
  } else {
    // If experience data is unavailable in dataset, scale proportionally to missing skills
    expFrictionPoints = missingRatio * 30;
  }

  const rawScore = skillFrictionPoints + expFrictionPoints;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  let level = "Moderate";
  if (score <= 30) {
    level = "Low";
  } else if (score >= 61) {
    level = "High";
  }

  // Transparent factor breakdown
  const factors = [];

  if (coverageRatio >= 0.5) {
    factors.push(`Strong skill overlap (${overlappingSkills.length}/${targetTotal} target skills shared)`);
  } else if (coverageRatio > 0) {
    factors.push(`Partial skill overlap (${overlappingSkills.length}/${targetTotal} target skills shared)`);
  } else {
    factors.push("Minimal initial skill overlap");
  }

  if (missingSkills.length === 0) {
    factors.push("Zero target skill gap");
  } else if (missingRatio <= 0.35) {
    factors.push(`Small target skill gap (${missingSkills.length} missing)`);
  } else if (missingRatio <= 0.65) {
    factors.push(`Moderate target skill gap (${missingSkills.length} missing)`);
  } else {
    factors.push(`Substantial target skill gap (${missingSkills.length} missing)`);
  }

  if (expDiffYears !== null) {
    if (expDiffYears <= 0.5) {
      factors.push("Minimal experience difference observed in dataset");
    } else if (expDiffYears <= 2.0) {
      factors.push(`Moderate experience difference (${expDiffYears.toFixed(1)} yrs observed in dataset)`);
    } else {
      factors.push(`Significant experience gap (${expDiffYears.toFixed(1)} yrs observed in dataset)`);
    }
  }

  const userSkillCount = parseProfileSkills(profile?.skills).length;
  if (userSkillCount > 0) {
    factors.push(`User profile contributes ${userSkillCount} verified competencies`);
  }

  return {
    score,
    level,
    factors,
  };
}

// ============================================================================
// 3. MARKET EVIDENCE ATTACHMENT
// ============================================================================

/**
 * Extracts empirical market evidence for a career without inventing numbers.
 */
function extractCareerMarketEvidence(careerName) {
  const data = getCareerMarketData(careerName);
  if (!data || !data.available) {
    return {
      marketDataAvailable: false,
      postingVolume: null,
      postingShare: null,
      avgSalary: null,
      salaryRange: null,
      message: "No direct market evidence in supplied datasets.",
    };
  }

  return {
    marketDataAvailable: true,
    postingVolume: data.postingVolume,
    postingShare: data.postingShare,
    avgSalary: data.avgSalary,
    salaryRange: data.salary?.formattedRange || null,
    formattedAvgSalary: data.salary?.formattedAvg || null,
    source: data.salary?.source || "DataScience Jobs dataset",
  };
}

// ============================================================================
// 4. ROUTE DISCOVERY & RANKING
// ============================================================================

/**
 * Generates and evaluates possible career transition routes.
 *
 * @param {string} currentCareer
 * @param {string} targetCareer
 * @param {Object} [profile]
 * @returns {Object} Structured escape route intelligence
 */
export function getCareerEscapeRoute(currentCareer, targetCareer, profile = {}) {
  // Defensive validation against empty/invalid careers
  if (!currentCareer || !targetCareer || typeof currentCareer !== "string" || typeof targetCareer !== "string") {
    return {
      currentCareer: currentCareer || null,
      targetCareer: targetCareer || null,
      available: false,
      directRoute: null,
      recommendedRoutes: [],
      rankings: { fastest: null, skillFit: null, market: null },
      mobilityFriction: {
        score: null,
        level: "Unknown",
        factors: ["Invalid career inputs provided"],
      },
      missingSkills: [],
      explanation: "Valid current and target careers are required to compute an escape route.",
    };
  }

  const currentObj = careerData[currentCareer.trim()];
  const targetObj = careerData[targetCareer.trim()];

  if (!currentObj || !targetObj) {
    return {
      currentCareer,
      targetCareer,
      available: false,
      directRoute: null,
      recommendedRoutes: [],
      rankings: { fastest: null, skillFit: null, market: null },
      mobilityFriction: {
        score: null,
        level: "Unknown",
        factors: ["Career not found in existing catalog"],
      },
      missingSkills: [],
      explanation: "Career not found in the existing CareerPath catalog. No routes can be calculated.",
    };
  }

  const normalizedCurrent = currentCareer.trim();
  const normalizedTarget = targetCareer.trim();

  // Direct skill analysis and friction
  const directSkills = analyzeTransitionSkills(normalizedCurrent, normalizedTarget, profile);
  const directFriction = calculateMobilityFriction(normalizedCurrent, normalizedTarget, profile);
  const targetMarket = extractCareerMarketEvidence(normalizedTarget);

  const directRoute = {
    id: "route-direct",
    type: "direct",
    careers: [normalizedCurrent, normalizedTarget],
    steps: 1,
    mobilityFriction: directFriction,
    skillAnalysis: directSkills,
    marketEvidence: targetMarket,
    scores: {
      fastestScore: Math.max(0, 100 - directFriction.score),
      skillFitScore: directSkills.coveragePercent,
      marketScore: targetMarket.marketDataAvailable ? Math.min(100, Math.round(targetMarket.postingShare * 2.5) + 50) : 10,
    },
    explanation: `Direct transition with ${directFriction.level.toLowerCase()} mobility friction (${directFriction.score}/100) and ${directSkills.overlappingSkills.length}/${(targetObj.skills || []).length} shared competencies.`,
  };

  // Find intermediate routes from existing catalog
  const intermediateRoutes = [];
  const currentRelated = currentObj.relatedCareers || [];

  // Check valid catalog candidates related to source or target
  const candidateIntermediates = new Set();
  currentRelated.forEach((c) => {
    if (c !== normalizedCurrent && c !== normalizedTarget && careerData[c]) {
      candidateIntermediates.add(c);
    }
  });

  // Also check if target is related to other careers
  Object.keys(careerData).forEach((careerName) => {
    if (careerName !== normalizedCurrent && careerName !== normalizedTarget) {
      const rels = careerData[careerName]?.relatedCareers || [];
      if (rels.includes(normalizedTarget) && currentRelated.includes(careerName)) {
        candidateIntermediates.add(careerName);
      }
    }
  });

  candidateIntermediates.forEach((intermediate) => {
    const interObj = careerData[intermediate];
    if (!interObj) return;

    // Step 1: current -> intermediate
    const step1Skills = analyzeTransitionSkills(normalizedCurrent, intermediate, profile);
    const step1Friction = calculateMobilityFriction(normalizedCurrent, intermediate, profile);

    // Step 2: intermediate -> target (simulate intermediate career competencies)
    const simulatedProfile = {
      skills: [...(profile?.skills || []), ...(interObj.skills || [])],
    };
    const step2Skills = analyzeTransitionSkills(intermediate, normalizedTarget, simulatedProfile);
    const step2Friction = calculateMobilityFriction(intermediate, normalizedTarget, simulatedProfile);

    // Aggregate friction (mean of the two steps + 5 step overhead points)
    const avgScore = Math.min(100, Math.round((step1Friction.score + step2Friction.score) / 2 + 5));
    let avgLevel = "Moderate";
    if (avgScore <= 30) avgLevel = "Low";
    else if (avgScore >= 61) avgLevel = "High";

    const interMarket = extractCareerMarketEvidence(intermediate);

    const fastestScore = Math.max(0, 100 - avgScore - 15); // Slight penalty for extra hop
    const skillFitScore = Math.round((step1Skills.coveragePercent + step2Skills.coveragePercent) / 2);
    const marketScore = (interMarket.marketDataAvailable ? 40 : 0) + (targetMarket.marketDataAvailable ? 50 : 0);

    intermediateRoutes.push({
      id: `route-${intermediate.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      type: "intermediate",
      careers: [normalizedCurrent, intermediate, normalizedTarget],
      steps: 2,
      intermediateCareer: intermediate,
      step1: {
        toCareer: intermediate,
        friction: step1Friction,
        skills: step1Skills,
      },
      step2: {
        toCareer: normalizedTarget,
        friction: step2Friction,
        skills: step2Skills,
      },
      mobilityFriction: {
        score: avgScore,
        level: avgLevel,
        factors: [
          `Phase 1: Transition to ${intermediate} (${step1Friction.level} friction)`,
          `Phase 2: Advance to ${normalizedTarget} (${step2Friction.level} friction)`,
        ],
      },
      skillAnalysis: {
        existingSkills: directSkills.existingSkills,
        overlappingSkills: directSkills.overlappingSkills,
        missingSkills: directSkills.missingSkills,
        intermediateContribution: interObj.skills || [],
      },
      marketEvidence: {
        intermediateMarket: interMarket,
        targetMarket,
        marketDataAvailable: interMarket.marketDataAvailable || targetMarket.marketDataAvailable,
      },
      scores: {
        fastestScore,
        skillFitScore,
        marketScore,
      },
      explanation: `Pivots through ${intermediate} to bridge core technical competencies before progressing to ${normalizedTarget}.`,
    });
  });

  // Sort candidate intermediate routes by combined fitness and pick top candidates
  intermediateRoutes.sort((a, b) => b.scores.skillFitScore - a.scores.skillFitScore);
  const selectedIntermediates = intermediateRoutes.slice(0, 2);

  // Pool of routes (at most 3 routes: 1 direct + up to 2 intermediate)
  const allRoutes = [directRoute, ...selectedIntermediates].slice(0, 3);

  // Deterministic rankings
  const fastestRoute = [...allRoutes].sort((a, b) => b.scores.fastestScore - a.scores.fastestScore)[0];
  const skillFitRoute = [...allRoutes].sort((a, b) => b.scores.skillFitScore - a.scores.skillFitScore)[0];
  const marketRoute = [...allRoutes].sort((a, b) => b.scores.marketScore - a.scores.marketScore)[0];

  // Attach named properties to recommendedRoutes array for ergonomic access
  const recommendedRoutes = [...allRoutes];
  recommendedRoutes.fastest = fastestRoute;
  recommendedRoutes.skillFit = skillFitRoute;
  recommendedRoutes.market = marketRoute;

  const rankings = {
    fastest: fastestRoute,
    skillFit: skillFitRoute,
    market: marketRoute,
  };

  // Deterministic top-level explanation
  let overallExplanation = "";
  if (directFriction.score <= 35) {
    overallExplanation = `Direct route recommended: ${normalizedCurrent} shares strong overlap with ${normalizedTarget} with low mobility friction (${directFriction.score}/100).`;
  } else if (selectedIntermediates.length > 0) {
    const topIntermediate = selectedIntermediates[0];
    overallExplanation = `Transition requires bridging ${directSkills.missingSkills.length} competencies (${directSkills.missingSkills.slice(0, 3).join(", ")}). An intermediate pathway through ${topIntermediate.intermediateCareer} can soften skill friction.`;
  } else {
    overallExplanation = `Direct route requires focused upskilling across ${directSkills.missingSkills.length} competencies: ${directSkills.missingSkills.join(", ")}.`;
  }

  return {
    currentCareer: normalizedCurrent,
    targetCareer: normalizedTarget,
    available: true,
    directRoute,
    recommendedRoutes,
    rankings,
    mobilityFriction: directFriction,
    missingSkills: directSkills.missingSkills,
    overlappingSkills: directSkills.overlappingSkills,
    explanation: overallExplanation,
  };
}
