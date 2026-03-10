export type OpeningHoursRange = {
  start: string; // "HH:MM" 24h
  end: string; // "HH:MM" 24h; may be past midnight
};

export type OpeningHours = {
  tz?: string; // e.g. "Europe/Copenhagen"
  mon?: OpeningHoursRange[];
  tue?: OpeningHoursRange[];
  wed?: OpeningHoursRange[];
  thu?: OpeningHoursRange[];
  fri?: OpeningHoursRange[];
  sat?: OpeningHoursRange[];
  sun?: OpeningHoursRange[];
};

