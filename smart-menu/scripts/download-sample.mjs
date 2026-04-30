import fs from 'fs';
import https from 'https';
import path from 'path';

// Using a small but robust sample model from modelviewer.dev
const url = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
const dir = path.join(process.cwd(), 'public', 'models');

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const target = path.join(dir, 'sample-food.glb');

console.log('Downloading sample GLB model...');
https.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed to download: HTTP ${res.statusCode}`);
    process.exit(1);
  }

  const stream = fs.createWriteStream(target);
  res.pipe(stream);
  
  stream.on('finish', () => {
    stream.close();
    console.log(`✅ Download complete! Saved to ${target}`);
    console.log(`You can now test the AR viewer on Zanzibar Pizza!`);
  });
}).on('error', (err) => {
  console.error('Download failed:', err.message);
  process.exit(1);
});
