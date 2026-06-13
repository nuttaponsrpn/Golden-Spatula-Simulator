import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svgPath = join(root, 'public/icons/logo.svg');
const outDir = join(root, 'public/icons');

mkdirSync(outDir, { recursive: true });

const svg = readFileSync(svgPath);

const icons = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-72x72.png', size: 72 },
  { name: 'icon-96x96.png', size: 96 },
  { name: 'icon-128x128.png', size: 128 },
  { name: 'icon-144x144.png', size: 144 },
  { name: 'icon-152x152.png', size: 152 },
  { name: 'icon-384x384.png', size: 384 },
];

for (const icon of icons) {
  await sharp(svg)
    .resize(icon.size, icon.size)
    .png()
    .toFile(join(outDir, icon.name));
  console.log(`✓ ${icon.name}`);
}

// favicon 32x32 → public/favicon.ico (as PNG, browsers accept PNG favicon)
await sharp(svg)
  .resize(32, 32)
  .png()
  .toFile(join(root, 'public/favicon.png'));
console.log('✓ favicon.png');

// Also create favicon.ico (32x32 PNG renamed, most browsers accept it)
await sharp(svg)
  .resize(32, 32)
  .png()
  .toFile(join(root, 'public/favicon.ico'));
console.log('✓ favicon.ico');

console.log('\nAll icons generated successfully!');
