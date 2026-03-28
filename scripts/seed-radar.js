const admin = require('firebase-admin');

// Note: This script assumes environment variables or default credentials are set
const serviceAccount = require('./service-account.json'); // I'll check if this exists or use default

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function seed() {
    const radarRef = db.collection('market_radar').doc('small-cap-mock');
    await radarRef.set({
        categoryName: 'Small Cap',
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        updates: [
            {
                type: 'new_high',
                schemeCode: '118778', // Corrected from 120828
                schemeName: 'Nippon India Small Cap Fund',
                category: 'Small Cap',
                message: 'is trading near its all-time high! (Simulated)',
                severity: 'info',
                timestamp: Date.now()
            },
            {
                type: 'top_gainer',
                schemeCode: '120828', // This is actually Quant Small Cap
                schemeName: 'Quant Small Cap Fund',
                category: 'Small Cap',
                message: 'is showing strong momentum!',
                severity: 'success',
                timestamp: Date.now()
            }
        ]
    });
    console.log('Mock radar data seeded successfully!');
}

seed().catch(console.error);
