const fs = require('fs');
const path = require('path');

const repoRoot = 'e:\\sweetbook';
const audioDir = path.join(repoRoot, 'public', 'audio');
const soundtrackDir = path.join(repoRoot, 'public', 'soundtrack');
const sourceFile = path.join(soundtrackDir, 'The_Shutter_s_Pause.mp3');
const destFile = path.join(audioDir, 'The_Shutter_s_Pause.mp3');

try {
  // Step 1: Create the public/audio directory if it doesn't exist
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
    console.log('Created directory: public\\audio');
  } else {
    console.log('Directory already exists: public\\audio');
  }

  // Step 2: Move the file from public/soundtrack to public/audio
  fs.copyFileSync(sourceFile, destFile);
  fs.unlinkSync(sourceFile);
  console.log('Moved file: public\\soundtrack\\The_Shutter_s_Pause.mp3 -> public\\audio\\The_Shutter_s_Pause.mp3');

  // Step 3: Remove the now-empty public/soundtrack directory
  fs.rmdirSync(soundtrackDir);
  console.log('Removed directory: public\\soundtrack');

  // Step 4: List the contents of public/audio to confirm
  console.log('\nContents of public\\audio\\:');
  const files = fs.readdirSync(audioDir);
  files.forEach(file => {
    console.log(`  ${file}`);
  });
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
