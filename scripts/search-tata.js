const fetch = require('node-fetch');

async function searchTata() {
    console.log("Fetching all funds from mfapi.in...");
    const res = await fetch('https://api.mfapi.in/mf');
    const all = await res.json();
    
    const tataFunds = all.filter(f => f.schemeName.toLowerCase().includes('tata digital india') && f.schemeName.toLowerCase().includes('direct'));
    console.log("Tata Digital India Results:");
    console.log(JSON.stringify(tataFunds.slice(0, 5), null, 2));

    const tataBaf = all.filter(f => f.schemeName.toLowerCase().includes('tata balanced advantage') && f.schemeName.toLowerCase().includes('direct'));
    console.log("\nTata Balanced Advantage Results:");
    console.log(JSON.stringify(tataBaf.slice(0, 5), null, 2));
}

searchTata();
