"use client";

import { useEffect, useId, useRef, useState } from "react";

import { calculateAge, formatAge } from "./date-calculations";

interface DeceasedAgeProps {
  birthday: string;
  deathday: string;
  deathDateLabel: string;
  today: string;
}

export function DeceasedAge({
  birthday,
  deathday,
  deathDateLabel,
  today,
}: DeceasedAgeProps) {
  const popupId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const pinned = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  function cancelClose(): void {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
  }

  function hide(): void {
    cancelClose();
    pinned.current = false;
    popupRef.current?.hidePopover();
  }

  function show(): void {
    cancelClose();
    const button = buttonRef.current;
    const popup = popupRef.current;
    if (!button || !popup) return;

    // The native top layer escapes the tables' horizontal scroll containers.
    popup.showPopover();
    const anchor = button.getBoundingClientRect();
    const bounds = popup.getBoundingClientRect();
    const margin = 8;
    const left = Math.max(
      margin,
      Math.min(anchor.left, window.innerWidth - bounds.width - margin),
    );
    const top =
      anchor.bottom + bounds.height + margin <= window.innerHeight
        ? anchor.bottom
        : Math.max(margin, anchor.top - bounds.height);
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
  }

  function scheduleClose(): void {
    cancelClose();
    // Allow the pointer to travel from the age to the popup and select its text.
    closeTimer.current = setTimeout(() => {
      if (!pinned.current && document.activeElement !== buttonRef.current) {
        popupRef.current?.hidePopover();
      }
    }, 150);
  }

  useEffect(() => {
    if (!isOpen) return;
    const popup = popupRef.current;
    function dismiss(): void {
      popup?.hidePopover();
    }
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", dismiss, true);
    return () => {
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("scroll", dismiss, true);
    };
  }, [isOpen]);

  useEffect(
    () => () => {
      if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    },
    [],
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="deceased-age"
        popoverTarget={popupId}
        aria-label={`Age ${calculateAge(birthday, deathday)}, deceased. Show death details.`}
        aria-describedby={popupId}
        aria-expanded={isOpen}
        onFocus={show}
        onBlur={hide}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") show();
        }}
        onPointerLeave={scheduleClose}
        onClick={(event) => {
          // Focus and hover may already have opened it; the first activation pins it.
          event.preventDefault();
          if (pinned.current) hide();
          else {
            show();
            pinned.current = true;
          }
        }}
      >
        <span aria-hidden="true">{formatAge(birthday, deathday, today)}</span>
      </button>
      <div
        ref={popupRef}
        id={popupId}
        popover="auto"
        role="tooltip"
        className="death-details"
        onToggle={(event) => {
          const open = event.newState === "open";
          setIsOpen(open);
          if (!open) pinned.current = false;
        }}
        onPointerEnter={cancelClose}
        onPointerLeave={scheduleClose}
      >
        <div>Died {deathDateLabel}</div>
        <div>Would be {calculateAge(birthday, today)} today</div>
      </div>
    </>
  );
}
