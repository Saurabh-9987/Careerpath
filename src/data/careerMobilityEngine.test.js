import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateSkillGap,
  calculateExperienceGap,
  extractMarketOpportunity,
  evaluateMobilityMlSignals,
  calculateMobilityScore,
  analyzeCareerMobility,
  simulateWhatIf,
} from "./careerMobilityEngine.js";

// ============================================================================
// 1. DIRECT CAREER TRANSITION TEST
// ============================================================================
test("1. Direct career transition calculates feasible 1-step route and mobility scores", () => {
  const profile = {
    skills: "Python, SQL, Tableau, Statistics",
    experience: "3 years",
  };

  const mobility = analyzeCareerMobility("Data Analyst", "Data Scientist", profile);

  assert.ok(mobility);
  assert.equal(mobility.currentRole, "Data Analyst");
  assert.equal(mobility.targetRole, "Data Scientist");

  // Escape route verification
  assert.equal(mobility.escapeRoute.available, true);
  assert.ok(mobility.escapeRoute.directRoute);
  assert.equal(mobility.escapeRoute.directRoute.steps, 1);
  assert.deepEqual(mobility.escapeRoute.directRoute.careers, ["Data Analyst", "Data Scientist"]);
  assert.equal(mobility.explainability.smartestRoute.pathString, "Data Analyst → Data Scientist");

  // Mobility score verification
  assert.ok(mobility.mobilityScore.overallScore >= 0 && mobility.mobilityScore.overallScore <= 100);
  assert.ok(mobility.mobilityScore.components.skillFit.score > 0);
  assert.ok(mobility.mobilityScore.components.experienceFit.score > 0);
  assert.ok(mobility.mobilityScore.components.marketOpportunity.score > 0);
});

// ============================================================================
// 2. INTERMEDIATE TRANSITION TEST
// ============================================================================
test("2. Transition requiring intermediate role generates multi-step escape routes", () => {
  const profile = {
    skills: "Java, C++, Data Structures, Algorithms",
    experience: "2 years",
  };

  const mobility = analyzeCareerMobility("Software Engineer", "Data Scientist", profile);

  assert.ok(mobility);
  assert.equal(mobility.escapeRoute.available, true);
  assert.ok(Array.isArray(mobility.escapeRoute.recommendedRoutes));
  assert.ok(mobility.escapeRoute.recommendedRoutes.length > 0);

  // Check intermediate route step count and pathway
  const intermediate = mobility.escapeRoute.recommendedRoutes.find((r) => r.steps === 2);
  assert.ok(intermediate, "Should discover at least one 2-step intermediate route");
  assert.equal(intermediate.careers.length, 3);
  assert.equal(intermediate.careers[0], "Software Engineer");
  assert.equal(intermediate.careers[2], "Data Scientist");
});

// ============================================================================
// 3. MISSING SKILLS TEST
// ============================================================================
test("3. Missing skills correctly identifies skill deficit and caps mobility score", () => {
  const profile = {
    skills: "Excel, Communication",
    experience: "2 years",
  };

  const mobility = analyzeCareerMobility("Business Analyst", "Data Scientist", profile);

  assert.equal(mobility.skillGap.matchedSkillCount, 0);
  assert.equal(mobility.skillGap.coveragePercentage, 0);
  assert.ok(mobility.skillGap.missingSkills.length >= 4);
  assert.ok(mobility.skillGap.missingSkills.includes("Python"));
  assert.ok(mobility.skillGap.missingSkills.includes("Machine Learning"));

  // Check that 0 matched skills caps the overall score at 30
  assert.ok(mobility.mobilityScore.overallScore <= 30);
  assert.equal(mobility.mobilityScore.components.skillFit.score, 0);

  // Check blockers in explainability
  const hasSkillBlocker = mobility.explainability.blockers.some((b) => b.includes("Missing"));
  assert.ok(hasSkillBlocker);
});

// ============================================================================
// 4. COMPLETE SKILL MATCH TEST
// ============================================================================
test("4. Complete skill match awards maximum skill fit points (35/35)", () => {
  const profile = {
    skills: "Python, SQL, Machine Learning, Statistics, Deep Learning, Cloud",
    experience: "4 years",
  };

  const mobility = analyzeCareerMobility("Data Analyst", "Data Scientist", profile);

  assert.equal(mobility.skillGap.missingSkills.length, 0);
  assert.equal(mobility.skillGap.coveragePercentage, 100);
  assert.equal(mobility.mobilityScore.components.skillFit.score, 35);
  assert.equal(mobility.mobilityScore.ratingTier, "High");
});

// ============================================================================
// 5. MISSING EXPERIENCE TEST
// ============================================================================
test("5. Missing experience returns explicit unavailable state without assuming defaults", () => {
  const profile = {
    skills: "Python, SQL, Statistics",
    // No experience provided
  };

  const mobility = analyzeCareerMobility("Data Analyst", "Data Scientist", profile);

  assert.equal(mobility.experienceGap.available, false);
  assert.equal(mobility.experienceGap.currentExperience.available, false);
  assert.equal(mobility.experienceGap.currentExperience.years, null);
  assert.match(mobility.experienceGap.currentExperience.message, /Candidate experience not provided/);

  // ML Salary prediction must not be called when experience is missing
  assert.equal(mobility.mlSignals.salaryPrediction.available, false);
  assert.equal(mobility.mlSignals.salaryPrediction.predictedSalaryLPA, null);

  // Check blockers contains experience reminder
  const hasExpBlocker = mobility.explainability.blockers.some((b) => b.includes("Experience not provided"));
  assert.ok(hasExpBlocker);
});

// ============================================================================
// 6. UNSUPPORTED MARKET ROLE TEST
// ============================================================================
test("6. Unsupported market role returns marketDataAvailable: false without fake numbers", () => {
  const profile = {
    skills: "JavaScript, React, CSS, HTML",
    experience: "2 years",
  };

  const mobility = analyzeCareerMobility("Software Engineer", "Frontend Developer", profile);

  assert.equal(mobility.marketOpportunity.marketDataAvailable, false);
  assert.equal(mobility.marketOpportunity.postingVolume, null);
  assert.equal(mobility.marketOpportunity.postingShare, null);
  assert.equal(mobility.marketOpportunity.avgSalary, null);
  assert.equal(mobility.marketOpportunity.salaryRange, null);
  assert.match(mobility.marketOpportunity.message, /Market evidence unavailable/);

  // Target experience in dataset is also unavailable
  assert.equal(mobility.experienceGap.targetExperience.available, false);
  assert.equal(mobility.experienceGap.targetExperience.minYears, null);
});

// ============================================================================
// 7. SALARY UNAVAILABLE TEST
// ============================================================================
test("7. Salary unavailable handles missing benchmarks gracefully", () => {
  const profile = {
    skills: "Figma, Wireframing, User Research",
    experience: "3 years",
  };

  const mobility = analyzeCareerMobility("UI/UX Designer", "Cybersecurity Engineer", profile);

  assert.equal(mobility.marketOpportunity.avgSalary, null);
  assert.equal(mobility.marketOpportunity.formattedAvgSalary, null);
  assert.equal(mobility.mlSignals.salaryPrediction.available, false);
  assert.equal(mobility.mlSignals.salaryPrediction.predictedSalaryLPA, null);
});

// ============================================================================
// 8. WHAT-IF MODIFIED PROFILE SIMULATION TEST
// ============================================================================
test("8. simulateWhatIf calculates positive score delta and newly satisfied skills", () => {
  const baseProfile = {
    skills: "SQL, Tableau",
    experience: "1 year",
  };

  const whatIfResult = simulateWhatIf("Data Analyst", "Data Scientist", baseProfile, {
    additionalSkills: ["Python", "Machine Learning"],
    additionalExperienceYears: 2,
  });

  assert.ok(whatIfResult.baseline);
  assert.ok(whatIfResult.simulated);
  assert.ok(whatIfResult.delta);

  // Verify score improved
  assert.ok(whatIfResult.delta.scoreDelta > 0, "Score should increase when acquiring skills & exp");
  assert.ok(whatIfResult.simulated.mobilityScore.overallScore > whatIfResult.baseline.mobilityScore.overallScore);

  // Verify new skills identified
  assert.ok(whatIfResult.delta.newMatchedSkills.includes("Python"));
  assert.ok(whatIfResult.delta.newMatchedSkills.includes("Machine Learning"));

  // Verify remaining missing skills decreased
  assert.ok(whatIfResult.delta.remainingMissingSkills.length < whatIfResult.baseline.skillGap.missingSkills.length);
  assert.match(whatIfResult.delta.improvementSummary, /\+.*points mobility improvement/);
});

// ============================================================================
// 9. EXPLAINABILITY FIELDS TEST
// ============================================================================
test("9. Explainability returns structured Why, Blockers, and Smartest Route reasons", () => {
  const profile = {
    skills: "SQL, Python",
    experience: "1 year",
  };

  const mobility = analyzeCareerMobility("Data Analyst", "Data Engineer", profile);

  assert.ok(mobility.explainability);
  assert.ok(mobility.explainability.headline);
  assert.ok(Array.isArray(mobility.explainability.why));
  assert.ok(Array.isArray(mobility.explainability.blockers));
  assert.ok(mobility.explainability.why.length > 0);
  assert.ok(mobility.explainability.blockers.length > 0);

  // Smartest route structure
  assert.ok(mobility.explainability.smartestRoute);
  assert.ok(mobility.explainability.smartestRoute.pathString);
  assert.ok(typeof mobility.explainability.smartestRoute.mobilityFrictionScore === "number");
  assert.ok(mobility.explainability.smartestRoute.explanation);
});

// ============================================================================
// 10. NO FABRICATED MARKET EVIDENCE TEST
// ============================================================================
test("10. Empirical market evidence reflects exact dataset numbers and no fabrications", () => {
  // Test Data Scientist against exact verified values from DataScience Jobs.csv
  const dsMobility = analyzeCareerMobility("Data Analyst", "Data Scientist", { skills: "Python", experience: "3 years" });
  assert.equal(dsMobility.marketOpportunity.postingVolume, 9051);
  assert.equal(dsMobility.marketOpportunity.avgSalary, 13.53);
  assert.equal(dsMobility.marketOpportunity.minSalary, 2.0);
  assert.equal(dsMobility.marketOpportunity.maxSalary, 74.5);
  assert.equal(dsMobility.marketOpportunity.demandTier, "High");

  // Test Data Engineer against exact verified values
  const deMobility = analyzeCareerMobility("Data Analyst", "Data Engineer", { skills: "SQL", experience: "2 years" });
  assert.equal(deMobility.marketOpportunity.postingVolume, 8044);
  assert.equal(deMobility.marketOpportunity.avgSalary, 11.81);

  // Test unsupported career
  const unsuppMobility = analyzeCareerMobility("Data Analyst", "Game Developer", {});
  assert.equal(unsuppMobility.marketOpportunity.marketDataAvailable, false);
  assert.equal(unsuppMobility.marketOpportunity.postingVolume, null);
  assert.equal(unsuppMobility.marketOpportunity.avgSalary, null);
});

// ============================================================================
// 11. ML PREDICTIONS STRICTLY SEPARATED FROM MARKET EVIDENCE
// ============================================================================
test("11. ML predictions and empirical market evidence remain separate data categories", () => {
  const profile = {
    skills: "Python, SQL, Machine Learning, Tableau",
    experience: "3 years",
    personality: {
      neuroticism: 30,
      extraversion: 45,
      openness: 50,
      agreeableness: 55,
      conscientiousness: 60,
    },
  };

  const mobility = analyzeCareerMobility("Data Analyst", "Data Scientist", profile);

  // Market evidence has distinct source tag
  assert.match(mobility.marketOpportunity.source, /MARKET EVIDENCE/);
  assert.equal(mobility.marketOpportunity.avgSalary, 13.53);

  // ML models have distinct source tags
  assert.equal(mobility.mlSignals.technicalSignal.source, "MODEL PREDICTION");
  assert.equal(mobility.mlSignals.salaryPrediction.source, "MODEL PREDICTION");
  assert.equal(mobility.mlSignals.personalitySignal.source, "MODEL PREDICTION");

  // Ensure they are not conflated
  assert.notEqual(mobility.marketOpportunity.source, mobility.mlSignals.salaryPrediction.source);
});

// ============================================================================
// 12. MODULAR COMPONENT FUNCTIONS EXECUTION IN ISOLATION
// ============================================================================
test("12. Modular helper functions execute cleanly in isolation", () => {
  const profile = { skills: "Python, SQL", experience: "2 years" };

  const sGap = calculateSkillGap("Data Analyst", profile);
  assert.equal(sGap.available, true);
  assert.ok(sGap.matchedSkillCount > 0);

  const eGap = calculateExperienceGap("Data Analyst", profile);
  assert.equal(eGap.available, true);
  assert.equal(eGap.currentExperience.years, 2);

  const mOpp = extractMarketOpportunity("Data Analyst");
  assert.equal(mOpp.marketDataAvailable, true);
  assert.ok(mOpp.postingVolume > 0);

  const mlSig = evaluateMobilityMlSignals("Data Analyst", profile);
  assert.ok(mlSig.technicalSignal);
  assert.ok(mlSig.salaryPrediction);

  const mScore = calculateMobilityScore(sGap, eGap, mOpp, 20);
  assert.ok(mScore.overallScore >= 0 && mScore.overallScore <= 100);
  assert.ok(mScore.components.skillFit);
});

// ============================================================================
// 13. STAGE 7B: FULLY SUPPORTED MARKET ROLE
// ============================================================================
test("13. Fully supported market role calculates all 5 evidence components with 100% coverage", () => {
  const profile = {
    skills: "Python, SQL, Machine Learning, Statistics",
    experience: "3 years",
  };

  const mobility = analyzeCareerMobility("Data Analyst", "Data Scientist", profile);

  assert.equal(mobility.mobilityScore.unavailableComponents.length, 0);
  assert.equal(mobility.mobilityScore.availableComponents.length, 5);
  assert.equal(mobility.mobilityScore.normalization.maxAvailablePoints, 100);
  assert.equal(mobility.mobilityScore.normalization.evidenceCoveragePercent, 100);

  // Market & Salary components are available with non-null points
  assert.equal(mobility.mobilityScore.components.marketOpportunity.available, true);
  assert.notEqual(mobility.mobilityScore.components.marketOpportunity.points, null);
  assert.ok(mobility.mobilityScore.components.marketOpportunity.points > 0);

  assert.equal(mobility.mobilityScore.components.salarySignal.available, true);
  assert.notEqual(mobility.mobilityScore.components.salarySignal.points, null);
  assert.ok(mobility.mobilityScore.components.salarySignal.points > 0);
});

// ============================================================================
// 14. STAGE 7B: UNSUPPORTED ROLE
// ============================================================================
test("14. Unsupported role marks market & salary unavailable with points: null and explicit reasons", () => {
  const profile = {
    skills: "JavaScript, React, CSS, HTML",
    experience: "2 years",
  };

  const mobility = analyzeCareerMobility("Software Engineer", "Frontend Developer", profile);

  // Market Opportunity check
  const marketComp = mobility.mobilityScore.components.marketOpportunity;
  assert.equal(marketComp.available, false);
  assert.equal(marketComp.points, null);
  assert.equal(marketComp.reason, "Market evidence unavailable for this role in the provided dataset.");

  // Salary Signal check
  const salaryComp = mobility.mobilityScore.components.salarySignal;
  assert.equal(salaryComp.available, false);
  assert.equal(salaryComp.points, null);
  assert.equal(salaryComp.reason, "Salary evidence unavailable for this role in the provided dataset.");

  // Check tracking arrays
  assert.ok(mobility.mobilityScore.unavailableComponents.includes("marketOpportunity"));
  assert.ok(mobility.mobilityScore.unavailableComponents.includes("salarySignal"));
});

// ============================================================================
// 15. STAGE 7B: SALARY UNAVAILABLE
// ============================================================================
test("15. Salary unavailable returns points: null and is excluded from earned points", () => {
  const sGap = { available: true, coveragePercentage: 80, matchedSkillCount: 4, coreSkillCount: 5 };
  const eGap = { available: true, gapYears: 0, currentExperience: { years: 3 }, targetExperience: { minYears: 2 } };
  const mOpp = { marketDataAvailable: true, postingVolume: 5000, avgSalary: null }; // Market exists but no salary

  const scoreObj = calculateMobilityScore(sGap, eGap, mOpp, 20);

  assert.equal(scoreObj.components.salarySignal.available, false);
  assert.equal(scoreObj.components.salarySignal.points, null);
  assert.equal(scoreObj.components.salarySignal.reason, "Salary evidence unavailable for this role in the provided dataset.");
  assert.ok(scoreObj.unavailableComponents.includes("salarySignal"));
  assert.equal(scoreObj.normalization.maxAvailablePoints, 90); // 100 - 10
});

// ============================================================================
// 16. STAGE 7B: MARKET UNAVAILABLE
// ============================================================================
test("16. Market unavailable returns points: null and is excluded from earned points", () => {
  const sGap = { available: true, coveragePercentage: 80, matchedSkillCount: 4, coreSkillCount: 5 };
  const eGap = { available: true, gapYears: 0, currentExperience: { years: 3 }, targetExperience: { minYears: 2 } };
  const mOpp = { marketDataAvailable: false }; // No market evidence

  const scoreObj = calculateMobilityScore(sGap, eGap, mOpp, 20);

  assert.equal(scoreObj.components.marketOpportunity.available, false);
  assert.equal(scoreObj.components.marketOpportunity.points, null);
  assert.equal(scoreObj.components.marketOpportunity.reason, "Market evidence unavailable for this role in the provided dataset.");
  assert.ok(scoreObj.unavailableComponents.includes("marketOpportunity"));
  assert.ok(scoreObj.unavailableComponents.includes("salarySignal"));
  assert.equal(scoreObj.normalization.maxAvailablePoints, 75); // 100 - 15 - 10
});

// ============================================================================
// 17. STAGE 7B: OVERALL SCORE NORMALIZATION WITH MISSING COMPONENTS
// ============================================================================
test("17. Overall score recalculates dynamically using only available evidence components", () => {
  // Perfect skill fit (35/35) and frictionless jump (20/20) on an unsupported role (no market, salary, or exp benchmark)
  const sGap = { available: true, coveragePercentage: 100, matchedSkillCount: 4, coreSkillCount: 4 };
  const eGap = { available: false };
  const mOpp = { marketDataAvailable: false };

  const scoreObj = calculateMobilityScore(sGap, eGap, mOpp, 0); // 0 friction -> 20/20 mobility ease

  // Available: skillFit (35) + mobilityEase (20) = 55 max available points
  // Earned: 35 + 20 = 55 points
  assert.equal(scoreObj.normalization.maxAvailablePoints, 55);
  assert.equal(scoreObj.normalization.totalEarnedPoints, 55);
  // Normalized score: (55 / 55) * 100 = 100
  assert.equal(scoreObj.score, 100);
  assert.equal(scoreObj.overallScore, 100);
  assert.equal(scoreObj.ratingTier, "High");
  assert.equal(scoreObj.availableComponents.length, 2);
  assert.equal(scoreObj.unavailableComponents.length, 3);
  assert.equal(scoreObj.normalization.evidenceCoveragePercent, 55);
});


