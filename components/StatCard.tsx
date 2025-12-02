interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changePercent?: number;
  icon?: React.ReactNode;
}

export default function StatCard({ label, value, change, changePercent, icon }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const changeClass = change !== undefined 
    ? `stat-change stat-change--${isPositive ? 'positive' : 'negative'}`
    : '';

  return (
    <div className="card card--stat slide-up">
      {icon && <div className="stat-icon">{icon}</div>}
      <p className="stat-label">{label}</p>
      <h2 className={`stat-value ${change !== undefined ? (isPositive ? 'stat-value--positive' : 'stat-value--negative') : ''}`}>
        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
      </h2>
      {change !== undefined && (
        <p className={changeClass}>
          {isPositive ? '▲' : '▼'} {Math.abs(change).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          {changePercent !== undefined && ` (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`}
        </p>
      )}
    </div>
  );
}
