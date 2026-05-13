'use client';

interface ScreenerHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onResetFilters: () => void;
  onSave?: () => void;
  onShare?: () => void;
}

export default function ScreenerHeader({
  searchValue,
  onSearchChange,
  onResetFilters,
  onSave,
  onShare
}: ScreenerHeaderProps) {

  return (
    <div className="opcvm-screener-header">
      {/* Hero Section with Slider */}
      <div 
        className="header-hero"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7))`,
        }}
      >
        <div className="header-top">
            <div className="header-title">
              <h1>Stock Screener</h1>
              <p>Filter and analyze African stocks with advanced criteria</p>
            </div>
        

          <div className="header-actions">
            <div className="search-bar">
              <div className="search-input-wrapper">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, ticker or sector..."
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchValue && (
                  <button
                    className="clear-search"
                    onClick={() => onSearchChange('')}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <button className="btn-secondary" onClick={onResetFilters}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              Reset
            </button>
            {onSave && (
              <button className="btn-secondary" onClick={onSave}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                Save
              </button>
            )}
            {onShare && (
              <button className="btn-secondary" onClick={onShare}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Share
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
