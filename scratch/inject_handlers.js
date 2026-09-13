const fs = require('fs');

function injectHandlersEdit() {
  const path = 'C:/Users/ACER/Desktop/autolearn-spot/app/author/products/[id]/edit/page.tsx';
  let content = fs.readFileSync(path, 'utf8');
  
  if (!content.includes('const handleMediaChange')) {
    const handlers = `
  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeMediaGalleryItem = (index: number) => {
    setMediaGallery(prev => prev.filter((_, i) => i !== index));
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };
`;
    // Find the end of handleThumbnailChange
    // It ends around line 230:
    //   };
    //
    //   const handleSubmit = async (e: React.FormEvent) => {
    content = content.replace('  const handleSubmit = async (e: React.FormEvent) => {', handlers + '\n  const handleSubmit = async (e: React.FormEvent) => {');
    fs.writeFileSync(path, content, 'utf8');
    console.log('Injected handlers into edit/page.tsx');
  } else {
    console.log('Handlers already exist in edit/page.tsx');
  }
}

function injectHandlersNew() {
  const path = 'C:/Users/ACER/Desktop/autolearn-spot/app/author/products/new/page.tsx';
  let content = fs.readFileSync(path, 'utf8');
  
  if (!content.includes('const handleMediaChange')) {
    const handlers = `
  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };
`;
    content = content.replace('  const handleSubmit = async (e: React.FormEvent) => {', handlers + '\n  const handleSubmit = async (e: React.FormEvent) => {');
    fs.writeFileSync(path, content, 'utf8');
    console.log('Injected handlers into new/page.tsx');
  } else {
    console.log('Handlers already exist in new/page.tsx');
  }
}

injectHandlersEdit();
injectHandlersNew();
