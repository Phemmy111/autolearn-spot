const sharp = require('sharp');
const fs = require('fs');

async function processCertificate() {
  const inputPath = 'C:/Users/ACER/.gemini/antigravity/brain/ecc0d0fe-ce59-4ac9-81eb-edd6072cfaad/.user_uploaded/media_1795006322289_74ec2262.jpg';
  
  if (!fs.existsSync(inputPath)) {
    console.error('Source image does not exist:', inputPath);
    return;
  }

  // 1. Copy the raw template to public as reference
  fs.copyFileSync(inputPath, 'public/certificate-template-luxury.jpg');
  console.log('Copied raw luxury template to public/certificate-template-luxury.jpg');

  const meta = await sharp(inputPath).metadata();
  console.log('Metadata:', meta.width, 'x', meta.height);

  // 2. Sample the background texture colors around the center text zones
  // Center background: subtle gradient from #fbf5ea in center to #eedfc5 at edges
  const maskSvg = `
    <svg width="${meta.width}" height="${meta.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="parchment" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stop-color="#FAF4E8" stop-opacity="1"/>
          <stop offset="40%" stop-color="#F5ECE0" stop-opacity="1"/>
          <stop offset="80%" stop-color="#EEE1D0" stop-opacity="1"/>
          <stop offset="100%" stop-color="#E5D6C1" stop-opacity="1"/>
        </radialGradient>
        <filter id="softBlur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      
      <!-- Clean Student Name Box -->
      <rect x="200" y="245" width="624" height="78" fill="url(#parchment)" rx="10" filter="url(#softBlur)" />
      <rect x="210" y="248" width="604" height="72" fill="url(#parchment)" rx="8" />

      <!-- Clean Course Name Box -->
      <rect x="180" y="392" width="664" height="52" fill="url(#parchment)" rx="8" filter="url(#softBlur)" />
      <rect x="190" y="394" width="644" height="48" fill="url(#parchment)" rx="6" />

      <!-- Clean Date Box -->
      <rect x="120" y="495" width="220" height="55" fill="url(#parchment)" rx="8" filter="url(#softBlur)" />
      <rect x="125" y="498" width="210" height="49" fill="url(#parchment)" rx="6" />

      <!-- Clean Signature Box -->
      <rect x="650" y="480" width="185" height="70" fill="url(#parchment)" rx="8" filter="url(#softBlur)" />
      <rect x="655" y="483" width="175" height="64" fill="url(#parchment)" rx="6" />

      <!-- Clean Bottom Motto Area -->
      <rect x="250" y="628" width="524" height="24" fill="url(#parchment)" rx="4" filter="url(#softBlur)" />
      <rect x="255" y="629" width="514" height="22" fill="url(#parchment)" rx="4" />
    </svg>
  `;

  await sharp(inputPath)
    .composite([{ input: Buffer.from(maskSvg), blend: 'over' }])
    .png()
    .toFile('public/certificate-template-parchment-clean.png');

  console.log('Successfully created public/certificate-template-parchment-clean.png');
}

processCertificate().catch(console.error);
