"use client";

import { useEffect, useRef, useState } from "react";

import {
  formatPhoneNumber,
  normalizePhoneNumber,
} from "./admin/people/phone-number";
import { DetailsPopup } from "./DetailsPopup";

interface PersonPhoneProps {
  fullName: string;
  phoneNumber: string;
}

export function PersonPhone({ fullName, phoneNumber }: PersonPhoneProps) {
  const [copyStatus, setCopyStatus] = useState("Copy");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const displayedNumber = formatPhoneNumber(phoneNumber);
  const dialNumber = normalizePhoneNumber(phoneNumber);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) clearTimeout(resetTimer.current);
    },
    [],
  );

  async function copyNumber(): Promise<void> {
    if (resetTimer.current !== null) clearTimeout(resetTimer.current);
    try {
      await navigator.clipboard.writeText(displayedNumber);
      setCopyStatus("Copied");
    } catch {
      // Clipboard permission can be denied; keep the number available to select.
      setCopyStatus("Could not copy");
    }
    resetTimer.current = setTimeout(() => setCopyStatus("Copy"), 2000);
  }

  return (
    <DetailsPopup
      label={`Phone number for ${fullName}`}
      triggerClassName="person-phone"
      interactive
      trigger={
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          focusable="false"
        >
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1Z" />
        </svg>
      }
    >
      <div className="phone-details">
        <span>{displayedNumber}</span>
        <button
          type="button"
          className="phone-action phone-copy-action"
          onClick={copyNumber}
        >
          <span role="status">{copyStatus}</span>
        </button>
        <a
          className="phone-action phone-call-action"
          href={`tel:+1${dialNumber}`}
        >
          Call
        </a>
      </div>
    </DetailsPopup>
  );
}
