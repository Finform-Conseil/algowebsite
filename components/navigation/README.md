# Navigation Components

## Navbar

Global navigation bar visible on all pages. Already integrated in the root layout.

### Usage

The Navbar is automatically rendered on all pages via `/app/layout.tsx`. No need to import it manually on individual pages.

---

## TickerBar

Dynamic ticker bar that displays live data based on context.

### Props

- `type?: 'exchanges' | 'equity' | 'fixed-income' | 'opcvm' | 'macro'` - Determines which preset data to display
- `data?: TickerItem[]` - Custom data array (overrides type)

### TickerItem Type

```typescript
type TickerItem = {
  symbol: string;
  value: string;
  change: string;
  up: boolean;
};
```

### Usage Examples

#### Homepage (Exchanges data)
```tsx
import TickerBar from '@/components/navigation/TickerBar';

<TickerBar type="exchanges" />
```

#### Equity Page
```tsx
import TickerBar from '@/components/navigation/TickerBar';

<TickerBar type="equity" />
```

#### Fixed Income Page
```tsx
import TickerBar from '@/components/navigation/TickerBar';

<TickerBar type="fixed-income" />
```

#### Custom Data
```tsx
import TickerBar from '@/components/navigation/TickerBar';

const customData = [
  { symbol: 'CUSTOM1', value: '100', change: '+5%', up: true },
  { symbol: 'CUSTOM2', value: '200', change: '-2%', up: false },
];

<TickerBar data={customData} />
```

### Available Preset Data

- **exchanges**: BRVM, GSE, NGX, NSE, JSE, CSE indices
- **equity**: Top stocks (SONATEL, TOTALCI, NESTLE, DANGOTE, MTN, SAFARICOM)
- **fixed-income**: Government bonds (SEN 10Y, CIV 5Y, NGA 7Y, KEN 10Y, ZAF 5Y, MAR 10Y)
- **opcvm**: (To be implemented)
- **macro**: (To be implemented)
