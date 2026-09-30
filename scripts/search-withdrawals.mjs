import fs from 'fs';
import path from 'path';

function findInDir(dir, pattern) {
  const results = [];
  try {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of list) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '.next') {
        results.push(...findInDir(fullPath, pattern));
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js') || entry.name.endsWith('.mjs'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (pattern.test(content)) {
          results.push(fullPath.replace(/\\/g, '/'));
        }
      }
    }
  } catch (err) {}
  return results;
}

console.log('Files with minWithdrawal / withdrawal / bank profile:');
console.log(JSON.stringify(findInDir('.', /minWithdrawal|minimum_withdrawal|WithdrawalService|partner_bank_profiles|handleWithdraw/i), null, 2));
