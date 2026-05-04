import React from "react";
import clsx from "clsx";
import s from "../../style.module.scss";

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
    return (
        <div
            className={clsx(s["gp-tabs-nav"], className)}
            style={{
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                marginBottom: "20px"
            }}
        >
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={clsx(s["gp-tab-btn"], activeTab === tab.id && s["active"])}
                    onClick={() => onTabChange(tab.id)}
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
