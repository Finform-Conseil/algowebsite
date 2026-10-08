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
};

interface ShareOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  timeframe: string;
  market: ShareMarket;
}

const SHARE_CHANNELS: readonly ShareChannel[] = [
  { id: "whatsapp", label: "WhatsApp", icon: "bi-whatsapp" },
  { id: "telegram", label: "Telegram", icon: "bi-telegram" },
  { id: "linkedin", label: "LinkedIn", icon: "bi-linkedin" },
  { id: "x", label: "X", icon: "X" },
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
      icon={<i className="bi bi-share" aria-hidden="true" />}
      maxWidth="520px"
      className="gp-share-modal"
      hideFooter
    >
      <div className="gp-share-panel">
        <section className="gp-share-context" aria-label="Analyse active">
          <div>
            <span className="gp-share-kicker">Analyse active</span>
            <strong>{symbol} · {timeframe}</strong>
            <small>{market.name}</small>
          </div>
          <span className="gp-share-market">{market.ticker} · {market.currency}</span>
        </section>

        <section className="gp-share-section" aria-labelledby="share-channel-title">
          <div className="gp-share-section__head">
            <h3 id="share-channel-title">Partager via</h3>
            <span>Lien sécurisé</span>
          </div>
          <div className="gp-share-channels">
            {SHARE_CHANNELS.map((channel) => (
              <button
                key={channel.id}
                aria-label={`Partager sur ${channel.label}`}
                className={`gp-share-channel gp-share-channel--${channel.id}`}
                onClick={() => handleShareChannel(channel)}
                type="button"
              >
                <span className="gp-share-channel__icon" aria-hidden="true">
                  {channel.icon === "X" ? "X" : <i className={`bi ${channel.icon}`} />}
                </span>
                <span>{channel.label}</span>
                <i className="bi bi-arrow-up-right gp-share-channel__arrow" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <section className="gp-share-actions" aria-label="Actions de partage supplémentaires">
          <button className="gp-share-action gp-share-action--primary" onClick={() => { void handleCopyLink(); }} type="button">
            <i className="bi bi-link-45deg" aria-hidden="true" />
            <span>Copier le lien</span>
          </button>
          {canUseNativeShare && (
            <button className="gp-share-action" onClick={() => { void handleNativeShare(); }} type="button">
              <i className="bi bi-share" aria-hidden="true" />
              <span>Autres options</span>
            </button>
          )}
        </section>

        {feedbackMessage && (
          <p className="gp-share-feedback" aria-live="polite" role="status">
            {feedbackMessage}
          </p>
        )}
      </div>
    </BaseModal>
  );
};
