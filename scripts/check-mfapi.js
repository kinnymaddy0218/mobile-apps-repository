const fetch = require('node-fetch');

async function check() {
    const codes = ['119598', '125497', '118668']; 
    for (const code of codes) {
        const res = await fetch(`https://api.mfapi.in/mf/${code}`);
        const data = await res.json();
        console.log(`\n--- Code: ${code} ---`);
        if (data.meta) {
            console.log(JSON.stringify(data.meta, null, 2));
        } else {
            console.log("NOT FOUND");
        }
    }
}

check();
