const fs = require('fs');
const schema = JSON.parse(fs.readFileSync('C:/Users/ACER/Desktop/autolearn-spot/scratch/schema.json', 'utf8'));
const tables = Object.keys(schema.definitions || {});
console.log(tables.join(', '));
