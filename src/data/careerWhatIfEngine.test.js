import test from "node:test";
import assert from "node:assert/strict";

import { simulateWhatIf } from "./careerMobilityEngine.js";

// ============================================================================
// 1. ADDING ONE SKILL
// ============================================================================
test("1. Adding one skill increases score, identifies new match, and decreases remaining missing skills", () => {
  const baseProfile = {
    skills: "SQL, Tableau",
    experience: "2 years",
  };

  const result = simulateWhatIf("Data Analyst", "Data Scientist", baseProfile, {
    additionalSkills: ["Python"],
  });

  assert.ok(result.delta.scoreDelta > 0, "Score delta must be positive when adding required skill");
  assert.equal(result.delta.newMatchedSkills.length, 1);
  assert.ok(result.delta.newMatchedSkills.includes("Python"));
  assert.ok(result.delta.remainingMissingSkills.length < result.baseline.skillGap.missingSkills.length);
  assert.equal(result.delta.skillCoverageDelta > 0, true);
  assert.ok(result.delta.skillImpactNotes.some((n) => n.includes("Python")));
});

// ============================================================================
// 2. ADDING MULTIPLE SKILLS
// ============================================================================
test("2. Adding multiple skills satisfies multiple competencies and boosts coverage percentage", () => {
  const baseProfile = {
    skills: "SQL",
    experience: "2 years",
  };

  const result = simulateWhatIf("Data Analyst", "Data Scientist", baseProfile, {
    additionalSkills: ["Python", "Statistics", "Machine Learning"],
  });

  assert.ok(result.delta.scoreDelta > 0);
  assert.equal(result.delta.newMatchedSkills.length, 3);
  assert.ok(result.delta.newMatchedSkills.includes("Python"));
  assert.ok(result.delta.newMatchedSkills.includes("Statistics"));
  assert.ok(result.delta.newMatchedSkills.includes("Machine Learning"));
  assert.equal(result.simulated.skillGap.coveragePercentage, 100);
  assert.equal(result.delta.remainingMissingSkills.length, 0);
});

// ============================================================================
// 3. ADDING EXPERIENCE
// ============================================================================
test("3. Adding experience decreases experience gap and bridges minimum benchmark", () => {
  const baseProfile = {
    skills: "Python, SQL, Statistics, Machine Learning",
    experience: "1 year", // Data Scientist benchmark minimum is ~2.0 yrs in dataset
  };

  const result = simulateWhatIf("Data Analyst", "Data Scientist", baseProfile, {
    additionalExperienceYears: 2, // Total 3 years
  });

  assert.ok(result.baseline.experienceGap.available);
  assert.ok(result.simulated.experienceGap.available);
  assert.ok(result.delta.experienceGapDelta > 0);
  assert.equal(result.simulated.experienceGap.gapYears, 0);
  assert.equal(result.simulated.experienceGap.status, "Qualified / Meets Benchmark");
});

// ============================================================================
// 4. CHANGING TARGET ROLE
// ============================================================================
test("4. Changing target role evaluates baseline and simulated destination independently", () => {
  const baseProfile = {
    skills: "Python, SQL, Spark, Cloud",
    experience: "3 years",
  };

  const result = simulateWhatIf("Data Analyst", "Data Scientist", baseProfile, {
    overrideTargetRole: "Data Engineer",
  });

  assert.equal(result.delta.targetRoleChanged, true);
  assert.equal(result.delta.baselineTarget, "Data Scientist");
  assert.equal(result.delta.simulatedTarget, "Data Engineer");
  assert.equal(result.baseline.targetRole, "Data Scientist");
  assert.equal(result.simulated.targetRole, "Data Engineer");
  // Spark & Cloud match Data Engineer 100%
  assert.equal(result.simulated.skillGap.coveragePercentage, 100);
});

// ============================================================================
// 5. COMBINED MODIFICATIONS
// ============================================================================
test("5. Combined modifications (skills + experience + target change) compute unified delta", () => {
  const baseProfile = {
    skills: "Java, C++",
    experience: "1 year",
  };

  const result = simulateWhatIf("Software Engineer", "Data Scientist", baseProfile, {
    additionalSkills: ["Python", "SQL", "Spark", "Cloud"],
    additionalExperienceYears: 2,
    overrideTargetRole: "Data Engineer",
  });

  assert.equal(result.delta.targetRoleChanged, true);
  assert.ok(result.delta.scoreDelta > 0);
  assert.ok(result.delta.newMatchedSkills.length > 0);
  assert.ok(result.delta.experienceGapDelta > 0);
  assert.ok(result.delta.improvementSummary.includes("mobility improvement"));
});

// ============================================================================
// 6. SCORE DELTA INTEGRITY
// ============================================================================
test("6. Score delta reflects actual mathematical difference between simulated and baseline", () => {
  const baseProfile = {
    skills: "Python",
    experience: "0 years",
  };

  const result = simulateWhatIf("Data Analyst", "Data Scientist", baseProfile, {
    additionalSkills: ["SQL"],
  });

  const expectedDelta = result.simulated.mobilityScore.overallScore - result.baseline.mobilityScore.overallScore;
  assert.equal(result.delta.scoreDelta, expectedDelta);
});

// ============================================================================
// 7. NEW MATCHED SKILLS VS REMAINING MISSING SKILLS
// ============================================================================
test("7. New matched skills and remaining missing skills partition core catalog requirements", () => {
  const baseProfile = {
    skills: "Python",
  };

  const result = simulateWhatIf("Data Analyst", "Data Scientist", baseProfile, {
    additionalSkills: ["Machine Learning"],
  });

  assert.deepEqual(result.delta.newMatchedSkills, ["Machine Learning"]);
  assert.ok(!result.delta.remainingMissingSkills.includes("Machine Learning"));
  assert.ok(result.delta.remainingMissingSkills.includes("SQL"));
  assert.ok(result.delta.remainingMissingSkills.includes("Statistics"));
});

// ============================================================================
// 8. EXPERIENCE GAP DELTA
// ============================================================================
test("8. Experience-gap delta accurately computes numerical difference in gap years", () => {
  const baseProfile = {
    skills: "Python, SQL",
    experience: "1.0 year",
  };

  const result = simulateWhatIf("Data Analyst", "Data Scientist", baseProfile, {
    additionalExperienceYears: 1.0,
  });

  const expectedGapDelta =
    Math.round((result.baseline.experienceGap.gapYears - result.simulated.experienceGap.gapYears) * 10) / 10;
  assert.equal(result.delta.experienceGapDelta, expectedGapDelta);
});

// ============================================================================
// 9. ROUTE CHANGES
// ============================================================================
test("9. Route changes track pathway transition and friction reduction", () => {
  const baseProfile = {
    skills: "Java, C++",
    experience: "1 year",
  };

  // Moving from Software Engineer to Data Scientist often starts multi-step,
  // acquiring all core competencies can simplify pathway
  const result = simulateWhatIf("Software Engineer", "Data Scientist", baseProfile, {
    additionalSkills: ["Python", "SQL", "Statistics", "Machine Learning"],
    additionalExperienceYears: 3,
  });

  assert.ok(result.delta.previousPathString);
  assert.ok(result.delta.newPathString);
  assert.ok(typeof result.delta.routeChanged === "boolean");
  assert.ok(result.simulated.escapeRoute.mobilityFriction.score <= result.baseline.escapeRoute.mobilityFriction.score);
});

// ============================================================================
// 10. RESET BEHAVIOR
// ============================================================================
test("10. Reset behavior (empty modifications) yields exact baseline replica with zero delta", () => {
  const baseProfile = {
    skills: "Python, SQL",
    experience: "2 years",
  };

  const resetResult = simulateWhatIf("Data Analyst", "Data Scientist", baseProfile, {});

  assert.equal(resetResult.delta.scoreDelta, 0);
  assert.equal(resetResult.delta.skillCoverageDelta, 0);
  assert.equal(resetResult.delta.newMatchedSkills.length, 0);
  assert.equal(resetResult.delta.targetRoleChanged, false);
  assert.equal(resetResult.delta.routeChanged, false);
  assert.equal(resetResult.simulated.mobilityScore.overallScore, resetResult.baseline.mobilityScore.overallScore);
  assert.deepEqual(
    resetResult.delta.remainingMissingSkills,
    resetResult.baseline.skillGap.missingSkills
  );
});

// ============================================================================
// 11. UNSUPPORTED MARKET ROLE IN WHAT-IF
// ============================================================================
test("11. Unsupported market role in What-If maintains unobserved market states without fake numbers", () => {
  const baseProfile = {
    skills: "Python, Docker, Linux",
    experience: "3 years",
  };

  const result = simulateWhatIf("Software Engineer", "DevOps Engineer", baseProfile, {
    additionalSkills: ["Kubernetes", "Terraform"],
  });

  assert.equal(result.simulated.marketOpportunity.marketDataAvailable, false);
  assert.equal(result.simulated.mobilityScore.components.marketOpportunity.available, false);
  assert.equal(result.simulated.mobilityScore.components.marketOpportunity.points, null);
  assert.equal(
    result.simulated.marketOpportunity.message,
    "Market evidence unavailable for this role in the provided dataset."
  );
  // Score must remain valid and bounded [0, 100]
  assert.ok(result.simulated.mobilityScore.overallScore >= 0 && result.simulated.mobilityScore.overallScore <= 100);
});

// ============================================================================
// 12. INCOMPLETE PROFILE HANDLING IN WHAT-IF
// ============================================================================
test("12. Incomplete or empty profile executes What-If stably without crashing", () => {
  assert.doesNotThrow(() => {
    const emptyResult = simulateWhatIf(null, null, {}, {
      additionalSkills: ["Python"],
    });
    assert.ok(emptyResult);
    assert.ok(emptyResult.simulated.mobilityScore.overallScore >= 0);
  });
});
