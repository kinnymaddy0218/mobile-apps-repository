
const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\maddy\\OneDrive\\Documents\\Antigravity\\mf-research\\app\\portfolio\\page.js', 'utf8');

let stack = [];
const lines = content.split('\n');

lines.forEach((line, i) => {
    // Very basic tag parser
    let pos = 0;
    while (true) {
        let openIdx = line.indexOf('<div', pos);
        let closeIdx = line.indexOf('</div>', pos);

        if (openIdx !== -1 && (closeIdx === -1 || openIdx < closeIdx)) {
            stack.push({ line: i + 1, tag: 'div' });
            pos = openIdx + 4;
        } else if (closeIdx !== -1) {
            if (stack.length > 0) {
                stack.pop();
            } else {
                console.log(`Extra </div> at line ${i + 1}`);
            }
            pos = closeIdx + 6;
        } else {
            break;
        }
    }
});

console.log(`Unclosed tags: ${stack.length}`);
stack.forEach(s => console.log(`Unclosed ${s.tag} started at line ${s.line}`));
