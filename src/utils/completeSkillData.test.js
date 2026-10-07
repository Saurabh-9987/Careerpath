import test from "node:test";
import assert from "node:assert/strict";
import { careerData, availableRoles, careerPaths, skillDescriptions } from "../data/careerData.js";
import * as scoring from "./careerScoring.js";
import * as roadmapModule from "./roadmapProgress.js";

const expectedCareers = [
  "Data Analyst",
  "Data Scientist",
  "Data Engineer",
  "ML Engineer",
  "Software Engineer",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "AI Engineer",
  "NLP Engineer",
  "Computer Vision Engineer",
  "Business Intelligence Analyst",
  "Cloud Engineer",
  "DevOps Engineer",
  "Site Reliability Engineer (SRE)",
  "Cybersecurity Engineer",
  "Security Analyst",
  "UI/UX Designer",
  "Mobile App Developer",
  "Game Developer",
];

test("Every career contains core skills, recommended skills, technical skills, weights, roadmap, and related careers", () => {
  for (const name of expectedCareers) {
    const item = careerData[name];
    assert.ok(item, "Missing career: " + name);

    // 1. Core skills
    assert.ok(Array.isArray(item.skills) && item.skills.length >= 4, name + ": missing core skills array");
    assert.ok(Array.isArray(item.coreSkills) && item.coreSkills.length >= 4, name + ": missing coreSkills array");

    // 2. Recommended skills
    assert.ok(Array.isArray(item.recommendedSkills) && item.recommendedSkills.length >= 4, name + ": missing recommendedSkills array");

    // 3. Technical skills
    assert.ok(Array.isArray(item.technicalSkills) && item.technicalSkills.length >= 5, name + ": missing technicalSkills array");

    // 4. Skill weights
    assert.ok(item.skillWeights && typeof item.skillWeights === "object", name + ": missing skillWeights object");
    const weightsSum = Object.values(item.skillWeights).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(weightsSum - 1.0) < 0.05, name + ": skillWeights sum is not 1.0 (got " + weightsSum + ")");

    // 5. Learning roadmap
    assert.ok(Array.isArray(item.roadmap) && item.roadmap.length >= 3, name + ": missing progressive roadmap array");

    // 6. Related careers
    assert.ok(Array.isArray(item.relatedCareers) && item.relatedCareers.length >= 2, name + ": missing relatedCareers array");

    // Check that every core skill has an informative description
    for (const skill of item.skills) {
      assert.ok(skillDescriptions[skill], name + ": core skill '" + skill + "' lacks description in skillDescriptions");
    }
  }

  assert.equal(availableRoles.length, 20, "availableRoles must contain all 20 careers");
  assert.equal(Object.keys(careerPaths).length, 20, "careerPaths must contain all 20 careers");
});

test("Skill Gap and Roadmap functions execute cleanly for all 20 careers", () => {
  const mockProfile = {
    role: "Data Analyst",
    skills: "Python, SQL, Excel, Statistics",
    education: "BS in Computer Science",
    experience: "Analyst for 2 years",
    projects: "Web scraping and dashboard",
    interests: "Cloud, Web Development, Cyber",
  };

  for (const name of expectedCareers) {
    const matched = scoring.getMatchedSkills(name, mockProfile);
    const missing = scoring.getMissingSkills(name, mockProfile);
    const totalRequired = careerData[name].skills.length;
    assert.equal(matched.length + missing.length, totalRequired, name + " matched + missing must equal total");

    const milestones = roadmapModule.getCanonicalMilestones(name, mockProfile);
    assert.ok(milestones.length > 0, name + " milestones must not be empty");

    const hasDest = milestones.some((m) => m.type === "DESTINATION");
    assert.ok(hasDest, name + " must have destination milestones in stage 03");

    const progress = roadmapModule.calculateCareerProgress(name, mockProfile);
    assert.equal(progress.totalCount, milestones.length, name + " progress totalCount must match milestones length");
  }
});

test("Original 4 careers are preserved exactly", () => {
  const ds = careerData["Data Scientist"];
  assert.equal(ds.skills.join(","), "Python,SQL,Statistics,Machine Learning");
  assert.equal(ds.baseScore, 78);
  assert.equal(ds.time, "4–6 months");

  const de = careerData["Data Engineer"];
  assert.equal(de.skills.join(","), "Python,SQL,Spark,Cloud");
  assert.equal(de.baseScore, 64);
  assert.equal(de.time, "5–7 months");

  const ml = careerData["ML Engineer"];
  assert.equal(ml.skills.join(","), "Python,Machine Learning,Deep Learning,Docker");
  assert.equal(ml.baseScore, 52);
  assert.equal(ml.time, "6–9 months");

  const da = careerData["Data Analyst"];
  assert.equal(da.skills.join(","), "Python,SQL,Excel,Statistics");
  assert.equal(da.baseScore, 82);
  assert.equal(da.time, "3–5 months");
});
