import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync } from 'fs';
import { generateMarketImpactMD } from '../lib/report-generator.js';

// Configuration
const UID = 'UbV7npYDChgP1yFIWJDmk81Zqd62'; // User UID obtained from environment
const PROJECT_ID = 'mf-research-india-b9c14';

// Note: In a real production environment, we would use service account credentials.
// For this environment, we assume the Firebase Admin SDK is already authenticated via CLI.
// Or we can use the default credential if running on a GCP environment.
const app = initializeApp({
  projectId: PROJECT_ID,
});

const db = getFirestore(app);

async function syncAnalysis() {
    console.log(`📡 Connecting to Firestore: ${PROJECT_ID}...`);
    
    try {
        const docRef = db.collection('user_portfolios').doc(UID);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            console.error('❌ No portfolio found for this user.');
            return;
        }
        
        const data = doc.data();
        const funds = data.funds || [];
        
        // Calculate basic metrics for the report
        let totalValuation = 0;
        let weightedAlpha = 0;
        let weightedBeta = 0;
        
        funds.forEach(f => {
            totalValuation += f.valuation || 0;
        });
        
        funds.forEach(f => {
            const weight = (f.valuation / totalValuation) * 100;
            weightedAlpha += (f.alpha || 0) * (weight / 100);
            weightedBeta += (f.beta || 0) * (weight / 100);
            f.weight = weight; // Inject calculated weight
        });

        const metrics = {
            weightedAlpha,
            weightedBeta: weightedBeta || 1.0, // Default to 1.0 if not available
            totalValuation,
            funds,
            riskAppetite: 'Moderate', // Mocking for now, could fetch from user profile
            investmentHorizon: 5
        };

        console.log('✍️ Generating Markdown content...');
        const mdContent = generateMarketImpactMD(metrics);
        
        const filePath = './market_impact_analysis.md';
        writeFileSync(filePath, mdContent);
        
        console.log(`✅ Success! Analysis saved to ${filePath}`);
    } catch (error) {
        console.error('❌ Error syncing analysis:', error);
    }
}

syncAnalysis();
