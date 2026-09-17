import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { BaseModal } from "../../common/primitives/BaseModal";
import type { ChartCustomDateRange } from "../../../config/market/dateRangeSeries";

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (range: ChartCustomDateRange) => void;
  minDate?: string | null;
  maxDate?: string | null;
  value?: ChartCustomDateRange | null;
}

type CalendarMonth = { year: number; month: number };
type PendingRange = { start: string | null; end: string | null };

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;
const MONTHS = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2020, index, 1))),
);

const parseDateKey = (key: string): Date | null => {
  const timestamp = Date.parse(`${key}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp)) return null;
  const date = new Date(timestamp);
  return date.toISOString().slice(0, 10) === key ? date : null;
};

const dateKeyFromParts = (year: number, month: number, day: number): string =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const shiftDateKey = (key: string, days: number): string => {
  const date = parseDateKey(key);
  if (!date) return key;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const monthFromDateKey = (key: string): CalendarMonth => {
  const date = parseDateKey(key) ?? new Date();
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
};

const clampDateKey = (key: string, minDate: string, maxDate: string): string =>
  key < minDate ? minDate : key > maxDate ? maxDate : key;

const formatDateKey = (key: string | null): string => {
  if (!key) return "—";
  const date = parseDateKey(key);
  return date
    ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date)
    : key;
};

const compareMonth = (a: CalendarMonth, b: CalendarMonth): number => (a.year * 12 + a.month) - (b.year * 12 + b.month);

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  onApply,
  minDate,
  maxDate,
  value,
}) => {
  const effectiveMin = minDate && parseDateKey(minDate) ? minDate : null;
  const effectiveMax = maxDate && parseDateKey(maxDate) ? maxDate : null;
  const hasBounds = Boolean(effectiveMin && effectiveMax && effectiveMin <= effectiveMax);

  const defaultRange = useMemo<PendingRange>(() => {
    if (!hasBounds || !effectiveMin || !effectiveMax) return { start: null, end: null };
    if (value && value.start >= effectiveMin && value.end <= effectiveMax && value.start <= value.end) {
      return { start: value.start, end: value.end };
    }
    return {
      start: clampDateKey(shiftDateKey(effectiveMax, -30), effectiveMin, effectiveMax),
      end: effectiveMax,
    };
  }, [effectiveMax, effectiveMin, hasBounds, value]);

  const [selection, setSelection] = useState<PendingRange>(defaultRange);
  const [calendarMonth, setCalendarMonth] = useState<CalendarMonth>(() =>
    monthFromDateKey(defaultRange.start ?? effectiveMax ?? new Date().toISOString().slice(0, 10)),
  );

  useEffect(() => {
    if (!isOpen) return;
    setSelection(defaultRange);
    setCalendarMonth(monthFromDateKey(defaultRange.start ?? effectiveMax ?? new Date().toISOString().slice(0, 10)));
  }, [defaultRange, effectiveMax, isOpen]);

  const minMonth = effectiveMin ? monthFromDateKey(effectiveMin) : calendarMonth;
  const maxMonth = effectiveMax ? monthFromDateKey(effectiveMax) : calendarMonth;
  const canGoPrevious = hasBounds && compareMonth(calendarMonth, minMonth) > 0;
  const canGoNext = hasBounds && compareMonth(calendarMonth, maxMonth) < 0;
  const yearOptions = useMemo(() => {
    if (!hasBounds) return [calendarMonth.year];
    return Array.from({ length: maxMonth.year - minMonth.year + 1 }, (_, index) => minMonth.year + index);
  }, [calendarMonth.year, hasBounds, maxMonth.year, minMonth.year]);

  const firstDay = new Date(Date.UTC(calendarMonth.year, calendarMonth.month, 1)).getUTCDay();
  const firstGridIndex = (firstDay + 6) % 7;
  const daysInMonth = new Date(Date.UTC(calendarMonth.year, calendarMonth.month + 1, 0)).getUTCDate();
  const isComplete = Boolean(selection.start && selection.end && selection.start <= selection.end);

  const moveMonth = (delta: number) => {
    const absolute = calendarMonth.year * 12 + calendarMonth.month + delta;
    const next = { year: Math.floor(absolute / 12), month: ((absolute % 12) + 12) % 12 };
    if (hasBounds && (compareMonth(next, minMonth) < 0 || compareMonth(next, maxMonth) > 0)) return;
    setCalendarMonth(next);
  };

  const selectDate = (dateKey: string) => {
    if (!hasBounds || !effectiveMin || !effectiveMax || dateKey < effectiveMin || dateKey > effectiveMax) return;
    setSelection((current) => {
      if (!current.start || current.end) return { start: dateKey, end: null };
      if (dateKey < current.start) return { start: dateKey, end: current.start };
      return { start: current.start, end: dateKey };
    });
  };

  const handleApply = () => {
    if (!selection.start || !selection.end || selection.start > selection.end) return;
    onApply({ start: selection.start, end: selection.end });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Plage de dates"
      icon={<i className="bi bi-calendar3" style={{ color: "var(--gp-accent-gold)" }} />}
      maxWidth="760px"
      className="gp-date-range-modal"
      footer={
        <div className="d-flex justify-content-end gap-2 w-100">
          <button type="button" className="btn btn-secondary btn-sm px-3" onClick={onClose}>
            Annuler
          </button>
          <button type="button" className="btn btn-warning btn-sm px-4" onClick={handleApply} disabled={!isComplete}>
            Appliquer
          </button>
        </div>
      }
    >
      <div className="gp-datepicker-container">
        <div className="d-flex gap-3 mb-4" role="status" aria-live="polite">
          <div className="flex-fill rounded border px-3 py-2">
            <div className="text-secondary small mb-1">Début</div>
            <strong>{formatDateKey(selection.start)}</strong>
          </div>
          <div className="d-flex align-items-center text-secondary" aria-hidden="true">→</div>
          <div className="flex-fill rounded border px-3 py-2">
            <div className="text-secondary small mb-1">Fin</div>
            <strong>{formatDateKey(selection.end)}</strong>
          </div>
        </div>

        {!hasBounds ? (
          <div className="alert alert-secondary mb-0" role="status">
            Aucune donnée historique datée n’est disponible pour ce graphique.
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary border-0"
                aria-label="Mois précédent"
                disabled={!canGoPrevious}
                onClick={() => moveMonth(-1)}
              >
                <i className="bi bi-chevron-left" aria-hidden="true" />
              </button>

              <div className="d-flex gap-2">
                <select
                  className="gp-datepicker-select"
                  aria-label="Mois"
                  value={calendarMonth.month}
                  onChange={(event) => {
                    const next = { ...calendarMonth, month: Number(event.target.value) };
                    if (compareMonth(next, minMonth) < 0) setCalendarMonth(minMonth);
                    else if (compareMonth(next, maxMonth) > 0) setCalendarMonth(maxMonth);
                    else setCalendarMonth(next);
                  }}
                >
                  {MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}
                </select>
                <select
                  className="gp-datepicker-select"
                  aria-label="Année"
                  value={calendarMonth.year}
                  onChange={(event) => {
                    const next = { ...calendarMonth, year: Number(event.target.value) };
                    if (compareMonth(next, minMonth) < 0) setCalendarMonth(minMonth);
                    else if (compareMonth(next, maxMonth) > 0) setCalendarMonth(maxMonth);
                    else setCalendarMonth(next);
                  }}
                >
                  {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary border-0"
                aria-label="Mois suivant"
                disabled={!canGoNext}
                onClick={() => moveMonth(1)}
              >
                <i className="bi bi-chevron-right" aria-hidden="true" />
              </button>
            </div>

            <div className="gp-calendar-grid" role="grid" aria-label="Calendrier de sélection de plage">
              {WEEKDAYS.map((day) => (
                <div key={day} className="gp-calendar-day-header" role="columnheader">{day}</div>
              ))}
              {Array.from({ length: firstGridIndex }, (_, index) => (
                <span key={`empty-${index}`} className="gp-calendar-day" aria-hidden="true" />
              ))}
              {Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1;
                const dateKey = dateKeyFromParts(calendarMonth.year, calendarMonth.month, day);
                const disabled = !effectiveMin || !effectiveMax || dateKey < effectiveMin || dateKey > effectiveMax;
                const isStart = selection.start === dateKey;
                const isEnd = selection.end === dateKey;
                const inRange = Boolean(selection.start && selection.end && dateKey > selection.start && dateKey < selection.end);
                return (
                  <button
                    key={dateKey}
                    type="button"
                    role="gridcell"
                    className={clsx("gp-calendar-day", (isStart || isEnd) && "active", inRange && "in-range")}
                    disabled={disabled}
                    aria-selected={isStart || isEnd || inRange}
                    aria-label={formatDateKey(dateKey)}
                    onClick={() => selectDate(dateKey)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <div className="small text-secondary mt-3">
              Sélectionnez le premier jour puis le dernier. La plage est bornée par l’historique disponible dans la source de données.
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
};

// --- EOF ---