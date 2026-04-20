import React from "react";
import Image from "next/image";
import { BRVM_SECURITIES } from "@/shared/data/brvm-securities";

interface SecurityBadgeProps {
    ticker: string;
    size?: number;
    showTicker?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({
    ticker,
    size = 24,
    showTicker = true,
    className,
    style,
}) => {
    const security = BRVM_SECURITIES.find((s) => s.ticker.toUpperCase() === ticker.toUpperCase());
    const logoUrl = security?.logoUrl;

    return (
        <div className={`d-flex align-items-center gap-2 ${className}`} style={style}>
            {logoUrl ? (
                <div style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: "50%",
                    backgroundColor: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    padding: "2px",
                    flexShrink: 0,
                    position: "relative"
                }}>
                    <Image fill src={logoUrl} alt={ticker} objectFit="contain" />
                </div>
            ) : (
                <div style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: `${size * 0.45}px`,
                    fontWeight: "700",
                    color: "white",
                    flexShrink: 0
                }}>
                    {ticker.slice(0, 2).toUpperCase()}
                </div>
            )}
            {showTicker && <span className="small fw-medium text-white">{ticker}</span>}
        </div>
    );
};
