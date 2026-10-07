import { getMissingSkills, getRoadmap } from "./careerScoring.js";

/**
 * Returns the complete list of unique, canonical milestones for a career.
 * Stage 02: Skill Gap milestones ("Learn <Skill>")
 * Stage 03: Destination Capstone/Interview milestones
 */
export function getCanonicalMilestones(careerName, profile, mlProject = false) {
  const missingSkills = getMissingSkills(careerName, profile, mlProject);
  const rawSteps = getRoadmap(careerName, profile, mlProject);

  const milestones = [];

  // Stage 02: Skill Gap Milestones
  missingSkills.forEach((skill) => {
    milestones.push({
      id: `skill-${skill.toLowerCase().replace(/\s+/g, "-")}`,
      title: `Learn ${skill}`,
      skill,
      type: "SKILL_GAP",
      stage: 2,
    });
  });

  // Stage 03: Destination Milestones (filter out any duplicates with skill gaps)
  const destinationSteps = rawSteps.filter(
    (step) => !missingSkills.some((s) => step.title.toLowerCase().includes(s.toLowerCase()))
  );

  destinationSteps.forEach((step, idx) => {
    milestones.push({
      id: `dest-${idx}-${step.title.toLowerCase().replace(/\s+/g, "-")}`,
      title: step.title,
      description: step.description,
      type: "DESTINATION",
      stage: 3,
    });
  });

  return milestones;
}

/**
 * Calculates genuine milestone progress metrics for a career based on saved records.
 * Completion Percentage = (completed milestones / total milestones) * 100
 */
export function calculateCareerProgress(careerName, profile, mlProject = false, roadmapProgress = []) {
  const milestones = getCanonicalMilestones(careerName, profile, mlProject);
  const normalizedCareerId = (careerName || "").toLowerCase().replace(/\s+/g, "-");

  // Lookup saved progress status for this career
  const progressMap = new Map();
  if (Array.isArray(roadmapProgress)) {
    roadmapProgress.forEach((p) => {
      const pCareerId = p.careerId || p.career?.id;
      const pCareerTitle = p.career?.title;
      if (
        pCareerId === normalizedCareerId ||
        pCareerTitle?.toLowerCase() === careerName?.toLowerCase()
      ) {
        progressMap.set(p.milestoneTitle, p.status);
      }
    });
  }

  let completedCount = 0;
  let inProgressCount = 0;
  let nextMilestone = null;

  const enrichedMilestones = milestones.map((m) => {
    const rawStatus = progressMap.get(m.title) || "PENDING";
    let status = "NOT_STARTED";
    if (rawStatus === "COMPLETED") {
      status = "COMPLETED";
    } else if (rawStatus === "IN_PROGRESS") {
      status = "IN_PROGRESS";
    }

    if (status === "COMPLETED") {
      completedCount++;
    } else if (status === "IN_PROGRESS") {
      inProgressCount++;
      if (!nextMilestone) nextMilestone = { ...m, status };
    } else {
      if (!nextMilestone) nextMilestone = { ...m, status };
    }

    return {
      ...m,
      status,
    };
  });

  const totalCount = enrichedMilestones.length;
  const remainingCount = Math.max(0, totalCount - completedCount);
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    careerName,
    milestones: enrichedMilestones,
    totalCount,
    completedCount,
    inProgressCount,
    remainingCount,
    completionPercent,
    nextMilestone,
    hasStarted: completedCount > 0 || inProgressCount > 0,
  };
}
