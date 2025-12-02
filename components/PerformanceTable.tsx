import { Asset } from '@/core/data/Asset';

interface PerformanceTableProps {
  title: string;
  assets: Asset[];
  type: 'top' | 'flop';
}

export default function PerformanceTable({ title, assets, type }: PerformanceTableProps) {
  return (
    <div className="fade-in">
      <h3 className="section__title">{title}</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Actif</th>
              <th>Ticker</th>
              <th>Type</th>
              <th>Prix</th>
              <th>Variation</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => {
              const isPositive = asset.dailyChangePercent >= 0;
              return (
                <tr key={asset.id}>
                  <td>{asset.name}</td>
                  <td>
                    <span className="ticker">{asset.ticker}</span>
                  </td>
                  <td>
                    <span className={`badge badge--${asset.type.toLowerCase().replace(' ', '-')}`}>
                      {asset.type}
                    </span>
                  </td>
                  <td>
                    {asset.currentPrice.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} €
                  </td>
                  <td className={isPositive ? 'positive' : 'negative'}>
                    {isPositive ? '▲' : '▼'} {Math.abs(asset.dailyChangePercent).toFixed(2)}%
                    <br />
                    <small>
                      ({isPositive ? '+' : ''}{asset.dailyChange.toFixed(2)} €)
                    </small>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
