// src/Components/NiceSelect.jsx
import { useEffect, useRef, useState } from "react";

export default function NiceSelect({
  value,
  onChange,
  options = [],
  className = "",
  placeholder = "Избери...",
  disabled = false,              // ← NEW
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selected = options.includes(value) ? value : options[0] ?? "";

  const handleSelect = (opt) => {
    if (disabled) return;        // ← guard
    onChange?.({ target: { value: opt } });
    setOpen(false);
  };

  return (
    <div className={"ns " + className} ref={wrapRef} aria-disabled={disabled}>
      <button
        type="button"
        className={"ns-button" + (disabled ? " disabled" : "")}
        onClick={() => !disabled && setOpen((v) => !v)}  // ← guard
        aria-expanded={open}
        disabled={disabled}                              // ← real disabled
      >
        <span className="ns-label">{selected || placeholder}</span>
        <svg
          className={"ns-caret" + (open ? " up" : "")}
          width="18" height="18" viewBox="0 0 24 24"
        >
          <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open && !disabled && (
        <ul className="ns-list" role="listbox">
          {options.map((opt) => (
            <li
              key={opt}
              role="option"
              aria-selected={opt === value}
              className={"ns-option" + (opt === value ? " is-selected" : "")}
              onClick={() => handleSelect(opt)}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
