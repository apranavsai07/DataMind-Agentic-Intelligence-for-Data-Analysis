import { useEffect, useState } from "react";
import "./LatticeLoader.css";

export default function LatticeLoader({
  status = "working",
  label = "Thinking",
  doneLabel = "Done in",
  errorLabel = "Failed after",
  pattern = "orbit",
  grid = 3,
  shape = "round",
  doneColor = "#22c55e",
  errorColor = "#ef4444",
  cellSize = 6,
  gap = 2,
  fontSize = 14,
  step = 90,
  idleOpacity = 0.15,
  glow = false,
  glowColor = "",
  showTimer = true,
  color = "#f5f5f5",
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== "working") return undefined;

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);

    return () => window.clearInterval(timer);
  }, [status]);

  const size = Math.max(1, Number(grid) || 3);
  const cells = Array.from({ length: size * size }, (_, index) => {
    const row = Math.floor(index / size);
    const col = index % size;
    const center = (size - 1) / 2;
    const distance = Math.hypot(row - center, col - center);
    const delayIndex =
      pattern === "orbit"
        ? (Math.atan2(row - center, col - center) + Math.PI) /
          (2 * Math.PI) *
          size * size
        : index;

    return {
      index,
      row,
      col,
      distance,
      delay: `${(delayIndex * Number(step || 90)) / 1000}s`,
    };
  });

  const isDone = status === "done";
  const isError = status === "error";
  const statusColor = isDone
    ? doneColor
    : isError
      ? errorColor
      : color;

  const formattedTime =
    elapsed < 60
      ? `${elapsed}s`
      : `${Math.floor(elapsed / 60)}m ${String(elapsed % 60).padStart(2, "0")}s`;

  return (
    <div
      className={`lattice-loader lattice-loader--${status}`}
      style={{
        "--ll-color": statusColor,
        "--ll-done-color": doneColor,
        "--ll-error-color": errorColor,
        "--ll-cell-size": `${cellSize}px`,
        "--ll-gap": `${gap}px`,
        "--ll-font-size": `${fontSize}px`,
        "--ll-idle-opacity": idleOpacity,
        "--ll-glow-color": glowColor || statusColor,
        "--ll-shape": shape === "round" ? "50%" : "2px",
      }}
      role="status"
      aria-live="polite"
      aria-label={
        isDone
          ? `${doneLabel} ${formattedTime}`
          : isError
            ? `${errorLabel} ${formattedTime}`
            : label
      }
    >
      <div
        className={`lattice-loader__grid lattice-loader__grid--${pattern}`}
        style={{
          gridTemplateColumns: `repeat(${size}, var(--ll-cell-size))`,
          gap: "var(--ll-gap)",
        }}
        aria-hidden="true"
      >
        {cells.map((cell) => (
          <span
            key={cell.index}
            className="lattice-loader__cell"
            style={{
              animationDelay: cell.delay,
              opacity: isDone || isError ? 1 : undefined,
              transform:
                pattern === "orbit"
                  ? `scale(${1 - Math.min(cell.distance, size) * 0.025})`
                  : undefined,
            }}
          />
        ))}
      </div>

      <div className="lattice-loader__text">
        <span className="lattice-loader__label">
          {isDone
            ? `${doneLabel} ${formattedTime}`
            : isError
              ? `${errorLabel} ${formattedTime}`
              : label}
        </span>
        {showTimer && status === "working" && (
          <span className="lattice-loader__timer">{formattedTime}</span>
        )}
      </div>
    </div>
  );
}
