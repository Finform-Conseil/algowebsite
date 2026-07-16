/**
 * [TENOR 2026] VOLATILITY ENGINE - HDR GRADE 
 * Standard quantitative formulas for Historical Volatility (HV).
 */

/**
 * Calculates Annualized Historical Volatility using Log-Returns.
 * 
 * Formula:
 * 1. Log Returns: r_i = ln(P_i / P_{i-1})
 * 2. Standard Deviation of r_i (std_dev)
 * 3. Annualization: std_dev * sqrt(252)
 * 
 * @param prices Array of closing prices (chronological order)
 * @param window Number of trading days for the window
 * @returns Annualized volatility as a percentage (e.g., 25.5 for 25.5%)
 */
export const calculateAnnualizedVolatility = (prices: number[], window: number): number => {
    if (prices.length < window + 1 || window < 2) return 0;

    // 1. Get the sub-set of prices needed (last 'window + 1' prices to get 'window' returns)
    const subset = prices.slice(-(window + 1));
    
    // 2. Calculate Log Returns
    const logReturns: number[] = [];
    for (let i = 1; i < subset.length; i++) {
        const prev = subset[i - 1];
        const curr = subset[i];
        if (prev > 0 && curr > 0) {
            logReturns.push(Math.log(curr / prev));
        }
    }

    if (logReturns.length < 2) return 0;

    // 3. Calculate Mean of Log Returns
    const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;

    // 4. Calculate Variance
    const variance = logReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (logReturns.length - 1);

    // 5. Daily Standard Deviation
    const dailyStdDev = Math.sqrt(variance);

    // 6. Annualized Volatility (sqrt(252))
    const TRADING_DAYS_PER_YEAR = 252;
    const annualizedVol = dailyStdDev * Math.sqrt(TRADING_DAYS_PER_YEAR);

    return Number((annualizedVol * 100).toFixed(2));
};

/**
 * Generates the Term Structure of Volatility.
 * Default maturities: 1W (5d), 2W (10d), 1M (21d), 2M (42d), 3M (63d), 6M (126d), 9M (189d), 1Y (252d).
 */
export const getVolatilityTermStructure = (prices: number[]) => {
    const maturities = [
        { label: '1W', days: 5 },
        { label: '2W', days: 10 },
        { label: '1M', days: 21 },
        { label: '2M', days: 42 },
        { label: '3M', days: 63 },
        { label: '6M', days: 126 },
        { label: '9M', days: 189 },
        { label: '1Y', days: 252 },
    ];

    return maturities.map(m => ({
        label: m.label,
        value: calculateAnnualizedVolatility(prices, m.days)
    }));
};
/**
 * Generates the Volatility Curve (Skew) for a given window.
 * Uses a Nadaraya-Watson type Kernel Estimator to smooth volatility across price levels.
 * 
 * @param prices Array of prices
 * @param window Number of days (e.g., 28)
 * @returns Array of { price, volatility } points
 */
export const getVolatilitySkew = (prices: number[], window: number = 28) => {
    if (prices.length < window + 2) return [];

    const subset = prices.slice(-(window + 1));
    const data: { price: number; squaredReturn: number }[] = [];
    const TRADING_DAYS_PER_YEAR = 252;

    // 1. Prepare (Price, SquaredReturn) pairs
    for (let i = 1; i < subset.length; i++) {
        const prev = subset[i - 1];
        const curr = subset[i];
        if (prev > 0 && curr > 0) {
            const logReturn = Math.log(curr / prev);
            data.push({
                price: curr,
                squaredReturn: Math.pow(logReturn, 2)
            });
        }
    }

    if (data.length < 5) return [];

    // 2. Determine price range for the curve
    const minPrice = Math.min(...data.map(d => d.price));
    const maxPrice = Math.max(...data.map(d => d.price));
    const range = maxPrice - minPrice;
    
    // Extend range slightly for better visualization (10% on each side)
    const plotMin = minPrice - range * 0.1;
    const plotMax = maxPrice + range * 0.1;
    
    // 3. Kernel Smoothing (Gaussian Kernel)
    const points: { price: number; value: number }[] = [];
    const numPoints = 25; // More points for a smoother appearance
    const h = range * 0.30; // [TENOR 2026] Increased bandwidth for HDR Smoothing (0.15 -> 0.30)

    for (let i = 0; i <= numPoints; i++) {
        const x = plotMin + (i * (plotMax - plotMin) / numPoints);
        
        let numerator = 0;
        let denominator = 0;

        for (const d of data) {
            // Gaussian kernel: K(u) = exp(-0.5 * u^2)
            const u = (d.price - x) / h;
            const weight = Math.exp(-0.5 * Math.pow(u, 2));
            
            numerator += weight * d.squaredReturn;
            denominator += weight;
        }

        if (denominator > 0) {
            const smoothedVariance = numerator / denominator;
            const vol = Math.sqrt(smoothedVariance * TRADING_DAYS_PER_YEAR) * 100;
            points.push({ 
                price: Number(x.toFixed(2)), 
                value: Number(vol.toFixed(2)) 
            });
        }
    }

    return points;
};
