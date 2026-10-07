import { createContext, useContext } from "react";

export const defaultProfile = {
  name: "",
  role: "Data Analyst",
  email: "",
  phone: "",
  skills: "",
  experience: "",
  education: "",
  projects: "",
  certifications: "",
  interests: "",
  github: "",
  linkedin: "",
  resumeName: "",
  resumeSize: "",
  resumeLastModified: "",
};

export const getInitialProfile = () => {
  try {
    const saved = localStorage.getItem("careerProfile");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return {
          ...defaultProfile,
          ...parsed,
          skills: Array.isArray(parsed.skills)
            ? parsed.skills.join(", ")
            : (typeof parsed.skills === "string" ? parsed.skills : ""),
          role: parsed.role || defaultProfile.role,
        };
      }
    }
  } catch (error) {
    console.error("Error reading careerProfile from localStorage:", error);
  }
  return { ...defaultProfile };
};

export const CareerContext = createContext(null);

export function useCareer() {
  const context = useContext(CareerContext);
  if (!context) {
    throw new Error("useCareer must be used within a CareerProvider");
  }
  return context;
}
