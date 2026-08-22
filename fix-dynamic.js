const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src/app').filter(f => f.endsWith('page.tsx') || f.endsWith('page.ts'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('getServerSession') && !content.includes('force-dynamic')) {
        console.log('Fixing: ', file);
        // import satırlarından sonra force-dynamic ekleyelim
        const lines = content.split('\n');
        let insertIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) {
                insertIndex = i + 1;
            }
        }
        lines.splice(insertIndex, 0, '\nexport const dynamic = "force-dynamic";\n');
        fs.writeFileSync(file, lines.join('\n'));
    }
});
console.log('Done.');
