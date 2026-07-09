'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getPortfolioById, calculatePortfolioHoldings } from '@/core/data/Portfolio';
import { getAssetById } from '@/core/data/Asset';

export default function PortfolioDetail() {
  const params = useParams();
  const portfolioId = params.id as string;
  const portfolio = getPortfolioById(portfolioId);

  if (!portfolio) {
    return (
      <main className="container-custom">
        <div className="page-header">
          <h1 className="page-header__title">Portefeuille introuvable</h1>
          <Link href="/">
            <button className="btn btn--primary mt-3">Retour au Dashboard</button>
          </Link>
        </div>
      </main>
    );
  }

  // Calcule les holdings du portefeuille
  const holdings = calculatePortfolioHoldings(
    portfolio,
    (assetId) => {
      const asset = getAssetById(assetId);
      return asset ? asset.currentPrice : 0;
    },
    (assetId) => {
      const asset = getAssetById(assetId);
      return asset ? { ticker: asset.ticker, name: asset.name, type: asset.type } : undefined;
    }
  );

  // Calcule la valeur totale réelle basée sur les holdings
  const calculatedTotalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalGainLoss = holdings.reduce((sum, h) => sum + h.gainLoss, 0);
  const totalGainLossPercent = holdings.reduce((sum, h) => sum + (h.averagePrice * h.quantity), 0);
  const overallGainLossPercent = (totalGainLoss / totalGainLossPercent) * 100;

  return (
    <main className="container-custom">
      {/* Header */}
      <div className="page-header">
        <Link href="/">
          <button className="btn btn--secondary mb-3">
            ← Retour au Dashboard
          </button>
        </Link>
        <h1 className="page-header__title">Le Creuset</h1>
        <p className="page-header__subtitle">{portfolio.name}</p>
      </div>

      {/* Statistiques du portefeuille */}
      <section className="section">
        <div className="row g-4">
          <div className="col-12 col-md-4">
            <div className="card card--stat slide-up">
              <p className="stat-label">Valeur Totale</p>
              <h2 className="stat-value">
                {calculatedTotalValue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </h2>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card card--stat slide-up">
              <p className="stat-label">Plus/Moins-Value Totale</p>
              <h2 className={`stat-value ${totalGainLoss >= 0 ? 'stat-value--positive' : 'stat-value--negative'}`}>
                {totalGainLoss >= 0 ? '▲' : '▼'} {Math.abs(totalGainLoss).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </h2>
              <p className={`stat-change ${totalGainLoss >= 0 ? 'stat-change--positive' : 'stat-change--negative'}`}>
                ({totalGainLoss >= 0 ? '+' : ''}{overallGainLossPercent.toFixed(2)}%)
              </p>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card card--stat slide-up">
              <p className="stat-label">Nombre de Positions</p>
              <h2 className="stat-value">
                {holdings.length}
              </h2>
            </div>
          </div>
        </div>
      </section>

      {/* Tableau des holdings */}
      <section className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="section__title" style={{ marginBottom: 0 }}>Positions</h2>
          <button className="btn btn--primary">
            + Ajouter une Transaction
          </button>
        </div>

        <div className="table-container fade-in">
          <table className="table">
            <thead>
              <tr>
                <th>Actif</th>
                <th>Ticker</th>
                <th>Type</th>
                <th>Quantité</th>
                <th>PRU</th>
                <th>Prix Actuel</th>
                <th>Valeur</th>
                <th>+/- Value</th>
                <th>+/- Value %</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => {
                const isPositive = holding.gainLoss >= 0;
                const currentAsset = getAssetById(holding.assetId);
                const currentPrice = currentAsset?.currentPrice || 0;

                return (
                  <tr key={holding.assetId}>
                    <td>{holding.name}</td>
                    <td>
                      <span className="ticker">{holding.ticker}</span>
                    </td>
                    <td>
                      <span className={`badge badge--${holding.type.toLowerCase().replace(' ', '-')}`}>
                        {holding.type}
                      </span>
                    </td>
                    <td>{holding.quantity}</td>
                    <td>
                      {holding.averagePrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </td>
                    <td>
                      {currentPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      {holding.currentValue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </td>
                    <td className={isPositive ? 'positive' : 'negative'}>
                      {isPositive ? '▲' : '▼'} {Math.abs(holding.gainLoss).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </td>
                    <td className={isPositive ? 'positive' : 'negative'}>
                      {isPositive ? '▲' : '▼'} {Math.abs(holding.gainLossPercent).toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Historique des transactions */}
      <section className="section" style={{ marginBottom: '4rem' }}>
        <h2 className="section__title">Historique des Transactions</h2>
        <div className="table-container fade-in">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Actif</th>
                <th>Quantité</th>
                <th>Prix</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {[...portfolio.transactions]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((tx) => {
                  const asset = getAssetById(tx.assetId);
                  const total = tx.quantity * tx.price;
                  const isBuy = tx.type === 'BUY';

                  return (
                    <tr key={tx.id}>
                      <td>
                        {new Date(tx.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td>
                        <span className={`badge ${isBuy ? 'badge--equity' : 'badge--fixed-income'}`}>
                          {tx.type === 'BUY' ? 'ACHAT' : 'VENTE'}
                        </span>
                      </td>
                      <td>{asset?.name || 'Inconnu'}</td>
                      <td>{tx.quantity}</td>
                      <td>
                        {tx.price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        {total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
