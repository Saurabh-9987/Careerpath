import test from "node:test";
import assert from "node:assert/strict";
import {
  getMarketOverviewMetrics,
  getRankedCareerDemand,
  getSalaryIntelligence,
  getSkillMarketIntelligence,
  getCompanyIntelligence,
  getLocationIntelligence,
  compareMarketRoles,
  getMarketFactualInsights,
  getMarketModelSeparation,
} from "./marketIntelligenceEngine.js";

test("1. Market Overview Metrics: Returns verified empirical totals from hackathon datasets", () => {
  const overview = getMarketOverviewMetrics();

  assert.equal(overview.totalAggregatedPostings, 93005);
  assert.equal(overview.totalAnalyticsRawPostings, 15841);
  assert.equal(overview.supportedStandardizedRolesCount, 10);
  assert.equal(overview.uniqueCompaniesCount, 642);
  assert.equal(overview.overallAvgSalaryLPA, 13.23);
  assert.equal(overview.postingWeightedAvgSalaryLPA, 9.69);

  // Most demanded role verification
  assert.equal(overview.mostDemandedRole.roleName, "Business Analyst");
  assert.equal(overview.mostDemandedRole.postingVolume, 32843);
  assert.equal(overview.mostDemandedRole.marketSharePercent, 35.31);
});

test("2. Role Demand Ranking: Accurately ranks all 10 supported roles and separates unobserved roles", () => {
  const demand = getRankedCareerDemand();

  assert.equal(demand.supportedRoles.length, 10);
  assert.equal(demand.supportedRoles[0].roleName, "Business Analyst");
  assert.equal(demand.supportedRoles[0].postingVolume, 32843);
  assert.equal(demand.supportedRoles[1].roleName, "Data Analyst");
  assert.equal(demand.supportedRoles[1].postingVolume, 18095);

  // Demand tiers verified
  assert.equal(demand.supportedRoles[0].demandTier, "Very High");
  assert.equal(demand.supportedRoles[1].demandTier, "Very High");

  // Sum of posting volumes equals total
  const volumeSum = demand.supportedRoles.reduce((sum, r) => sum + r.postingVolume, 0);
  assert.equal(volumeSum, 93005);

  // Unobserved roles verification (no fake zero numbers)
  assert.ok(demand.unobservedRoles.length > 0);
  const gameDev = demand.unobservedRoles.find((r) => r.roleName === "Game Developer");
  assert.ok(gameDev !== undefined);
  assert.equal(gameDev.postingVolume, null);
  assert.equal(gameDev.evidenceStatus, "Not observed in provided dataset");
});

test("3. Salary Evidence: Correctly orders empirical benchmarks and labels MARKET EVIDENCE", () => {
  const salary = getSalaryIntelligence();

  assert.equal(salary.evidenceLabel, "MARKET EVIDENCE");
  assert.equal(salary.roles.length, 10);

  // Data Architect is highest paid
  assert.equal(salary.highestPaidRole.roleName, "Data Architect");
  assert.equal(salary.highestPaidRole.avgSalaryLPA, 25.09);
  assert.equal(salary.highestPaidRole.minSalaryLPA, 7.5);
  assert.equal(salary.highestPaidRole.maxSalaryLPA, 102.0);

  // Strictly non-increasing order of average salary
  for (let i = 0; i < salary.roles.length - 1; i++) {
    assert.ok(
      salary.roles[i].avgSalaryLPA >= salary.roles[i + 1].avgSalaryLPA,
      `Salary at rank ${i} should be >= salary at rank ${i + 1}`
    );
  }
});

test("4. Skill Evidence: Returns verified frequencies and categories from Analytics Jobs", () => {
  const skillData = getSkillMarketIntelligence();

  assert.equal(skillData.totalJobPostings, 15841);
  assert.ok(skillData.skills.length >= 10);

  const sqlSkill = skillData.skills.find((s) => s.skillName === "SQL");
  assert.ok(sqlSkill !== undefined);
  assert.equal(sqlSkill.mentionCount, 915);
  assert.equal(sqlSkill.demandPercentage, 5.78);
  assert.equal(sqlSkill.category, "Data & Querying");

  const pythonSkill = skillData.skills.find((s) => s.skillName === "Python");
  assert.ok(pythonSkill !== undefined);
  assert.equal(pythonSkill.mentionCount, 840);
  assert.equal(pythonSkill.demandPercentage, 5.30);
});

test("5. Company Intelligence: Uses exact dataset volume and 'Observed posting volume in dataset' wording", () => {
  const companyData = getCompanyIntelligence();

  assert.equal(companyData.wording, "Observed posting volume in dataset");
  assert.ok(companyData.companies.length >= 5);

  assert.equal(companyData.companies[0].companyName, "TCS");
  assert.equal(companyData.companies[0].jobVolume, 9064);
  assert.equal(companyData.companies[0].marketSharePercent, 9.75);

  assert.equal(companyData.companies[1].companyName, "Accenture");
  assert.equal(companyData.companies[1].jobVolume, 5425);
});

test("6. Location Intelligence: Accurately reports city mentions and multi-city parsing note", () => {
  const locData = getLocationIntelligence();

  assert.equal(locData.wording, "Observed hiring locations in dataset");
  assert.ok(locData.sourceNote.includes("multi-city"));
  assert.ok(locData.locations.length >= 5);

  assert.equal(locData.locations[0].city, "Bengaluru");
  assert.equal(locData.locations[0].jobCount, 3333);
  assert.equal(locData.locations[0].marketSharePercent, 21.04);
});

test("7. Supported vs Unsupported Role Comparison: Does not compare unsupported metrics as if observed", () => {
  // Compare two supported roles
  const supportedComp = compareMarketRoles("Data Analyst", "Data Scientist");
  assert.equal(supportedComp.bothObserved, true);
  assert.equal(supportedComp.roleA.available, true);
  assert.equal(supportedComp.roleB.available, true);
  assert.equal(supportedComp.demandComparison.higherRole, "Data Analyst");
  assert.equal(supportedComp.salaryComparison.higherRole, "Data Scientist");

  // Compare supported vs unsupported role
  const mixedComp = compareMarketRoles("Data Scientist", "UI/UX Designer");
  assert.equal(mixedComp.bothObserved, false);
  assert.equal(mixedComp.roleA.available, true);
  assert.equal(mixedComp.roleB.available, false);
  assert.equal(mixedComp.roleB.evidenceStatus, "Not observed in provided dataset");
  assert.equal(mixedComp.roleB.postingVolume, null);
  assert.equal(mixedComp.demandComparison, null);
  assert.equal(mixedComp.salaryComparison, null);
});

test("8. Factual Insight Generation: Generates verifiable statements derived solely from dataset metrics", () => {
  const insights = getMarketFactualInsights();

  assert.ok(insights.length >= 5);
  insights.forEach((insight) => {
    assert.ok(typeof insight.category === "string");
    assert.ok(typeof insight.title === "string");
    assert.ok(typeof insight.text === "string" && insight.text.length > 20);
  });

  // Verify specific facts in statements
  assert.ok(insights.some((i) => i.text.includes("Business Analyst") && i.text.includes("32,843")));
  assert.ok(insights.some((i) => i.text.includes("Data Architect") && i.text.includes("25.09")));
  assert.ok(insights.some((i) => i.text.includes("SQL") && i.text.includes("Python")));
  assert.ok(insights.some((i) => i.text.includes("Bengaluru")));
});

test("9. ML Separation: Keeps MODEL PREDICTION strictly distinct from MARKET EVIDENCE", () => {
  const sep = getMarketModelSeparation("Data Scientist", 3);

  // Market Evidence: empirical distribution
  assert.equal(sep.marketEvidence.available, true);
  assert.equal(sep.marketEvidence.avgSalaryLPA, 13.53);
  assert.ok(sep.marketEvidence.evidenceType.includes("MARKET EVIDENCE"));

  // Model Prediction: regression estimate
  assert.equal(sep.modelPrediction.available, true);
  assert.equal(typeof sep.modelPrediction.predictedSalaryLPA, "number");
  assert.ok(sep.modelPrediction.modelType.includes("MODEL PREDICTION"));
  assert.equal(sep.modelPrediction.inputExperience, 3);

  // Separation rule
  assert.ok(sep.separationRule.includes("never be blended or conflated"));

  // Unsupported role in ML separation
  const unsupp = getMarketModelSeparation("Game Developer", 3);
  assert.equal(unsupp.marketEvidence.available, false);
  assert.ok(unsupp.marketEvidence.message.includes("unavailable"));
});
