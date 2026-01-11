const fs = require('fs');
const path = require('path');

// Read the A1.json file
const filePath = path.join(__dirname, 'app', 'data', 'dictionaries', 'A1.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Count occurrences of each noun
const nounCounts = new Map();
const nounEntries = new Map(); // Store all entries for each noun
const entriesWithEmptyNoun = [];
const entriesWithoutNoun = [];

data.forEach((entry, index) => {
  if ('noun' in entry) {
    if (entry.noun && entry.noun.trim() !== '') {
      const noun = entry.noun;
      nounCounts.set(noun, (nounCounts.get(noun) || 0) + 1);
      
      if (!nounEntries.has(noun)) {
        nounEntries.set(noun, []);
      }
      nounEntries.get(noun).push({ index, entry });
    } else {
      entriesWithEmptyNoun.push({ index, entry });
    }
  } else {
    entriesWithoutNoun.push({ index, entry });
  }
});

// Find duplicates
const duplicates = Array.from(nounCounts.entries())
  .filter(([noun, count]) => count > 1)
  .sort((a, b) => b[1] - a[1]); // Sort by count descending

console.log(`Total entries in array: ${data.length}`);
console.log(`Entries with "noun" field: ${data.length - entriesWithoutNoun.length}`);
console.log(`Entries with non-empty noun: ${nounCounts.size + entriesWithEmptyNoun.length - entriesWithoutNoun.length}`);
console.log(`Unique nouns: ${nounCounts.size}`);
console.log(`Entries with empty/null noun: ${entriesWithEmptyNoun.length}`);
console.log(`Entries without "noun" field: ${entriesWithoutNoun.length}`);

if (entriesWithEmptyNoun.length > 0) {
  console.log('\n=== ENTRIES WITH EMPTY/NULL NOUN ===');
  entriesWithEmptyNoun.forEach(({ index, entry }) => {
    console.log(`Entry ${index + 1}: ${JSON.stringify(entry)}`);
  });
}

if (entriesWithoutNoun.length > 0) {
  console.log('\n=== ENTRIES WITHOUT "noun" FIELD ===');
  entriesWithoutNoun.forEach(({ index, entry }) => {
    console.log(`Entry ${index + 1}: ${JSON.stringify(entry)}`);
  });
}

console.log(`\nDuplicates found: ${duplicates.length}`);

if (duplicates.length > 0) {
  console.log('\n=== DUPLICATE NOUNS ===\n');
  duplicates.forEach(([noun, count]) => {
    console.log(`"${noun}" appears ${count} times:`);
    nounEntries.get(noun).forEach(({ index, entry }) => {
      console.log(`  - Entry ${index + 1}: ${entry.article} ${entry.noun} (${entry.translation_en}) - Topic: ${entry.topic}`);
    });
    console.log('');
  });
} else {
  console.log('\nNo duplicates found! All nouns are unique.');
}
