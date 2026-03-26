"use client";

import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types

export interface TimeRange {
  start: string; // HH:MM
  end: string;   // HH:MM
}

/** null = no information; [] = closed; [{...}] = open with time ranges */
export type DayValue = TimeRange[] | null;

export interface OpeningHours {
  tz: string;
  mon: DayValue;
  tue: DayValue;
  wed: DayValue;
  thu: DayValue;
  fri: DayValue;
  sat: DayValue;
  sun: DayValue;
}

type DayKey = keyof Omit<OpeningHours, "tz">;

type DayStatus = "open" | "closed" | "unknown";

// ---------------------------------------------------------------------------
// Constants

const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

// Common timezones grouped by region
const COMMON_TIMEZONES = [
  "UTC",
  // Europe
  "Europe/London",
  "Europe/Dublin",
  "Europe/Amsterdam",
  "Europe/Berlin",
  "Europe/Brussels",
  "Europe/Copenhagen",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Rome",
  "Europe/Stockholm",
  "Europe/Vienna",
  "Europe/Warsaw",
  "Europe/Athens",
  "Europe/Istanbul",
  "Europe/Lisbon",
  "Europe/Oslo",
  // North America
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  // South America
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  "America/Bogota",
  // Asia Pacific
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Asia/Bangkok",
  "Asia/Taipei",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Tel_Aviv",
  // Australia / NZ
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Pacific/Auckland",
  // Africa
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Cairo",
];

// ---------------------------------------------------------------------------
// Helpers

function dayStatusOf(value: DayValue): DayStatus {
  if (value === null) return "unknown";
  if (value.length === 0) return "closed";
  return "open";
}

function defaultDayValue(status: DayStatus): DayValue {
  if (status === "unknown") return null;
  if (status === "closed") return [];
  return [{ start: "18:00", end: "02:00" }];
}

function parseIncoming(raw: unknown): OpeningHours {
  const defaultHours: OpeningHours = {
    tz: "UTC",
    mon: null,
    tue: null,
    wed: null,
    thu: null,
    fri: null,
    sat: null,
    sun: null,
  };

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaultHours;
  const r = raw as Record<string, unknown>;

  function parseDay(v: unknown): DayValue {
    if (v === null || v === undefined) return null;
    if (!Array.isArray(v)) return null;
    if (v.length === 0) return [];
    return v
      .filter(
        (item): item is { start: string; end: string } =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).start === "string" &&
          typeof (item as Record<string, unknown>).end === "string",
      )
      .map((item) => ({ start: item.start, end: item.end }));
  }

  return {
    tz: typeof r.tz === "string" ? r.tz : "UTC",
    mon: parseDay(r.mon),
    tue: parseDay(r.tue),
    wed: parseDay(r.wed),
    thu: parseDay(r.thu),
    fri: parseDay(r.fri),
    sat: parseDay(r.sat),
    sun: parseDay(r.sun),
  };
}

// ---------------------------------------------------------------------------
// Sub-components

function TimeInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <input
      type="time"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-28 rounded-lg border border-border bg-background px-2 text-xs tabular-nums outline-none focus:ring-1 focus:ring-accent"
    />
  );
}

function StatusPill({
  status,
  onClick,
}: {
  status: DayStatus;
  onClick: () => void;
}) {
  const styles: Record<DayStatus, string> = {
    open: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    closed: "bg-muted text-muted-foreground border-border hover:bg-muted/80",
    unknown: "bg-background text-muted-foreground border-dashed border-border hover:border-foreground/40",
  };
  const labels: Record<DayStatus, string> = {
    open: "Open",
    closed: "Closed",
    unknown: "No info",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title="Click to cycle: Open → Closed → No info"
      className={`inline-flex h-7 w-[68px] items-center justify-center rounded-full border text-[11px] font-medium transition-colors ${styles[status]}`}
    >
      {labels[status]}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component

interface Props {
  /** Current value from DB (parsed JSONB) */
  initialValue?: unknown;
  /** Name of the hidden input for form submission */
  inputName?: string;
  /**
   * The HTML form id to associate the hidden input with.
   * Only relevant when inputName is provided.
   */
  formId?: string;
  /** Called when value changes (useful when used as controlled component) */
  onChange?: (hours: OpeningHours) => void;
  /** When true, renders as read-only (for preview modals) */
  readOnly?: boolean;
}

export function OpeningHoursEditor({
  initialValue,
  inputName = "opening_hours",
  formId,
  onChange,
  readOnly = false,
}: Props) {
  const [hours, setHours] = useState<OpeningHours>(() => parseIncoming(initialValue));

  const update = useCallback(
    (updater: (prev: OpeningHours) => OpeningHours) => {
      setHours((prev) => {
        const next = updater(prev);
        onChange?.(next);
        return next;
      });
    },
    [onChange],
  );

  function cycleStatus(day: DayKey) {
    const current = dayStatusOf(hours[day]);
    const next: DayStatus =
      current === "open" ? "closed" : current === "closed" ? "unknown" : "open";
    update((prev) => ({ ...prev, [day]: defaultDayValue(next) }));
  }

  function updateRange(day: DayKey, index: number, field: "start" | "end", value: string) {
    update((prev) => {
      const ranges = [...((prev[day] as TimeRange[]) ?? [])];
      ranges[index] = { ...ranges[index], [field]: value };
      return { ...prev, [day]: ranges };
    });
  }

  function addRange(day: DayKey) {
    update((prev) => {
      const ranges = [...((prev[day] as TimeRange[]) ?? [])];
      ranges.push({ start: "18:00", end: "02:00" });
      return { ...prev, [day]: ranges };
    });
  }

  function removeRange(day: DayKey, index: number) {
    update((prev) => {
      const ranges = [...((prev[day] as TimeRange[]) ?? [])];
      ranges.splice(index, 1);
      // If we removed all ranges, treat as closed (empty array)
      return { ...prev, [day]: ranges };
    });
  }

  return (
    <div className="space-y-3">
      {/* Timezone */}
      {!readOnly ? (
        <div className="flex items-center gap-2">
          <span className="w-[52px] shrink-0 text-[11px] text-muted-foreground">Timezone</span>
          <select
            value={hours.tz}
            onChange={(e) => update((prev) => ({ ...prev, tz: e.target.value }))}
            className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-accent"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">
          Timezone: <span className="font-medium text-foreground">{hours.tz}</span>
        </div>
      )}

      {/* Day rows */}
      <div className="divide-y divide-border rounded-xl border border-border">
        {DAYS.map(({ key, label }) => {
          const status = dayStatusOf(hours[key]);
          const ranges = status === "open" ? (hours[key] as TimeRange[]) : [];

          return (
            <div
              key={key}
              className={`flex min-h-[44px] flex-wrap items-start gap-x-3 gap-y-2 px-3 py-2.5 ${
                status !== "open" ? "opacity-60" : ""
              }`}
            >
              {/* Day label */}
              <span className="w-[34px] shrink-0 pt-0.5 text-xs font-medium text-foreground">
                {label}
              </span>

              {/* Status pill */}
              {readOnly ? (
                <span
                  className={`inline-flex h-7 w-[68px] items-center justify-center rounded-full border text-[11px] font-medium ${
                    status === "open"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {status === "open" ? "Open" : status === "closed" ? "Closed" : "No info"}
                </span>
              ) : (
                <StatusPill status={status} onClick={() => cycleStatus(key)} />
              )}

              {/* Time ranges */}
              {status === "open" && (
                <div className="flex flex-wrap items-center gap-2">
                  {ranges.map((range, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      {i > 0 && (
                        <span className="text-[11px] text-muted-foreground">+</span>
                      )}
                      {readOnly ? (
                        <span className="text-xs tabular-nums text-foreground">
                          {range.start}–{range.end}
                        </span>
                      ) : (
                        <>
                          <TimeInput
                            value={range.start}
                            onChange={(v) => updateRange(key, i, "start", v)}
                            label={`${label} open time ${i + 1}`}
                          />
                          <span className="text-xs text-muted-foreground">–</span>
                          <TimeInput
                            value={range.end}
                            onChange={(v) => updateRange(key, i, "end", v)}
                            label={`${label} close time ${i + 1}`}
                          />
                          {ranges.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRange(key, i)}
                              aria-label={`Remove range ${i + 1} for ${label}`}
                              className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              ×
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ))}

                  {/* Add range */}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => addRange(key)}
                      className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      + Add range
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hidden form input — only rendered when a form name is provided */}
      {!readOnly && inputName && (
        <input
          type="hidden"
          name={inputName}
          value={JSON.stringify(hours)}
          {...(formId ? { form: formId } : {})}
        />
      )}
    </div>
  );
}
