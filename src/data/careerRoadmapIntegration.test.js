import test from "node:test";
import assert from "node:assert/strict";
import { generateRouteRoadmap } from "./careerRoadmapEngine.js";
import { careerData } from "./careerData.js";
import { calculateCareerProgress } from "../utils/roadmapProgress.js";

test("1. Direct route roadmap: Data Analyst → Data Engineer with 4-phase structure", () => {
  const profile = {
    role: "Data Analyst",
    skills: ["SQL", "Python"],
    experience: "2 years",
  };

  const roadmap = generateRouteRoadmap("Data Analyst", "Data Engineer", profile);

  assert.equal(roadmap.route.routeType, "direct");
  assert.deepEqual(roadmap.route.path, ["Data Analyst", "Data Engineer"]);
  assert.equal(roadmap.route.intermediateMilestone, null);

  // Phase 1: Strengthen Core Skills (SQL, Python)
  assert.equal(roadmap.phases.phase1.number, 1);
  const phase1Skills = roadmap.phases.phase1.items.map((i) => i.skill);
  assert.ok(phase1Skills.includes("SQL"));
  assert.ok(phase1Skills.includes("Python"));
  assert.equal(roadmap.phases.phase1.items[0].status, "VERIFIED_FOUNDATION");

  // Phase 2: Close Target Skill Gaps (Spark, Cloud)
  assert.equal(roadmap.phases.phase2.number, 2);
  const phase2Skills = roadmap.phases.phase2.milestones.map((m) => m.skill);
  assert.ok(phase2Skills.includes("Spark"));
  assert.ok(phase2Skills.includes("Cloud"));
  assert.ok(!phase2Skills.includes("SQL")); // Already satisfied
  assert.ok(!phase2Skills.includes("Python")); // Already satisfied

  // Phase 3: Build Evidence
  assert.equal(roadmap.phases.phase3.number, 3);
  assert.ok(roadmap.phases.phase3.milestones.length >= 1);
  assert.ok(
    roadmap.phases.phase3.milestones.some((m) =>
      m.title.toLowerCase().includes("pipeline") || m.title.toLowerCase().includes("portfolio")
    )
  );

  // Phase 4: Target Role Readiness
  assert.equal(roadmap.phases.phase4.number, 4);
  assert.ok(roadmap.phases.phase4.milestones.length >= 1);
  assert.ok(
    roadmap.phases.phase4.milestones.some((m) =>
      m.title.toLowerCase().includes("interview") || m.title.toLowerCase().includes("prepare")
    )
  );
});

test("2. Intermediate route roadmap: Multi-step transition understands each transition", () => {
  const profile = {
    role: "Software Engineer",
    skills: ["Java", "C++"],
    experience: "2 years",
  };

  // OptimizationMode "Skill Fit" evaluates intermediate pathways
  const roadmap = generateRouteRoadmap("Software Engineer", "Data Scientist", profile, {
    optimizationMode: "Skill Fit",
  });

  // Verify route properties
  assert.ok(roadmap.route.path.length >= 2);
  if (roadmap.route.routeType === "intermediate") {
    assert.equal(roadmap.route.path.length, 3);
    assert.ok(roadmap.route.intermediateMilestone !== null);
    assert.equal(typeof roadmap.route.intermediateMilestone.role, "string");
    assert.ok(Array.isArray(roadmap.route.intermediateMilestone.skillsNeeded));

    // Phase 2 should contain intermediate bridge milestones
    const bridgeMilestones = roadmap.phases.phase2.milestones.filter(
      (m) => m.transitionPhase === "intermediate"
    );
    assert.ok(bridgeMilestones.length > 0);
    assert.ok(bridgeMilestones[0].explanation.includes(roadmap.route.intermediateMilestone.role));
  } else {
    // If direct route is chosen, schema must still be consistent
    assert.equal(roadmap.route.routeType, "direct");
  }
});

test("3. Missing skills: Uses actual catalog skills without inventing requirements", () => {
  const profile = {
    role: "Data Analyst",
    skills: ["Python"],
    experience: "2 years",
  };

  const roadmap = generateRouteRoadmap("Data Analyst", "Data Engineer", profile);
  const phase2Skills = roadmap.phases.phase2.milestones.map((m) => m.skill);
  const canonicalSkills = careerData["Data Engineer"].skills;

  // All Phase 2 skills must strictly exist in Data Engineer catalog definition
  phase2Skills.forEach((skill) => {
    assert.ok(
      canonicalSkills.includes(skill),
      `Skill "${skill}" must exist in canonical Data Engineer catalog definition`
    );
  });

  // Python is already in profile, so it must not be in missing skills
  assert.ok(!phase2Skills.includes("Python"));
  assert.ok(phase2Skills.includes("SQL"));
  assert.ok(phase2Skills.includes("Spark"));
  assert.ok(phase2Skills.includes("Cloud"));
});

test("4. Skill prioritization: Strictly prioritizes by catalog skillWeights descending", () => {
  // Empty profile for Data Engineer
  const emptyProfile = {
    role: "Fresher",
    skills: [],
    experience: "0 years",
  };

  const roadmap = generateRouteRoadmap("Fresher", "Data Engineer", emptyProfile);
  const phase2Milestones = roadmap.phases.phase2.milestones;

  // Data Engineer weights: SQL: 0.30, Python: 0.25, Spark: 0.25, Cloud: 0.20
  const sqlIndex = phase2Milestones.findIndex((m) => m.skill === "SQL");
  const cloudIndex = phase2Milestones.findIndex((m) => m.skill === "Cloud");

  assert.ok(sqlIndex !== -1);
  assert.ok(cloudIndex !== -1);
  assert.ok(
    sqlIndex < cloudIndex,
    `SQL (weight 0.30) must be prioritized before Cloud (weight 0.20)`
  );

  // Weights must be non-increasing
  for (let i = 0; i < phase2Milestones.length - 1; i++) {
    assert.ok(
      phase2Milestones[i].weight >= phase2Milestones[i + 1].weight,
      `Milestone at ${i} (weight ${phase2Milestones[i].weight}) should be >= milestone at ${i + 1} (weight ${phase2Milestones[i + 1].weight})`
    );
  }
});

test("5. Progress persistence: calculateCareerProgress computes genuine metrics from saved records", () => {
  const profile = {
    role: "Data Analyst",
    skills: ["Python", "SQL"],
    experience: "2 years",
  };

  // Base progress with 0 completed
  const initialProgress = calculateCareerProgress("Data Engineer", profile, false, []);
  assert.equal(initialProgress.completedCount, 0);
  assert.equal(initialProgress.completionPercent, 0);
  assert.equal(initialProgress.totalCount, initialProgress.remainingCount);

  // Simulate marking one milestone completed
  const savedRecords = [
    {
      careerId: "data-engineer",
      milestoneTitle: "Learn Spark",
      status: "COMPLETED",
    },
  ];

  const updatedProgress = calculateCareerProgress("Data Engineer", profile, false, savedRecords);
  assert.equal(updatedProgress.completedCount, 1);
  assert.ok(updatedProgress.completionPercent > 0);
  assert.equal(updatedProgress.hasStarted, true);

  // Status on the milestone object itself
  const sparkMilestone = updatedProgress.milestones.find((m) => m.title === "Learn Spark");
  assert.equal(sparkMilestone?.status, "COMPLETED");
});

test("6. Unsupported market role: Returns available: false with zero fabricated values", () => {
  const profile = {
    role: "Data Analyst",
    skills: ["JavaScript", "HTML"],
    experience: "1 year",
  };

  // "Game Developer" is not supported in the hackathon empirical market dataset
  const roadmap = generateRouteRoadmap("Data Analyst", "Game Developer", profile);

  assert.equal(roadmap.marketContext.available, false);
  assert.equal(roadmap.marketContext.demandVolume, null);
  assert.equal(roadmap.marketContext.avgSalary, null);
  assert.equal(roadmap.marketContext.formattedDemand, null);
  assert.equal(roadmap.marketContext.formattedAvgSalary, null);
  assert.equal(roadmap.marketContext.label, "MARKET EVIDENCE");
  assert.ok(roadmap.marketContext.benchmarkNote.includes("unavailable"));
});

test("7. What-If compatibility: Reflects simulated profile non-destructively", () => {
  const storedProfile = {
    role: "Data Analyst",
    skills: ["SQL"],
    experience: "1 year",
  };

  const whatIfScenario = {
    additionalSkills: ["Python", "Spark", "Cloud"],
    additionalExpYears: 2,
  };

  const roadmap = generateRouteRoadmap("Data Analyst", "Data Engineer", storedProfile, {
    whatIfScenario,
  });

  assert.equal(roadmap.isWhatIfActive, true);
  // With SQL, Python, Spark, Cloud added, all core Data Engineer skills are covered
  assert.equal(roadmap.completionState.isCovered, true);
  assert.equal(roadmap.completionState.badgeText, "Core skill requirements covered");

  // Verify stored profile was NOT mutated
  assert.deepEqual(storedProfile.skills, ["SQL"]);
  assert.equal(storedProfile.experience, "1 year");
});

test("8. Completion state: When all core skills satisfied, displays required text and forbids false guarantees", () => {
  const completeProfile = {
    role: "Data Engineer",
    skills: ["SQL", "Python", "Spark", "Cloud"],
    experience: "3 years",
  };

  const roadmap = generateRouteRoadmap("Data Engineer", "Data Engineer", completeProfile);

  assert.equal(roadmap.completionState.isCovered, true);
  assert.equal(roadmap.completionState.badgeText, "Core skill requirements covered");
  assert.equal(roadmap.completionState.headline, "Core skill requirements covered");

  // Check prohibited non-causal claims
  const combinedText = `${roadmap.completionState.headline} ${roadmap.completionState.description} ${roadmap.completionState.guaranteeDisclaimer}`.toLowerCase();
  assert.ok(!combinedText.includes("job guaranteed"), "Must not claim 'Job guaranteed'");
  assert.ok(!combinedText.includes("career guaranteed"), "Must not claim 'Career guaranteed'");
  assert.ok(!combinedText.includes("ready to get hired"), "Must not claim 'Ready to get hired'");
});

test("9. Explainability: Every major step contains factual catalog/engine reasoning", () => {
  const profile = {
    role: "Data Analyst",
    skills: ["SQL"],
    experience: "1 year",
  };

  const roadmap = generateRouteRoadmap("Data Analyst", "Data Engineer", profile);

  // Phase 1 explainability
  assert.ok(roadmap.phases.phase1.items.length > 0);
  roadmap.phases.phase1.items.forEach((item) => {
    assert.ok(item.explanation.includes("Data Engineer"));
    assert.ok(item.explanation.includes("Weight:"));
  });

  // Phase 2 explainability
  assert.ok(roadmap.phases.phase2.milestones.length > 0);
  roadmap.phases.phase2.milestones.forEach((m) => {
    assert.ok(m.explanation.includes("Data Engineer"));
    assert.ok(m.explanation.includes("core skill"));
  });

  // Phase 3 & 4 explainability
  roadmap.phases.phase3.milestones.forEach((m) => {
    assert.ok(m.explanation.includes("portfolio evidence"));
  });
  roadmap.phases.phase4.milestones.forEach((m) => {
    assert.ok(m.explanation.includes("interview readiness"));
  });
});
