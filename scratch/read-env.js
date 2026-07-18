const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-16le');
console.log(envContent);
