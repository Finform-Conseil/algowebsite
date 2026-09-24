"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { routing } from "@/i18n/routing";

export type AppLocale = (typeof routing.locales)[number];

const isAppLocale = (value: string): value is AppLocale =>
  routing.locales.includes(value as AppLocale);

/**
 * Single navigation contract for every locale control in the application.
 * Navbar, profile menus, and future locale affordances must all consume this hook.
 */
export const useLocaleNavigation = () => {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = useCallback((newLocale: AppLocale) => {
    if (newLocale === locale) return;

    const segments = pathname.split("/");
    if (isAppLocale(segments[1] ?? "")) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }

    router.push(segments.join("/"));
  }, [locale, pathname, router]);

  const toggleLocale = useCallback(() => {
    switchLocale(locale === "fr" ? "en" : "fr");
  }, [locale, switchLocale]);

  return {
    locale,
    switchLocale,
    toggleLocale,
  };
};
