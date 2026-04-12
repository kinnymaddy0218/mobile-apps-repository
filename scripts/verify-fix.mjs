import fetch from 'node-fetch';

async function testCron() {
    const baseUrl = 'http://localhost:3000/api/cron/update-rankings';
    
    console.log('--- Case 1: Unauthorized access ---');
    try {
        const res = await fetch(baseUrl);
        console.log('Status:', res.status, await res.text());
    } catch (e) {
        console.log('Error (expected if server not running):', e.message);
    }

    console.log('\n--- Case 2: Process stalest category ---');
    // Assuming no secret set locally, it might still fail if not running
    try {
        const res = await fetch(`${baseUrl}?secret=test-secret`);
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.log('Error (expected if server not running):', e.message);
    }
}

testCron();
