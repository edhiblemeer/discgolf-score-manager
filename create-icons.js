const sharp = require('sharp');
const fs = require('fs');

// SVGアイコンを作成
const svgIcon = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#2A9D8F"/>
  <circle cx="256" cy="256" r="180" fill="none" stroke="white" stroke-width="20"/>
  <circle cx="256" cy="256" r="25" fill="white"/>
  <path d="M 100 256 Q 256 150 412 256" fill="none" stroke="white" stroke-width="15"/>
  <text x="256" y="450" font-family="Arial" font-size="50" font-weight="bold" fill="white" text-anchor="middle">DG SCORE</text>
</svg>
`;

// 192x192アイコンを作成
sharp(Buffer.from(svgIcon))
  .resize(192, 192)
  .png()
  .toFile('public/icon-192.png', (err) => {
    if (err) console.error('Error creating 192x192 icon:', err);
    else console.log('Created icon-192.png');
  });

// 512x512アイコンを作成
sharp(Buffer.from(svgIcon))
  .resize(512, 512)
  .png()
  .toFile('public/icon-512.png', (err) => {
    if (err) console.error('Error creating 512x512 icon:', err);
    else console.log('Created icon-512.png');
  });

// faviconを作成
sharp(Buffer.from(svgIcon))
  .resize(32, 32)
  .png()
  .toFile('public/favicon.ico', (err) => {
    if (err) console.error('Error creating favicon:', err);
    else console.log('Created favicon.ico');
  });