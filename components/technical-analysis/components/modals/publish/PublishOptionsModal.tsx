"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BaseModal } from "../../common/primitives/BaseModal";

type ShareMarket = {
  currency: string;
  name: string;
  ticker: string;
};

type ShareFeedback = "idle" | "copied" | "copyFailed" | "shared" | "shareFailed";
type ShareChannelId = "whatsapp" | "telegram" | "linkedin" | "x";

type ShareChannel = {
  id: ShareChannelId;
  label: string;
  icon: string;
  accent: string;
  background: string;
};

interface ShareOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  timeframe: string;
  market: ShareMarket;
}

const SHARE_CHANNELS: readonly ShareChannel[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: "bi-whatsapp",
    accent: "#4ade80",
    background: "rgba(37, 211, 102, 0.12)",
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: "bi-telegram",
    accent: "#38bdf8",
    background: "rgba(56, 189, 248, 0.12)",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: "bi-linkedin",
    accent: "#60a5fa",
    background: "rgba(96, 165, 250, 0.12)",
  },
  {
    id: "x",
    label: "X",
    icon: "X",
    accent: "#f8fafc",
    background: "rgba(248, 250, 252, 0.09)",
  },
];

const getCurrentPageUrl = () => (
  typeof window === "undefined" ? "" : window.location.href
);

const copyText = async (value: string) => {
  if (!value) {
    throw new Error("Share URL is unavailable.");
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const fallbackInput = document.createElement("textarea");
  fallbackInput.value = value;
  fallbackInput.setAttribute("readonly", "");
  fallbackInput.style.position = "fixed";
  fallbackInput.style.opacity = "0";
  document.body.appendChild(fallbackInput);
  fallbackInput.select();

  const didCopy = document.execCommand("copy");
  fallbackInput.remove();

  if (!didCopy) {
    throw new Error("Clipboard copy failed.");
  }
};

const getShareDestination = (channel: ShareChannelId, text: string, shareUrl: string) => {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(shareUrl);

  switch (channel) {
    case "whatsapp":
      return `https://wa.me/?text=${encodedText}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "x":
      return `https://x.com/intent/post?text=${encodedText}`;
  }
};

export const ShareOptionsModal: React.FC<ShareOptionsModalProps> = ({
  isOpen,
  onClose,
  symbol,
  timeframe,
  market,
}) => {
  const [feedback, setFeedback] = useState<ShareFeedback>("idle");
  const shareUrl = getCurrentPageUrl();
  const shareText = useMemo(
    () => `Analyse AfriMarket — ${symbol} · ${timeframe} · ${market.ticker} (${market.currency})\n${shareUrl}`,
    [market.currency, market.ticker, shareUrl, symbol, timeframe],
  );
  const canUseNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    if (isOpen) {
      setFeedback("idle");
    }
  }, [isOpen]);

  const handleCopyLink = useCallback(async () => {
    try {
      await copyText(shareUrl);
      setFeedback("copied");
    } catch {
      setFeedback("copyFailed");
    }
  }, [shareUrl]);

  const handleNativeShare = useCallback(async () => {
    if (!canUseNativeShare) {
      await handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        text: shareText,
        title: `Analyse ${symbol} · AfriMarket`,
        url: shareUrl,
      });
      setFeedback("shared");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setFeedback("shareFailed");
    }
  }, [canUseNativeShare, handleCopyLink, shareText, shareUrl, symbol]);

  const handleShareChannel = useCallback((channel: ShareChannel) => {
    if (!shareText || !shareUrl) {
      setFeedback("shareFailed");
      return;
    }

    const shareWindow = window.open(
      getShareDestination(channel.id, shareText, shareUrl),
      "_blank",
      "noopener,noreferrer",
    );

    if (!shareWindow) {
      setFeedback("shareFailed");
      return;
    }

    shareWindow.opener = null;
    setFeedback("shared");
  }, [shareText, shareUrl]);

  const feedbackMessage = feedback === "copied"
    ? "Lien copié dans le presse-papiers."
    : feedback === "shared"
      ? "Fenêtre de partage ouverte."
      : feedback === "copyFailed"
        ? "Impossible de copier le lien. Réessayez."
        : feedback === "shareFailed"
          ? "Le partage n’a pas pu être ouvert. Vérifiez le bloqueur de fenêtres."
          : null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Partager l’analyse"
      icon={<i className="bi bi-share-fill" aria-hidden="true" />}
      footer={
        <div className="d-flex justify-content-end w-100">
          <button className="btn btn-outline-light px-4" onClick={onClose} type="button">
            Fermer
          </button>
        </div>
      }
    >
      <div className="d-grid gap-4">
        <section
          className="rounded-3 px-3 py-3"
          style={{
            backgroundColor: "rgba(148, 163, 184, 0.09)",
            border: "1px solid rgba(148, 163, 184, 0.22)",
          }}
        >
          <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
            <span className="small fw-semibold text-uppercase" style={{ color: "#94a3b8", letterSpacing: "0.08em" }}>
              Analyse active
            </span>
            <span className="small fw-semibold" style={{ color: "#cbd5e1" }}>
              {market.ticker} · {market.currency}
            </span>
          </div>
          <p className="mb-1 fs-5 fw-semibold text-white">{symbol} · {timeframe}</p>
          <p className="mb-0 small" style={{ color: "#94a3b8" }}>{market.name}</p>
        </section>

        <section aria-labelledby="share-channel-title">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h3
              id="share-channel-title"
              className="mb-0 small fw-semibold text-uppercase"
              style={{ color: "#94a3b8", letterSpacing: "0.08em" }}
            >
              Partager via
            </h3>
            <span className="small" style={{ color: "#64748b" }}>Lien sécurisé</span>
          </div>
          <div className="row g-2">
            {SHARE_CHANNELS.map((channel) => (
              <div className="col-6" key={channel.id}>
                <button
                  aria-label={`Partager sur ${channel.label}`}
                  className="btn d-flex flex-column align-items-center justify-content-center gap-2 w-100 px-2 py-3 text-center"
                  onClick={() => handleShareChannel(channel)}
                  style={{
                    backgroundColor: channel.background,
                    border: "1px solid rgba(148, 163, 184, 0.20)",
                    color: "#f8fafc",
                    minHeight: "96px",
                    boxShadow: "none",
                  }}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className="d-inline-flex align-items-center justify-content-center rounded-circle"
                    style={{
                      backgroundColor: "rgba(15, 23, 42, 0.55)",
                      border: `1px solid ${channel.accent}`,
                      color: channel.accent,
                      fontSize: channel.icon === "X" ? "0.9rem" : "1.1rem",
                      fontWeight: 800,
                      height: "36px",
                      width: "36px",
                    }}
                  >
                    {channel.icon === "X" ? "X" : <i className={`bi ${channel.icon}`} />}
                  </span>
                  <span className="small fw-semibold">{channel.label}</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="d-grid gap-2" aria-label="Actions de partage supplémentaires">
          {canUseNativeShare && (
            <button
              className="btn btn-outline-light d-flex align-items-center justify-content-center gap-2 fw-semibold"
              onClick={() => { void handleNativeShare(); }}
              type="button"
            >
              <i className="bi bi-share" aria-hidden="true" />
              Plus d’options de partage
            </button>
          )}
          <button
            className="btn d-flex align-items-center justify-content-center gap-2 fw-semibold"
            onClick={() => { void handleCopyLink(); }}
            style={{
              backgroundColor: "rgba(59, 130, 246, 0.12)",
              border: "1px solid rgba(96, 165, 250, 0.52)",
              color: "#dbeafe",
            }}
            type="button"
          >
            <i className="bi bi-link-45deg" aria-hidden="true" />
            Copier le lien
          </button>
        </section>

        {feedbackMessage && (
          <p className="mb-0 small" aria-live="polite" role="status" style={{ color: "#94a3b8" }}>
            {feedbackMessage}
          </p>
        )}
      </div>
    </BaseModal>
  );
};
