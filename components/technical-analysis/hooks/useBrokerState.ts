import { useState, useCallback } from "react";
import {
  Broker,
  BrokerConnectionState,
  BrokerOrderIntent,
  BROKER_CATALOG,
} from "../components/modals/broker/BrokerModal";

/**
 * [TENOR 2026 SRE] useBrokerState
 * [ADR-004] State Extraction: Encapsulates the Broker Modal state to prevent
 * prop-drilling and root component re-renders.
 * Designed to be consumed via React Context (BrokerContext).
 */
export const useBrokerState = () => {
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState<boolean>(false);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [brokerConnectionState, setBrokerConnectionState] = useState<BrokerConnectionState>("idle");
  const [brokerOrderIntent, setBrokerOrderIntent] = useState<BrokerOrderIntent | null>(null);

  const openPrefilledBrokerFlow = useCallback((intent: BrokerOrderIntent) => {
    // Fallback to "paper" trading broker, or the first available, or null
    const preferredBroker = BROKER_CATALOG.find((b) => b.id === "paper") ?? BROKER_CATALOG[0] ?? null;
    
    setBrokerOrderIntent(intent);
    setSelectedBroker(preferredBroker);
    setBrokerConnectionState("idle");
    setIsBrokerModalOpen(true);
  }, []);

  return {
    isBrokerModalOpen,
    setIsBrokerModalOpen,
    selectedBroker,
    setSelectedBroker,
    brokerConnectionState,
    setBrokerConnectionState,
    brokerOrderIntent,
    setBrokerOrderIntent,
    openPrefilledBrokerFlow,
  };
};

// --- EOF ---