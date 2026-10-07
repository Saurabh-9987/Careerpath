import { useCareer } from "../context/CareerContextCore";
import CareerComparison from "../components/CareerComparison";

export default function ComparePage() {
  const { role, profile, mlProject, setSelectedCareer } = useCareer();

  return (
    <div style={{ paddingTop: "20px", paddingBottom: "60px" }}>
      <CareerComparison
        role={role}
        profile={profile}
        mlProject={mlProject}
        onSelectCareer={(career) => setSelectedCareer(career)}
      />
    </div>
  );
}
