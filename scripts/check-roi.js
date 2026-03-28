// lib/benchmarks.js

async function checkRoi(schemeCode, name) {
    try {
        const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
        const data = await res.json();
        const navs = data.data || [];
        if (navs.length < 250) {
            console.log(`${name} (${schemeCode}): Not enough data`);
            return;
        }
        const latest = parseFloat(navs[0].nav);
        const oneYearAgo = navs[250]; 
        const roi = ((latest - parseFloat(oneYearAgo.nav)) / parseFloat(oneYearAgo.nav)) * 100;
        console.log(`${name} (${schemeCode}): 1Y ROI = ${roi.toFixed(2)}%`);
    } catch (e) {
        console.log(`${name} (${schemeCode}): Error ${e.message}`);
    }
}

async function main() {
    await checkRoi('120586', 'Nifty 50 (Large)');
    await checkRoi('148726', 'Nifty Midcap 150');
    await checkRoi('150468', 'Nifty IT');
}

main();
