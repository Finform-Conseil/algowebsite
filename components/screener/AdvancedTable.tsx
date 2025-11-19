'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnOrderState,
} from '@tanstack/react-table';
import { StockScreenerItem } from '@/core/data/StockScreener';
import StockHoverCard from './StockHoverCard';

interface AdvancedTableProps {
  data: StockScreenerItem[];
  onSelectRows: (rows: StockScreenerItem[]) => void;
  selectedRows: StockScreenerItem[];
  splitViewEnabled: boolean;
  onToggleSplitView: (enabled: boolean) => void;
  onCompare: () => void;
}

export default function AdvancedTable({ data, onSelectRows, selectedRows, splitViewEnabled, onToggleSplitView, onCompare }: AdvancedTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [density, setDensity] = useState<'compact' | 'normal' | 'comfortable'>('normal');
  const [rowSelection, setRowSelection] = useState({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  const columns = useMemo<ColumnDef<StockScreenerItem>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        size: 40,
        enableSorting: false,
      },
      {
        accessorKey: 'ticker',
        header: 'Ticker',
        cell: (info) => {
          const stock = info.row.original;
          return (
            <StockHoverCard stock={stock}>
              <span className="ticker-cell">{info.getValue() as string}</span>
            </StockHoverCard>
          );
        },
        size: 80,
      },
      {
        accessorKey: 'name',
        header: 'Nom',
        size: 150,
      },
      {
        accessorKey: 'sector',
        header: 'Secteur',
        size: 120,
      },
      {
        accessorKey: 'price',
        header: 'Prix',
        cell: (info) => `${(info.getValue() as number).toFixed(2)} €`,
        size: 90,
      },
      {
        accessorKey: 'changePercent',
        header: 'Var %',
        cell: (info) => {
          const value = info.getValue() as number;
          const className = value >= 0 ? 'change-positive' : 'change-negative';
          return (
            <span className={className}>
              {value >= 0 ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
            </span>
          );
        },
        size: 90,
      },
      {
        accessorKey: 'marketCap',
        header: 'Cap. (Md€)',
        cell: (info) => <span className="gold">{info.getValue() as number}</span>,
        size: 100,
      },
      {
        accessorKey: 'pe',
        header: 'P/E',
        cell: (info) => (info.getValue() as number).toFixed(1),
        size: 70,
      },
      {
        accessorKey: 'roe',
        header: 'ROE',
        cell: (info) => {
          const value = info.getValue() as number;
          return <span className={value > 20 ? 'positive' : ''}>{value.toFixed(1)}%</span>;
        },
        size: 70,
      },
      {
        accessorKey: 'revenue5YGrowth',
        header: 'Crois. 5A',
        cell: (info) => {
          const value = info.getValue() as number;
          return <span className={value > 30 ? 'positive' : ''}>{value.toFixed(1)}%</span>;
        },
        size: 90,
      },
      {
        accessorKey: 'cashFlow',
        header: 'CF (M€)',
        cell: (info) => {
          const value = info.getValue() as number;
          return (
            <span className={value > 0 ? 'positive' : 'negative'}>
              {(value / 1000).toFixed(1)}Md
            </span>
          );
        },
        size: 90,
      },
      {
        accessorKey: 'debtTrend',
        header: 'Dette',
        cell: (info) => {
          const value = info.getValue() as string;
          return (
            <span className={`trend-badge trend-badge--${value}`}>
              {value === 'decreasing' ? '↓' : value === 'increasing' ? '↑' : '→'}
            </span>
          );
        },
        size: 70,
      },
      {
        accessorKey: 'dividendYield',
        header: 'Div %',
        cell: (info) => `${(info.getValue() as number).toFixed(2)}%`,
        size: 70,
      },
      {
        accessorKey: 'analystRating',
        header: 'Rating',
        cell: (info) => {
          const value = info.getValue() as string;
          return (
            <span className={`rating-badge rating-badge--${value.toLowerCase().replace(' ', '-')}`}>
              {value}
            </span>
          );
        },
        size: 110,
      },
    ],
    []
  );

  // Filtrer les données selon la recherche
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((stock) => 
      stock.name.toLowerCase().includes(query) || 
      stock.ticker.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnOrder,
      rowSelection,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  });

  // Mettre à jour les lignes sélectionnées
  useMemo(() => {
    const selected = table.getSelectedRowModel().rows.map((row) => row.original);
    onSelectRows(selected);
  }, [rowSelection, table, onSelectRows]);

  const densityClasses = {
    compact: 'table-compact',
    normal: 'table-normal',
    comfortable: 'table-comfortable',
  };

  return (
    <div className="advanced-table-container">
      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="table-toolbar__left">
          {/* Search */}
          <div className="table-toolbar__search">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-small"
            />
          </div>

          {/* View Mode */}
          <div className="table-toolbar__view-mode">
            <button
              className={`toolbar-btn ${!splitViewEnabled ? 'active' : ''}`}
              onClick={() => onToggleSplitView(false)}
              title="Tableau seul"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </button>
            <button
              className={`toolbar-btn ${splitViewEnabled ? 'active' : ''}`}
              onClick={() => onToggleSplitView(true)}
              title="Split View"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="18" rx="1" />
              </svg>
            </button>
          </div>

          {/* Density */}
          <div className="table-toolbar__density-buttons">
            <button
              className={`toolbar-btn ${density === 'compact' ? 'active' : ''}`}
              onClick={() => setDensity('compact')}
              title="Compact"
            >
              ━
            </button>
            <button
              className={`toolbar-btn ${density === 'normal' ? 'active' : ''}`}
              onClick={() => setDensity('normal')}
              title="Normal"
            >
              ≡
            </button>
            <button
              className={`toolbar-btn ${density === 'comfortable' ? 'active' : ''}`}
              onClick={() => setDensity('comfortable')}
              title="Confortable"
            >
              ☰
            </button>
          </div>

          {/* Column Selector */}
          <div className="table-toolbar__column-selector">
            <button
              className="toolbar-btn"
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              title="Colonnes"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="4" y2="18" />
                <line x1="12" y1="6" x2="12" y2="18" />
                <line x1="20" y1="6" x2="20" y2="18" />
              </svg>
            </button>
            {showColumnSelector && (
              <div className="column-selector-dropdown">
                {table.getAllLeafColumns().filter(col => col.id !== 'select').map((column) => (
                  <label key={column.id} className="column-selector-item">
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                    />
                    <span>{typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="table-toolbar__right">
          {Object.keys(rowSelection).length > 0 && (
            <>
              <span className="table-toolbar__selected">
                {Object.keys(rowSelection).length} sélectionnée(s)
              </span>
              {Object.keys(rowSelection).length >= 2 && (
                <button className="toolbar-btn compare-btn-small" onClick={onCompare} title="Comparer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="8" cy="8" r="3" />
                    <circle cx="16" cy="16" r="3" />
                    <line x1="10" y1="10" x2="14" y2="14" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={`table-wrapper ${densityClasses[density]}`}>
        <table className="advanced-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={header.column.getCanSort() ? 'sortable' : ''}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="th-content">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          <span className="sort-indicator">
                            {header.column.getIsSorted() === 'asc' ? ' ▲' : ' ▼'}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={row.getIsSelected() ? 'selected-row' : ''}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} style={{ width: cell.column.getSize() }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
