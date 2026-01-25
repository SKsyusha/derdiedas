const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'app/data/dictionaries/B1.jsonl');
const outputFile = path.join(__dirname, 'app/data/dictionaries/B1.json');

// Read the JSONL file
const jsonlContent = fs.readFileSync(inputFile, 'utf-8');

// Split by lines and parse each line as JSON
const lines = jsonlContent.trim().split('\n');
const jsonArray = lines.map(line => {
  try {
    return JSON.parse(line);
  } catch (error) {
    console.error(`Error parsing line: ${line}`);
    throw error;
  }
});

// Write as formatted JSON array
fs.writeFileSync(outputFile, JSON.stringify(jsonArray, null, 2), 'utf-8');

console.log(`Successfully converted ${jsonArray.length} entries from ${inputFile} to ${outputFile}`);
