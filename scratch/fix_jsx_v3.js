const fs = require('fs');

function fixFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  
  // The PowerShell `f in backtick-f created a form-feed char (0x0C)
  // Pattern: key={\x0Cile-}  should be  key={"file-" + idx}
  // Pattern: alt={\x0CMedia } should be alt={"Media " + idx}  (already fixed for edit page)
  
  // Fix key pattern with form-feed
  content = content.replace(/key=\{\x0Cile-\}/g, 'key={"file-" + idx}');
  
  // Fix alt pattern with form-feed (if still present)
  content = content.replace(/alt=\{\x0CMedia \}/g, 'alt={"Media " + idx}');
  
  // Also fix the backtick-f variants that show as literal \f
  content = content.replace(/key=\{\\file-\}/g, 'key={"file-" + idx}');
  content = content.replace(/alt=\{\\fMedia \}/g, 'alt={"Media " + idx}');

  fs.writeFileSync(path, content, 'utf8');
  
  // Verify
  const after = fs.readFileSync(path, 'utf8');
  console.log(path);
  console.log('  Has form-feed char:', after.includes('\x0C'));
  console.log('  Has correct key:', after.includes('key={"file-" + idx}'));
  console.log('  Has correct alt:', after.includes('alt={"Media " + idx}'));
}

fixFile('C:/Users/ACER/Desktop/autolearn-spot/app/author/products/[id]/edit/page.tsx');
fixFile('C:/Users/ACER/Desktop/autolearn-spot/app/author/products/new/page.tsx');
