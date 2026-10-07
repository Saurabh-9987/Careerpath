import test from "node:test";
import assert from "node:assert";
import {
  getCareerEscapeRoute,
  calculateMobilityFriction,
  analyzeTransitionSkills,
} from "./careerEscapeRoute.js";

// 1. Data Analyst → Data Scientist transition
test("1. Data Analyst → Data Scientist returns structured escape route", () => {
  const route = getCareerEscapeRoute("Data Analyst", "Data Scientist");

  assert.strictEqual(route.available, true);
  assert.strictEqual(route.currentCareer, "Data Analyst");
  assert.strictEqual(route.targetCareer, "Data Scientist");
  assert.ok(route.directRoute);
  assert.deepStrictEqual(route.directRoute.careers, ["Data Analyst", "Data Scientist"]);
  assert.strictEqual(route.directRoute.steps, 1);
  assert.ok(route.recommendedRoutes.length >= 1 && route.recommendedRoutes.length <= 3);
  assert.ok(typeof route.mobilityFriction.score === "number");
  assert.ok(route.mobilityFriction.score >= 0 && route.mobilityFriction.score <= 100);
  assert.ok(["Low", "Moderate", "High"].includes(route.mobilityFriction.level));
  assert.ok(route.explanation.length > 0);

  // Direct target market evidence attached
  assert.strictEqual(route.directRoute.marketEvidence.marketDataAvailable, true);
  assert.strictEqual(route.directRoute.marketEvidence.postingVolume, 9051);
  assert.strictEqual(route.directRoute.marketEvidence.avgSalary, 13.53);
});

// 2. Software Engineer → Data Scientist transition
test("2. Software Engineer → Data Scientist correctly identifies skills and friction", () => {
  const route = getCareerEscapeRoute("Software Engineer", "Data Scientist");

  assert.strictEqual(route.available, true);
  assert.strictEqual(route.currentCareer, "Software Engineer");
  assert.strictEqual(route.targetCareer, "Data Scientist");

  // Software Engineer has Python, but lacks SQL, Statistics, Machine Learning
  assert.ok(route.overlappingSkills.includes("Python") || route.overlappingSkills.length >= 1);
  assert.ok(route.missingSkills.length > 0);

  // Mobility friction should be higher due to more missing skills
  assert.ok(route.mobilityFriction.score >= 30);
  assert.ok(route.directRoute);
  assert.deepStrictEqual(route.directRoute.careers, ["Software Engineer", "Data Scientist"]);
});

// 3. Direct route generation
test("3. Direct route generation has required schema and step count", () => {
  const route = getCareerEscapeRoute("Data Engineer", "Data Scientist");
  assert.strictEqual(route.directRoute.type, "direct");
  assert.strictEqual(route.directRoute.steps, 1);
  assert.deepStrictEqual(route.directRoute.careers, ["Data Engineer", "Data Scientist"]);
  assert.ok(route.directRoute.mobilityFriction);
  assert.ok(route.directRoute.skillAnalysis);
  assert.ok(route.directRoute.marketEvidence);
  assert.ok(route.directRoute.scores.fastestScore !== undefined);
  assert.ok(route.directRoute.scores.skillFitScore !== undefined);
  assert.ok(route.directRoute.scores.marketScore !== undefined);
});

// 4. Intermediate route generation
test("4. Intermediate route generation uses only valid catalog careers and returns <= 3 routes", () => {
  const route = getCareerEscapeRoute("Data Analyst", "Data Scientist");

  assert.ok(route.recommendedRoutes.length <= 3);

  const intermediateRoutes = route.recommendedRoutes.filter((r) => r.type === "intermediate");
  if (intermediateRoutes.length > 0) {
    const inter = intermediateRoutes[0];
    assert.strictEqual(inter.steps, 2);
    assert.strictEqual(inter.careers.length, 3);
    assert.strictEqual(inter.careers[0], "Data Analyst");
    assert.strictEqual(inter.careers[2], "Data Scientist");
    // Intermediate career must be in existing catalog
    assert.ok(inter.careers[1] in { "Data Engineer": 1, "Business Intelligence Analyst": 1, "ML Engineer": 1 });
  }
});

// 5. Missing skills analysis
test("5. Missing skills accurately reflect target career requirements not in source", () => {
  const skills = analyzeTransitionSkills("Data Analyst", "Data Scientist");

  // Data Scientist requires ["Python", "SQL", "Statistics", "Machine Learning"]
  // Data Analyst has ["Python", "SQL", "Tableau", "Excel"]
  assert.ok(skills.missingSkills.includes("Statistics") || skills.missingSkills.includes("Machine Learning"));
  assert.ok(skills.overlappingSkills.includes("Python"));
  assert.ok(skills.overlappingSkills.includes("SQL"));
});

// 6. Skill overlap analysis with profile contributions
test("6. Skill overlap incorporates profile skills dynamically", () => {
  const withoutProfile = analyzeTransitionSkills("Data Analyst", "Data Scientist", {});
  assert.ok(withoutProfile.missingSkills.includes("Machine Learning"));

  // Profile provides Machine Learning
  const withProfile = analyzeTransitionSkills("Data Analyst", "Data Scientist", {
    skills: ["Machine Learning", "Statistics"],
  });
  assert.ok(withProfile.overlappingSkills.includes("Machine Learning"));
  assert.ok(withProfile.overlappingSkills.includes("Statistics"));
  assert.strictEqual(withProfile.missingSkills.length, 0);
  assert.strictEqual(withProfile.coveragePercent, 100);
});

// 7. Mobility friction range 0–100 and categories
test("7. Mobility friction score stays between 0 and 100 and categorizes correctly", () => {
  const fLow = calculateMobilityFriction("Data Scientist", "Data Scientist");
  assert.strictEqual(fLow.score, 0);
  assert.strictEqual(fLow.level, "Low");

  const fModerate = calculateMobilityFriction("Data Analyst", "Data Scientist");
  assert.ok(fModerate.score >= 0 && fModerate.score <= 100);
  assert.ok(Array.isArray(fModerate.factors));
  assert.ok(fModerate.factors.length > 0);

  // Unrelated roles have higher friction
  const fHigh = calculateMobilityFriction("UI/UX Designer", "Data Architect");
  assert.ok(fHigh.score >= 60);
  assert.strictEqual(fHigh.level, "High");
});

// 8. Unsupported career handling
test("8. Unsupported career handling returns available: false without throwing", () => {
  const invalid = getCareerEscapeRoute("NonExistentCareer", "Data Scientist");
  assert.strictEqual(invalid.available, false);
  assert.strictEqual(invalid.directRoute, null);
  assert.strictEqual(invalid.recommendedRoutes.length, 0);
  assert.ok(invalid.explanation.includes("not found"));

  const invalidTarget = getCareerEscapeRoute("Data Analyst", "ImaginaryRole");
  assert.strictEqual(invalidTarget.available, false);

  const invalidInputs = getCareerEscapeRoute(null, undefined);
  assert.strictEqual(invalidInputs.available, false);
});

// 9. Empty profile handling
test("9. Empty profile handling produces stable results without errors", () => {
  const empty1 = getCareerEscapeRoute("Data Analyst", "Data Scientist", null);
  const empty2 = getCareerEscapeRoute("Data Analyst", "Data Scientist", undefined);
  const empty3 = getCareerEscapeRoute("Data Analyst", "Data Scientist", {});
  const empty4 = getCareerEscapeRoute("Data Analyst", "Data Scientist", { skills: [] });

  assert.strictEqual(empty1.available, true);
  assert.strictEqual(empty2.available, true);
  assert.strictEqual(empty3.available, true);
  assert.strictEqual(empty4.available, true);
  assert.strictEqual(empty1.mobilityFriction.score, empty4.mobilityFriction.score);
});

// 10. Deterministic route ranking (fastest, skillFit, market)
test("10. Deterministic route ranking produces fastest, skillFit, and market picks", () => {
  const route = getCareerEscapeRoute("Data Analyst", "Data Scientist");

  assert.ok(route.rankings.fastest);
  assert.ok(route.rankings.skillFit);
  assert.ok(route.rankings.market);

  assert.strictEqual(route.recommendedRoutes.fastest.id, route.rankings.fastest.id);
  assert.strictEqual(route.recommendedRoutes.skillFit.id, route.rankings.skillFit.id);
  assert.strictEqual(route.recommendedRoutes.market.id, route.rankings.market.id);

  // Fastest should prefer direct or lowest step/friction
  assert.ok(route.rankings.fastest.scores.fastestScore >= 0);
  // Skill fit should have high overlap score
  assert.ok(route.rankings.skillFit.scores.skillFitScore >= 0);
  // Market should have valid market score
  assert.ok(route.rankings.market.scores.marketScore >= 0);
});

// 11. No fabricated market data for roles outside dataset
test("11. Roles outside dataset have marketDataAvailable: false and no fake numbers", () => {
  // Software Engineer is outside DataScience Jobs dataset
  const route = getCareerEscapeRoute("Software Engineer", "Frontend Developer");
  assert.strictEqual(route.available, true);
  assert.strictEqual(route.directRoute.marketEvidence.marketDataAvailable, false);
  assert.strictEqual(route.directRoute.marketEvidence.postingVolume, null);
  assert.strictEqual(route.directRoute.marketEvidence.avgSalary, null);
  assert.strictEqual(route.directRoute.marketEvidence.salaryRange, null);
});
