const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function dumpRawText(filePath) {
    console.log(`\n--- Dumping Raw Text from ${filePath} ---`);
    try {
        const buffer = fs.readFileSync(filePath);
        const data = await pdf(buffer);
        fs.writeFileSync(filePath + '.txt', data.text);
        console.log(`Saved raw text to ${filePath}.txt (${data.text.length} chars)`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
}

(async () => {
    const invescoPath = path.join(process.cwd(), 'invesco_test.bin');
    if (fs.existsSync(invescoPath)) {
        await dumpRawText(invescoPath);
    }
})();
