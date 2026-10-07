export default function GlowSeparator({ className = "", style = {} }) {
  return (
    <div
      className={`hero13-glow-separator ${className}`}
      style={style}
      aria-hidden="true"
    >
      <div className="glow-separator-blur" />
      <div className="glow-separator-line" />
      <div className="glow-separator-node">
        <span className="glow-node-dot" />
      </div>
    </div>
  );
}
