import React from "react";
import clsx from "clsx";

interface TabItem {
    id: string;
    label: string;
    badge?: string | number;
}

interface ModalTabsProps {
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (id: string) => void;
    className?: string;
}

/**
 * [TENOR 2026] Centralized ModalTabs
 * Ensures consistent navigation across all multi-tab modals.
 * PAT-021: Standardized Navigation.
 */
export const ModalTabs: React.FC<ModalTabsProps> = ({
    tabs,
    activeTab,
    onTabChange,
    className,
}) => {
    const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        const moveToTab = (nextIndex: number) => {
            event.preventDefault();
            const nextTab = tabs[nextIndex];
            if (!nextTab) return;

            onTabChange(nextTab.id);
            event.currentTarget.parentElement
                ?.querySelectorAll<HTMLButtonElement>("[role=tab]")
                [nextIndex]?.focus();
        };

        if (event.key === "ArrowRight") {
            moveToTab((index + 1) % tabs.length);
        } else if (event.key === "ArrowLeft") {
            moveToTab((index - 1 + tabs.length) % tabs.length);
        } else if (event.key === "Home") {
            moveToTab(0);
        } else if (event.key === "End") {
            moveToTab(tabs.length - 1);
        }
    };

    return (
        <div
            className={clsx("gp-tabs-nav", className)}
            role="tablist"
            aria-label="Sections de la modale"
            style={{
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                marginBottom: "20px"
            }}
        >
            {tabs.map((tab, index) => (
                <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    tabIndex={activeTab === tab.id ? 0 : -1}
                    className={clsx("gp-tab-btn", activeTab === tab.id && "active")}
                    onClick={() => onTabChange(tab.id)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                    style={{ textTransform: "capitalize" }}
                >
                    {tab.label}
                    {tab.badge !== undefined && (
                        <span className="badge rounded-pill bg-dark ms-1">
                            {tab.badge}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
};
