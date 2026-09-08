const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeImages() {
  const publicDir = path.join(__dirname, '..', 'public');

  // 1. Optimize phone mockup screenshot
  const img4070 = path.join(publicDir, 'IMG_4070.png');
  const img4070Webp = path.join(publicDir, 'IMG_4070.webp');
  if (fs.existsSync(img4070)) {
    await sharp(img4070)
      .resize({ width: 750 }) // perfectly sized for retina phone frame
      .webp({ quality: 82, effort: 6 })
      .toFile(img4070Webp);
    console.log('IMG_4070.png (' + fs.statSync(img4070).size + ' bytes) -> IMG_4070.webp (' + fs.statSync(img4070Webp).size + ' bytes)');
  }

  // 2. Optimize Squirt N Splash flyer
  const squirt = path.join(publicDir, 'squirtNsplash.jpeg');
  const squirtWebp = path.join(publicDir, 'squirtNsplash.webp');
  if (fs.existsSync(squirt)) {
    await sharp(squirt)
      .resize({ width: 500 })
      .webp({ quality: 80, effort: 6 })
      .toFile(squirtWebp);
    console.log('squirtNsplash.jpeg (' + fs.statSync(squirt).size + ' bytes) -> squirtNsplash.webp (' + fs.statSync(squirtWebp).size + ' bytes)');
  }

  // 3. Optimize Opening Statement flyer
  const opening = path.join(publicDir, 'opening-statement.jpeg');
  const openingWebp = path.join(publicDir, 'opening-statement.webp');
  if (fs.existsSync(opening)) {
    await sharp(opening)
      .resize({ width: 500 })
      .webp({ quality: 80, effort: 6 })
      .toFile(openingWebp);
    console.log('opening-statement.jpeg (' + fs.statSync(opening).size + ' bytes) -> opening-statement.webp (' + fs.statSync(openingWebp).size + ' bytes)');
  }

  // 4. Optimize logo
  const logo = path.join(publicDir, 'thescenne-logo-transparent.png');
  const logoWebp = path.join(publicDir, 'thescenne-logo-transparent.webp');
  if (fs.existsSync(logo)) {
    await sharp(logo)
      .webp({ quality: 90, effort: 6 })
      .toFile(logoWebp);
    console.log('thescenne-logo-transparent.png (' + fs.statSync(logo).size + ' bytes) -> thescenne-logo-transparent.webp (' + fs.statSync(logoWebp).size + ' bytes)');
  }
}

optimizeImages().catch(console.error);
