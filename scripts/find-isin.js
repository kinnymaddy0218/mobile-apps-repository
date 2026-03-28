const fetch = require('node-fetch');

async function findByIsin() {
    const isin = 'INF200K01VG3';
    // We don't have a direct ISIN search API on mfapi.in, 
    // but some other APIs might have it or we can try to find it.
    // Actually, let's just use the mfapi.in search if it has one.
    // It doesn't. So I'll try some common codes.
    const codes = ['119551', '103504', '120465', '118668', '118778', '120465'];
    console.log("Searching for ISIN", isin);
}
findByIsin();
