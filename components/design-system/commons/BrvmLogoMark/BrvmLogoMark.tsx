"use client";

import React, { memo, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import s from "./BrvmLogoMark.module.css";

type BrvmLogoShape = "circle" | "rounded";

type BrvmLogoStyle = React.CSSProperties & {
  "--brvm-logo-size"?: string;
  "--brvm-logo-scale"?: string;
  "--brvm-logo-label-size"?: string;
};

interface BrvmLogoMarkProps {
  ticker: string;
  name?: string;
  logoUrl?: string | null;
  sector?: string;
  status?: string;
  size?: number;
  scale?: number;
  shape?: BrvmLogoShape;
  className?: string;
  style?: React.CSSProperties;
  imageSizes?: string;
  showBackdrop?: boolean;
  quality?: number;
  unoptimized?: boolean;
}

const INDEX_FALLBACK_LABELS: Record<string, string> = {
  BRVMC: "C",
  BRVM30: "30",
  BRVMPR: "P",
  BRVMAG: "AG",
  BRVMSP: "SP",
};

const DEFAULT_LOGO_SCALE = 1.18;

const LOGO_SCALE_BY_TICKER: Record<string, number> = {
  BNBC: 1.34,
  BOAB: 1.34,
  CBIBF: 1.34,
  NTLC: 1.45,
  ORAC: 1.04,
  PALC: 1.34,
  PRSC: 1.34,
  SHEC: 1.34,
  SLBC: 1.34,
  UNXC: 1.45,
};

const normalizeTicker = (ticker: string): string => ticker.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

const getFallbackLabel = (ticker: string): string => {
  const normalizedTicker = normalizeTicker(ticker);
  const indexFallbackLabel = INDEX_FALLBACK_LABELS[normalizedTicker];

  if (indexFallbackLabel !== undefined) {
    return indexFallbackLabel;
  }

  return normalizedTicker.slice(0, 2) || "NA";
};

const getLogoScale = (ticker: string): number => {
  const normalizedTicker = normalizeTicker(ticker);
  return LOGO_SCALE_BY_TICKER[normalizedTicker] ?? DEFAULT_LOGO_SCALE;
};

const getLabelSize = (size: number, label: string): string => {
  const baseSize = label.length > 1 ? size * 0.34 : size * 0.42;
  return `${Math.max(baseSize, 9)}px`;
};

export const BrvmLogoMark = memo(({
  ticker,
  name,
  logoUrl,
  sector,
  status,
  size = 36,
  scale,
  shape = "circle",
  className,
  style,
  imageSizes,
  showBackdrop = false,
  quality,
  unoptimized,
}: BrvmLogoMarkProps) => {
  const [hasImageError, setHasImageError] = useState(false);
  const normalizedTicker = normalizeTicker(ticker);
  const fallbackLabel = getFallbackLabel(normalizedTicker);
  const isIndex = sector === "Market Indices" || Boolean(INDEX_FALLBACK_LABELS[normalizedTicker]);
  const hasUsableLogo = Boolean(logoUrl) && !hasImageError;
  const bypassImageOptimization = unoptimized ?? (typeof logoUrl === "string" && logoUrl.startsWith("/"));

  useEffect(() => {
    setHasImageError(false);
  }, [logoUrl]);

  const rootStyle = useMemo<BrvmLogoStyle>(() => ({
    ...style,
    "--brvm-logo-size": String(size) + "px",
    "--brvm-logo-scale": String(scale === undefined ? getLogoScale(normalizedTicker) : scale),
    "--brvm-logo-label-size": getLabelSize(size, fallbackLabel),
  }), [fallbackLabel, normalizedTicker, scale, size, style]);

  return (
    <span
      className={clsx(
        s.root,
        shape === "rounded" && s.rounded,
        !hasUsableLogo && s.fallback,
        !hasUsableLogo && isIndex && s.indexFallback,
        className,
      )}
      style={rootStyle}
      title={name ? `${name} (${ticker})` : ticker}
      role="img"
      aria-label={name ? `${name} logo` : `${ticker} logo`}
      data-brvm-logo-status={status}
    >
      {hasUsableLogo ? (
        <>
          {showBackdrop && (
            <Image
              fill
              src={logoUrl as string}
              alt=""
              aria-hidden="true"
              sizes={imageSizes ?? `${size}px`}
              className={s.backdrop}
              quality={quality}
              unoptimized={bypassImageOptimization}
              onError={() => setHasImageError(true)}
            />
          )}
          <Image
            fill
            src={logoUrl as string}
            alt=""
            aria-hidden="true"
            sizes={imageSizes ?? `${size}px`}
            className={s.image}
            quality={quality}
            unoptimized={bypassImageOptimization}
            onError={() => setHasImageError(true)}
          />
        </>
      ) : (
        <span className={s.label}>{fallbackLabel}</span>
      )}
    </span>
  );
});

BrvmLogoMark.displayName = "BrvmLogoMark";
