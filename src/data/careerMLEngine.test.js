import test from "node:test";
import assert from "node:assert/strict";

import {
  getModelRegistry,
  getMLTrainingSummary,
  predictJuniorSalaryHike,
  predictSeniorLeadershipSuccess,
  predictMarketSalary,
  getMarketSkillArchetypes,
} from "./careerMLEngine.js";

test("1. Model Registry returns all 5 trained models with artifacts", () => {
  const registry = getModelRegistry();
  assert.ok(registry);
  assert.equal(registry.version, "1.0.0");
  assert.ok(Array.isArray(registry.models));
  assert.equal(registry.models.length, 5);

  const modelNames = registry.models.map((m) => m.name);
  assert.ok(modelNames.includes("jds_skill_outcome_model"));
  assert.ok(modelNames.includes("sds_personality_outcome_model"));
  assert.ok(modelNames.includes("ds_salary_regressor"));
  assert.ok(modelNames.includes("analytics_salary_tier_classifier"));
  assert.ok(modelNames.includes("market_skill_cluster_model"));

  registry.models.forEach((m) => {
    assert.ok(m.artifact.endsWith(".joblib"));
    assert.ok(m.training_rows > 0);
  });
});

test("2. ML Training Summary reflects all four hackathon datasets", () => {
  const summary = getMLTrainingSummary();
  assert.ok(summary);
  assert.equal(summary.models_trained_count, 5);
  assert.equal(summary.datasets_used.length, 4);
  assert.ok(summary.datasets_used.includes("DataScience Jobs.csv"));
  assert.ok(summary.datasets_used.includes("Analytics Jobs.csv"));
  assert.ok(summary.datasets_used.includes("JDS Skill Traits.xlsx"));
  assert.ok(summary.datasets_used.includes("SDS Personality Traits.xlsx"));
});

test("3. JDS Junior Technical Skill prediction responds correctly to high vs low skills", () => {
  // High skills (top ratings 5.0)
  const highResult = predictJuniorSalaryHike({
    mathsStats: 5.0,
    dashboard: 5.0,
    coding: 5.0,
    aiMl: 5.0,
    bigData: 4.5,
  });
  assert.equal(highResult.source, "MODEL PREDICTION");
  assert.equal(highResult.predictedClass, 1);
  assert.ok(highResult.probability > 0.7);
  assert.equal(highResult.outcomeLabel, "High Salary Hike");
  assert.ok(highResult.cvAccuracy > 0.85);
  assert.ok(highResult.cvRocAuc > 0.88);

  // Low skills (low ratings 2.0)
  const lowResult = predictJuniorSalaryHike({
    mathsStats: 2.0,
    dashboard: 2.0,
    coding: 2.0,
    aiMl: 2.0,
    bigData: 2.0,
  });
  assert.equal(lowResult.predictedClass, 0);
  assert.ok(lowResult.probability < 0.3);
  assert.equal(lowResult.outcomeLabel, "Standard / Baseline Salary Hike");
});

test("4. SDS Senior Personality prediction responds correctly to trait profiles", () => {
  // High Conscientiousness + Openness
  const executiveProfile = predictSeniorLeadershipSuccess({
    conscientiousness: 60,
    openness_to_experience: 55,
    neuroticism: 25,
    extraversion: 45,
    agreeableness: 45,
  });
  assert.equal(executiveProfile.source, "MODEL PREDICTION");
  assert.equal(executiveProfile.predictedClass, 1);
  assert.ok(executiveProfile.probability > 0.8);
  assert.equal(executiveProfile.outcomeLabel, "High Leadership Success");
  assert.ok(executiveProfile.cvAccuracy > 0.90);
  assert.ok(executiveProfile.cvRocAuc > 0.95);

  // High Neuroticism, Low Conscientiousness
  const lowProfile = predictSeniorLeadershipSuccess({
    conscientiousness: 25,
    openness_to_experience: 30,
    neuroticism: 60,
    extraversion: 35,
    agreeableness: 45,
  });
  assert.equal(lowProfile.predictedClass, 0);
  assert.ok(lowProfile.probability < 0.2);
});

test("5. DataScience Jobs Salary Regression estimates plausible market salaries", () => {
  const dsPred = predictMarketSalary(4, "Data Scientist");
  assert.equal(dsPred.available, true);
  assert.equal(dsPred.source, "MODEL PREDICTION");
  assert.ok(dsPred.predictedSalaryLPA > 13.0);
  assert.ok(dsPred.predictedSalaryLPA < 25.0);
  assert.ok(dsPred.cvR2 > 0.5);

  const unsupportedPred = predictMarketSalary(3, "Frontend Developer");
  assert.equal(unsupportedPred.available, false);
  assert.equal(unsupportedPred.predictedSalaryLPA, null);
});

test("6. Market Skill Archetypes returns 6 KMeans clusters from Analytics Jobs", () => {
  const archetypes = getMarketSkillArchetypes();
  assert.ok(Array.isArray(archetypes));
  assert.equal(archetypes.length, 6);

  archetypes.forEach((cluster) => {
    assert.ok(cluster.size > 0);
    assert.ok(cluster.percentage > 0);
    assert.ok(Array.isArray(cluster.top_skills_and_terms));
    assert.ok(cluster.top_skills_and_terms.length > 0);
    assert.ok(cluster.dominant_salary_tier);
  });
});

test("7. ML Engine function aliases match specified interfaces", async () => {
  const { predictJdsOutcome, predictSdsOutcome, predictSalary } = await import("./careerMLEngine.js");
  assert.equal(typeof predictJdsOutcome, "function");
  assert.equal(typeof predictSdsOutcome, "function");
  assert.equal(typeof predictSalary, "function");

  const jdsRes = predictJdsOutcome({ mathsStats: 4.5, coding: 4.0 });
  assert.ok(jdsRes.probability >= 0 && jdsRes.probability <= 1);

  const salRes = predictSalary(2, "Data Scientist");
  assert.equal(salRes.source, "MODEL PREDICTION");
  assert.ok(salRes.predictedSalaryLPA > 0);
});

test("8. parseProfileExperience handles missing, Fresher, 0 years, and numeric values deterministically", async () => {
  const { parseProfileExperience } = await import("./careerMLEngine.js");

  // Missing experience
  assert.equal(parseProfileExperience(undefined).available, false);
  assert.equal(parseProfileExperience(null).available, false);
  assert.equal(parseProfileExperience("").available, false);
  assert.equal(parseProfileExperience("   ").available, false);
  assert.match(parseProfileExperience(undefined).message, /Add your experience/);

  // Ambiguous title without explicit experience
  assert.equal(parseProfileExperience("Senior Data Scientist").available, false);
  assert.equal(parseProfileExperience("Intermediate Developer").available, false);

  // Invalid / negative
  assert.equal(parseProfileExperience(-1).available, false);

  // Fresher
  const fresher1 = parseProfileExperience("Fresher");
  assert.equal(fresher1.available, true);
  assert.equal(fresher1.experienceYears, 0);
  assert.equal(fresher1.source, "USER-PROVIDED DATA");

  const fresher2 = parseProfileExperience("fresher");
  assert.equal(fresher2.available, true);
  assert.equal(fresher2.experienceYears, 0);

  const entryLevel = parseProfileExperience("entry-level");
  assert.equal(entryLevel.available, true);
  assert.equal(entryLevel.experienceYears, 0);

  // 0 years
  const zeroYears1 = parseProfileExperience("0 years");
  assert.equal(zeroYears1.available, true);
  assert.equal(zeroYears1.experienceYears, 0);

  const zeroYears2 = parseProfileExperience("0");
  assert.equal(zeroYears2.available, true);
  assert.equal(zeroYears2.experienceYears, 0);

  const zeroNumeric = parseProfileExperience(0);
  assert.equal(zeroNumeric.available, true);
  assert.equal(zeroNumeric.experienceYears, 0);

  // Valid numeric experience
  const threeYears = parseProfileExperience("3 years");
  assert.equal(threeYears.available, true);
  assert.equal(threeYears.experienceYears, 3);

  const decimalYears = parseProfileExperience("2.5 years");
  assert.equal(decimalYears.available, true);
  assert.equal(decimalYears.experienceYears, 2.5);

  const numericProp = parseProfileExperience(4);
  assert.equal(numericProp.available, true);
  assert.equal(numericProp.experienceYears, 4);
});

test("9. mapProfileToJdsScores reliably maps user skills to 5 dimensions and handles unverified skills", async () => {
  const { mapProfileToJdsScores } = await import("./careerMLEngine.js");

  // Valid profile with technical skills
  const profileWithSkills = {
    skills: "Python, SQL, Statistics, Machine Learning, Tableau",
  };
  const result = mapProfileToJdsScores(profileWithSkills);
  assert.equal(result.sufficientData, true);
  assert.equal(result.source, "PROFILE-DERIVED FEATURE");
  assert.ok(result.totalMatchedSkills > 0);
  assert.ok(result.scores.coding_skills >= 4.0);
  assert.ok(result.scores["maths-stats_skills"] >= 3.0);
  assert.ok(result.scores.ai_and_ml_skills >= 3.0);
  assert.ok(result.scores.dashboard_and_storytelling_skills >= 3.0);

  // Empty skills
  const emptyProfile = { skills: "" };
  const emptyResult = mapProfileToJdsScores(emptyProfile);
  assert.equal(emptyResult.sufficientData, false);
  assert.equal(emptyResult.scores, null);
  assert.match(emptyResult.message, /Insufficient profile data/);

  // Non-matching / non-technical skills (no fabricated competency)
  const nonTechProfile = { skills: "guitar, culinary arts, creative writing" };
  const nonTechResult = mapProfileToJdsScores(nonTechProfile);
  assert.equal(nonTechResult.sufficientData, false);
  assert.equal(nonTechResult.scores, null);
  assert.equal(nonTechResult.totalMatchedSkills, 0);
  assert.match(nonTechResult.message, /No verified matching technical skills/);
});

test("10. mapProfileToPersonality requires complete Big Five data and never fabricates traits", async () => {
  const { mapProfileToPersonality } = await import("./careerMLEngine.js");

  // Missing personality
  const noTraits = { name: "Alice", skills: "Python" };
  const res1 = mapProfileToPersonality(noTraits);
  assert.equal(res1.available, false);
  assert.equal(res1.scores, null);
  assert.match(res1.message, /Personality assessment not completed/);

  // Incomplete traits
  const incomplete = {
    personality: { neuroticism: 30, extraversion: 40 },
  };
  const resIncomplete = mapProfileToPersonality(incomplete);
  assert.equal(resIncomplete.available, false);
  assert.match(resIncomplete.message, /Incomplete personality traits/);

  // Valid complete personality
  const withTraits = {
    personality: {
      neuroticism: 30,
      extraversion: 45,
      openness: 50,
      agreeableness: 55,
      conscientiousness: 60,
    },
  };
  const res2 = mapProfileToPersonality(withTraits);
  assert.equal(res2.available, true);
  assert.equal(res2.source, "USER-PROVIDED DATA");
  assert.equal(res2.scores.conscientiousness, 60);
});

test("11. getDashboardMlInsights strictly handles missing vs complete profiles without assumptions", async () => {
  const { getDashboardMlInsights } = await import("./careerMLEngine.js");

  // 1. Missing experience profile: predictSalary must NOT be called
  const noExpProfile = {
    skills: "Python, SQL, Machine Learning",
  };
  const noExpInsights = getDashboardMlInsights(noExpProfile, "Data Scientist");
  assert.equal(noExpInsights.salaryEstimate.available, false);
  assert.match(noExpInsights.salaryEstimate.message, /Add your experience in My Profile/);
  assert.equal(noExpInsights.technicalSignal.available, true); // skills present
  assert.equal(noExpInsights.personalitySignal.available, false); // personality absent

  // 2. Fresher profile (0 experience)
  const fresherProfile = {
    experience: "Fresher",
    skills: "Python, SQL",
  };
  const fresherInsights = getDashboardMlInsights(fresherProfile, "Data Analyst");
  assert.equal(fresherInsights.salaryEstimate.available, true);
  assert.equal(fresherInsights.salaryEstimate.inputExperience, 0);
  assert.equal(fresherInsights.salaryEstimate.inputExperienceSource, "USER-PROVIDED DATA");
  assert.ok(fresherInsights.salaryEstimate.predictedSalaryLPA > 0);

  // 3. 0 years profile
  const zeroYearsProfile = {
    experience: "0 years",
    skills: "Tableau, SQL, Excel",
  };
  const zeroYearsInsights = getDashboardMlInsights(zeroYearsProfile, "Business Analyst");
  assert.equal(zeroYearsInsights.salaryEstimate.available, true);
  assert.equal(zeroYearsInsights.salaryEstimate.inputExperience, 0);

  // 4. Completely empty profile
  const blankInsights = getDashboardMlInsights({}, "Data Analyst");
  assert.equal(blankInsights.technicalSignal.available, false);
  assert.match(blankInsights.technicalSignal.message, /Insufficient/);
  assert.equal(blankInsights.salaryEstimate.available, false); // NO ASSUMED 1 YEAR!
  assert.match(blankInsights.salaryEstimate.message, /Add your experience/);
  assert.equal(blankInsights.personalitySignal.available, false);

  // 5. Complete profile with experience, skills, and personality
  const fullProfile = {
    name: "Alex",
    experience: "3 years",
    skills: "Python, SQL, Statistics, Deep Learning, Power BI",
    personality: {
      neuroticism: 25,
      extraversion: 50,
      openness: 60,
      agreeableness: 55,
      conscientiousness: 65,
    },
  };
  const fullInsights = getDashboardMlInsights(fullProfile, "Data Scientist");
  assert.equal(fullInsights.technicalSignal.available, true);
  assert.equal(fullInsights.technicalSignal.source, "MODEL PREDICTION");
  assert.equal(fullInsights.technicalSignal.featureDerivation, "PROFILE-DERIVED FEATURE");

  assert.equal(fullInsights.salaryEstimate.available, true);
  assert.equal(fullInsights.salaryEstimate.source, "MODEL PREDICTION");
  assert.equal(fullInsights.salaryEstimate.inputExperienceSource, "USER-PROVIDED DATA");
  assert.equal(fullInsights.salaryEstimate.inputExperience, 3);

  assert.equal(fullInsights.personalitySignal.available, true);
  assert.equal(fullInsights.personalitySignal.source, "MODEL PREDICTION");
  assert.equal(fullInsights.personalitySignal.traitsSource, "USER-PROVIDED DATA");
});

