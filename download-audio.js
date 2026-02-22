#!/usr/bin/env node

/**
 * Script to download all audio files from the article cache
 * 
 * Usage: node download-audio.js [output-folder]
 * Example: node download-audio.js
 * Example: node download-audio.js ./my-audio
 * 
 * Default output folder: ./audio
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CACHE_PATH = path.join(__dirname, '.article-cache.json');
const DEFAULT_OUTPUT_DIR = path.join(__dirname, 'audio');

// Delay between downloads to be polite to the server (random 500-1500ms)
function randomDelay() {
  return Math.floor(Math.random() * 1000) + 500;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Download a file from URL to local path
 */
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        file.close();
        fs.unlinkSync(filePath);
        downloadFile(response.headers.location, filePath).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filePath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        file.close();
        fs.unlinkSync(filePath);
        reject(err);
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      reject(err);
    });
  });
}

async function main() {
  const outputDir = process.argv[2] || DEFAULT_OUTPUT_DIR;
  
  // Load cache
  if (!fs.existsSync(CACHE_PATH)) {
    console.error('Cache file not found:', CACHE_PATH);
    console.error('Run verify-articles.js first to build the cache.');
    process.exit(1);
  }
  
  const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
  const entries = Object.entries(cache);
  
  console.log(`\nFound ${entries.length} words in cache`);
  console.log(`Output folder: ${outputDir}\n`);
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created folder: ${outputDir}`);
  }
  
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  const failedWords = [];
  
  for (let i = 0; i < entries.length; i++) {
    const [word, data] = entries[i];
    
    if (!data.audio_url || data.notFound) {
      skipped++;
      continue;
    }
    
    // Decode URL to get filename
    const decodedWord = decodeURIComponent(word);
    const fileName = `${decodedWord}.mp3`;
    const filePath = path.join(outputDir, fileName);
    
    // Skip if already downloaded
    if (fs.existsSync(filePath)) {
      console.log(`[${i + 1}/${entries.length}] ⏭️  "${decodedWord}" - already exists`);
      skipped++;
      continue;
    }
    
    console.log(`[${i + 1}/${entries.length}] ⬇️  Downloading "${decodedWord}"...`);
    
    try {
      await downloadFile(data.audio_url, filePath);
      console.log(`   ✓ Saved: ${fileName}`);
      downloaded++;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      failedWords.push({ word: decodedWord, error: error.message });
      failed++;
    }
    
    // Random delay between downloads
    if (i < entries.length - 1) {
      await sleep(randomDelay());
    }
  }
  
  // Summary
  console.log('\n========== Summary ==========');
  console.log(`Total in cache: ${entries.length}`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Skipped (exists/no url): ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Output folder: ${outputDir}`);
  console.log('==============================');
  
  if (failedWords.length > 0) {
    console.log('\n❌ Failed downloads:');
    failedWords.forEach(({ word, error }) => {
      console.log(`   - ${word}: ${error}`);
    });
  }
  
  console.log('');
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
