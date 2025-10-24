const fs = require('fs');
const path = require('path');

const songsDir = path.join(__dirname, '../public/songs');
const outputPath = path.join(songsDir, 'manifest.json');

fs.readdir(songsDir, (err, files) => {
  if (err) {
    console.error('❌ Error reading songs directory:', err);
    return;
  }
  
  const mp3Files = files.filter(file => file.endsWith('.mp3'));
  
  fs.writeFileSync(outputPath, JSON.stringify(mp3Files, null, 2));
  console.log(`✅ Generated manifest.json with ${mp3Files.length} songs`);
  console.log('Songs:', mp3Files.join(', '));
});

