'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useMacroRepository } from '@/core/infra/repositories/macro.repository.impl';
import { MacroCountryDataEntity, MacroItemTreeNode } from '@/core/domain/entities/macro.entity';
import { PeriodEntity } from '@/core/domain/entities/config.entity';
import { useCountryRepository } from '@/core/infra/repositories/country.repository.impl';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import RadarChart from '@/components/charts/RadarChart';

type AnalysisCategory = 'analysis' | 'reports' | 'insights' | 'updates';
type ViewMode = 'analyses' | 'charts';
type ChartType = 'line' | 'bar' | 'radar';
type ComparisonMode = 'single' | 'comparison';

interface MacroAnalysis {
  id: string;
  title: string;
  category: AnalysisCategory;
  country: string;
  date: string;
  excerpt: string;
  featured: boolean;
}

export default function KeyIndicatorsPage() {
  const { allSectorRealData, getAllSectorReal, isMutationLoading } = useMacroRepository();
  const { allCountriesData, getAllCountries, isMutationLoading: isCountriesLoading } = useCountryRepository();
  const [activeCountryId, setActiveCountryId] = useState<string>('');
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [currentAnalysisIndex, setCurrentAnalysisIndex] = useState(0);
  const [countdown, setCountdown] = useState(15);
  const [viewMode, setViewMode] = useState<ViewMode>('analyses');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [selectedIndicator, setSelectedIndicator] = useState<MacroItemTreeNode | null>(null);
  
  // Comparison mode states
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('single');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [comparisonDataMap, setComparisonDataMap] = useState<Record<string, MacroCountryDataEntity>>({});

  console.log("Component render - isMutationLoading:", isMutationLoading);

  useEffect(() => {
    getAllCountries();
  }, [getAllCountries]);

  useEffect(() => {
    console.log("Countries ", allCountriesData);
  },[allCountriesData]);

  useEffect(() => {
    if (allCountriesData && allCountriesData?.data?.length > 0 && !activeCountryId) {
      setActiveCountryId(allCountriesData.data[0].id);
    }
  }, [allCountriesData, activeCountryId]);

  useEffect(() => {
    if (comparisonMode === 'single' && activeCountryId) {
      console.log("Loading data for country:", activeCountryId);
      getAllSectorReal({ view_type: "country_tree", country_id: activeCountryId });
    }
  }, [activeCountryId, comparisonMode]);

  // Load comparison data when countries are selected
  useEffect(() => {
    if (comparisonMode === 'comparison' && selectedCountries.length > 0) {
      const loadComparisonData = async () => {
        const newDataMap: Record<string, MacroCountryDataEntity> = {};
        
        for (const countryId of selectedCountries) {
          try {
            const result = await getAllSectorReal({ 
              view_type: "country_tree", 
              country_id: countryId 
            });
            
            if (result) {
              newDataMap[countryId] = result as MacroCountryDataEntity;
            }
          } catch (error) {
            console.error(`Error loading data for country ${countryId}:`, error);
          }
        }
        
        setComparisonDataMap(newDataMap);
      };
      
      loadComparisonData();
    } else if (comparisonMode === 'single') {
      // Clear comparison data when switching back to single mode
      setComparisonDataMap({});
    }
  }, [comparisonMode, selectedCountries, getAllSectorReal]);

  const toggleCountrySelection = (countryId: string) => {
    setSelectedCountries(prev => {
      if (prev.includes(countryId)) {
        return prev.filter(id => id !== countryId);
      } else if (prev.length < 3) {
        return [...prev, countryId];
      }
      return prev; // Max 3 countries
    });
  };

  useEffect(() => {
    console.log("Sector Real Data (raw):", allSectorRealData);
    console.log("Type:", typeof allSectorRealData);
    console.log("Keys:", allSectorRealData ? Object.keys(allSectorRealData) : 'undefined');
  }, [allSectorRealData]);

  const activeCountryData = useMemo(() => {
    if (!allSectorRealData) {
      console.log("No data available");
      return null;
    }
    
    console.log("Processing data:", allSectorRealData);
    return allSectorRealData as any;
  }, [allSectorRealData]);

  const availablePeriods = useMemo(() => {
    if (!activeCountryData?.items?.[0]?.values) return [];
    return activeCountryData.items[0].values.map((v: any) => v.period);
  }, [activeCountryData]);

  const selectedPeriods = useMemo(() => {
    if (selectedYears.length === 0) return availablePeriods;
    return availablePeriods.filter((p: PeriodEntity) => p.year && selectedYears.includes(p.year));
  }, [availablePeriods, selectedYears]);

  const toggleYearSelection = (year: number) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        return prev.filter(y => y !== year);
      } else {
        return [...prev, year].sort();
      }
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.querySelector('.years-dropdown');
      const toggle = document.querySelector('.years-toggle');
      
      if (dropdown && toggle && 
          !dropdown.contains(event.target as Node) && 
          !toggle.contains(event.target as Node)) {
        dropdown.classList.remove('open');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const formatValue = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)}B`;
    } else if (absValue >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    return value.toLocaleString();
  };

  const getRowClassName = (level: number): string => {
    if (level === 0) return 'total-row highlight';
    if (level === 1) return 'total-row';
    return '';
  };

  const getIndentClass = (level: number): string => {
    if (level === 0) return '';
    if (level === 1) return 'indent-1';
    if (level === 2) return 'indent-2';
    if (level >= 3) return 'indent-3';
    return '';
  };

  const isNegativeValue = (value: number): boolean => {
    return value < 0;
  };

  const renderMacroItem = (item: MacroItemTreeNode, periods: PeriodEntity[]): JSX.Element[] => {
    const rowClassName = getRowClassName(item.level);
    const labelClassName = `row-label ${getIndentClass(item.level)}`;
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    
    const rows: JSX.Element[] = [];

    rows.push(
      <tr key={item.id} className={rowClassName}>
        <td className={labelClassName}>
          {hasChildren && (
            <button
              onClick={() => toggleExpand(item.id)}
              className="expand-toggle"
              aria-label={isExpanded ? 'Réduire' : 'Développer'}
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
          {item.label}
        </td>
        {periods.map((period: PeriodEntity) => {
          const valueData = item.values.find((v: any) => v.period.id === period.id);
          const numValue = parseFloat(valueData?.value || '0');
          const isNegative = isNegativeValue(numValue);
          
          return (
            <td 
              key={period.id} 
              className={`value ${isNegative ? 'negative' : ''} ${rowClassName.includes('bold') || rowClassName.includes('highlight') ? 'bold' : ''}`}
              title={`${isNegative ? '-' : ''}${Math.abs(numValue)}`}
            >
              {isNegative ? '-' : ''}{formatValue(Math.abs(numValue))}
            </td>
          );
        })}
      </tr>
    );
    
    if (hasChildren && isExpanded) {
      item.children!.forEach((child: MacroItemTreeNode) => {
        rows.push(...renderMacroItem(child, periods));
      });
    }
    
    return rows;
  };

  const renderMacroTable = () => {
    if (!activeCountryData || !activeCountryData.items || activeCountryData.items.length === 0) {
      return (
        <div className="statement-table">
          <div className="no-data">Aucune donnée disponible</div>
        </div>
      );
    }
    
    const currentCountry = allCountriesData?.data?.find((c: any) => c.id === activeCountryId);
    const countryName = currentCountry?.name || 'Pays';
    
    return (
      <div className="statement-table">
        <table>
          <thead>
            <tr>
              <th className="row-header">Indicateurs - {countryName}</th>
              {selectedPeriods.map((period: PeriodEntity) => (
                <th key={period.id} className="period-header">{period.display || period.year}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeCountryData.items.map((item: MacroItemTreeNode) => 
              renderMacroItem(item, selectedPeriods)
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderComparisonTable = () => {
    const comparisonDataArray = Object.values(comparisonDataMap);
    
    if (comparisonDataArray.length === 0) {
      return (
        <div className="statement-table">
          <div className="no-data">Sélectionnez des pays pour comparer</div>
        </div>
      );
    }

    if (selectedPeriods.length === 0) {
      return (
        <div className="statement-table">
          <div className="no-data">Aucune année disponible pour la comparaison</div>
        </div>
      );
    }

    // Récupérer tous les indicateurs uniques (on prend ceux du premier pays comme référence)
    const referenceItems = comparisonDataArray[0]?.items || [];

    const renderComparisonRow = (item: MacroItemTreeNode): JSX.Element[] => {
      const rows: JSX.Element[] = [];
      const rowClassName = getRowClassName(item.level);
      const labelClassName = `row-label ${getIndentClass(item.level)}`;
      const isExpanded = expandedItems.has(item.id);
      const hasChildren = item.children && item.children.length > 0;

      rows.push(
        <tr key={item.id} className={rowClassName}>
          <td className={labelClassName}>
            {hasChildren && (
              <button
                onClick={() => toggleExpand(item.id)}
                className="expand-toggle"
                aria-label={isExpanded ? 'Réduire' : 'Développer'}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
            {item.label}
          </td>
          {/* Pour chaque pays, afficher toutes les années sélectionnées */}
          {selectedCountries.map(countryId => {
            const countryData = comparisonDataMap[countryId];
            if (!countryData) return null;

            return selectedPeriods.map((period: PeriodEntity) => {
              const countryItem = countryData.items.find((i: MacroItemTreeNode) => i.code === item.code);
              const valueData = countryItem?.values.find((v: any) => v.period.year === period.year);
              const numValue = parseFloat(valueData?.value || '0');
              const isNegative = isNegativeValue(numValue);
              
              return (
                <td 
                  key={`${countryId}-${period.id}-${item.id}`}
                  className={`value ${isNegative ? 'negative' : ''} ${rowClassName.includes('bold') || rowClassName.includes('highlight') ? 'bold' : ''}`}
                  title={`${isNegative ? '-' : ''}${Math.abs(numValue)}`}
                >
                  {isNegative ? '-' : ''}{formatValue(Math.abs(numValue))}
                </td>
              );
            });
          })}
        </tr>
      );

      if (hasChildren && isExpanded) {
        item.children!.forEach((child: MacroItemTreeNode) => {
          rows.push(...renderComparisonRow(child));
        });
      }

      return rows;
    };

    return (
      <div className="statement-table comparison-table">
        <table>
          <thead>
            <tr>
              <th className="row-header">Indicateurs</th>
              {/* Pour chaque pays, afficher toutes les années */}
              {selectedCountries.map(countryId => {
                const country = allCountriesData?.data?.find((c: any) => c.id === countryId);
                const countryName = country?.name || 'Pays';
                
                return selectedPeriods.map((period: PeriodEntity) => (
                  <th key={`${countryId}-${period.id}`} className="period-header comparison-country">
                    {countryName} {period.year}
                  </th>
                ));
              })}
            </tr>
          </thead>
          <tbody>
            {referenceItems.map((item: MacroItemTreeNode) => 
              renderComparisonRow(item)
            )}
          </tbody>
        </table>
      </div>
    );
  };


  useEffect(() => {
    if (activeCountryData?.items) {
      const level0Ids = activeCountryData.items
        .filter((item: MacroItemTreeNode) => item.level === 0 && item.children && item.children.length > 0)
        .map((item: MacroItemTreeNode) => item.id);
      
      if (level0Ids.length > 0) {
        setExpandedItems(new Set(level0Ids));
      }
    }
  }, [activeCountryData]);

  const mockAnalyses: MacroAnalysis[] = [
    {
      id: '1',
      title: 'Perspectives économiques 2025 : Croissance soutenue dans la zone UEMOA',
      category: 'analysis',
      country: 'UEMOA',
      date: '2025-05-20',
      excerpt: 'Les prévisions indiquent une croissance moyenne de 6.2% pour la zone UEMOA en 2025, portée par les investissements infrastructurels et la transformation digitale.',
      featured: true
    },
    {
      id: '2',
      title: 'Impact de l\'inflation sur les économies africaines',
      category: 'reports',
      country: 'Afrique',
      date: '2025-05-18',
      excerpt: 'Analyse détaillée des pressions inflationnistes et des mesures de politique monétaire adoptées par les banques centrales africaines.',
      featured: true
    },
    {
      id: '3',
      title: 'Secteur réel : Performance du Bénin au T1 2025',
      category: 'insights',
      country: 'Bénin',
      date: '2025-05-15',
      excerpt: 'Le secteur réel béninois affiche une croissance de 5.8% au premier trimestre, tirée par l\'agriculture et les services.',
      featured: false
    },
    {
      id: '4',
      title: 'Mise à jour des indicateurs monétaires - Mai 2025',
      category: 'updates',
      country: 'BCEAO',
      date: '2025-05-10',
      excerpt: 'Publication des derniers chiffres de la masse monétaire et du crédit à l\'économie dans la zone UEMOA.',
      featured: false
    }
  ];

  const featuredAnalyses = mockAnalyses.filter(a => a.featured);

  // Préparer les données pour les graphiques
  const prepareChartData = () => {
    if (comparisonMode === 'comparison') {
      // Mode comparaison : une série par pays
      const comparisonDataArray = Object.values(comparisonDataMap);
      
      if (comparisonDataArray.length === 0) {
        return null;
      }

      const indicator = selectedIndicator || comparisonDataArray[0]?.items[0];
      if (!indicator) return null;

      const categories = selectedPeriods.map((p: PeriodEntity) => p.year?.toString() || p.display || '');
      
      const series = selectedCountries.map((countryId, idx) => {
        const countryData = comparisonDataMap[countryId];
        const country = allCountriesData?.data?.find((c: any) => c.id === countryId);
        const countryItem = countryData?.items.find((i: MacroItemTreeNode) => i.code === indicator.code);
        
        const values = selectedPeriods.map((p: PeriodEntity) => {
          const valueData = countryItem?.values.find((v: any) => v.period.year === p.year);
          return parseFloat(valueData?.value || '0');
        });

        const colors = ['#3b82f6', '#10b981', '#f59e0b'];
        return {
          name: country?.name || countryData?.country?.name || `Pays ${idx + 1}`,
          values,
          color: colors[idx]
        };
      });

      return { indicator, categories, series };
    } else {
      // Mode simple : une seule série
      if (!activeCountryData?.items || activeCountryData.items.length === 0) {
        return null;
      }

      const indicator = selectedIndicator || activeCountryData.items[0];
      
      const categories = selectedPeriods.map((p: PeriodEntity) => p.year?.toString() || p.display || '');
      const values = selectedPeriods.map((p: PeriodEntity) => {
        const valueData = indicator.values.find((v: any) => v.period.id === p.id);
        return parseFloat(valueData?.value || '0');
      });

      return { 
        indicator, 
        categories, 
        values,
        series: [{
          name: indicator.label,
          values,
          color: '#3b82f6'
        }]
      };
    }
  };

  const prepareRadarData = () => {
    if (!activeCountryData?.items || activeCountryData.items.length === 0) {
      return null;
    }

    // Prendre les 5 premiers indicateurs de niveau 0 pour le radar
    const topIndicators = activeCountryData.items.slice(0, 5);
    const indicators = topIndicators.map((item: MacroItemTreeNode) => item.label);
    
    // Pour chaque année sélectionnée (ou les 3 dernières si aucune sélection), créer une série
    const periodsToUse = selectedPeriods.length > 0 ? selectedPeriods.slice(0, 3) : availablePeriods.slice(0, 3);
    const radarSeries = periodsToUse.map((period: PeriodEntity, idx: number) => {
      const values = topIndicators.map((item: MacroItemTreeNode) => {
        const valueData = item.values.find((v: any) => v.period.id === period.id);
        const value = parseFloat(valueData?.value || '0');
        // Normaliser les valeurs pour le radar (0-100)
        return Math.min(Math.abs(value) / 1000, 100);
      });

      const colors = ['#3b82f6', '#10b981', '#f59e0b'];
      return {
        name: period.year?.toString() || period.display || '',
        values,
        color: colors[idx]
      };
    });

    return { indicators, data: radarSeries };
  };

  const getCategoryLabel = (category: AnalysisCategory): string => {
    const labels: Record<AnalysisCategory, string> = {
      'analysis': 'Analyse',
      'reports': 'Rapport',
      'insights': 'Insights',
      'updates': 'Mise à jour'
    };
    return labels[category];
  };

  const handleAnalysisNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'next') {
      setCurrentAnalysisIndex((prev) => (prev + 1) % featuredAnalyses.length);
    } else {
      setCurrentAnalysisIndex((prev) => (prev - 1 + featuredAnalyses.length) % featuredAnalyses.length);
    }
    setCountdown(15);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCurrentAnalysisIndex((current) => (current + 1) % featuredAnalyses.length);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [featuredAnalyses.length]);

  return (
    <div className="macro-home-page">
      <div className="macro-header-wrapper">
        <div 
          className="macro-header"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7))`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            transition: 'background-image 1s ease-in-out',
          }}
        >
          <div className="header-content">
            <h1>Key Economic Indicators</h1>
            <p>Growth, inflation, employment, and economic conditions</p>
          </div>
          
          <div className="header-filters">
            {/* Mode Toggle */}
            <div className="filter-group">
              <label>Mode</label>
              <div className="mode-toggle">
                <button
                  className={`mode-btn ${comparisonMode === 'single' ? 'active' : ''}`}
                  onClick={() => setComparisonMode('single')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Unique
                </button>
                <button
                  className={`mode-btn ${comparisonMode === 'comparison' ? 'active' : ''}`}
                  onClick={() => setComparisonMode('comparison')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Comparaison
                </button>
              </div>
            </div>

            {/* Country Filter - Single or Multi */}
            {comparisonMode === 'single' ? (
              <div className="filter-group">
                <label>Pays</label>
                <select 
                  value={activeCountryId} 
                  onChange={(e) => setActiveCountryId(e.target.value)}
                  className="filter-select"
                >
                  {allCountriesData?.data?.map((country: any) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="filter-group">
                <label>Pays (max 3)</label>
                <div className="countries-filter">
                  <button 
                    className="countries-toggle"
                    onClick={() => {
                      const dropdown = document.querySelector('.countries-dropdown');
                      dropdown?.classList.toggle('open');
                    }}
                  >
                    {selectedCountries.length === 0 
                      ? 'Sélectionner des pays' 
                      : `${selectedCountries.length} pays sélectionné${selectedCountries.length > 1 ? 's' : ''}`
                    }
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <div className="countries-dropdown">
                    <div className="countries-dropdown-header">
                      <span>Sélectionner les pays</span>
                      {selectedCountries.length > 0 && (
                        <button 
                          className="clear-btn"
                          onClick={() => setSelectedCountries([])}
                        >
                          Tout effacer
                        </button>
                      )}
                    </div>
                    <div className="countries-list">
                      {allCountriesData?.data?.map((country: any) => (
                        <label key={country.id} className="country-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedCountries.includes(country.id)}
                            onChange={() => toggleCountrySelection(country.id)}
                            disabled={!selectedCountries.includes(country.id) && selectedCountries.length >= 3}
                          />
                          <span className="checkbox-custom"></span>
                          <span className="country-label">{country.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="filter-group">
              <label>Années</label>
              <div className="years-filter">
                <button 
                  className="years-toggle"
                  onClick={() => {
                    const btn = document.querySelector('.years-dropdown');
                    btn?.classList.toggle('open');
                  }}
                >
                  {selectedYears.length === 0 
                    ? 'Toutes les années' 
                    : `${selectedYears.length} année${selectedYears.length > 1 ? 's' : ''} sélectionnée${selectedYears.length > 1 ? 's' : ''}`
                  }
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div className="years-dropdown">
                  <div className="years-dropdown-header">
                    <span>Sélectionner les années</span>
                    {selectedYears.length > 0 && (
                      <button 
                        className="clear-btn"
                        onClick={() => setSelectedYears([])}
                      >
                        Tout effacer
                      </button>
                    )}
                  </div>
                  <div className="years-list">
                    {availablePeriods.map((period: PeriodEntity) => (
                      <label key={period.id} className="year-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedYears.includes(period.year!)}
                          onChange={() => toggleYearSelection(period.year!)}
                        />
                        <span className="checkbox-custom"></span>
                        <span className="year-label">{period.year}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="filter-group">
              <label>Vue</label>
              <div className="view-mode-toggle">
                <button
                  className={`toggle-btn ${viewMode === 'analyses' ? 'active' : ''}`}
                  onClick={() => setViewMode('analyses')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  Analyses
                </button>
                <button
                  className={`toggle-btn ${viewMode === 'charts' ? 'active' : ''}`}
                  onClick={() => setViewMode('charts')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  Graphiques
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="macro-content">
        <div className="left-column">
          <div className="macro-indicators">

            <div className="indicators-content">
              {comparisonMode === 'single' ? renderMacroTable() : renderComparisonTable()}
            </div>
          </div>
        </div>

        <div className="right-column">
          {viewMode === 'analyses' ? (
            <>
            <div className="featured-analysis-section">
              <div className="featured-analysis-nav">
                <button
                  onClick={() => handleAnalysisNavigation('prev')}
                  className="nav-arrow"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleAnalysisNavigation('next')}
                  className="nav-arrow"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>

              <div className="countdown-timer">
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 16}`}
                    strokeDashoffset={`${2 * Math.PI * 16 * (1 - countdown / 15)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 20 20)"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <span className="countdown-number">{countdown}</span>
              </div>

            {featuredAnalyses.length > 0 && (
              <div className="featured-analysis-card">
                <div className="featured-analysis-image">
                  <div className="image-placeholder" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
                  <span className={`featured-category category-${featuredAnalyses[currentAnalysisIndex].category}`}>
                    {getCategoryLabel(featuredAnalyses[currentAnalysisIndex].category)}
                  </span>
                </div>
                <div className="featured-analysis-content">
                  <h3>{featuredAnalyses[currentAnalysisIndex].title}</h3>
                  <p>{featuredAnalyses[currentAnalysisIndex].excerpt}</p>
                  <div className="featured-analysis-meta">
                    <span className="meta-country">{featuredAnalyses[currentAnalysisIndex].country}</span>
                    <span className="meta-date">
                      {new Date(featuredAnalyses[currentAnalysisIndex].date).toLocaleDateString('fr-FR', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric' 
                      })}
                    </span>
                    <span className="meta-read">5 min</span>
                  </div>
                  <Link href="/macro" className="read-more-btn">
                    Lire l'analyse →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="recommended-analysis-section">
            <h3 className="recommended-title">Analyses Recommandées</h3>
            <div className="recommended-analysis-grid">
              {mockAnalyses.slice(0, 2).map((analysis) => (
                <Link key={analysis.id} href="/macro" className="recommended-analysis-card">
                  <span className={`analysis-category category-${analysis.category}`}>
                    {getCategoryLabel(analysis.category)}
                  </span>
                  <h4>{analysis.title}</h4>
                  <p>{analysis.excerpt}</p>
                  <div className="recommended-meta">
                    <span>{analysis.country}</span>
                    <span>{new Date(analysis.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          </>
          ) : (
            <div className="charts-section">
              {/* Chart Type Selector */}
              <div className="chart-type-selector">
                <button
                  className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
                  onClick={() => setChartType('line')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  Courbe
                </button>
                <button
                  className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
                  onClick={() => setChartType('bar')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  Histogramme
                </button>
                <button
                  className={`chart-type-btn ${chartType === 'radar' ? 'active' : ''}`}
                  onClick={() => setChartType('radar')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                  Radar
                </button>
              </div>

              {/* Chart Display */}
              <div className="chart-container">
                {chartType === 'line' && (() => {
                  const chartData = prepareChartData();
                  if (!chartData) return <div className="no-data">Aucune donnée disponible</div>;
                  
                  return (
                    <div className="chart-wrapper">
                      <h3 className="chart-title">{chartData.indicator.label}</h3>
                      <LineChart
                        data={{
                          categories: chartData.categories,
                          series: chartData.series
                        }}
                        height="400px"
                      />
                    </div>
                  );
                })()}

                {chartType === 'bar' && (() => {
                  const chartData = prepareChartData();
                  if (!chartData) return <div className="no-data">Aucune donnée disponible</div>;
                  
                  return (
                    <div className="chart-wrapper">
                      <h3 className="chart-title">
                        {chartData.indicator.label}
                        {comparisonMode === 'comparison' && ' - Comparaison'}
                      </h3>
                      <BarChart
                        data={{
                          categories: chartData.categories,
                          values: chartData.values,
                          series: comparisonMode === 'comparison' ? chartData.series : undefined
                        }}
                        height="400px"
                        color="#10b981"
                      />
                    </div>
                  );
                })()}

                {chartType === 'radar' && (() => {
                  const radarData = prepareRadarData();
                  if (!radarData) return <div className="no-data">Aucune donnée disponible</div>;
                  
                  return (
                    <div className="chart-wrapper">
                      <h3 className="chart-title">Comparaison Multi-Indicateurs</h3>
                      <RadarChart
                        indicators={radarData.indicators}
                        data={radarData.data}
                        height="450px"
                      />
                    </div>
                  );
                })()}
              </div>

              {/* Indicator Selector */}
              {chartType !== 'radar' && activeCountryData?.items && (
                <div className="indicator-selector">
                  <label>Sélectionner un indicateur</label>
                  <select
                    value={selectedIndicator?.id || ''}
                    onChange={(e) => {
                      const indicator = activeCountryData.items.find((item: MacroItemTreeNode) => item.id === e.target.value);
                      setSelectedIndicator(indicator || null);
                    }}
                  >
                    {activeCountryData.items.map((item: MacroItemTreeNode) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}