"use client";

import { DetailsPopup } from "./DetailsPopup";

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
  return (
    <DetailsPopup
      label={`Age ${calculateAge(birthday, deathday)}, deceased. Show death details.`}
      triggerClassName="deceased-age"
      trigger={formatAge(birthday, deathday, today)}
    >
      <div>Died {deathDateLabel}</div>
      <div>Would be {calculateAge(birthday, today)} today</div>
    </DetailsPopup>
  );
}
