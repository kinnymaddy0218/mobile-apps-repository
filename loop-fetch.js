const categories = ['mid-cap', 'small-cap', 'flexi-cap', 'elss', 'index', 'hybrid', 'debt', 'liquid'];
(async () => {
    for (let cat of categories) {
        console.log('▶️ Fetching mathematical rankings for', cat);
        try {
            const res = await fetch('http://localhost:3001/api/cron/update-rankings?category=' + cat);
            const text = await res.json();
            console.log('✅ Success:', text.message);
        } catch (e) {
            console.log('❌ Failed:', e.message);
        }
    }
})();
