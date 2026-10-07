import { careerData, careerPaths, skillDescriptions } from "../data/careerData.js";

/**
 * Normalizes skill strings for robust, forgiving comparison (e.g. "ml" -> "machine learning").
 */
const SKILL_SYNONYMS = {
  ml: "machine learning",
  "machine learning": "machine learning",
  dl: "deep learning",
  "deep learning": "deep learning",
  nn: "deep learning",
  "neural networks": "deep learning",
  stats: "statistics",
  statistics: "statistics",
  py: "python",
  python: "python",
  sql: "sql",
  spark: "spark",
  pyspark: "spark",
  "apache spark": "spark",
  cloud: "cloud",
  aws: "cloud",
  gcp: "cloud",
  azure: "cloud",
  docker: "docker",
  containers: "docker",
  containerization: "docker",
  kubernetes: "kubernetes",
  k8s: "kubernetes",
  pandas: "pandas",
  numpy: "numpy",
  excel: "excel",
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  reactjs: "react",
  react: "react",
  nodejs: "node.js",
  "node.js": "node.js",
  node: "node.js",
  dsa: "data structures",
  "data structures": "data structures",
  algorithms: "algorithms",
  oop: "oop",
  git: "git",
  linux: "linux",
  figma: "figma",
  unity: "unity",
  cpp: "c++",
  "c++": "c++",
  csharp: "c#",
  "c#": "c#",
  "power bi": "power bi",
  powerbi: "power bi",
  tableau: "tableau",
  llm: "llms",
  llms: "llms",
  nlp: "nlp",
  "natural language processing": "nlp",
  cv: "opencv",
  opencv: "opencv",
  "computer vision": "opencv",
  "rest api": "rest apis",
  "rest apis": "rest apis",
  rest: "rest apis",
  "ci/cd": "ci/cd",
  cicd: "ci/cd",
  "react native": "react native",
  reactnative: "react native",
  html: "html/css",
  css: "html/css",
  "html/css": "html/css",
};

/**
 * Normalizes a single skill string.
 */
export const normalizeSkill = (skill) => {
  if (!skill || typeof skill !== "string") return "";
  const cleaned = skill.trim().toLowerCase();
  return SKILL_SYNONYMS[cleaned] || cleaned;
};

/**
 * Extracts and cleans an array of trimmed skill strings from user profile.
 * Never invents skills if the input is empty or missing.
 */
export const parseProfileSkills = (skillsInput) => {
  if (!skillsInput) return [];
  if (Array.isArray(skillsInput)) {
    return skillsInput
      .map((skill) => (typeof skill === "string" ? skill.trim() : ""))
      .filter(Boolean);
  }
  if (typeof skillsInput !== "string") return [];
  return skillsInput
    .split(/[,;\n]+/)
    .map((skill) => skill.trim())
    .filter(Boolean);
};

/**
 * Convenience helper to extract verified skills array directly from a profile object.
 */
export const getProfileSkills = (profile) => {
  return parseProfileSkills(profile?.skills);
};

/**
 * Checks whether a required career skill is matched by the student's verified skills list.
 */
export const isSkillMatched = (requiredSkill, userSkills = []) => {
  if (!requiredSkill || !Array.isArray(userSkills)) return false;
  const normRequired = normalizeSkill(requiredSkill);

  return userSkills.some((userSkill) => {
    const normUser = normalizeSkill(userSkill);
    if (normUser === normRequired) return true;
    if (normUser.length > 2 && normRequired.includes(normUser)) return true;
    if (normRequired.length > 2 && normUser.includes(normRequired)) return true;
    return false;
  });
};

/**
 * Computes verified skills that match the target career requirements.
 * If mlProject is true and "Machine Learning" is required, it satisfies the ML competency.
 */
export const getMatchedSkills = (careerName, profile, mlProject = false) => {
  const career = careerData[careerName];
  if (!career) return [];

  const userSkills = getProfileSkills(profile);

  return career.skills.filter((skill) => {
    const hasSkill = isSkillMatched(skill, userSkills);
    const satisfiedByMl =
      mlProject && normalizeSkill(skill) === "machine learning";
    return hasSkill || satisfiedByMl;
  });
};

/**
 * Computes missing skills required for target career.
 */
export const getMissingSkills = (careerName, profile, mlProject = false) => {
  const career = careerData[careerName];
  if (!career) return [];

  const matched = getMatchedSkills(careerName, profile, mlProject);
  return career.skills.filter((skill) => !matched.includes(skill));
};

/**
 * Evaluates academic alignment based on user's entered education.
 */
export const evaluateEducationAlignment = (careerName, educationString) => {
  if (!educationString || typeof educationString !== "string") {
    return { points: 0, text: "" };
  }
  const text = educationString.toLowerCase();

  const domainMatches = {
    "Data Scientist": [
      { keywords: ["statistics", "data science", "mathematics", "math", "quantitative"], points: 10, label: "Statistics & Data Science" },
      { keywords: ["computer science", "cs", "informatics", "economics", "physics"], points: 7, label: "Quantitative Science / Computer Science" },
      { keywords: ["engineering", "information technology", "it"], points: 5, label: "Technical Engineering" },
    ],
    "Data Engineer": [
      { keywords: ["computer science", "cs", "software engineering", "computer engineering"], points: 10, label: "Computer Science & Software Systems" },
      { keywords: ["information technology", "it", "systems", "data science"], points: 7, label: "Information Technology & Systems" },
      { keywords: ["electrical engineering", "mathematics", "engineering"], points: 5, label: "Quantitative Engineering" },
    ],
    "ML Engineer": [
      { keywords: ["computer science", "artificial intelligence", "machine learning", "ai", "cs"], points: 10, label: "Computer Science & AI" },
      { keywords: ["software engineering", "data science", "robotics", "mathematics"], points: 7, label: "Software & Applied Mathematics" },
      { keywords: ["engineering", "physics"], points: 5, label: "Engineering & Applied Sciences" },
    ],
  };

  const careerRules = domainMatches[careerName] || domainMatches["Data Scientist"];
  for (const rule of careerRules) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return { points: rule.points, text: rule.label };
    }
  }

  return { points: text.length > 2 ? 3 : 0, text: educationString.trim() };
};

/**
 * Evaluates professional experience & current role proximity.
 */
export const evaluateExperienceAlignment = (careerName, experienceString, currentRole) => {
  let points = 0;
  let text = "";

  // 1. Natural trajectory proximity between roles
  const trajectoryBonus = {
    "Data Analyst": {
      "Data Analyst": 8,
      "Data Scientist": 6,
      "Data Engineer": 5,
      "ML Engineer": 3,
    },
    "Data Scientist": {
      "Data Scientist": 8,
      "ML Engineer": 7,
      "Data Engineer": 6,
      "Data Analyst": 4,
    },
    "Data Engineer": {
      "Data Engineer": 8,
      "Data Scientist": 6,
      "ML Engineer": 5,
      "Data Analyst": 4,
    },
    "ML Engineer": {
      "ML Engineer": 8,
      "Data Scientist": 7,
      "Data Engineer": 6,
      "Data Analyst": 3,
    },
  };

  const roleProximity =
    currentRole === careerName
      ? 8
      : trajectoryBonus[currentRole]?.[careerName] || 3;
  points += roleProximity;

  // 2. Documented practical experience keywords
  if (experienceString && typeof experienceString === "string") {
    const expText = experienceString.toLowerCase();
    const relevantKeywords = [
      "analyst", "analytics", "sql", "python", "pipeline", "etl", "database",
      "model", "data", "engineer", "developer", "intern", "research", "dashboard",
      "cloud", "spark", "machine learning",
    ];

    const matchedExpWords = relevantKeywords.filter((kw) => expText.includes(kw));
    if (matchedExpWords.length > 0) {
      points += Math.min(6, matchedExpWords.length * 2);
      text = experienceString.trim();
    }
  }

  return { points: Math.min(12, points), text };
};

/**
 * Evaluates career interests alignment.
 */
export const evaluateInterestAlignment = (careerName, interestsString) => {
  if (!interestsString || typeof interestsString !== "string") {
    return { points: 0, text: "" };
  }
  const text = interestsString.toLowerCase();

  const domainKeywords = {
    "Data Scientist": ["data science", "machine learning", "statistics", "analytics", "predictive", "modeling", "insights", "research"],
    "Data Engineer": ["big data", "data engineering", "pipeline", "pipelines", "cloud", "etl", "spark", "database", "warehousing", "distributed"],
    "ML Engineer": ["machine learning", "mlops", "deep learning", "ai", "artificial intelligence", "neural", "computer vision", "nlp", "deployment"],
  };

  const keywords = domainKeywords[careerName] || domainKeywords["Data Scientist"];
  const matchedInterests = keywords.filter((kw) => text.includes(kw));

  if (matchedInterests.length >= 2) {
    return { points: 8, text: matchedInterests.slice(0, 2).join(" & ") };
  }
  if (matchedInterests.length === 1) {
    return { points: 5, text: matchedInterests[0] };
  }

  return { points: 0, text: "" };
};

/**
 * Evaluates documented project alignment and What-If ML project boost.
 * Maximum points: 10 (maintains exact 100-point total scale).
 * Prevents double-counting if the ML project already satisfied the "Machine Learning" competency in skillsScore.
 */
export const evaluateProjectAlignment = (
  careerName,
  projectsString,
  mlProject = false,
  mlSkillSatisfiedInSkills = false
) => {
  let points = 0;
  let text = "";

  if (projectsString && typeof projectsString === "string") {
    const pText = projectsString.toLowerCase();
    const projectKeywords = [
      "project",
      "model",
      "pipeline",
      "dashboard",
      "analysis",
      "app",
      "etl",
      "web",
      "api",
    ];
    if (projectKeywords.some((kw) => pText.includes(kw))) {
      points += 4;
      text = projectsString.trim();
    }
  }

  if (mlProject) {
    if (mlSkillSatisfiedInSkills) {
      // The ML project already satisfied the core "Machine Learning" competency in skillsScore (+15 points).
      // Award baseline project credit (at least 4 points) without duplicate boost.
      points = Math.max(points, 4);
    } else {
      // User already had ML competency (or role is Data Engineer where ML is not a core requirement).
      // The ML project contributes applied project alignment.
      const projectBoost = {
        "Data Scientist": 6,
        "ML Engineer": 6,
        "Data Engineer": 3,
      };
      points += projectBoost[careerName] || 0;
    }
  }

  return { points: Math.min(10, points), text };
};

/**
 * Canonical scoring factor weights (total 100 points scale).
 */
export const SCORING_WEIGHTS = {
  skills: 60,
  experience: 12,
  education: 10,
  projects: 10,
  interests: 8,
  total: 100,
};

/**
 * Full multi-factor scoring breakdown (0–100%).
 * Deterministic, explainable, and consistent across all pages.
 */
export const getCareerScoreBreakdown = (
  careerName,
  profile,
  mlProject = false,
  currentRole = null
) => {
  const career = careerData[careerName];
  if (!career) {
    return {
      totalScore: 0,
      skillsScore: 0,
      educationScore: 0,
      experienceScore: 0,
      interestScore: 0,
      projectScore: 0,
      maxPoints: SCORING_WEIGHTS,
      matchedSkills: [],
      missingSkills: [],
      reasons: [],
    };
  }

  const userSkills = getProfileSkills(profile);
  const userHadMlSkill = isSkillMatched("Machine Learning", userSkills);
  const matchedSkills = getMatchedSkills(careerName, profile, mlProject);
  const missingSkills = getMissingSkills(careerName, profile, mlProject);
  const careerRequiresMl = career.skills.some(
    (s) => normalizeSkill(s) === "machine learning"
  );
  const mlSkillSatisfiedInSkills =
    mlProject && careerRequiresMl && !userHadMlSkill;

  // Check if profile actually contains user-entered inputs
  const hasProfileInput =
    userSkills.length > 0 ||
    Boolean(profile?.education?.trim()) ||
    Boolean(profile?.experience?.trim()) ||
    Boolean(profile?.interests?.trim()) ||
    Boolean(profile?.projects?.trim());

  if (!hasProfileInput && !mlProject) {
    return {
      totalScore: 0,
      skillsScore: 0,
      educationScore: 0,
      experienceScore: 0,
      interestScore: 0,
      projectScore: 0,
      maxPoints: SCORING_WEIGHTS,
      matchedSkills: [],
      missingSkills: career.skills,
      reasons: ["No profile information entered yet."],
    };
  }

  // 1. Core Competency Skills Score (up to 60 points)
  const skillsRatio = matchedSkills.length / career.skills.length;
  const skillsScore = Math.round(skillsRatio * 60);

  // 2. Education Alignment (up to 10 points)
  const eduEval = hasProfileInput
    ? evaluateEducationAlignment(careerName, profile?.education)
    : { points: 0, text: "" };

  // 3. Experience & Role Proximity (up to 12 points)
  const effectiveRole = currentRole || profile?.role || "Data Analyst";
  const expEval = hasProfileInput
    ? evaluateExperienceAlignment(
        careerName,
        profile?.experience,
        effectiveRole
      )
    : { points: 0, text: "" };

  // 4. Interests Alignment (up to 8 points)
  const intEval = hasProfileInput
    ? evaluateInterestAlignment(careerName, profile?.interests)
    : { points: 0, text: "" };

  // 5. Hands-on Projects (up to 10 points)
  const projEval = evaluateProjectAlignment(
    careerName,
    profile?.projects,
    mlProject,
    mlSkillSatisfiedInSkills
  );

  // Total Score Calculation (Exact 100-point scale: 60 + 10 + 12 + 8 + 10 = 100)
  let totalScore =
    skillsScore +
    eduEval.points +
    expEval.points +
    intEval.points +
    projEval.points;

  // If user has 0 matched skills, cap the score at 25% so core skills remain primary
  if (matchedSkills.length === 0) {
    totalScore = Math.min(totalScore, 25);
  }

  // Clamped to valid mathematical percentage range: 0% to 100%
  totalScore = Math.max(0, Math.min(totalScore, 100));

  // Construct bulleted evidence reasons
  const reasons = [];
  if (matchedSkills.length > 0) {
    reasons.push(
      `Verified skills: ${matchedSkills.join(", ")} (${matchedSkills.length}/${career.skills.length} core competencies matched).`
    );
  }
  if (eduEval.text && eduEval.points > 0) {
    reasons.push(`Education alignment: Academic foundation in ${eduEval.text}.`);
  }
  if (expEval.text) {
    reasons.push(`Relevant background: Practical experience noted in "${expEval.text}".`);
  }
  if (intEval.text) {
    reasons.push(`Stated career interest in ${intEval.text}.`);
  }
  if (mlProject && careerRequiresMl) {
    if (mlSkillSatisfiedInSkills) {
      reasons.push(
        "Core Machine Learning competency fulfilled via practical What-If ML project simulation."
      );
    } else {
      reasons.push(
        "Practical portfolio alignment boost applied from What-If ML project simulation."
      );
    }
  } else if (mlProject && careerName === "Data Engineer") {
    reasons.push(
      "Technical versatility boost applied from What-If ML project simulation."
    );
  }
  if (missingSkills.length > 0) {
    reasons.push(`Key areas to acquire: ${missingSkills.join(", ")}.`);
  }

  return {
    totalScore,
    skillsScore,
    educationScore: eduEval.points,
    experienceScore: expEval.points,
    interestScore: intEval.points,
    projectScore: projEval.points,
    maxPoints: SCORING_WEIGHTS,
    matchedSkills,
    missingSkills,
    reasons,
  };
};

/**
 * Calculates a match score percentage (0-100%) for a given target career.
 */
export const getScore = (
  careerName,
  profile,
  mlProject = false,
  currentRole = null
) => {
  const breakdown = getCareerScoreBreakdown(
    careerName,
    profile,
    mlProject,
    currentRole
  );
  return breakdown.totalScore;
};

/**
 * Calculates pure skill coverage percentage (0–100%) based on matched required skills.
 */
export const getSkillCoveragePercent = (careerName, profile, mlProject = false) => {
  const career = careerData[careerName];
  if (!career || !career.skills || career.skills.length === 0) return 0;
  const matched = getMatchedSkills(careerName, profile, mlProject);
  return Math.min(100, Math.round((matched.length / career.skills.length) * 100));
};

/**
 * Produces a contextual, evidence-based explanation of why a career fits or has gaps.
 * Transparent, deterministic, and grounded solely in what the student entered.
 */
export const getPathReason = (
  careerName,
  profile,
  mlProject = false,
  currentRole = null
) => {
  const career = careerData[careerName];
  if (!career) return "";

  const breakdown = getCareerScoreBreakdown(
    careerName,
    profile,
    mlProject,
    currentRole
  );
  const { matchedSkills, missingSkills } = breakdown;
  const userSkills = getProfileSkills(profile);

  // Case 1: Empty profile
  if (userSkills.length === 0 && !profile?.education && !profile?.experience && !profile?.interests) {
    return `No verified skills or profile details have been added yet. Add your current skills, education, and interests in My Profile to generate personalized readiness insights for ${careerName}.`;
  }

  // Case 2: No matched skills yet
  if (matchedSkills.length === 0) {
    const baseMsg = `${careerName} requires core competencies in ${career.skills.join(", ")}. None of these are currently verified in your profile.`;
    if (breakdown.educationScore > 0 || breakdown.interestScore > 0) {
      return `${baseMsg} However, your educational background and interests provide an encouraging foundation to start learning.`;
    }
    return `${baseMsg} Begin by adding technical coursework or foundational projects in your profile.`;
  }

  // Case 3: Complete skill match
  if (missingSkills.length === 0) {
    return `Strong competency match! You have verified all ${career.skills.length} core technical requirements for ${careerName} (${matchedSkills.join(", ")}). Focus on portfolio showcase and interview preparation.`;
  }

  // Case 4: Partial match with clear gaps
  let context = `You have verified competency in ${matchedSkills.join(", ")}.`;

  if (breakdown.educationScore >= 7) {
    context += " Your academic background provides strong quantitative support.";
  } else if (breakdown.interestScore > 0) {
    context += " This trajectory directly aligns with your stated career interests.";
  }

  context += ` To bridge the gap to ${careerName}, your primary focus should be acquiring ${missingSkills.join(", ")}.`;

  return context;
};

/**
 * Returns all careers ranked by recommendation match score with full breakdown.
 */
export const getCareerRecommendations = (profile, mlProject = false, currentRole = null) => {
  const candidateCareers = currentRole && careerPaths[currentRole]
    ? careerPaths[currentRole]
    : Object.keys(careerData);

  const recommendations = candidateCareers.map((careerName) => {
    const breakdown = getCareerScoreBreakdown(careerName, profile, mlProject);
    const info = careerData[careerName] || {};
    return {
      career: careerName,
      score: breakdown.totalScore,
      time: info.time || "4–6 months",
      skills: info.skills || [],
      matchedSkills: breakdown.matchedSkills,
      missingSkills: breakdown.missingSkills,
      reasons: breakdown.reasons,
      breakdown,
    };
  });

  return recommendations.sort((a, b) => b.score - a.score);
};

/**
 * Generates an ordered milestone roadmap for the selected career path.
 */
export const getRoadmap = (careerName, profile, mlProject = false) => {
  const missingSkills = getMissingSkills(careerName, profile, mlProject);
  const roadmap = [];

  missingSkills.forEach((skill) => {
    if (skill === "Machine Learning") {
      roadmap.push({
        title: "Learn Machine Learning",
        description:
          "Study supervised learning, unsupervised learning, model evaluation, and feature engineering.",
      });
    }

    if (skill === "Spark") {
      roadmap.push({
        title: "Learn Apache Spark",
        description:
          "Learn distributed data processing, Spark DataFrames, and practical data transformation.",
      });
    }

    if (skill === "Cloud") {
      roadmap.push({
        title: "Learn Cloud Platforms",
        description:
          "Learn cloud storage, compute, databases, and managed data services.",
      });
    }

    if (skill === "Deep Learning") {
      roadmap.push({
        title: "Learn Deep Learning",
        description:
          "Study neural networks, CNNs, and practical deep learning workflows.",
      });
    }

    if (skill === "Docker") {
      roadmap.push({
        title: "Learn Docker",
        description:
          "Learn how to containerize and run machine learning applications with reproducible environments.",
      });
    }

    if (skill === "Python") {
      roadmap.push({
        title: "Learn Python Foundations",
        description:
          "Master core data structures, analytical libraries, and clean scripting practices.",
      });
    }

    if (skill === "SQL") {
      roadmap.push({
        title: "Master SQL & Databases",
        description:
          "Practice complex relational queries, joins, aggregations, and window functions.",
      });
    }

    if (skill === "Statistics") {
      roadmap.push({
        title: "Study Statistical Analysis",
        description:
          "Cover probability distributions, hypothesis testing, and quantitative data exploration.",
      });
    }

    if (
      ![
        "Machine Learning",
        "Spark",
        "Cloud",
        "Deep Learning",
        "Docker",
        "Python",
        "SQL",
        "Statistics",
      ].includes(skill)
    ) {
      roadmap.push({
        title: `Learn ${skill}`,
        description:
          skillDescriptions[skill] ||
          `Master core concepts, practical techniques, and best practices in ${skill}.`,
      });
    }
  });

  if (careerName === "Data Scientist") {
    roadmap.push({
      title: mlProject ? "Build ML Project" : "Build Data Science Project",
      description: mlProject
        ? "Build a practical machine learning project using real data and document the results."
        : "Build a data science project using Python, SQL, statistics, and exploratory data analysis.",
    });

    roadmap.push({
      title: "Build Your Portfolio",
      description:
        "Organize your strongest data science projects and showcase your analytical methodology.",
    });

    roadmap.push({
      title: "Prepare for Data Science Interviews",
      description:
        "Practice statistics, SQL, Python, machine learning concepts, and behavioral project walkthroughs.",
    });
  } else if (careerName === "Data Engineer") {
    roadmap.push({
      title: "Build a Data Pipeline",
      description:
        "Create a practical pipeline that collects, transforms, stores, and processes data.",
    });

    roadmap.push({
      title: "Build Your Portfolio",
      description:
        "Showcase your data pipelines, SQL work, Spark jobs, and cloud data architecture.",
    });

    roadmap.push({
      title: "Prepare for Data Engineering Interviews",
      description:
        "Practice SQL, databases, distributed systems, Spark, cloud architecture, and data modeling.",
    });
  } else if (careerName === "ML Engineer") {
    roadmap.push({
      title: "Build ML Engineering Project",
      description:
        "Create an end-to-end machine learning project from data ingestion to model serving.",
    });

    roadmap.push({
      title: "Learn Model Deployment & Serving",
      description:
        "Build REST APIs, containerize models with Docker, and learn production inference concepts.",
    });

    roadmap.push({
      title: "Build Your Portfolio",
      description:
        "Showcase machine learning, deep learning, deployment pipelines, and engineering best practices.",
    });

    roadmap.push({
      title: "Prepare for ML Engineering Interviews",
      description:
        "Practice machine learning algorithms, deep learning, Python, system design, and MLOps.",
    });
  } else {
    roadmap.push({
      title: `Build ${careerName} Portfolio Project`,
      description: `Create a portfolio project demonstrating practical end-to-end competency in ${careerName} workflows and tools.`,
    });

    roadmap.push({
      title: "Build Your Portfolio",
      description: `Organize your strongest ${careerName} projects, code repositories, and technical contributions.`,
    });

    roadmap.push({
      title: `Prepare for ${careerName} Interviews`,
      description: `Practice technical challenges, system design, and role-specific interview questions for ${careerName}.`,
    });
  }

  return roadmap;
};
