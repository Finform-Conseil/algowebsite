import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { BaseModal } from "../common/BaseModal";
import clsx from "clsx";
import s from "../../style.module.css";
import { setModalOpen } from "../../store/technicalAnalysisSlice";

/**
 * [TENOR 2026] DatePickerModal - Autonomous Smart Component
 * Refactored to manage its own local calendar state, eliminating prop-drilling
 * and preventing re-renders in the God Component during date selection.
 */

interface DatePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (range: { start: Date | null; end: Date | null }) => void;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
    isOpen,
    onClose,
    onApply,
}) => {
    const dispatch = useDispatch();

    // --- Local State ---
    const [calendarMonth, setCalendarMonth] = useState(() => new Date());
    const [dateRangeSelection, setDateRangeSelection] = useState<{
        start: Date | null;
        end: Date | null;
    }>(() => ({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Default: Last 7 days
        end: new Date(),
    }));
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

    // Reset calendar view to the selected start date when modal opens (Adjusting state during render)
    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen && dateRangeSelection.start) {
            setCalendarMonth(new Date(dateRangeSelection.start));
        }
    }

    // --- Helpers ---
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        return { firstDay, daysInMonth };
    };

    // --- Handlers ---
    const handleApply = () => {
        if (dateRangeSelection.start && dateRangeSelection.end) {
            onApply(dateRangeSelection);
            dispatch(setModalOpen({ modal: "datePicker", isOpen: false }));
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Sélecteur de Période Premium"
            icon={<i className="bi bi-calendar3" style={{ color: "var(--gp-accent-gold)" }} />}
            maxWidth="800px"
            footer={
                <div className="d-flex justify-content-end w-100">
                    <button
                        className="btn btn-warning px-4"
                        onClick={handleApply}
                        disabled={!dateRangeSelection.start || !dateRangeSelection.end}
                    >
                        Appliquer la Période
                    </button>
                </div>
            }
        >
            <div className={s["gp-datepicker-container"]}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <button
                        className="btn btn-sm btn-outline-secondary border-0"
                        onClick={() =>
                            setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))
                        }
                    >
                        <i className="bi bi-chevron-left" style={{ fontSize: "1.2rem" }}></i>
                    </button>

                    <div className="d-flex gap-2">
                        {/* [TENOR 2026] MONTH SELECTOR */}
                        <select
                            className={s["gp-datepicker-select"]}
                            value={calendarMonth.getMonth()}
                            onChange={(e) =>
                                setCalendarMonth(new Date(calendarMonth.getFullYear(), parseInt(e.target.value), 1))
                            }
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={i}>
                                    {new Date(2000, i, 1).toLocaleString("default", { month: "long" })}
                                </option>
                            ))}
                        </select>

                        {/* [TENOR 2026] YEAR SELECTOR */}
                        <select
                            className={s["gp-datepicker-select"]}
                            value={calendarMonth.getFullYear()}
                            onChange={(e) =>
                                setCalendarMonth(new Date(parseInt(e.target.value), calendarMonth.getMonth(), 1))
                            }
                        >
                            {Array.from({ length: 41 }, (_, i) => {
                                const year = 1990 + i;
                                return (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <button
                        className="btn btn-sm btn-outline-secondary border-0"
                        onClick={() =>
                            setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))
                        }
                    >
                        <i className="bi bi-chevron-right" style={{ fontSize: "1.2rem" }}></i>
                    </button>
                </div>

                <div className={s["gp-calendar-grid"]}>
                    {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
                        <div key={day} className={s["gp-calendar-day-header"]}>
                            {day}
                        </div>
                    ))}
                    {(() => {
                        const { firstDay, daysInMonth } = getDaysInMonth(calendarMonth);
                        const cells = [];

                        for (let i = 0; i < firstDay; i++) {
                            cells.push(<div key={`empty-${i}`} className={s["gp-calendar-day"]} />);
                        }

                        for (let d = 1; d <= daysInMonth; d++) {
                            const date = new Date(
                                calendarMonth.getFullYear(),
                                calendarMonth.getMonth(),
                                d
                            );
                            const isStart =
                                dateRangeSelection.start?.toDateString() === date.toDateString();
                            const isEnd =
                                dateRangeSelection.end?.toDateString() === date.toDateString();
                            const inRange =
                                dateRangeSelection.start &&
                                dateRangeSelection.end &&
                                date > dateRangeSelection.start &&
                                date < dateRangeSelection.end;

                            cells.push(
                                <div
                                    key={d}
                                    className={clsx(
                                        s["gp-calendar-day"],
                                        (isStart || isEnd) && s["active"],
                                        inRange && s["in-range"]
                                    )}
                                    onClick={() => {
                                        if (
                                            !dateRangeSelection.start ||
                                            (dateRangeSelection.start && dateRangeSelection.end)
                                        ) {
                                            setDateRangeSelection({ start: date, end: null });
                                        } else {
                                            if (date < dateRangeSelection.start) {
                                                setDateRangeSelection({ start: date, end: null });
                                            } else {
                                                setDateRangeSelection({
                                                    start: dateRangeSelection.start,
                                                    end: date,
                                                });
                                            }
                                        }
                                    }}
                                >
                                    {d}
                                </div>
                            );
                        }
                        return cells;
                    })()}
                </div>
            </div>
        </BaseModal>
    );
};

// --- EOF ---