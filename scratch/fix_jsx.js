const fs = require('fs');

const fixFile = (path) => {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/key=\{[\s\S]*?ile-\}/g, 'key={"file-" + idx}');
  fs.writeFileSync(path, content, 'utf8');
  console.log('Fixed', path);
};

fixFile('C:/Users/ACER/Desktop/autolearn-spot/app/author/products/[id]/edit/page.tsx');
fixFile('C:/Users/ACER/Desktop/autolearn-spot/app/author/products/new/page.tsx');
