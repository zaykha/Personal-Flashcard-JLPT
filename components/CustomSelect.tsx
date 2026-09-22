"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
}

export function CustomSelect({
  value,
  options,
  onChange,
  ariaLabel,
  disabled = false,
  className = "",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selected = options[selectedIndex];

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  function showMenu() {
    if (disabled) return;
    setActiveIndex(selectedIndex);
    setOpen(true);
  }

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (disabled) return;
    if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      showMenu();
      return;
    }
    if (!open) return;
    if (event.key === "Escape" || event.key === "Tab") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(
        (current) => (current + direction + options.length) % options.length,
      );
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(activeIndex);
    }
  }

  return (
    <div
      ref={rootRef}
      className={`custom-select ${open ? "is-open" : ""} ${className}`}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={buttonRef}
        type="button"
        className="custom-select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : showMenu())}
      >
        <span>{selected?.label ?? "Select…"}</span>
        <ChevronDown size={17} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={listId}
          className="custom-select-menu"
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option, index) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`custom-select-option ${index === activeIndex ? "is-active" : ""}`}
              key={option.value}
              onPointerEnter={() => setActiveIndex(index)}
              onClick={() => choose(index)}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={16} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
