import { Outlet, useLocation } from "react-router-dom";
import CareerScene from "../CareerScene";
import Navbar from "./Navbar";
import { useCareer } from "../context/CareerContextCore";

export default function Layout() {
  const location = useLocation();
  const {
    role,
    selectedCareer,
    setSelectedCareer,
    buildRoadmap,
    profile,
    mlProject,
    handleTriggerRoadmapAnimation,
  } = useCareer();
  const isLanding = location.pathname === "/";
  const isAuth = location.pathname === "/auth";

  return (
    <div className={`app ${isLanding ? "vesper-landing-layout" : "workspace-layout"}`}>
      <div className="career-transition"></div>

      {!isLanding && (
        <>
          <div className="workspace-ambient-glow" aria-hidden="true" />
          <div className="workspace-ambient-grid" aria-hidden="true" />
        </>
      )}

      <Navbar isLanding={isLanding} />

      {!isLanding && !isAuth && (
        <CareerScene
          role={role}
          selectedCareer={selectedCareer}
          onCareerSelect={(career) => setSelectedCareer(career)}
          buildRoadmap={buildRoadmap}
          profile={profile}
          mlProject={mlProject}
          handleTriggerRoadmapAnimation={handleTriggerRoadmapAnimation}
        />
      )}

      <main className={isLanding ? "landing-main" : "workspace-main"}>
        {isLanding ? (
          <Outlet />
        ) : (
          <div key={location.pathname} className="route-enter">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}
