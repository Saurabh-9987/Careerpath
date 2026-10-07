import { careerData } from "./careerData.js";
import { analyzeCareerMobility } from "./careerMobilityEngine.js";
import {
  getMissingSkills,
  getProfileSkills,
  getMatchedSkills,
  getRoadmap,
} from "../utils/careerScoring.js";

/**
 * Builds an actionable, 4-phase learning roadmap aligned with the candidate's recommended transition route.
 *
 * Features:
 * 1. Route-Aware: Understands direct (Current → Target) and intermediate (Current → Intermediate → Target) transitions.
 * 2. Skill Prioritization: Uses actual missing core skills and catalog skillWeights (descending priority).
 * 3. 4-Phase Actionable Structure:
 *    - Phase 1: Strengthen Core Skills (foundation & verified competencies)
 *    - Phase 2: Close Target Skill Gaps (prioritized core skills for next/target transition)
 *    - Phase 3: Build Evidence (portfolio and project artifacts)
 *    - Phase 4: Target Role Readiness (interview prep & role prerequisites)
 * 4. Explainability: Factual catalog/engine reason for each step.
 * 5. Market Context: Observed demand & salary benchmark strictly labeled "MARKET EVIDENCE".
 * 6. Completion State: Displays "Core skill requirements covered" without non-causal hiring guarantees.
 * 7. What-If Compatibility: Reflects simulated profile states non-destructively.
 *
 * @param {string} currentRole - Candidate's current role
 * @param {string} targetRole - Desired target role
 * @param {Object} profile - Candidate profile (skills, experience, etc.)
 * @param {Object} [options] - Configuration { optimizationMode, selectedRouteId, mlProject, whatIfScenario }
 * @returns {Object} Structured route roadmap intelligence
 */
export function generateRouteRoadmap(currentRole, targetRole, profile = {}, options = {}) {
  const normCurrent = (currentRole || profile?.currentRole || profile?.role || "Data Analyst").trim();
  const normTarget = (targetRole || profile?.targetRole || profile?.targetCareer || "Data Scientist").trim();
  const optimizationMode = options.optimizationMode || "Fastest";
  const mlProject = Boolean(options.mlProject);

  // 1. Evaluate What-If scenario modifications non-destructively if provided
  let effectiveProfile = { ...profile };
  let isWhatIfActive = false;
  let simulatedModifications = null;

  if (options.whatIfScenario) {
    isWhatIfActive = true;
    simulatedModifications = options.whatIfScenario;
    const baseSkills = getProfileSkills(profile);
    const addedSkills = options.whatIfScenario.additionalSkills || [];
    const mergedSkills = Array.from(new Set([...baseSkills, ...addedSkills]));

    effectiveProfile = {
      ...profile,
      skills: mergedSkills,
    };

    if (options.whatIfScenario.additionalExpYears) {
      const baseExpNum = parseFloat(String(profile?.experience || "").replace(/[^0-9.]/g, "")) || 0;
      effectiveProfile.experience = `${baseExpNum + options.whatIfScenario.additionalExpYears} years`;
    }
  }

  // 2. Run Mobility Engine Analysis
  const mobility = analyzeCareerMobility(normCurrent, normTarget, effectiveProfile, {
    optimizationMode,
  });

  // 3. Determine Selected Transition Route
  const escapeRouteResult = mobility.escapeRoute;
  let selectedRoute = escapeRouteResult.selectedRoute || escapeRouteResult.directRoute;

  // Allow override via selectedRouteId if specified
  if (options.selectedRouteId && options.selectedRouteId !== selectedRoute?.id) {
    if (escapeRouteResult.directRoute?.id === options.selectedRouteId) {
      selectedRoute = escapeRouteResult.directRoute;
    } else {
      const match = (escapeRouteResult.recommendedRoutes || []).find(
        (r) => r.id === options.selectedRouteId
      );
      if (match) selectedRoute = match;
    }
  }

  const isIntermediate = selectedRoute?.type === "intermediate" && Boolean(selectedRoute?.intermediateCareer);
  const intermediateRole = isIntermediate ? selectedRoute.intermediateCareer : null;

  // 4. Extract Canonical Catalog Information (No duplicate definitions)
  const targetCareerDef = careerData[normTarget] || careerData["Data Scientist"];
  const targetCoreSkills = targetCareerDef.coreSkills || targetCareerDef.skills || [];
  const targetSkillWeights = targetCareerDef.skillWeights || {};

  const intermediateCareerDef = intermediateRole ? careerData[intermediateRole] : null;
  const intermediateSkillWeights = intermediateCareerDef?.skillWeights || {};

  // 5. Skill Analysis & Prioritization
  // Target missing skills using canonical evaluation
  const targetMissingSkills = getMissingSkills(normTarget, effectiveProfile, mlProject);
  const targetMatchedSkills = getMatchedSkills(normTarget, effectiveProfile, mlProject);

  // Sort missing skills strictly by catalog skillWeights descending (no invented skills)
  const prioritizedTargetMissing = [...targetMissingSkills].sort((a, b) => {
    const weightA = targetSkillWeights[a] ?? 0;
    const weightB = targetSkillWeights[b] ?? 0;
    if (weightB !== weightA) return weightB - weightA;
    return a.localeCompare(b);
  });

  // Intermediate step missing skills if route is multi-step
  let step1MissingSkills = [];
  let step1MatchedSkills = [];
  if (isIntermediate && intermediateCareerDef) {
    const rawStep1Missing = getMissingSkills(intermediateRole, effectiveProfile, mlProject);
    step1MatchedSkills = getMatchedSkills(intermediateRole, effectiveProfile, mlProject);
    step1MissingSkills = [...rawStep1Missing].sort((a, b) => {
      const weightA = intermediateSkillWeights[a] ?? 0;
      const weightB = intermediateSkillWeights[b] ?? 0;
      if (weightB !== weightA) return weightB - weightA;
      return a.localeCompare(b);
    });
  }

  // 6. Assemble Phase 1 — Strengthen Core Skills
  // Foundational skills overlapping between profile and destination/bridge
  const phase1Items = [];
  const overlappingCore = isIntermediate
    ? Array.from(new Set([...step1MatchedSkills, ...targetMatchedSkills]))
    : targetMatchedSkills;

  overlappingCore.forEach((skill) => {
    const weight = targetSkillWeights[skill] || intermediateSkillWeights[skill] || 0.2;
    const weightPct = Math.round(weight * 100);
    phase1Items.push({
      id: `core-${skill.toLowerCase().replace(/\s+/g, "-")}`,
      skill,
      title: `Strengthen ${skill}`,
      status: "VERIFIED_FOUNDATION",
      weight,
      weightPercent: weightPct,
      explanation: `Demonstrated foundation skill for ${normTarget} (Catalog Weight: ${weightPct}%). Reinforce applied fluency.`,
    });
  });

  // 7. Assemble Phase 2 — Close Target Skill Gaps
  // Strictly ordered: next transition bridge skills first (if intermediate), then target skills by weight descending
  const phase2Milestones = [];

  if (isIntermediate) {
    // Step 2A: Intermediate bridge skills (required for the NEXT transition)
    step1MissingSkills.forEach((skill) => {
      const weight = intermediateSkillWeights[skill] ?? 0.25;
      const weightPct = Math.round(weight * 100);
      phase2Milestones.push({
        id: `skill-${skill.toLowerCase().replace(/\s+/g, "-")}`,
        title: `Learn ${skill}`,
        skill,
        type: "SKILL_GAP",
        stage: 2,
        transitionPhase: "intermediate",
        transitionRole: intermediateRole,
        weight,
        weightPercent: weightPct,
        explanation: `Required for intermediate bridge milestone to ${intermediateRole} (Weight: ${weightPct}%).`,
      });
    });

    // Step 2B: Remaining target destination skills not already covered in bridge
    prioritizedTargetMissing.forEach((skill) => {
      if (!step1MissingSkills.includes(skill)) {
        const weight = targetSkillWeights[skill] ?? 0.25;
        const weightPct = Math.round(weight * 100);
        phase2Milestones.push({
          id: `skill-${skill.toLowerCase().replace(/\s+/g, "-")}`,
          title: `Learn ${skill}`,
          skill,
          type: "SKILL_GAP",
          stage: 2,
          transitionPhase: "target",
          transitionRole: normTarget,
          weight,
          weightPercent: weightPct,
          explanation: `Required because it is a core skill for ${normTarget} (Weight: ${weightPct}%).`,
        });
      }
    });
  } else {
    // Direct transition: all missing core skills ordered descending by targetSkillWeights
    prioritizedTargetMissing.forEach((skill) => {
      const weight = targetSkillWeights[skill] ?? 0.25;
      const weightPct = Math.round(weight * 100);
      phase2Milestones.push({
        id: `skill-${skill.toLowerCase().replace(/\s+/g, "-")}`,
        title: `Learn ${skill}`,
        skill,
        type: "SKILL_GAP",
        stage: 2,
        transitionPhase: "direct",
        transitionRole: normTarget,
        weight,
        weightPercent: weightPct,
        explanation: `Required because it is a core skill for ${normTarget} (Weight: ${weightPct}%).`,
      });
    });
  }

  // 8. Extract Canonical Destination Steps (getRoadmap) for Phases 3 and 4
  const canonicalSteps = getRoadmap(normTarget, effectiveProfile, mlProject);
  const destinationOnlySteps = canonicalSteps.filter(
    (step) => !targetCoreSkills.some((s) => step.title.toLowerCase().includes(s.toLowerCase()))
  );

  // Phase 3: Build Evidence (Projects & Portfolios)
  const phase3Milestones = [];
  // Phase 4: Target Role Readiness (Interviews & Capstones)
  const phase4Milestones = [];

  destinationOnlySteps.forEach((step, idx) => {
    const lowerTitle = step.title.toLowerCase();
    const isReadiness =
      lowerTitle.includes("interview") ||
      lowerTitle.includes("readiness") ||
      lowerTitle.includes("prepare");

    if (isReadiness) {
      phase4Milestones.push({
        id: `dest-${idx}-${step.title.toLowerCase().replace(/\s+/g, "-")}`,
        title: step.title,
        description: step.description,
        type: "DESTINATION",
        stage: 4,
        explanation: `Required to validate interview readiness and technical evaluation for ${normTarget}.`,
      });
    } else {
      phase3Milestones.push({
        id: `dest-${idx}-${step.title.toLowerCase().replace(/\s+/g, "-")}`,
        title: step.title,
        description: step.description,
        type: "DESTINATION",
        stage: 3,
        explanation: `Required to build practical portfolio evidence for ${normTarget}.`,
      });
    }
  });

  // If Phase 3 or Phase 4 are empty due to custom catalog entries, fall back gracefully
  if (phase3Milestones.length === 0 && destinationOnlySteps.length > 0) {
    phase3Milestones.push({
      id: `dest-0-${destinationOnlySteps[0].title.toLowerCase().replace(/\s+/g, "-")}`,
      title: destinationOnlySteps[0].title,
      description: destinationOnlySteps[0].description,
      type: "DESTINATION",
      stage: 3,
      explanation: `Required to build practical portfolio evidence for ${normTarget}.`,
    });
  }

  // 9. Completion State Evaluation
  const isCoreRequirementsCovered = targetMissingSkills.length === 0;
  const completionState = {
    isCovered: isCoreRequirementsCovered,
    badgeText: isCoreRequirementsCovered ? "Core skill requirements covered" : "Skill gaps remaining",
    headline: isCoreRequirementsCovered
      ? "Core skill requirements covered"
      : `${targetMissingSkills.length} Core Skill Deficit(s) Identified`,
    description: isCoreRequirementsCovered
      ? `Candidate profile satisfies all core catalog competency requirements for ${normTarget}. Focus on reinforcing portfolio artifacts and interview preparation.`
      : `Acquire prioritized missing competencies (${targetMissingSkills.join(", ")}) to achieve full catalog coverage.`,
    guaranteeDisclaimer:
      "Skill coverage reflects catalog benchmark alignment only. Does not constitute an employment or compensation guarantee.",
  };

  // 10. Market Context (Strictly labeled "MARKET EVIDENCE", no proxies for unsupported roles)
  const marketOpportunity = mobility.marketOpportunity || {};
  const marketContext = {
    label: "MARKET EVIDENCE",
    role: normTarget,
    available: Boolean(marketOpportunity.marketDataAvailable),
    demandVolume: marketOpportunity.demandVolume ?? null,
    formattedDemand: marketOpportunity.formattedVolume || null,
    demandTier: marketOpportunity.demandTier || null,
    avgSalary: marketOpportunity.avgSalary ?? null,
    formattedAvgSalary: marketOpportunity.formattedAvgSalary || null,
    benchmarkNote: marketOpportunity.marketDataAvailable
      ? "Empirical dataset distribution benchmark"
      : "Market evidence unavailable for this role in the provided benchmark dataset.",
  };

  // 11. Route Milestones Structure
  const routeStructure = {
    routeType: isIntermediate ? "intermediate" : "direct",
    path: isIntermediate ? [normCurrent, intermediateRole, normTarget] : [normCurrent, normTarget],
    pathString: isIntermediate
      ? `${normCurrent} → ${intermediateRole} → ${normTarget}`
      : `${normCurrent} → ${normTarget}`,
    currentPosition: {
      role: normCurrent,
      verifiedSkills: getProfileSkills(effectiveProfile),
    },
    intermediateMilestone: isIntermediate
      ? {
          role: intermediateRole,
          skillsNeeded: step1MissingSkills,
          skillsShared: step1MatchedSkills,
          friction: selectedRoute?.step1?.mobilityFriction || null,
        }
      : null,
    targetPosition: {
      role: normTarget,
      coreSkills: targetCoreSkills,
      missingSkills: prioritizedTargetMissing,
      matchedSkills: targetMatchedSkills,
    },
    mobilityScore: mobility.mobilityScore,
    optimizationMode,
  };

  return {
    currentRole: normCurrent,
    targetRole: normTarget,
    optimizationMode,
    isWhatIfActive,
    simulatedModifications,
    route: routeStructure,
    phases: {
      phase1: {
        id: "phase-1",
        number: 1,
        title: "Phase 1 — Strengthen Core Skills",
        subtitle: "Reinforce verified baseline competencies and overlapping fundamentals",
        items: phase1Items,
      },
      phase2: {
        id: "phase-2",
        number: 2,
        title: "Phase 2 — Close Target Skill Gaps",
        subtitle: isIntermediate
          ? `Bridge intermediate competencies for ${intermediateRole} then complete target gaps for ${normTarget}`
          : `Acquire prioritized missing competencies for ${normTarget}`,
        milestones: phase2Milestones,
      },
      phase3: {
        id: "phase-3",
        number: 3,
        title: "Phase 3 — Build Evidence",
        subtitle: `Demonstrate applied capability through portfolio artifacts and production pipelines`,
        milestones: phase3Milestones,
      },
      phase4: {
        id: "phase-4",
        number: 4,
        title: "Phase 4 — Target Role Readiness",
        subtitle: `Technical evaluation mastery, system design, and role-specific interview preparation`,
        milestones: phase4Milestones,
      },
    },
    completionState,
    marketContext,
    explainability: mobility.explainability,
  };
}
