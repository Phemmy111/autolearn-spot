const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf-8');
const lines = envContent.split(/\r?\n/);
lines.forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    console.log(line.split('=')[0]);
  }
});
