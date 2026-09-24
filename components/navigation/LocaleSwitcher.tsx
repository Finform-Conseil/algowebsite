"use client";

import { routing } from "@/i18n/routing";
import { useLocaleNavigation } from "./useLocaleNavigation";

export default function LocaleSwitcher() {
  const { locale, switchLocale } = useLocaleNavigation();

  return (
    <div className="locale-switcher">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchLocale(loc)}
          className={`locale-btn ${locale === loc ? "active" : ""}`}
          aria-label={loc === "en" ? "English" : "Français"}
          aria-pressed={locale === loc}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
