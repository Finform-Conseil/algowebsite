import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { BaseModal } from "../../common/primitives/BaseModal";

interface ReplayModalProps {
    isOpen: boolean;
    onClose: () => void;
    replaySpeed: number;
    setReplaySpeed: (speed: number) => void;
    onStart: (startTime?: string | null) => void;
}

export const ReplayModal: React.FC<ReplayModalProps> = ({
    isOpen,
    onClose,
    replaySpeed,
    setReplaySpeed,
    onStart,
}) => {
    const [selectedDate, setSelectedDate] = useState("");

    useEffect(() => {
        if (!isOpen) setSelectedDate("");
    }, [isOpen]);

    if (!isOpen) return null;

    const handleStart = () => {
        onStart(selectedDate ? `${selectedDate}T00:00:00` : null);
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Mode Replay"
            icon="bi-play-circle-fill"
            maxWidth="500px"
            footer={
                <div className="d-flex justify-content-end gap-2 w-100">
                    <button className="btn btn-secondary btn-sm" onClick={onClose}>
                        Annuler
                    </button>
                    <button className={clsx("btn btn-sm", "btn-california")} onClick={handleStart}>
                        <i className="bi bi-play-fill me-1"></i> Sélectionner le point de départ
                    </button>
                </div>
            }
        >
            <div className="p-1">
                <p className="text-secondary mb-4 small">
                    Le mode Replay vous permet de rejouer l&apos;historique des prix
                    comme si vous étiez en temps réel. Parfait pour tester vos
                    stratégies de trading.
                </p>
                <div className="mb-4">
                    <label className="form-label text-white small fw-bold">Date de début</label>
                    <input
                        type="date"
                        className="form-control form-control-sm"
                        value={selectedDate}
                        onChange={(event) => setSelectedDate(event.target.value)}
                        aria-label="Date de départ du replay"
                        style={{
                            backgroundColor: "rgba(255,255,255,0.05)",
                            border: "1px solid var(--gp-border-color, #2d455c)",
                            color: "white",
                        }}
                    />
                    <small className="text-secondary d-block mt-2">
                        Sans date, une portion récente de l&apos;historique est utilisée. Les bougies futures restent masquées jusqu&apos;à lecture.
                    </small>
                </div>
                <div className="mb-2">
                    <label className="text-secondary mb-2 small fw-bold">Vitesse de lecture</label>
                    <div className="btn-group w-100">
                        <button
                            className={clsx(
                                "btn btn-sm btn-outline-secondary",
                                replaySpeed === 1000 && "active"
                            )}
                            onClick={() => setReplaySpeed(1000)}
                        >
                            x1
                        </button>
                        <button
                            className={clsx(
                                "btn btn-sm btn-outline-secondary",
                                replaySpeed === 500 && "active"
                            )}
                            onClick={() => setReplaySpeed(500)}
                        >
                            x2
                        </button>
                        <button
                            className={clsx(
                                "btn btn-sm btn-outline-secondary",
                                replaySpeed === 250 && "active"
                            )}
                            onClick={() => setReplaySpeed(250)}
                        >
                            x4
                        </button>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
};
