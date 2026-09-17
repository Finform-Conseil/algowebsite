"use client";

import { useCallback } from "react";
import type { ActionEntity } from "@/core/domain/entities/action.entity";
import type { IndiceEntity } from "@/core/domain/entities/indice.entity";
import { BRVM_SECURITIES } from "@/core/data/brvm-securities";
import { useActionRepository } from "@/core/infra/repositories/action.repository.impl";
import { useIndiceRepository } from "@/core/infra/repositories/indice.repository.impl";
import {
  getLayoutDefinition,
  MULTI_CHART_PRESETS,
} from "../config/layout/multiChartLayouts";
import {
  rankMarketMonitorEquities,
  rankSectorPeers,
  resolveBenchmarkIndex,
} from "../config/layout/multiChartPresetPolicy";
import type { ChartTimeframe } from "../config/market/timeframeCatalog";
import type { ChartType } from "../lib/chart-types";

const ACTION_PAGE_SIZE = 100;
const MAX_ACTION_PAGES = 20;
const INDEX_PAGE_SIZE = 100;
const MAX_INDEX_PAGES = 10;

const normalize = (value: unknown): string => String(value ?? "").trim().toUpperCase();

const normalizeIssuerName = (value: unknown): string => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, " ")
  .trim();

const resolveCanonicalSector = (action: ActionEntity): string | null => {
  const actionTicker = normalize(action.ticker);
  const directTickerMatch = BRVM_SECURITIES.find((security) => (
    security.status !== "delisted"
    && normalize(security.exchange) === "BRVM"
    && normalize(security.ticker) === actionTicker
  ));
  if (directTickerMatch) return directTickerMatch.sector;

  const issuerName = normalizeIssuerName(action.society?.name);
  if (!issuerName) return null;
  const issuerMatch = BRVM_SECURITIES.find((security) => {
    if (security.status === "delisted" || normalize(security.exchange) !== "BRVM") return false;
    const canonicalName = normalizeIssuerName(security.name);
    if (!canonicalName) return false;
    if (canonicalName === issuerName) return true;
    return canonicalName.length >= 8
      && issuerName.length >= 8
      && (canonicalName.includes(issuerName) || issuerName.includes(canonicalName));
  });
  return issuerMatch?.sector ?? null;
};

const rankCanonicalSectorPeers = (
  primary: ActionEntity,
  actions: readonly ActionEntity[],
  market: string,
  limit: number,
): ActionEntity[] => {
  const sector = resolveCanonicalSector(primary);
  if (!sector) return [];
  const candidates = actions.filter((candidate) => resolveCanonicalSector(candidate) === sector);
  return rankMarketMonitorEquities(candidates, market, limit, [primary.ticker]);
};

export interface ResolvedMultiChartPresetBinding {
  symbol: string;
  exchange: string;
  timeframe: ChartTimeframe;
  sourceKind: "equity" | "index";
  sourceId: string;
  chartType: ChartType;
}

export type MultiChartPresetResolution =
  | { ok: true; bindings: ResolvedMultiChartPresetBinding[] }
  | { ok: false; reason: string };

const EQUITY_INSTRUMENT_SOURCE_PREFIX = "instrument:";

const toEquityBinding = (
  action: ActionEntity,
  timeframe: ChartTimeframe = "1D",
): ResolvedMultiChartPresetBinding => {
  const instrumentId = String(action.instrument ?? "").trim();
  return {
    symbol: normalize(action.ticker),
    exchange: normalize(action.bourse?.ticker),
    timeframe,
    sourceKind: "equity",
    sourceId: instrumentId ? `${EQUITY_INSTRUMENT_SOURCE_PREFIX}${instrumentId}` : "",
    chartType: "candles",
  };
};

export const useMultiChartPresetResolver = () => {
  const { getActionByTicker, getAllActions } = useActionRepository();
  const { getAllIndices } = useIndiceRepository();

  const loadMarketActions = useCallback(async (market: string): Promise<ActionEntity[]> => {
    const normalizedMarket = normalize(market);
    if (!normalizedMarket) return [];
    const first = await getAllActions({
      bourse_tickers: normalizedMarket,
      view_type: "screener",
      page: 1,
      page_size: ACTION_PAGE_SIZE,
    });
    const all = [...(first.data ?? [])];
    const totalPages = Math.min(Math.max(1, Number(first.total_pages) || 1), MAX_ACTION_PAGES);
    for (let page = 2; page <= totalPages; page += 1) {
      const response = await getAllActions({
        bourse_tickers: normalizedMarket,
        view_type: "screener",
        page,
        page_size: ACTION_PAGE_SIZE,
      });
      if (Array.isArray(response.data)) all.push(...response.data);
    }
    const unique = new Map<string, ActionEntity>();
    for (const action of all) {
      const id = String(action?.id ?? "").trim();
      const ticker = normalize(action?.ticker);
      if (!id || !ticker) continue;
      unique.set(id, action);
    }
    return Array.from(unique.values());
  }, [getAllActions]);

  const loadIndices = useCallback(async (): Promise<IndiceEntity[]> => {
    const first = await getAllIndices({ page: 1, page_size: INDEX_PAGE_SIZE });
    const all = [...(first.data ?? [])];
    const totalPages = Math.min(Math.max(1, Number(first.total_pages) || 1), MAX_INDEX_PAGES);
    for (let page = 2; page <= totalPages; page += 1) {
      const response = await getAllIndices({ page, page_size: INDEX_PAGE_SIZE });
      if (Array.isArray(response.data)) all.push(...response.data);
    }
    const unique = new Map<string, IndiceEntity>();
    for (const indice of all) {
      const id = String(indice?.id ?? "").trim();
      if (id) unique.set(id, indice);
    }
    return Array.from(unique.values());
  }, [getAllIndices]);

  const resolvePreset = useCallback(async (
    presetId: string,
    primarySymbol: string,
    market: string,
  ): Promise<MultiChartPresetResolution> => {
    const symbol = normalize(primarySymbol);
    const normalizedMarket = normalize(market);
    if (!symbol || !normalizedMarket) {
      return { ok: false, reason: "Sélectionnez d’abord une bourse et un titre." };
    }

    const preset = MULTI_CHART_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) return { ok: false, reason: `Preset multi-chart inconnu : ${presetId}.` };
    const targetChartCount = getLayoutDefinition(preset.layoutId).chartCount;

    const primary = await getActionByTicker({ ticker: symbol, marketTicker: normalizedMarket });
    const primaryBinding = toEquityBinding(primary);

    if (presetId === "multi_timeframe") {
      return {
        ok: true,
        bindings: [
          { ...primaryBinding, timeframe: "1D" },
          { ...primaryBinding, timeframe: "1W" },
          { ...primaryBinding, timeframe: "1M" },
        ],
      };
    }

    if (presetId === "symbol_vs_market") {
      const explicitPrincipal = primary.bourse?.principal_index
        ? { id: primary.bourse.principal_index.id, name: primary.bourse.principal_index.name }
        : null;
      const indices = explicitPrincipal ? [] : await loadIndices();
      const benchmark = resolveBenchmarkIndex(normalizedMarket, indices, explicitPrincipal);
      if (!benchmark) {
        return { ok: false, reason: `Aucun indice de référence n’est disponible pour ${normalizedMarket}.` };
      }
      return {
        ok: true,
        bindings: [
          primaryBinding,
          {
            symbol: benchmark.symbol,
            exchange: normalizedMarket,
            timeframe: "1D",
            sourceKind: "index",
            sourceId: benchmark.id,
            chartType: "line",
          },
        ],
      };
    }

    const marketActions = await loadMarketActions(normalizedMarket);

    if (presetId === "sector_compare") {
      const peerLimit = Math.max(0, targetChartCount - 1);
      const apiPeers = rankSectorPeers(primary, marketActions, peerLimit);
      const peers = apiPeers.length > 0
        ? apiPeers
        : rankCanonicalSectorPeers(primary, marketActions, normalizedMarket, peerLimit);
      if (peers.length === 0) {
        return { ok: false, reason: `Aucun pair sectoriel exploitable n’est disponible pour ${symbol} sur ${normalizedMarket}.` };
      }
      return {
        ok: true,
        bindings: [primaryBinding, ...peers.map((peer) => toEquityBinding(peer))].slice(0, targetChartCount),
      };
    }

    if (presetId === "market_monitor") {
      const explicitPrincipal = primary.bourse?.principal_index
        ? { id: primary.bourse.principal_index.id, name: primary.bourse.principal_index.name }
        : null;
      const indices = explicitPrincipal ? [] : await loadIndices();
      const benchmark = resolveBenchmarkIndex(normalizedMarket, indices, explicitPrincipal);
      const reservedSlots = 1 + (benchmark ? 1 : 0);
      const equityLimit = Math.max(0, targetChartCount - reservedSlots);
      const leaderCandidates = rankMarketMonitorEquities(marketActions, normalizedMarket, equityLimit, [primary.ticker]);
      const leaders: ActionEntity[] = [];
      const hydrationConcurrency = 4;
      for (let offset = 0; offset < leaderCandidates.length; offset += hydrationConcurrency) {
        const batch = leaderCandidates.slice(offset, offset + hydrationConcurrency);
        const hydratedBatch = await Promise.allSettled(batch.map(async (leader) => {
          if (String(leader.instrument ?? "").trim()) return leader;
          return getActionByTicker({
            ticker: normalize(leader.ticker),
            marketTicker: normalizedMarket,
          });
        }));
        hydratedBatch.forEach((result, index) => {
          leaders.push(result.status === "fulfilled" ? result.value : batch[index]);
        });
      }
      const bindings: ResolvedMultiChartPresetBinding[] = [primaryBinding];
      if (benchmark) {
        bindings.push({
          symbol: benchmark.symbol,
          exchange: normalizedMarket,
          timeframe: "1D",
          sourceKind: "index",
          sourceId: benchmark.id,
          chartType: "line",
        });
      }
      bindings.push(...leaders.map((leader) => toEquityBinding(leader)));
      if (bindings.length < 2) {
        return { ok: false, reason: `Le Market Monitor ne dispose pas d’assez de séries pour ${normalizedMarket}.` };
      }
      return { ok: true, bindings: bindings.slice(0, targetChartCount) };
    }

    return { ok: false, reason: `Preset multi-chart inconnu : ${presetId}.` };
  }, [getActionByTicker, loadIndices, loadMarketActions]);

  return { resolvePreset };
};
