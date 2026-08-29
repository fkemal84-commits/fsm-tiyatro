const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/if\s*\(\s*([a-zA-Z0-9_]+)\.error\s*\)/g, "if ('error' in $1 && $1.error)");
  content = content.replace(/if\s*\(\s*([a-zA-Z0-9_]+)\?\.error\s*\)/g, "if ($1 && 'error' in $1 && $1.error)");
  
  content = content.replace(/if\s*\(\s*([a-zA-Z0-9_]+)\.success\s*\)/g, "if ('success' in $1 && $1.success)");
  content = content.replace(/if\s*\(\s*([a-zA-Z0-9_]+)\?\.success\s*\)/g, "if ($1 && 'success' in $1 && $1.success)");
  
  const props = ['message', 'likes', 'photoUrl', 'sentCount', 'ticketId', 'seats', 'tickets'];
  props.forEach(prop => {
    const regex = new RegExp(`([a-zA-Z0-9_]+)\\.${prop}`, 'g');
    content = content.replace(regex, `('error' in $1 ? undefined : ($1 as any).${prop})`);
  });

  fs.writeFileSync(filePath, content, 'utf8');
}

const filesToFix = [
  "src/app/biletimi-bul/page.tsx",
  "src/app/forgot-password/page.tsx",
  "src/components/UserPlaysManager.tsx"
];

filesToFix.forEach(fixFile);
console.log("Fixed more files!");
