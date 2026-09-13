const fs = require('fs');

function fixFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  
  // Fix 1: key={\file-} -> key={"file-" + idx}
  content = content.replace(/key=\{\\file-\}/g, 'key={"file-" + idx}');
  
  // Fix 2: alt={Media } -> alt={"Media " + idx}
  content = content.replace(/alt=\{Media \}/g, 'alt={"Media " + idx}');
  
  fs.writeFileSync(path, content, 'utf8');
  
  // Verify fixes applied
  const after = fs.readFileSync(path, 'utf8');
  const hasOldKey = after.includes('key={\\file-}');
  const hasOldAlt = after.includes('alt={Media }');
  console.log(path);
  console.log('  Old key pattern remaining:', hasOldKey);
  console.log('  Old alt pattern remaining:', hasOldAlt);
  console.log('  Has correct key:', after.includes('key={"file-" + idx}'));
  console.log('  Has correct alt:', after.includes('alt={"Media " + idx}'));
}

fixFile('C:/Users/ACER/Desktop/autolearn-spot/app/author/products/[id]/edit/page.tsx');
fixFile('C:/Users/ACER/Desktop/autolearn-spot/app/author/products/new/page.tsx');
