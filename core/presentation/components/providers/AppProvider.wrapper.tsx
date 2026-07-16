"use client";

import { StoreProvider } from "./StoreProvider";
import { TickerSelectorProvider } from "@/components/design-system/commons/TickerSelectorModal";
import { GlobalNotificationProvider } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <TickerSelectorProvider>
        <GlobalNotificationProvider>
          {children}
        </GlobalNotificationProvider>
      </TickerSelectorProvider>
    </StoreProvider>
  );
}
