'use client';

type TickerItem = {
  symbol: string;
  value: string;
  change: string;
  up: boolean;
};

type TickerBarProps = {
  data?: TickerItem[];
  type?: 'exchanges' | 'equity' | 'fixed-income' | 'opcvm' | 'macro';
};

// Default ticker data for exchanges
const EXCHANGES_DATA: TickerItem[] = [
  { symbol: 'BRVM', value: '218.45', change: '+1.24%', up: true },
  { symbol: 'GSE', value: '3,128.7', change: '-0.38%', up: false },
  { symbol: 'NGX', value: '97,324', change: '+2.11%', up: true },
  { symbol: 'NSE', value: '1,928.4', change: '-0.91%', up: false },
  { symbol: 'JSE', value: '82,415', change: '+0.88%', up: true },
  { symbol: 'CSE', value: '12,845', change: '+0.45%', up: true },
];

// Sample equity data - Top African stocks
const EQUITY_DATA: TickerItem[] = [
  { symbol: 'SONATEL', value: '18,500', change: '+2.5%', up: true },
  { symbol: 'TOTALCI', value: '2,450', change: '-0.8%', up: false },
  { symbol: 'NESTLE CI', value: '7,200', change: '+1.2%', up: true },
  { symbol: 'DANGOTE', value: '285', change: '+3.1%', up: true },
  { symbol: 'MTN', value: '142', change: '-1.5%', up: false },
  { symbol: 'SAFARICOM', value: '28.5', change: '+0.9%', up: true },
  { symbol: 'ECOBANK', value: '8,750', change: '+1.8%', up: true },
  { symbol: 'ORANGE CI', value: '12,300', change: '-0.5%', up: false },
  { symbol: 'SMBCIC', value: '9,850', change: '+2.2%', up: true },
  { symbol: 'NASCON', value: '18.45', change: '+4.5%', up: true },
  { symbol: 'EQUITY', value: '52.5', change: '+1.1%', up: true },
  { symbol: 'STANBIC', value: '98.2', change: '-0.3%', up: false },
];

// Sample fixed-income data
const FIXED_INCOME_DATA: TickerItem[] = [
  { symbol: 'SEN 10Y', value: '6.25%', change: '+0.05%', up: true },
  { symbol: 'CIV 5Y', value: '5.80%', change: '-0.10%', up: false },
  { symbol: 'NGA 7Y', value: '12.50%', change: '+0.15%', up: true },
  { symbol: 'KEN 10Y', value: '13.20%', change: '+0.08%', up: true },
  { symbol: 'ZAF 5Y', value: '9.75%', change: '-0.12%', up: false },
  { symbol: 'MAR 10Y', value: '3.45%', change: '+0.03%', up: true },
  { symbol: 'GHA 7Y', value: '19.50%', change: '+0.20%', up: true },
  { symbol: 'EGY 5Y', value: '18.75%', change: '-0.15%', up: false },
  { symbol: 'TUN 10Y', value: '7.80%', change: '+0.10%', up: true },
  { symbol: 'BEN 5Y', value: '6.50%', change: '+0.05%', up: true },
];

// Sample OPCVM/UCITS data
const OPCVM_DATA: TickerItem[] = [
  { symbol: 'BRVM PRESTIGE', value: '1,245', change: '+1.8%', up: true },
  { symbol: 'NSIA ACTIONS', value: '2,850', change: '+2.3%', up: true },
  { symbol: 'EDC OBLIG', value: '1,125', change: '+0.5%', up: true },
  { symbol: 'SUNU EQUITY', value: '3,420', change: '-0.8%', up: false },
  { symbol: 'BGF AFRICA', value: '4,680', change: '+1.5%', up: true },
  { symbol: 'ALIOS FINANCE', value: '1,890', change: '+0.9%', up: true },
  { symbol: 'IMPAXIS', value: '2,340', change: '-0.3%', up: false },
  { symbol: 'UNICEF OBLIG', value: '1,560', change: '+0.7%', up: true },
  { symbol: 'CAURIS CROISS', value: '2,980', change: '+2.1%', up: true },
  { symbol: 'ATLANTIQUE FIN', value: '1,720', change: '+1.2%', up: true },
];

// Sample Macro data
const MACRO_DATA: TickerItem[] = [
  { symbol: 'USD/XOF', value: '605.50', change: '+0.15%', up: true },
  { symbol: 'EUR/XOF', value: '655.95', change: '-0.08%', up: false },
  { symbol: 'NGN/USD', value: '1,485', change: '-0.25%', up: false },
  { symbol: 'ZAR/USD', value: '18.45', change: '+0.35%', up: true },
  { symbol: 'KES/USD', value: '129.80', change: '-0.12%', up: false },
  { symbol: 'GHS/USD', value: '12.15', change: '+0.18%', up: true },
  { symbol: 'BRENT', value: '$85.40', change: '+1.2%', up: true },
  { symbol: 'GOLD', value: '$2,045', change: '+0.8%', up: true },
  { symbol: 'COCOA', value: '$4,280', change: '+2.5%', up: true },
  { symbol: 'COFFEE', value: '$1.85', change: '-0.5%', up: false },
];

export default function TickerBar({ data, type = 'exchanges' }: TickerBarProps) {
  // Determine which data to use
  let tickerData = data;
  
  if (!tickerData) {
    switch (type) {
      case 'equity':
        tickerData = EQUITY_DATA;
        break;
      case 'fixed-income':
        tickerData = FIXED_INCOME_DATA;
        break;
      case 'opcvm':
        tickerData = OPCVM_DATA;
        break;
      case 'macro':
        tickerData = MACRO_DATA;
        break;
      case 'exchanges':
      default:
        tickerData = EXCHANGES_DATA;
        break;
    }
  }
  return (
    <div className="ticker-bar">
      <div className="ticker-label">LIVE</div>
      <div className="ticker-overflow">
        <div className="ticker-track">
          {[...tickerData, ...tickerData].map((item, idx) => (
            <div key={idx} className="ticker-item">
              <span className="symbol">{item.symbol}</span>
              <span className="value">{item.value}</span>
              <span className={item.up ? 'up' : 'down'}>{item.change}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
