import clsx from "clsx";
import { BaseModal } from "../../common/primitives/BaseModal";
import type { DisplaySecurity } from "../../../config/market/marketSnapshotTypes";
import type { BRVMIndexData } from "../data/sidebarFetchers";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  security: DisplaySecurity;
  livePrice: number;
  liveChangePercent: number;
  liveVolume?: number | null;
  marketStatusLabel: string;
  sidebarLastUpdateLabel: string;
  indicesData: Record<string, BRVMIndexData> | null;
};

const INDEX_ROWS = [
  { key: "BRVMC", label: "BRVM Composite" },
  { key: "BRVM30", label: "BRVM 30" },
  { key: "BRVMPR", label: "BRVM Prestige" },
] as const;

const formatNumber = (value: number | null | undefined, digits = 2) => (
  typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : "N/D"
);

export const WatchlistAdvancedModal = ({
  isOpen,
  onClose,
  security,
  livePrice,
  liveChangePercent,
  liveVolume,
  marketStatusLabel,
  sidebarLastUpdateLabel,
  indicesData,
}: Props) => {
  const changeTone = liveChangePercent > 0 ? "is-positive" : liveChangePercent < 0 ? "is-negative" : "is-neutral";
  const currency = security.currency || "XOF";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Vue avancée de la liste de surveillance"
      icon={<i className="bi bi-pie-chart" />}
      maxWidth="620px"
      className="gp-watchlist-advanced-modal"
      hideFooter
    >
      <div className="gp-watchlist-advanced">
        <section className="gp-watchlist-advanced-hero">
          <div>
            <div className="gp-watchlist-advanced-kicker">Instrument surveillé</div>
            <div className="gp-watchlist-advanced-identity">
              <strong>{security.ticker}</strong>
              <span>{security.name}</span>
            </div>
            <div className="gp-watchlist-advanced-meta">
              {[security.exchange, security.country].filter(Boolean).join(" · ") || "BRVM"}
            </div>
          </div>
          <div className="gp-watchlist-advanced-price">
            <strong>{formatNumber(livePrice)} <small>{currency}</small></strong>
            <span className={clsx("gp-watchlist-advanced-change", changeTone)}>
              {liveChangePercent > 0 ? "+" : ""}{formatNumber(liveChangePercent)}%
            </span>
          </div>
        </section>

        <div className="gp-watchlist-advanced-metrics" role="list" aria-label="Synthèse instrument">
          <div role="listitem">
            <span>Volume</span>
            <strong>{typeof liveVolume === "number" && Number.isFinite(liveVolume) ? liveVolume.toLocaleString("fr-FR") : "N/D"}</strong>
          </div>
          <div role="listitem">
            <span>Marché</span>
            <strong>{marketStatusLabel}</strong>
          </div>
          <div role="listitem">
            <span>Mise à jour</span>
            <strong>{sidebarLastUpdateLabel}</strong>
          </div>
        </div>

        <section className="gp-watchlist-advanced-indices">
          <div className="gp-watchlist-advanced-section-head">
            <div>
              <span className="gp-watchlist-advanced-kicker">Marché de référence</span>
              <h3>Indices BRVM</h3>
            </div>
          </div>

          <div className="gp-watchlist-advanced-table" role="table" aria-label="Indices BRVM">
            <div className="gp-watchlist-advanced-table-head" role="row">
              <span role="columnheader">Indice</span>
              <span role="columnheader">Dernier</span>
              <span role="columnheader">Variation</span>
            </div>
            {INDEX_ROWS.map((row) => {
              const data = indicesData?.[row.key];
              const negative = data?.variation?.startsWith("-") ?? false;
              return (
                <div className="gp-watchlist-advanced-table-row" role="row" key={row.key}>
                  <span role="cell">{row.label}</span>
                  <strong role="cell">{data ? formatNumber(data.price) : "N/D"}</strong>
                  <span
                    role="cell"
                    className={clsx(
                      "gp-watchlist-advanced-change",
                      data ? (negative ? "is-negative" : "is-positive") : "is-neutral",
                    )}
                  >
                    {data?.variation ?? "N/D"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </BaseModal>
  );
};
