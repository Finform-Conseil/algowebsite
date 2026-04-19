'use client';

import { useMemo } from 'react';

interface YieldDataPoint {
  maturity: number;
  yield: number;
}

interface CountryYieldData {
  country: string;
  countryCode: string;
  color: string;
  data: YieldDataPoint[];
}

interface YieldRatesTableProps {
  selectedCountries: string[];
  currentDate: string;
  yieldData: CountryYieldData[];
  previousYieldData?: CountryYieldData[];
}

export default function YieldRatesTable({ 
  selectedCountries, 
  currentDate, 
  yieldData,
  previousYieldData 
}: YieldRatesTableProps) {
  const maturities = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20];
  
  const filteredData = useMemo(() => 
    yieldData.filter(c => selectedCountries.includes(c.countryCode)),
    [yieldData, selectedCountries]
  );

  const getYieldChange = (country: string, maturity: number): number | null => {
    if (!previousYieldData) return null;
    
    const current = yieldData.find(c => c.country === country);
    const previous = previousYieldData.find(c => c.country === country);
    
    if (!current || !previous) return null;
    
    const currentYield = current.data.find(d => d.maturity === maturity)?.yield;
    const previousYield = previous.data.find(d => d.maturity === maturity)?.yield;
    
    if (currentYield === undefined || previousYield === undefined) return null;
    
    return parseFloat((currentYield - previousYield).toFixed(2));
  };

  const formatMaturity = (maturity: number) => {
    if (maturity < 1) return `${maturity * 12}M`;
    return `${maturity}Y`;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.75rem',
        }}>
          <thead style={{
            position: 'sticky',
            top: 0,
            background: 'var(--card-background)',
            zIndex: 1,
          }}>
            <tr>
              <th style={{
                padding: '0.625rem 0.75rem',
                textAlign: 'left',
                fontWeight: 600,
                color: 'var(--text-color)',
                borderBottom: '2px solid var(--border-color)',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Maturity
              </th>
              {filteredData.map((country) => (
                <th
                  key={country.countryCode}
                  style={{
                    padding: '0.625rem 0.75rem',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: country.color,
                    borderBottom: `2px solid ${country.color}`,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {country.countryCode}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {maturities.map((maturity) => (
              <tr
                key={maturity}
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-background)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{
                  padding: '0.625rem 0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-color)',
                  fontSize: '0.75rem',
                }}>
                  {formatMaturity(maturity)}
                </td>
                {filteredData.map((country) => {
                  const yieldValue = country.data.find(d => d.maturity === maturity)?.yield;
                  const change = getYieldChange(country.country, maturity);
                  
                  return (
                    <td
                      key={country.countryCode}
                      style={{
                        padding: '0.625rem 0.75rem',
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <span style={{
                          fontWeight: 600,
                          color: 'var(--text-color)',
                          fontSize: '0.8125rem',
                        }}>
                          {yieldValue?.toFixed(2)}%
                        </span>
                        {change !== null && change !== 0 && (
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            color: change > 0 ? '#F44336' : '#4CAF50',
                          }}>
                            {change > 0 ? '+' : ''}{change.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  );
}
