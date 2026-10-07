import { getRoadmap } from "../utils/careerScoring";

export default function Roadmap({ selectedCareer, profile, mlProject }) {
  const steps = selectedCareer
    ? getRoadmap(selectedCareer, profile, mlProject)
    : [];

  return (
    <section id="roadmap" className="roadmap roadmap-target">
      <p className="eyebrow">03 — ROADMAP</p>
      <h2>Your Next Steps</h2>

      {selectedCareer ? (
        <div className="roadmap-grid">
          {steps.map((step, index) => (
            <div
              className="roadmap-step roadmap-animate"
              key={step.title}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>

              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="roadmap-empty">
          Select a career path above to generate your roadmap.
        </p>
      )}
    </section>
  );
}
