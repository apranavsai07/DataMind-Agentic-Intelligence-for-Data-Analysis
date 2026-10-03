import { useState } from "react";
import "./LineSidebar.css";

export default function LineSidebar({
  items = [],
  activeIndex = 0,
  onChange,
}) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const displayIndex =
    hoverIndex !== null
      ? hoverIndex
      : activeIndex;

  return (
    <nav className="line-sidebar line-sidebar--markers line-sidebar--scale-tick">
      <ul className="line-sidebar__list">

        {items.map((item, index) => {
          const isActive = index === activeIndex;
          const isHovered = index === hoverIndex;

          const distance = Math.abs(
            displayIndex - index
          );

          const effect =
            distance === 0
              ? 1
              : distance === 1
              ? 0.45
              : 0;

          return (
            <li
              key={item.id}
              className={`line-sidebar__item ${
                isActive
                  ? "is-active"
                  : ""
              }`}
              style={{
                "--effect": effect,
              }}
              onMouseEnter={() => {
                setHoverIndex(index);
                onChange?.(index);
              }}
              onMouseLeave={() => {
                setHoverIndex(null);
              }}
              onClick={() => {
                onChange?.(index);
              }}
            >
              <span className="line-sidebar__label">

                <span className="line-sidebar__index">
                  {item.number}
                </span>

                <span className="line-sidebar__text">
                  {item.label}
                </span>

              </span>

              <span className="line-sidebar__marker" />
            </li>
          );
        })}

      </ul>
    </nav>
  );
}