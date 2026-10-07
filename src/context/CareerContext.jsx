import { useState, useMemo, useEffect, useCallback } from "react";
import {
  CareerContext,
  getInitialProfile,
  defaultProfile,
} from "./CareerContextCore";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export function CareerProvider({ children }) {
  const [profile, setProfileState] = useState(getInitialProfile);
  const role = profile?.role || "Data Analyst";
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [mlProject, setMlProject] = useState(false);
  const [buildRoadmap, setBuildRoadmap] = useState(false);
  const [roadmapProgress, setRoadmapProgress] = useState(() => {
    try {
      const saved = localStorage.getItem("careerRoadmapProgress");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle");

  // Keep setProfile synchronized
  const setProfile = useCallback((updaterOrObj) => {
    setProfileState((prev) => {
      return typeof updaterOrObj === "function" ? updaterOrObj(prev) : updaterOrObj;
    });
  }, []);

  // Load profile and roadmap progress from backend on mount
  useEffect(() => {
    let isMounted = true;

    const loadBackendData = async () => {
      try {
        setIsSyncing(true);
        const res = await fetch(`${backendUrl}/api/profile`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            const hasServerData = Boolean(
              (json.data.name && json.data.name.trim()) ||
              (json.data.skills && (Array.isArray(json.data.skills) ? json.data.skills.length > 0 : json.data.skills.trim())) ||
              (json.data.experience && json.data.experience.trim())
            );

            if (hasServerData) {
              const serverProfile = {
                ...defaultProfile,
                ...json.data,
                skills: Array.isArray(json.data.skills)
                  ? json.data.skills.join(", ")
                  : (typeof json.data.skills === "string" ? json.data.skills : ""),
                role: json.data.role || "Data Analyst",
              };
              setProfileState(serverProfile);
              try {
                localStorage.setItem("careerProfile", JSON.stringify(serverProfile));
              } catch (e) {
                console.error("Error updating localStorage cache:", e);
              }
            }
            setSyncStatus("synced");
          }
        } else {
          if (isMounted) setSyncStatus("offline");
        }
      } catch (err) {
        console.warn("Backend API offline or unreachable, using localStorage fallback:", err);
        if (isMounted) setSyncStatus("offline");
      } finally {
        if (isMounted) setIsSyncing(false);
      }

      // Load roadmap progress
      try {
        const progRes = await fetch(`${backendUrl}/api/roadmap/progress`);
        if (progRes.ok) {
          const progJson = await progRes.json();
          if (progJson.success && Array.isArray(progJson.data) && isMounted) {
            setRoadmapProgress(progJson.data);
            try {
              localStorage.setItem("careerRoadmapProgress", JSON.stringify(progJson.data));
            } catch (e) {
              console.error("Error caching roadmap progress:", e);
            }
          }
        }
      } catch {
        // Backend offline for progress, keep cached state
      }
    };

    loadBackendData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRoleChange = useCallback((newRole) => {
    setProfileState((prev) => {
      const updated = { ...prev, role: newRole };
      try {
        localStorage.setItem("careerProfile", JSON.stringify(updated));
      } catch (err) {
        console.error("Error saving updated profile role to localStorage:", err);
      }
      // Asynchronously sync role change with backend
      fetch(`${backendUrl}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      }).catch(() => {
        // Retain local state if backend unreachable
      });
      return updated;
    });
  }, []);

  const handleSaveProfile = useCallback(async (newProfile) => {
    const profileToSave = newProfile || profile;
    setProfileState(profileToSave);
    // Retain existing navigation and selectedCareer state

    // Immediate offline cache
    try {
      localStorage.setItem("careerProfile", JSON.stringify(profileToSave));
    } catch (err) {
      console.error("Error saving profile to localStorage:", err);
    }

    // Persist to backend
    try {
      setIsSyncing(true);
      const res = await fetch(`${backendUrl}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileToSave),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const serverProfile = {
            ...profileToSave,
            ...json.data,
            skills: typeof json.data.skills === "string"
              ? json.data.skills
              : (json.data.skillsArray?.join(", ") || profileToSave.skills || ""),
          };
          setProfileState(serverProfile);
          try {
            localStorage.setItem("careerProfile", JSON.stringify(serverProfile));
          } catch (e) {
            console.error("Error saving server profile to localStorage:", e);
          }
          setSyncStatus("synced");
          return { success: true, offline: false, profile: serverProfile };
        }
      }

      setSyncStatus("offline");
      return { success: true, offline: true, profile: profileToSave };
    } catch (err) {
      console.warn("Backend unreachable during profile save. Saved to localStorage fallback.", err);
      setSyncStatus("offline");
      return { success: true, offline: true, profile: profileToSave };
    } finally {
      setIsSyncing(false);
    }
  }, [profile]);

  const handleUpdateRoadmapProgress = useCallback(async ({ career, milestoneTitle, status, milestoneType }) => {
    const normalizedCareerId = (career || "").toLowerCase().replace(/\s+/g, "-");
    const now = new Date().toISOString();

    // Optimistic local state update
    setRoadmapProgress((prev) => {
      const existingIndex = prev.findIndex(
        (p) =>
          (p.careerId === normalizedCareerId || p.career?.id === normalizedCareerId || p.career?.title === career) &&
          p.milestoneTitle === milestoneTitle
      );
      let updated;
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          status,
          milestoneType: milestoneType || updated[existingIndex].milestoneType,
          completedAt: status === "COMPLETED" ? now : null,
          updatedAt: now,
        };
      } else {
        updated = [
          ...prev,
          {
            id: `local-${Date.now()}`,
            careerId: normalizedCareerId,
            career: { id: normalizedCareerId, title: career },
            milestoneTitle,
            milestoneType: milestoneType || "SKILL_GAP",
            status,
            completedAt: status === "COMPLETED" ? now : null,
            createdAt: now,
            updatedAt: now,
          },
        ];
      }
      try {
        localStorage.setItem("careerRoadmapProgress", JSON.stringify(updated));
      } catch (e) {
        console.error("Error updating cached roadmap progress:", e);
      }
      return updated;
    });

    // Synchronize with backend
    try {
      const res = await fetch(`${backendUrl}/api/roadmap/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ career, milestoneTitle, status, milestoneType }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setRoadmapProgress((prev) => {
            const filtered = prev.filter(
              (p) =>
                !(
                  (p.careerId === normalizedCareerId || p.career?.id === normalizedCareerId) &&
                  p.milestoneTitle === milestoneTitle
                )
            );
            const next = [json.data, ...filtered];
            try {
              localStorage.setItem("careerRoadmapProgress", JSON.stringify(next));
            } catch (e) {
              console.error("Error updating cached roadmap progress:", e);
            }
            return next;
          });
          return { success: true, offline: false, data: json.data };
        }
      }
    } catch (err) {
      console.warn("Backend unreachable during roadmap progress update. Saved locally only.", err);
    }
    return { success: true, offline: true };
  }, []);

  const effectiveProfile = useMemo(() => {
    return {
      ...profile,
      role: profile?.role || "Data Analyst",
    };
  }, [profile]);

  const handleTriggerRoadmapAnimation = (career) => {
    if (career) {
      setSelectedCareer(career);
    } else if (!selectedCareer) {
      setSelectedCareer("Data Scientist");
    }

    setBuildRoadmap(true);
    setTimeout(() => {
      setBuildRoadmap(false);
    }, 2100);

    const roadmap = document.getElementById("roadmap");
    const transition = document.querySelector(".career-transition");

    if (transition) {
      transition.classList.remove("active");
      requestAnimationFrame(() => {
        transition.classList.add("active");
      });
    }

    if (roadmap) {
      setTimeout(() => {
        roadmap.classList.remove("roadmap-active");
        requestAnimationFrame(() => {
          roadmap.classList.add("roadmap-active");
          roadmap.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          setTimeout(() => {
            roadmap.classList.remove("roadmap-active");
          }, 1200);
        });
      }, 350);
    }
  };

  return (
    <CareerContext.Provider
      value={{
        profile: effectiveProfile,
        setProfile,
        role,
        setRole: handleRoleChange,
        selectedCareer,
        setSelectedCareer,
        mlProject,
        setMlProject,
        buildRoadmap,
        handleSaveProfile,
        handleTriggerRoadmapAnimation,
        roadmapProgress,
        handleUpdateRoadmapProgress,
        isSyncing,
        syncStatus,
      }}
    >
      {children}
    </CareerContext.Provider>
  );
}
