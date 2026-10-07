import test from "node:test";
import assert from "node:assert";
import {
  getMarketSummary,
  getCareerMarketData,
  getCareerPostingVolume,
  getCareerSalary,
  getCareerDemand,
  getCareerExperience,
  getTopCompanies,
  getTopSkills,
  getSkillMarketData,
  getLocationMarketData,
  getJDSWeights,
  getAugmentedCareer,
  getAllAugmentedCareers,
  CAREER_TO_DATASET_ROLE_MAP,
  TOTAL_AGGREGATED_POSTINGS,
} from "./careerIntelligence.js";
import { careerData } from "./careerData.js";

test("getMarketSummary returns empirical benchmark totals", () => {
  const summary = getMarketSummary();
  assert.strictEqual(summary.totalAggregatedPostings, 93005);
  assert.strictEqual(summary.totalDatasetRecords, 1602);
  assert.strictEqual(summary.uniqueCompanies, 642);
  assert.strictEqual(summary.uniqueStandardRoles, 10);
  assert.strictEqual(summary.totalAnalyticsJobsRecords, 15841);
  assert.strictEqual(summary.overallAvgSalaryLPA, 13.23);
  assert.strictEqual(summary.postingWeightedAvgSalaryLPA, 9.69);
});

test("Supported roles return verified empirical market evidence", () => {
  // 1. Data Scientist
  const ds = getCareerMarketData("Data Scientist");
  assert.strictEqual(ds.available, true);
  assert.strictEqual(ds.marketDataAvailable, true);
  assert.strictEqual(ds.postingVolume, 9051);
  assert.strictEqual(ds.postingShare, 9.73);
  assert.strictEqual(ds.avgSalary, 13.53);
  assert.strictEqual(ds.minSalary, 2.0);
  assert.strictEqual(ds.maxSalary, 74.5);
  assert.ok(ds.minExperience > 1.0);
  assert.ok(ds.topSkills.length > 0);
  assert.ok(ds.topCompanies.length > 0);

  // 2. Data Analyst
  const da = getCareerMarketData("Data Analyst");
  assert.strictEqual(da.available, true);
  assert.strictEqual(da.postingVolume, 18095);
  assert.strictEqual(da.postingShare, 19.46);

  // 3. Data Engineer
  const de = getCareerMarketData("Data Engineer");
  assert.strictEqual(de.available, true);
  assert.strictEqual(de.postingVolume, 8044);
  assert.strictEqual(de.postingShare, 8.65);

  // 4. ML Engineer (maps to Machine Learning Engineer)
  const ml = getCareerMarketData("ML Engineer");
  assert.strictEqual(ml.available, true);
  assert.strictEqual(ml.datasetRoleName, "Machine Learning Engineer");
  assert.strictEqual(ml.postingVolume, 964);
  assert.strictEqual(ml.postingShare, 1.04);
});

test("Unsupported careers return available: false without fabricated numbers", () => {
  const unsupportedList = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Cybersecurity Engineer",
    "UI/UX Designer",
    "Game Developer",
  ];

  unsupportedList.forEach((role) => {
    const data = getCareerMarketData(role);
    assert.strictEqual(data.available, false);
    assert.strictEqual(data.marketDataAvailable, false);
    assert.strictEqual(data.postingVolume, undefined);
    assert.strictEqual(data.avgSalary, undefined);
    assert.ok(data.message.includes("unavailable for this role"));
  });
});

test("Helper selectors return expected values or null on unsupported roles", () => {
  assert.strictEqual(getCareerPostingVolume("Data Scientist"), 9051);
  assert.strictEqual(getCareerPostingVolume("Frontend Developer"), null);

  const salary = getCareerSalary("Data Scientist");
  assert.strictEqual(salary.avg, 13.53);
  assert.strictEqual(salary.avgSalary, 13.53);
  assert.strictEqual(salary.currency, "INR");
  assert.strictEqual(salary.unit, "LPA");
  assert.strictEqual(salary.source, "DataScience Jobs dataset");
  assert.strictEqual(salary.formattedAvg, "₹13.53 LPA");
  assert.strictEqual(getCareerSalary("Frontend Developer"), null);

  const exp = getCareerExperience("Data Scientist");
  assert.ok(exp.minExperience > 1.0);
  assert.strictEqual(getCareerExperience("Frontend Developer"), null);
});

test("Stage 3A: Verified dataset role-level average salaries and formatting", () => {
  const verifiedSalaries = [
    { role: "Data Analyst", expectedAvg: 5.71, formatted: "₹5.71 LPA" },
    { role: "Business Analyst", expectedAvg: 8.95, formatted: "₹8.95 LPA" },
    { role: "Senior Data Analyst", expectedAvg: 9.57, formatted: "₹9.57 LPA" },
    { role: "Machine Learning Engineer", expectedAvg: 9.85, formatted: "₹9.85 LPA" },
    { role: "ML Engineer", expectedAvg: 9.85, formatted: "₹9.85 LPA" }, // Alias in careerData
    { role: "Data Engineer", expectedAvg: 11.81, formatted: "₹11.81 LPA" },
    { role: "Senior Business Analyst", expectedAvg: 13.17, formatted: "₹13.17 LPA" },
    { role: "Data Scientist", expectedAvg: 13.53, formatted: "₹13.53 LPA" },
    { role: "Senior Data Engineer", expectedAvg: 19.00, formatted: "₹19.00 LPA" },
    { role: "Senior Data Scientist", expectedAvg: 22.29, formatted: "₹22.29 LPA" },
    { role: "Data Architect", expectedAvg: 25.09, formatted: "₹25.09 LPA" },
  ];

  for (const { role, expectedAvg, formatted } of verifiedSalaries) {
    const marketData = getCareerMarketData(role);
    assert.strictEqual(marketData.available, true);
    assert.ok(marketData.salary, `Salary object should exist for ${role}`);
    assert.strictEqual(marketData.salary.avg, expectedAvg);
    assert.strictEqual(marketData.salary.formattedAvg, formatted);
    assert.strictEqual(marketData.salary.currency, "INR");
    assert.strictEqual(marketData.salary.unit, "LPA");
    assert.strictEqual(marketData.salary.source, "DataScience Jobs dataset");
    assert.ok(marketData.salary.min <= marketData.salary.avg);
    assert.ok(marketData.salary.max >= marketData.salary.avg);
    assert.ok(marketData.salary.formattedRange.includes("₹"));
    assert.ok(marketData.salary.formattedRange.includes("LPA"));
  }
});

test("Stage 3B: Verified dataset role posting volumes, market share, and fallback", () => {
  assert.strictEqual(TOTAL_AGGREGATED_POSTINGS, 93005);

  const verifiedDemands = [
    { role: "Business Analyst", expectedVolume: 32843 },
    { role: "Data Analyst", expectedVolume: 18095 },
    { role: "Senior Business Analyst", expectedVolume: 14115 },
    { role: "Data Scientist", expectedVolume: 9051 },
    { role: "Data Engineer", expectedVolume: 8044 },
    { role: "Senior Data Analyst", expectedVolume: 3825 },
    { role: "Senior Data Engineer", expectedVolume: 3411 },
    { role: "Senior Data Scientist", expectedVolume: 2129 },
    { role: "Machine Learning Engineer", expectedVolume: 964 },
    { role: "ML Engineer", expectedVolume: 964 }, // Alias in careerData
    { role: "Data Architect", expectedVolume: 528 },
  ];

  for (const { role, expectedVolume } of verifiedDemands) {
    const demand = getCareerDemand(role);
    assert.strictEqual(demand.available, true);
    assert.strictEqual(demand.postingVolume, expectedVolume);
    assert.strictEqual(demand.source, "DataScience Jobs dataset");
    assert.strictEqual(demand.interpretation, "Observed aggregated job posting volume");

    // Market share calculation: role posting volume / 93005 * 100
    const expectedShare = Number(((expectedVolume / 93005) * 100).toFixed(2));
    assert.strictEqual(demand.postingShare, expectedShare);
    assert.strictEqual(demand.formattedShare, `${expectedShare}%`);
    assert.strictEqual(demand.formattedVolume, expectedVolume.toLocaleString());

    // Also verify getCareerMarketData connects demand properly
    const marketData = getCareerMarketData(role);
    assert.strictEqual(marketData.available, true);
    assert.strictEqual(marketData.postingVolume, expectedVolume);
    assert.strictEqual(marketData.postingShare, expectedShare);
    assert.strictEqual(marketData.demand.postingVolume, expectedVolume);
    assert.strictEqual(marketData.demand.postingShare, expectedShare);
  }

  // Unsupported careers return available: false with zero fabricated values
  const unsupportedCareers = [
    "Frontend Developer",
    "Backend Developer",
    "Cybersecurity Engineer",
    "UI/UX Designer",
    "Game Developer",
  ];

  for (const role of unsupportedCareers) {
    const demand = getCareerDemand(role);
    assert.strictEqual(demand.available, false);
    assert.strictEqual(demand.postingVolume, null);
    assert.strictEqual(demand.postingShare, null);
    assert.ok(demand.message.includes("Market demand unavailable"));
    assert.ok(demand.message.includes("No direct demand evidence for this role in the supplied datasets."));

    const marketData = getCareerMarketData(role);
    assert.strictEqual(marketData.available, false);
    assert.strictEqual(marketData.demand.available, false);
    assert.strictEqual(marketData.demand.postingVolume, null);
  }
});

test("Top companies, locations, and top skills return empirical rankings", () => {
  const companies = getTopCompanies();
  assert.strictEqual(companies.length, 10);
  assert.strictEqual(companies[0].companyName, "TCS");
  assert.strictEqual(companies[0].jobVolume, 9064);

  const locations = getLocationMarketData();
  assert.strictEqual(locations[0].city, "Bengaluru");
  assert.strictEqual(locations[0].jobCount, 4108);

  const skills = getTopSkills(5);
  assert.strictEqual(skills.length, 5);
  assert.strictEqual(skills[0].skillName, "sql");

  assert.strictEqual(CAREER_TO_DATASET_ROLE_MAP["Data Scientist"], "Data Scientist");
  assert.strictEqual(CAREER_TO_DATASET_ROLE_MAP["Frontend Developer"], null);
});

test("Skill market data returns frequencies and non-causational signals", () => {
  const python = getSkillMarketData("Python");
  assert.strictEqual(python.available, true);
  assert.strictEqual(python.mentionCount, 840);
  assert.strictEqual(python.postingCoverage, 5.3);
  assert.ok(python.marketSignal.includes("Observed in 840 job postings"));
  assert.ok(!python.marketSignal.includes("guarantee"));

  const unknown = getSkillMarketData("NonExistentSkill123");
  assert.strictEqual(unknown.available, false);
});

test("getJDSWeights returns empirical correlation and percentage weights", () => {
  const jds = getJDSWeights();
  assert.strictEqual(jds.normalizedWeights.dashboardAndStorytelling, 0.27);
  assert.strictEqual(jds.normalizedWeights.mathsAndStatistics, 0.26);
  assert.strictEqual(jds.normalizedWeights.coding, 0.22);
  assert.strictEqual(jds.normalizedWeights.aiAndMl, 0.20);
  assert.strictEqual(jds.normalizedWeights.bigData, 0.05);

  const sumWeights = Object.values(jds.normalizedWeights).reduce((a, b) => a + b, 0);
  assert.strictEqual(Math.round(sumWeights * 100) / 100, 1.0);
  assert.ok(jds.metadata.interpretationNote.includes("does not constitute a guaranteed"));
});

test("getAugmentedCareer preserves careerData while attaching market evidence", () => {
  const augmented = getAugmentedCareer("Data Scientist");
  assert.strictEqual(augmented.baseScore, careerData["Data Scientist"].baseScore);
  assert.deepStrictEqual(augmented.skills, careerData["Data Scientist"].skills);
  assert.deepStrictEqual(augmented.roadmap, careerData["Data Scientist"].roadmap);
  assert.strictEqual(augmented.market.available, true);
  assert.strictEqual(augmented.market.postingVolume, 9051);

  const allAugmented = getAllAugmentedCareers();
  assert.strictEqual(Object.keys(allAugmented).length, 20);
  assert.strictEqual(allAugmented["Frontend Developer"].market.available, false);
});

test("Defensive error handling on empty/invalid inputs", () => {
  assert.strictEqual(getCareerMarketData(null).available, false);
  assert.strictEqual(getCareerMarketData(undefined).available, false);
  assert.strictEqual(getCareerMarketData("").available, false);
  assert.strictEqual(getSkillMarketData(null), null);
  assert.strictEqual(getSkillMarketData(""), null);
});
