import { parseProfileSkills } from "../utils/careerScoring";

export default function Hero({ role, profileSkills, onSimulateCareer }) {
  const displayedSkills = parseProfileSkills(profileSkills);

  const handleSimulateClick = () => {
    if (onSimulateCareer) {
      onSimulateCareer();
      return;
    }

    const roadmap = document.getElementById("roadmap");
    const transition = document.querySelector(".career-transition");

    if (!roadmap || !transition) return;

    transition.classList.remove("active");

    requestAnimationFrame(() => {
      transition.classList.add("active");

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
    });
  };

  return (
    <section className="hero">
      <div>
        <p className="eyebrow">
          CAREER TRAJECTORY SIMULATOR
        </p>

        <h1>
          Don't just find your next job.
          <span> Build your next path.</span>
        </h1>

        <p className="hero-text">
          Explore career routes, discover missing skills,
          and simulate how your next experience can open
          new pathways.
        </p>

        <button
          className="primary-button"
          onClick={handleSimulateClick}
        >
          Simulate My Career →
        </button>
      </div>

      <div className="hero-card">
        <p className="card-label">CURRENT POSITION</p>

        <h2>{role}</h2>

        <div className="skill-list">
          {displayedSkills.length > 0 ? (
            displayedSkills.map((skill) => (
              <span key={skill}>✓ {skill}</span>
            ))
          ) : (
            <p style={{ color: "#64748B", fontSize: "13px", fontStyle: "italic", margin: "8px 0" }}>
              No verified skills saved in profile yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
