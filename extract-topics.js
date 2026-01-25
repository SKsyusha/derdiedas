const fs = require('fs');
const path = require('path');

// Find all dictionary files
const dictionaryPaths = [
  path.join(__dirname, 'app', 'data', 'dictionaries', 'A1.json'),
  path.join(__dirname, 'app', 'data', 'dictionaries', 'A2.json'),
  path.join(__dirname, 'app', 'data', 'dictionaries', 'B1.json'),
];

const topicsSet = new Set();
const topicsByFile = {};

// Extract topics from each dictionary file
dictionaryPaths.forEach((filePath) => {
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const fileTopics = new Set();
      
      data.forEach((entry) => {
        if (entry.topic) {
          topicsSet.add(entry.topic);
          fileTopics.add(entry.topic);
        }
      });
      
      topicsByFile[path.basename(filePath)] = Array.from(fileTopics).sort();
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error.message);
    }
  }
});

// Sort all unique topics
const allTopics = Array.from(topicsSet).sort();

console.log('=== ALL UNIQUE TOPICS ===');
console.log(`Total unique topics: ${allTopics.length}\n`);
allTopics.forEach((topic, index) => {
  console.log(`${index + 1}. ${topic}`);
});

console.log('\n=== TOPICS BY FILE ===');
Object.entries(topicsByFile).forEach(([fileName, topics]) => {
  console.log(`\n${fileName} (${topics.length} topics):`);
  topics.forEach((topic) => {
    console.log(`  - ${topic}`);
  });
});

// Generate JSON structure for localization files
console.log('\n=== JSON STRUCTURE FOR LOCALIZATION ===\n');
const topicsJson = {};
allTopics.forEach((topic) => {
  topicsJson[topic] = topic; // Default to topic name, can be translated later
});

console.log(JSON.stringify(topicsJson, null, 2));
