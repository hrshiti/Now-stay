const fs = require('fs');
const content = fs.readFileSync('d:/hritik sir/Now-stay/frontend/src/app/partner/pages/AddTentWizard.jsx', 'utf8');

let stack = [];
const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
let match;

while ((match = tagRegex.exec(content)) !== null) {
    const tag = match[0];
    const tagName = match[1];
    
    if (tag.startsWith('</')) {
        if (stack.length === 0) {
            console.log(`Extra closing tag: ${tag} at index ${match.index}`);
        } else {
            const last = stack.pop();
            if (last !== tagName) {
                // console.log(`Mismatch: opened ${last}, closed ${tagName} at index ${match.index}`);
            }
        }
    } else if (tag.endsWith('/>')) {
        // Self-closing, do nothing
    } else {
        stack.push(tagName);
    }
}

if (stack.length > 0) {
    console.log(`Unclosed tags: ${stack.join(', ')}`);
} else {
    console.log('All tags balanced!');
}
