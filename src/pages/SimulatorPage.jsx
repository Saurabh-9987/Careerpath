import { useNavigate } from "react-router-dom";
import { useCareer } from "../context/CareerContextCore";
import Simulator from "../components/Simulator";

export default function SimulatorPage() {
  const navigate = useNavigate();
  const {
    role,
    setRole,
    profile,
    selectedCareer,
    setSelectedCareer,
    mlProject,
    setMlProject,
    handleTriggerRoadmapAnimation,
  } = useCareer();

  const handleBuildRoadmap = () => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      navigate("/roadmap");
      return;
    }

    if (handleTriggerRoadmapAnimation) {
      handleTriggerRoadmapAnimation(selectedCareer);
    }

    setTimeout(() => {
      navigate("/roadmap");
    }, 550);
  };

  return (
    <div style={{ paddingTop: "20px" }}>
      <Simulator
        role={role}
        onRoleChange={setRole}
        profile={profile}
        selectedCareer={selectedCareer}
        onCareerSelect={(career) => setSelectedCareer(career)}
        mlProject={mlProject}
        onToggleMlProject={() => setMlProject((prev) => !prev)}
        onBuildRoadmap={handleBuildRoadmap}
      />
    </div>
  );
}
