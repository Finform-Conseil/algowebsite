import React from "react";
import clsx from "clsx";
import { getBRVMSecurityByTicker } from "@/core/data/brvm-securities";
import { BrvmLogoMark } from "@/components/design-system/commons/BrvmLogoMark/BrvmLogoMark";

interface SecurityBadgeProps {
    ticker: string;
    size?: number;
    showTicker?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

const normalizeTicker = (ticker: string): string => ticker.trim().toUpperCase();

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({
    ticker,
    size = 24,
    showTicker = true,
    className,
    style,
}) => {
    const normalizedTicker = normalizeTicker(ticker);
    const security = normalizedTicker ? getBRVMSecurityByTicker(normalizedTicker) : undefined;
    const displayTicker = security?.ticker ?? (normalizedTicker || "N/A");
    const isDelisted = security?.status === "delisted";
    const accessibleLabel = security
        ? `${security.name} (${displayTicker})`
        : `Unknown security (${displayTicker})`;

    return (
        <div
            className={clsx("d-flex align-items-center gap-2", className)}
            style={style}
            title={accessibleLabel}
            aria-label={accessibleLabel}
        >
            <BrvmLogoMark
                ticker={displayTicker}
                name={security?.name}
                logoUrl={security?.logoUrl}
                sector={security?.sector}
                status={security?.status}
                size={size}
                imageSizes={`${size}px`}
            />
            {showTicker && (
                <>
                    <span className="small fw-medium text-white">{displayTicker}</span>
                    {isDelisted && <span className="badge rounded-pill text-bg-secondary">Delisted</span>}
                </>
            )}
        </div>
    );
};
