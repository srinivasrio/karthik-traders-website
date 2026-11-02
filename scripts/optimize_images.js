const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../public');

async function getAllFiles(dir, fileList = []) {
  const files = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      if (file.name !== 'node_modules' && file.name !== '.next') {
        await getAllFiles(fullPath, fileList);
      }
    } else {
      const ext = path.extname(file.name).toLowerCase();
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

async function optimizeImages() {
  console.log('🔍 Scanning public directory for images to optimize...');
  const files = await getAllFiles(PUBLIC_DIR);
  console.log(`Found ${files.length} images.`);

  let totalBefore = 0;
  let totalAfter = 0;
  let count = 0;

  for (const file of files) {
    try {
      const stat = await fs.promises.stat(file);
      const beforeSize = stat.size;
      totalBefore += beforeSize;

      // Only optimize images larger than 50KB
      if (beforeSize < 50 * 1024) {
        totalAfter += beforeSize;
        continue;
      }

      const ext = path.extname(file).toLowerCase();
      let pipeline = sharp(file);
      const meta = await pipeline.metadata();

      // Constrain dimensions to max 1200px (or 1600 for wide hero)
      const maxDim = file.includes('hero-pond-desktop') ? 1600 : 1200;
      if ((meta.width && meta.width > maxDim) || (meta.height && meta.height > maxDim)) {
        pipeline = pipeline.resize(
          meta.width > meta.height ? maxDim : null,
          meta.height >= meta.width ? maxDim : null,
          { withoutEnlargement: true, fit: 'inside' }
        );
      }

      let optimizedBuffer;
      if (ext === '.png') {
        optimizedBuffer = await pipeline
          .png({ quality: 80, compressionLevel: 9, effort: 8 })
          .toBuffer();
      } else if (ext === '.jpg' || ext === '.jpeg') {
        optimizedBuffer = await pipeline
          .jpeg({ quality: 78, mozjpeg: true })
          .toBuffer();
      }

      // Only save if smaller
      if (optimizedBuffer && optimizedBuffer.length < beforeSize) {
        await fs.promises.writeFile(file, optimizedBuffer);
        totalAfter += optimizedBuffer.length;
        count++;
        const savedPercent = (((beforeSize - optimizedBuffer.length) / beforeSize) * 100).toFixed(1);
        console.log(`⚡ Optimized: ${path.relative(PUBLIC_DIR, file)} (${(beforeSize / 1024).toFixed(0)}KB -> ${(optimizedBuffer.length / 1024).toFixed(0)}KB, -${savedPercent}%)`);
      } else {
        totalAfter += beforeSize;
      }
    } catch (err) {
      console.warn(`Skipping ${file}:`, err.message);
    }
  }

  const savedMB = ((totalBefore - totalAfter) / 1024 / 1024).toFixed(2);
  const totalBeforeMB = (totalBefore / 1024 / 1024).toFixed(2);
  const totalAfterMB = (totalAfter / 1024 / 1024).toFixed(2);
  console.log('==============================================');
  console.log(`🎉 Optimization Complete!`);
  console.log(`Images compressed: ${count}`);
  console.log(`Total payload: ${totalBeforeMB} MB -> ${totalAfterMB} MB`);
  console.log(`Total saved: ${savedMB} MB (${(((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1)}% reduction)`);
  console.log('==============================================');
}

optimizeImages();
