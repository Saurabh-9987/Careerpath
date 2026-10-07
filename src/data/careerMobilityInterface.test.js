import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeCareerMobility,
  calculateSkillGap,
  calculateExperienceGap,
  extractMarketOpportunity,
} from "./careerMobilityEngine.js";

// ============================================================================
// 1. CURRENT ROLE + TARGET ROLE
// ============================================================================
test("1. Current role + target role performs full mobility analysis with catalog integrity", () => {
  const profile = {
    role: "Data Analyst",
    skills: "Python, SQL, Tableau, Statistics",
    experience: "3 years",
  };

  const mobility = analyzeCareerMobility("Data Analyst", "Data Scientist", profile);

  assert.ok(mobility);
  assert.equal(mobility.currentRole, "Data Analyst");
  assert.equal(mobility.targetRole, "Data Scientist");
  assert.ok(typeof mobility.mobilityScore.overallScore === "number");
  assert.ok(mobility.mobilityScore.overallScore >= 0 && mobility.mobilityScore.overallScore <= 100);

  // Verifies 5 score components exist
  const comps = mobility.mobilityScore.components;
  assert.ok(comps.skillFit);
  assert.ok(comps.experienceFit);
  assert.ok(comps.mobilityEase);
  assert.ok(comps.marketOpportunity);
  assert.ok(comps.salarySignal);
});

// ============================================================================
// 2. PROFILE DEFAULTS
// ============================================================================
test("2. Profile defaults populate fallback roles when arguments are absent", () => {
  const profileWithRole = {
    role: "Software Engineer",
    targetCareer: "Data Engineer",
  };

  const mobility = analyzeCareerMobility(null, null, profileWithRole);
  assert.equal(mobility.currentRole, "Software Engineer");
  assert.equal(mobility.targetRole, "Data Engineer");

  // Fallback when entire profile is empty
  const defaultMobility = analyzeCareerMobility(null, null, {});
  assert.equal(defaultMobility.currentRole, "Data Analyst");
  assert.equal(defaultMobility.targetRole, "Data Scientist");
});

// ============================================================================
// 3. SUPPORTED MARKET ROLE
// ============================================================================
test("3. Supported market role returns verified empirical market evidence without proxy data", () => {
  const marketOpp = extractMarketOpportunity("Data Scientist", "Data Analyst");

  assert.equal(marketOpp.marketDataAvailable, true);
  assert.equal(marketOpp.roleName, "Data Scientist");
  assert.ok(typeof marketOpp.postingVolume === "number" && marketOpp.postingVolume > 0);
  assert.ok(typeof marketOpp.avgSalary === "number" && marketOpp.avgSalary > 0);
  assert.ok(marketOpp.formattedAvgSalary.includes("LPA"));
  assert.ok(Array.isArray(marketOpp.topHiringCompanies));
  assert.ok(marketOpp.topHiringCompanies.length > 0);
  assert.ok(Array.isArray(marketOpp.topLocations));
  assert.ok(marketOpp.topLocations.length > 0);
  assert.equal(marketOpp.message, null);
});

// ============================================================================
// 4. UNSUPPORTED MARKET ROLE
// ============================================================================
test("4. Unsupported market role returns explicit unavailable state without fabricated numbers", () => {
  const marketOpp = extractMarketOpportunity("DevOps Engineer", "Data Analyst");

  assert.equal(marketOpp.marketDataAvailable, false);
  assert.equal(marketOpp.roleName, "DevOps Engineer");
  assert.equal(marketOpp.postingVolume, null);
  assert.equal(marketOpp.avgSalary, null);
  assert.equal(marketOpp.salaryRange, null);
  assert.equal(marketOpp.topHiringCompanies.length, 0);
  assert.equal(marketOpp.message, "Market evidence unavailable for this role in the provided dataset.");
});

// ============================================================================
// 5. MISSING SKILLS & PRIORITY ORDERING
// ============================================================================
test("5. Missing skills analysis calculates coverage and ranks deficits by priority weight", () => {
  const profile = {
    skills: "Python", // Only 1 matched skill for Data Scientist
  };

  const skillGap = calculateSkillGap("Data Scientist", profile);

  assert.equal(skillGap.available, true);
  assert.deepEqual(skillGap.matchedSkills, ["Python"]);
  assert.ok(skillGap.missingSkills.includes("Machine Learning"));
  assert.ok(skillGap.missingSkills.includes("SQL"));
  assert.ok(skillGap.missingSkills.includes("Statistics"));
  assert.equal(skillGap.coveragePercentage, 25); // 1 / 4 = 25%

  // Priority ordering should be populated
  assert.ok(Array.isArray(skillGap.highestPriorityMissingSkills));
  assert.equal(skillGap.highestPriorityMissingSkills.length, skillGap.missingSkills.length);
});

// ============================================================================
// 6. MISSING EXPERIENCE HANDLING
// ============================================================================
test("6. Missing experience returns explicit unavailable state without assuming defaults", () => {
  const emptyExpProfile = {
    skills: "Python, SQL",
    experience: "", // empty
  };

  const expGap = calculateExperienceGap("Data Scientist", emptyExpProfile);

  assert.equal(expGap.available, false);
  assert.equal(expGap.currentExperience.available, false);
  assert.equal(expGap.currentExperience.years, null);
  assert.equal(expGap.gapYears, null);
  assert.equal(expGap.status, "Unavailable");
  assert.ok(expGap.currentExperience.message.includes("Candidate experience not provided"));

  // Check mobility score component reflects unmeasured experience
  const mobility = analyzeCareerMobility("Data Analyst", "Data Scientist", emptyExpProfile);
  assert.equal(mobility.experienceGap.available, false);
  assert.equal(mobility.mobilityScore.components.experienceFit.available, false);
  assert.equal(mobility.mobilityScore.components.experienceFit.points, null);
});

// ============================================================================
// 7. UNAVAILABLE MARKET EVIDENCE SCORING
// ============================================================================
test("7. Unavailable market evidence leaves points as null and recalculates across available evidence", () => {
  // Role outside hackathon dataset (e.g. Cloud Architect or DevOps Engineer)
  const profile = {
    skills: "AWS, Azure, Docker, Kubernetes, Linux",
    experience: "5 years",
  };

  const mobility = analyzeCareerMobility("Data Engineer", "Cloud Architect", profile);

  assert.equal(mobility.marketOpportunity.marketDataAvailable, false);
  assert.equal(mobility.mobilityScore.components.marketOpportunity.available, false);
  assert.equal(mobility.mobilityScore.components.marketOpportunity.points, null);
  assert.equal(
    mobility.mobilityScore.components.marketOpportunity.explanation,
    "Market evidence unavailable for this role in the provided dataset."
  );

  assert.equal(mobility.mobilityScore.components.salarySignal.available, false);
  assert.equal(mobility.mobilityScore.components.salarySignal.points, null);
  assert.equal(
    mobility.mobilityScore.components.salarySignal.explanation,
    "Salary evidence unavailable for this role in the provided dataset."
  );

  // Score should be normalized over remaining available points (< 100 maxAvailablePoints)
  assert.ok(mobility.mobilityScore.normalization.maxAvailablePoints < 100);
  assert.ok(mobility.mobilityScore.overallScore >= 0 && mobility.mobilityScore.overallScore <= 100);
});

// ============================================================================
// 8. ROUTE SWITCHING: FASTEST / SKILL FIT / MARKET
// ============================================================================
test("8. Route optimization modes calculate and select distinct escape routes", () => {
  const profile = {
    skills: "Java, Spring Boot, MySQL, Git",
    experience: "3 years",
  };

  const fastest = analyzeCareerMobility("Software Engineer", "Data Scientist", profile, {
    optimizationMode: "Fastest",
  });
  const skillFit = analyzeCareerMobility("Software Engineer", "Data Scientist", profile, {
    optimizationMode: "Skill Fit",
  });
  const market = analyzeCareerMobility("Software Engineer", "Data Scientist", profile, {
    optimizationMode: "Market",
  });

  assert.ok(fastest.escapeRoute.selectedRoute);
  assert.ok(skillFit.escapeRoute.selectedRoute);
  assert.ok(market.escapeRoute.selectedRoute);

  assert.equal(fastest.optimizationMode, "Fastest");
  assert.equal(skillFit.optimizationMode, "Skill Fit");
  assert.equal(market.optimizationMode, "Market");
});

// ============================================================================
// 9. INCOMPLETE PROFILE HANDLING
// ============================================================================
test("9. Completely empty or undefined profile executes stably without crashing", () => {
  assert.doesNotThrow(() => {
    const mobility = analyzeCareerMobility("Data Analyst", "Data Scientist", null);
    assert.ok(mobility);
    assert.equal(mobility.skillGap.matchedSkillCount, 0);
    assert.equal(mobility.experienceGap.available, false);
  });

  assert.doesNotThrow(() => {
    const mobility = analyzeCareerMobility("Data Analyst", "Data Scientist", {
      skills: undefined,
      experience: undefined,
    });
    assert.ok(mobility);
  });
});

// ============================================================================
// 10. ML SIGNAL AVAILABILITY & SEPARATION FROM MARKET EVIDENCE
// ============================================================================
test("10. ML signals remain strictly separated from empirical market evidence", () => {
  const profile = {
    skills: "Python, SQL, Machine Learning, Deep Learning, Statistics",
    experience: "4 years",
    personality: {
      openness: 75,
      conscientiousness: 80,
      extraversion: 65,
      agreeableness: 70,
      neuroticism: 35,
    },
  };

  const mobility = analyzeCareerMobility("Data Analyst", "Data Scientist", profile);

  // Empirical Market Evidence source check
  assert.equal(mobility.marketOpportunity.source.startsWith("MARKET EVIDENCE"), true);

  // Model Predictions source check
  const ml = mobility.mlSignals;
  assert.equal(ml.technicalSignal.source, "MODEL PREDICTION");
  assert.equal(ml.salaryPrediction.source, "MODEL PREDICTION");
  assert.equal(ml.personalitySignal.source, "MODEL PREDICTION");

  // Verify predictions are statistical numbers, not observed job postings
  assert.ok(ml.technicalSignal.confidencePercent >= 0 && ml.technicalSignal.confidencePercent <= 100);
  assert.ok(typeof ml.salaryPrediction.predictedSalaryLPA === "number");
  assert.ok(ml.personalitySignal.confidencePercent >= 0);
});

// ============================================================================
// 11. WHY THIS ROUTE & BLOCKERS EXPLAINABILITY
// ============================================================================
test("11. Explainability generates factual reasons and blockers from engine data", () => {
  const profile = {
    skills: "Python, SQL",
    experience: "1 year",
  };

  const mobility = analyzeCareerMobility("Data Analyst", "Data Scientist", profile);
  const explain = mobility.explainability;

  assert.ok(Array.isArray(explain.why));
  assert.ok(explain.why.length > 0);
  // Verifies at least 1 reason cites matched skill coverage
  assert.ok(explain.why.some((r) => r.includes("core skill overlap")));

  assert.ok(Array.isArray(explain.blockers));
  assert.ok(explain.blockers.length > 0);
  // Verifies at least 1 blocker cites missing competencies
  assert.ok(explain.blockers.some((b) => b.includes("core competencies")));
});
