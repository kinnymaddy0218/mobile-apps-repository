
async function checkCodes() {
    const res = await fetch('https://api.mfapi.in/mf');
    const data = await res.json();

    console.log("Searching for Nippon India Small Cap Direct Growth...");
    const nippon = data.filter(f =>
        f.schemeName.toLowerCase().includes('nippon') &&
        f.schemeName.toLowerCase().includes('small cap') &&
        f.schemeName.toLowerCase().includes('direct') &&
        f.schemeName.toLowerCase().includes('growth')
    );
    console.log(JSON.stringify(nippon, null, 2));

    console.log("\nSearching for Quant Small Cap Direct Growth...");
    const quant = data.filter(f =>
        f.schemeName.toLowerCase().includes('quant') &&
        f.schemeName.toLowerCase().includes('small cap') &&
        f.schemeName.toLowerCase().includes('direct') &&
        f.schemeName.toLowerCase().includes('growth')
    );
    console.log(JSON.stringify(quant, null, 2));

    console.log("\nChecking what code 120828 is...");
    const code120828 = data.filter(f => f.schemeCode == 120828);
    console.log(JSON.stringify(code120828, null, 2));

    console.log("\nChecking what code 118778 is...");
    const code118778 = data.filter(f => f.schemeCode == 118778);
    console.log(JSON.stringify(code118778, null, 2));
}

checkCodes().catch(console.error);
