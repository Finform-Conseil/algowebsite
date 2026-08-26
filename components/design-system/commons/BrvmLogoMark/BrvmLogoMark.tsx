"use client";

import React, { memo, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { getBrvmLogoUrl, getBrvmLogoUrlByIssuerName } from "@/core/data/brvm-logo-registry";
import { getMarketLogoUrl } from "@/core/data/market-logo-registry";
import s from "./BrvmLogoMark.module.css";

type BrvmLogoShape = "circle" | "rounded";

type BrvmLogoStyle = React.CSSProperties & {
  "--brvm-logo-size"?: string;
  "--brvm-logo-scale"?: string;
  "--brvm-logo-image-offset-y"?: string;
  "--brvm-logo-label-size"?: string;
};

interface BrvmLogoMarkProps {
  ticker: string;
  name?: string;
  logoUrl?: string | null;
  exchange?: string;
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
  loading?: "eager" | "lazy";
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

const LOGO_IMAGE_OFFSET_Y_BY_TICKER: Record<string, string> = {
  ORAC: "calc(var(--brvm-logo-size) * -0.08)",
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

const getLogoImageOffsetY = (ticker: string, resolvedLogoUrl?: string): string => {
  const normalizedTicker = normalizeTicker(ticker);
  const normalizedLogoUrl = resolvedLogoUrl?.toLowerCase();

  if (normalizedLogoUrl?.endsWith("/orac.webp")) {
    return LOGO_IMAGE_OFFSET_Y_BY_TICKER.ORAC;
  }

  return LOGO_IMAGE_OFFSET_Y_BY_TICKER[normalizedTicker] ?? "0px";
};

const getLabelSize = (size: number, label: string): string => {
  const baseSize = label.length > 1 ? size * 0.34 : size * 0.42;
  return `${Math.max(baseSize, 9)}px`;
};

export const BrvmLogoMark = memo(({
  ticker,
  name,
  logoUrl,
  exchange,
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
  loading = "lazy",
}: BrvmLogoMarkProps) => {
  const [hasImageError, setHasImageError] = useState(false);
  const [hasImageLoaded, setHasImageLoaded] = useState(false);
  const normalizedTicker = normalizeTicker(ticker);
  const fallbackLabel = getFallbackLabel(normalizedTicker);
  const isIndex = sector === "Market Indices" || Boolean(INDEX_FALLBACK_LABELS[normalizedTicker]);
  const resolvedLogoUrl = logoUrl
    ?? (exchange?.trim()
      ? getMarketLogoUrl(exchange, normalizedTicker)
      : getBrvmLogoUrl(normalizedTicker))
    ?? ((!exchange || exchange.trim().toUpperCase() === "BRVM")
      ? getBrvmLogoUrlByIssuerName(name ?? "")
      : undefined);
  const hasUsableLogo = Boolean(resolvedLogoUrl) && !hasImageError;
  const bypassImageOptimization = unoptimized
    ?? (typeof resolvedLogoUrl === "string" && resolvedLogoUrl.startsWith("/"));

  useEffect(() => {
    setHasImageError(false);
    setHasImageLoaded(false);
  }, [resolvedLogoUrl]);

  const shouldShowFallbackVisual = !hasUsableLogo || !hasImageLoaded;

  const rootStyle = useMemo<BrvmLogoStyle>(() => ({
    ...style,
    "--brvm-logo-size": String(size) + "px",
    "--brvm-logo-scale": String(scale === undefined ? getLogoScale(normalizedTicker) : scale),
    "--brvm-logo-image-offset-y": getLogoImageOffsetY(normalizedTicker, resolvedLogoUrl),
    "--brvm-logo-label-size": getLabelSize(size, fallbackLabel),
  }), [fallbackLabel, normalizedTicker, resolvedLogoUrl, scale, size, style]);

  return (
    <span
      className={clsx(
        s.root,
        shape === "rounded" && s.rounded,
        shouldShowFallbackVisual && s.fallback,
        shouldShowFallbackVisual && isIndex && s.indexFallback,
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
              src={resolvedLogoUrl as string}
              alt=""
              aria-hidden="true"
              sizes={imageSizes ?? `${size}px`}
              className={s.backdrop}
              quality={quality}
              unoptimized={bypassImageOptimization}
              loading={loading}
              onError={() => setHasImageError(true)}
            />
          )}
          <Image
            fill
            src={resolvedLogoUrl as string}
            alt=""
            aria-hidden="true"
            sizes={imageSizes ?? `${size}px`}
            className={clsx(s.image, !hasImageLoaded && s.imageLoading)}
            quality={quality}
            unoptimized={bypassImageOptimization}
            loading={loading}
            onLoad={() => setHasImageLoaded(true)}
            onError={() => setHasImageError(true)}
          />
          {!hasImageLoaded && (
            <span className={s.label} aria-hidden="true">{fallbackLabel}</span>
          )}
        </>
      ) : (
        <span className={s.label}>{fallbackLabel}</span>
      )}
    </span>
  );
});

BrvmLogoMark.displayName = "BrvmLogoMark";
