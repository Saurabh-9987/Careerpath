import test from "node:test";
import assert from "node:assert/strict";
import {
  getCanonicalMilestones,
  calculateCareerProgress,
} from "./roadmapProgress.js";

const mockProfile = {
  name: "Taylor",
  role: "Data Analyst",
  skills: "Python, SQL, Pandas, Excel, Statistics",
  experience: "1 year analytics",
  education: "BS Statistics",
  projects: "Data cleaning pipeline",
  interests: "Data Science, Machine Learning",
};

test("getCanonicalMilestones generates unique, non-duplicated milestones", () => {
  const milestones = getCanonicalMilestones("Data Scientist", mockProfile, false);
  assert.ok(milestones.length > 0);

  // Check unique titles
  const titles = milestones.map((m) => m.title);
  const uniqueTitles = new Set(titles);
  assert.equal(titles.length, uniqueTitles.size, "Milestones must have unique titles");

  // Check types
  assert.ok(milestones.some((m) => m.type === "SKILL_GAP"));
  assert.ok(milestones.some((m) => m.type === "DESTINATION"));
});

test("calculateCareerProgress accurately computes completion % from completed / total * 100", () => {
  const allMilestones = getCanonicalMilestones("Data Scientist", mockProfile, false);
  const total = allMilestones.length;

  // Empty progress
  const initial = calculateCareerProgress("Data Scientist", mockProfile, false, []);
  assert.equal(initial.totalCount, total);
  assert.equal(initial.completedCount, 0);
  assert.equal(initial.inProgressCount, 0);
  assert.equal(initial.remainingCount, total);
  assert.equal(initial.completionPercent, 0);
  assert.equal(initial.hasStarted, false);
  assert.equal(initial.nextMilestone?.title, allMilestones[0].title);

  // 1 completed milestone
  const firstTitle = allMilestones[0].title;
  const progress1 = [
    {
      careerId: "data-scientist",
      milestoneTitle: firstTitle,
      status: "COMPLETED",
    },
  ];
  const stats1 = calculateCareerProgress("Data Scientist", mockProfile, false, progress1);
  assert.equal(stats1.completedCount, 1);
  assert.equal(stats1.remainingCount, total - 1);
  assert.equal(stats1.completionPercent, Math.round((1 / total) * 100));
  assert.equal(stats1.hasStarted, true);
  assert.equal(stats1.nextMilestone?.title, allMilestones[1].title);

  // All completed
  const allCompleted = allMilestones.map((m) => ({
    careerId: "data-scientist",
    milestoneTitle: m.title,
    status: "COMPLETED",
  }));
  const statsAll = calculateCareerProgress("Data Scientist", mockProfile, false, allCompleted);
  assert.equal(statsAll.completedCount, total);
  assert.equal(statsAll.remainingCount, 0);
  assert.equal(statsAll.completionPercent, 100);
  assert.equal(statsAll.nextMilestone, null);
});

test("calculateCareerProgress keeps progress isolated between different careers", () => {
  const progress = [
    {
      careerId: "data-scientist",
      milestoneTitle: "Learn Machine Learning",
      status: "COMPLETED",
    },
    {
      careerId: "data-engineer",
      milestoneTitle: "Learn Spark",
      status: "COMPLETED",
    },
  ];

  const dsStats = calculateCareerProgress("Data Scientist", mockProfile, false, progress);
  const deStats = calculateCareerProgress("Data Engineer", mockProfile, false, progress);

  assert.equal(
    dsStats.milestones.find((m) => m.title === "Learn Machine Learning")?.status,
    "COMPLETED"
  );
  // Spark completion must not leak into Data Scientist
  assert.equal(
    dsStats.milestones.find((m) => m.title === "Learn Spark"),
    undefined
  );

  assert.equal(
    deStats.milestones.find((m) => m.title === "Learn Apache Spark" || m.title === "Learn Spark")?.status,
    "COMPLETED"
  );
});
