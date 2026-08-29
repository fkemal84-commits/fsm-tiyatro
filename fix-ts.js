const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Fix res.error / res?.error
  content = content.replace(/if\s*\(\s*([a-zA-Z0-9_]+)\.error\s*\)/g, "if ('error' in $1 && $1.error)");
  content = content.replace(/if\s*\(\s*([a-zA-Z0-9_]+)\?\.error\s*\)/g, "if ($1 && 'error' in $1 && $1.error)");
  
  // Fix res.success / res?.success
  content = content.replace(/if\s*\(\s*([a-zA-Z0-9_]+)\.success\s*\)/g, "if ('success' in $1 && $1.success)");
  content = content.replace(/if\s*\(\s*([a-zA-Z0-9_]+)\?\.success\s*\)/g, "if ($1 && 'success' in $1 && $1.success)");
  
  // Also fix uses of res.message, res.likes, res.photoUrl, res.sentCount, res.ticketId
  const props = ['message', 'likes', 'photoUrl', 'sentCount', 'ticketId'];
  props.forEach(prop => {
    const regex = new RegExp(`([a-zA-Z0-9_]+)\\.${prop}`, 'g');
    content = content.replace(regex, `('error' in $1 ? undefined : ($1 as any).${prop})`);
  });

  fs.writeFileSync(filePath, content, 'utf8');
}

const filesToFix = [
  "src/app/members/tickets/scan/page.tsx",
  "src/app/members/tickets/TicketClientView.tsx",
  "src/app/profile/ProfileClient.tsx",
  "src/app/register/page.tsx",
  "src/app/reset-password/page.tsx",
  "src/components/AttendanceManager.tsx",
  "src/components/BlogInteractions.tsx",
  "src/components/JoinEventButton.tsx",
  "src/components/ScriptVault.tsx",
  "src/components/SiteConfigForm.tsx",
  "src/components/TeamNeedApplyButton.tsx",
  "src/components/TestPushButton.tsx",
  "src/components/UserPlaysManager.tsx"
];

filesToFix.forEach(fixFile);
console.log("Fixed files!");
