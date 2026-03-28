// lib/benchmarks.js

// Map mutual fund categories to proxy Index Funds or ETFs available on mfapi.in
// This ensures we have free, live historical NAV data to compute benchmark metrics.

export const BENCHMARK_MAP = {
    // Core Equity Indices
    'Nifty 50': { name: 'Nifty 50 TRI', schemeCode: '120716', yahooSymbol: '^NSEI' }, // UTI Nifty 50 Index Direct
    'Nifty 100': { name: 'Nifty 100 TRI', schemeCode: '149868', yahooSymbol: '^CNX100' },
    'Nifty Midcap 150': { name: 'Nifty Midcap 150 TRI', schemeCode: '147622', yahooSymbol: '^NSEMDCP50' }, // Proxy with Midcap 50 for index level
    'Nifty Smallcap 250': { name: 'Nifty Smallcap 250 TRI', schemeCode: '148519', yahooSymbol: 'NIFTYSMLCAP250.NS' },
    'Nifty 500': { name: 'Nifty 500 TRI', schemeCode: '147625', yahooSymbol: '^CRSLDX' },
    'Sensex': { name: 'S&P BSE Sensex TRI', schemeCode: '120712', yahooSymbol: '^BSESN' }, // UTI Sensex Index Direct
    'Nifty Total Market': { name: 'Nifty Total Market TRI', schemeCode: '152092' },
    'Nifty Next 50': { name: 'Nifty Next 50 TRI', schemeCode: '120684' },
    'Nifty LargeMidcap 250': { name: 'Nifty LargeMidcap 250 TRI', schemeCode: '152976' }, // Proxy: Mirae Asset Nifty LargeMidcap 250 Index
    
    // Factor / Strategy Indices
    'Momentum': { name: 'Nifty 200 Momentum 30 TRI', schemeCode: '148703' }, // UTI Momentum 30 Direct
    'Low Volatility': { name: 'Nifty 100 Low Volatility 30 TRI', schemeCode: '148822' }, // ICICI Low Vol 30 Direct
    'Quality': { name: 'Nifty 200 Quality 30 TRI', schemeCode: '152859' }, // UTI Quality 30 Direct
    'Alpha Low Vol': { name: 'Nifty Alpha Low Volatility 30 TRI', schemeCode: '149158' }, // ICICI Alpha Low Vol 30 Direct
    'Equal Weight': { name: 'Nifty 50 Equal Weight TRI', schemeCode: '141877' }, // DSP Equal Weight Direct
    'Dividend Yield': { name: 'Nifty Dividend Opportunities 50 TRI', schemeCode: '128639' }, // Nippon ETF Proxy
    
    // Sectoral / Thematic
    'Banking': { name: 'Nifty Bank TRI', schemeCode: '149858' }, // ICICI Bank Index Direct
    'Financial Services': { name: 'Nifty Financial Services TRI', schemeCode: '149858' }, // Proxy
    'Pharma': { name: 'Nifty Healthcare TRI', schemeCode: '150930' }, // ICICI Pharma Index Direct
    'IT': { name: 'Nifty IT TRI', schemeCode: '150468' }, // ICICI IT Index Direct
    'Auto': { name: 'Nifty Auto TRI', schemeCode: '150643' }, // ICICI Auto Index Direct
    'PSU': { name: 'Nifty PSU TRI', schemeCode: '152350' }, // HDFC PSU Bank ETF Proxy
    'Infrastructure': { name: 'Nifty Infrastructure TRI', schemeCode: '147625' }, // Fallback to Nifty 500
    'Manufacturing': { name: 'Nifty India Manufacturing TRI', schemeCode: '150515' }, // Navi Manufacturing Direct
    'Consumption': { name: 'Nifty India Consumption TRI', schemeCode: '152066' }, // HDFC Nifty Consumption Index
    
    // International
    'S&P 500': { name: 'S&P 500 TRI (US)', schemeCode: '148381' }, // Motilal S&P 500 Direct
    'NASDAQ 100': { name: 'NASDAQ 100 TRI (US)', schemeCode: '149219' }, // ICICI NASDAQ 100 Direct
    'China': { name: 'Greater China Equity', schemeCode: '140243' }, // Edelweiss China Direct
    
    // Hybrid / Debt
    'Balanced Advantage': { name: 'Balanced Advantage Index', schemeCode: '120377' }, // ICICI BAF Direct
    'Aggressive Hybrid': { name: 'Aggressive Hybrid Index (65:35)', schemeCode: '120251' }, // ICICI Equity & Debt Direct
    'Liquid': { name: 'Liquid Fund Index', schemeCode: '118701' }, // Nippon Liquid Direct
    'Debt': { name: 'Debt Index', schemeCode: '118701' }, // Proxy
    
    // Default Fallback
    'default': { name: 'Nifty 50 TRI', schemeCode: '120716' }
};

export function getBenchmarkForCategory(category, fundName = '') {
    if (!category && !fundName) return BENCHMARK_MAP['default'];

    const lowerCat = (category || '').toLowerCase();
    const lowerName = (fundName || '').toLowerCase();
    const combined = `${lowerCat} ${lowerName}`;

    // 1. International
    if (combined.includes('s&p 500') || combined.includes('sp 500')) return BENCHMARK_MAP['S&P 500'];
    if (combined.includes('nasdaq')) return BENCHMARK_MAP['NASDAQ 100'];
    if (combined.includes('china')) return BENCHMARK_MAP['China'];
    if (combined.includes('usa') || combined.includes('us equity')) return BENCHMARK_MAP['S&P 500'];

    // 2. Strategy / Factor
    if (combined.includes('momentum')) return BENCHMARK_MAP['Momentum'];
    if (combined.includes('low volatility') || combined.includes('low vol')) {
        if (combined.includes('alpha')) return BENCHMARK_MAP['Alpha Low Vol'];
        return BENCHMARK_MAP['Low Volatility'];
    }
    if (combined.includes('quality')) return BENCHMARK_MAP['Quality'];
    if (combined.includes('equal weight')) return BENCHMARK_MAP['Equal Weight'];
    if (combined.includes('dividend')) return BENCHMARK_MAP['Dividend Yield'];
    if (combined.includes('alpha')) return BENCHMARK_MAP['Momentum']; // Many Alpha funds are momentum-style

    // 3. Cap-based (Priority)
    // Use regex to match variations like "large & mid cap", "large and midcap", "largemidcap"
    if (/(large\s*(?:&|and)\s*mid\s*cap?)|largemidcap/i.test(combined)) return BENCHMARK_MAP['Nifty LargeMidcap 250'];
    if (combined.includes('mid cap') || combined.includes('midcap')) return BENCHMARK_MAP['Nifty Midcap 150'];
    if (combined.includes('small cap') || combined.includes('smallcap')) return BENCHMARK_MAP['Nifty Smallcap 250'];
    if (combined.includes('next 50')) return BENCHMARK_MAP['Nifty Next 50'];
    
    if (combined.includes('large cap') || combined.includes('largecap')) {
        if (combined.includes('index') || combined.includes('bluechip')) return BENCHMARK_MAP['Nifty 50'];
        return BENCHMARK_MAP['Nifty 100'];
    }
    
    if (combined.includes('flexi cap') || combined.includes('multi cap') || combined.includes('elss') || 
        combined.includes('focused') || combined.includes('value') || combined.includes('contra')) {
        return BENCHMARK_MAP['Nifty 500'];
    }

    if (combined.includes('total market')) return BENCHMARK_MAP['Nifty Total Market'];

    // 4. Sectoral
    if (/\bit\b/.test(combined) || combined.includes('technology')) return BENCHMARK_MAP['IT'];
    if (combined.includes('bank') || combined.includes('financial')) return BENCHMARK_MAP['Banking'];
    if (combined.includes('health') || combined.includes('pharma')) return BENCHMARK_MAP['Pharma'];
    if (combined.includes('infra')) return BENCHMARK_MAP['Infrastructure'];
    if (combined.includes('energy')) return BENCHMARK_MAP['Infrastructure']; // Fallback
    if (combined.includes('psu')) return BENCHMARK_MAP['PSU'];
    if (combined.includes('auto')) return BENCHMARK_MAP['Auto'];
    if (combined.includes('manufacturing')) return BENCHMARK_MAP['Manufacturing'];
    if (combined.includes('consumption') || combined.includes('fmcg')) return BENCHMARK_MAP['Consumption'];

    // 5. Hybrid / Debt
    if (combined.includes('balanced advantage') || combined.includes('dynamic asset')) return BENCHMARK_MAP['Balanced Advantage'];
    if (combined.includes('aggressive hybrid')) return BENCHMARK_MAP['Aggressive Hybrid'];
    if (combined.includes('liquid')) return BENCHMARK_MAP['Liquid'];
    if (combined.includes('debt') || combined.includes('gilt') || combined.includes('conservative hybrid')) return BENCHMARK_MAP['Debt'];

    // 6. Generic Fallbacks
    if (combined.includes('equity')) return BENCHMARK_MAP['Nifty 500'];

    return BENCHMARK_MAP['default'];
}
