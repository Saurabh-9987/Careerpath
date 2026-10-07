import assert from "node:assert/strict";
import {
  getCareerScoreBreakdown,
  getScore,
  getSkillCoveragePercent,
  SCORING_WEIGHTS,
} from "./careerScoring.js";

console.log("Running Career Scoring Test Suite...\n");

// Test 1: User Case (ML Engineer -> Data Scientist with 4/4 skills matched)
{
  const profile = {
    role: "ML Engineer",
    skills: "Python, SQL, Statistics, Machine Learning",
    education: "B.Tech",
    experience: "",
    interests: "",
    projects: "",
  };

  const breakdown = getCareerScoreBreakdown("Data Scientist", profile);

  assert.equal(breakdown.totalScore, 70, "Total profile readiness must be 70%");
  assert.equal(breakdown.skillsScore, 60, "Skills must contribute 60/60 points");
  assert.equal(breakdown.educationScore, 3, "Education must contribute 3/10 points");
  assert.equal(breakdown.experienceScore, 7, "Experience proximity must contribute 7/12 points");
  assert.equal(breakdown.interestScore, 0, "Interests must contribute 0/8 points");
  assert.equal(breakdown.projectScore, 0, "Projects must contribute 0/10 points");

  assert.equal(breakdown.matchedSkills.length, 4, "Must match all 4 skills");
  assert.equal(breakdown.missingSkills.length, 0, "Must have 0 missing skills");

  const skillCoverage = getSkillCoveragePercent("Data Scientist", profile);
  assert.equal(skillCoverage, 100, "Requirements coverage must be 100%");

  const scoreDirect = getScore("Data Scientist", profile);
  assert.equal(scoreDirect, 70, "getScore must equal 70%");

  // Verify missing points breakdown
  const missingPoints =
    (SCORING_WEIGHTS.skills - breakdown.skillsScore) +
    (SCORING_WEIGHTS.education - breakdown.educationScore) +
    (SCORING_WEIGHTS.experience - breakdown.experienceScore) +
    (SCORING_WEIGHTS.interests - breakdown.interestScore) +
    (SCORING_WEIGHTS.projects - breakdown.projectScore);
  assert.equal(missingPoints, 30, "Missing categories must total exactly 30 points");

  console.log("✓ Test 1 Passed: 70% readiness mathematically verified with 100% skill coverage");
}

// Test 2: Weight Verification (Total must equal 100)
{
  const sumWeights =
    SCORING_WEIGHTS.skills +
    SCORING_WEIGHTS.education +
    SCORING_WEIGHTS.experience +
    SCORING_WEIGHTS.interests +
    SCORING_WEIGHTS.projects;
  assert.equal(sumWeights, 100, "Scoring factor weights must sum to exactly 100");
  console.log("✓ Test 2 Passed: Scoring weights sum to 100 points");
}

// Test 3: What-If ML project and additional profile details reach 100%
{
  const fullProfile = {
    role: "ML Engineer",
    skills: "Python, SQL, Statistics, Machine Learning",
    education: "Master of Science in Statistics and Data Science",
    experience: "Data pipeline and model deployment engineer",
    interests: "machine learning, data science, statistics",
    projects: "Production predictive model app",
  };

  const fullBreakdown = getCareerScoreBreakdown("Data Scientist", fullProfile, true);
  assert.equal(fullBreakdown.skillsScore, 60, "Skills max 60");
  assert.equal(fullBreakdown.educationScore, 10, "Education max 10");
  assert.equal(fullBreakdown.experienceScore, 12, "Experience max 12 (7 proximity + 5 keywords capped at 12)");
  assert.equal(fullBreakdown.interestScore, 8, "Interests max 8");
  assert.equal(fullBreakdown.projectScore, 10, "Projects max 10");
  assert.equal(fullBreakdown.totalScore, 100, "Full profile must achieve 100%");

  console.log("✓ Test 3 Passed: Comprehensive profile correctly reaches 100% readiness");
}

console.log("\nAll 3 test suites passed successfully!");
