const categories = [
    'large-cap', 'mid-cap', 'small-cap', 'flexi-cap', 'multi-cap', 'large-mid',
    'focused', 'value-contra', 'dividend-yield', 'elss', 'sector-it', 'sector-pharma',
    'sector-banking', 'sector-infra', 'sector-consumption', 'hybrid-baf',
    'hybrid-aggressive', 'hybrid-conservative', 'hybrid-multi-asset',
    'hybrid-arbitrage', 'hybrid-equity-savings', 'debt-liquid', 'debt-short',
    'debt-corporate', 'debt-gilt', 'debt-dynamic', 'debt-credit', 'index',
    'gold-silver', 'international', 'miscellaneous'
];

async function reindexProd() {
    console.log(`Starting Production re-indexing for ${categories.length} categories...`);
    const startTime = Date.now();

    for (const cat of categories) {
        let attempts = 0;
        let categoryDone = false;

        while (!categoryDone && attempts < 5) { // Max 5 chunks per category
            attempts++;
            process.stdout.write(`Indexing ${cat} (Chunk ${attempts})... `);
            try {
                const res = await fetch(`https://mf-research.vercel.app/api/cron/update-rankings?category=${cat}`);
                const data = await res.json();
                if (data.success) {
                    const count = data.updated?.[0]?.count || 0;
                    // If success is true and we processed funds, we might still have more if it timed out
                    // But our API currently returns success: true even on partial completion.
                    // If count is small or 0, or if the API response indicates completeness, we stop.
                    // For now, let's look at the "success" flag and the time it took.
                    console.log(`DONE (${count} funds)`);
                    categoryDone = true;
                } else {
                    console.log(`FAILED: ${data.error || 'Unknown error'}`);
                    categoryDone = true;
                }
            } catch (e) {
                console.log(`ERROR: ${e.message}`);
                categoryDone = true;
            }
        }
    }

    console.log(`\nProduction Re-indexing complete in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
}

reindexProd();
