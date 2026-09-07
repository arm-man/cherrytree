"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FocusEvent, ReactNode } from "react";

interface DetailsPopupProps {
  label: string;
  trigger: ReactNode;
  triggerClassName: string;
  children: ReactNode;
  interactive?: boolean;
}

// Age and phone details share the same native popover and dismissal behavior.
export function DetailsPopup({
  label,
  trigger,
  triggerClassName,
  children,
  interactive = false,
}: DetailsPopupProps) {
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
    // Let the pointer travel into the popup; focused actions must remain usable.
    closeTimer.current = setTimeout(() => {
      if (
        !pinned.current &&
        document.activeElement !== buttonRef.current &&
        !popupRef.current?.contains(document.activeElement)
      ) {
        popupRef.current?.hidePopover();
      }
    }, 150);
  }

  function handleBlur(event: FocusEvent<HTMLSpanElement>): void {
    // Moving focus from the icon to Copy/Call is still inside this interaction.
    if (!event.currentTarget.contains(event.relatedTarget)) hide();
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
    <span onBlur={handleBlur} onClick={(event) => event.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        className={triggerClassName}
        popoverTarget={popupId}
        aria-label={label}
        aria-describedby={interactive ? undefined : popupId}
        aria-controls={popupId}
        aria-expanded={isOpen}
        onFocus={show}
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
        <span aria-hidden="true">{trigger}</span>
      </button>
      <div
        ref={popupRef}
        id={popupId}
        popover="auto"
        role={interactive ? "group" : "tooltip"}
        aria-label={interactive ? label : undefined}
        className="person-details"
        onToggle={(event) => {
          const open = event.newState === "open";
          setIsOpen(open);
          if (!open) pinned.current = false;
        }}
        onPointerEnter={cancelClose}
        onPointerLeave={scheduleClose}
      >
        {children}
      </div>
    </span>
  );
}
