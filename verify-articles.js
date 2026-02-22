#!/usr/bin/env node

/**
 * Script to verify articles from A1.json against der-artikel.de
 * 
 * Usage: node verify-articles.js <start>-<end> [dictionary]
 * Example: node verify-articles.js 1-10
 * Example: node verify-articles.js 1-10 A2
 * 
 * The script will:
 * 1. Try der/die/das for each word on der-artikel.de
 * 2. Update the article if it differs from the website
 * 3. Add audio_url field with the link to audio file
 * 4. Cache results to avoid duplicate requests across runs
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://der-artikel.de';
const ARTICLES = ['der', 'die', 'das'];
const CACHE_PATH = path.join(__dirname, '.article-cache.json');

/**
 * Load cache from file
 */
function loadCache() {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const data = fs.readFileSync(CACHE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('Warning: Could not load cache, starting fresh');
  }
  return {};
}

/**
 * Save cache to file
 */
function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
}

// Delay between requests to be polite to the server (random 1-3 seconds)
const DELAY_MIN_MS = 1000;
const DELAY_MAX_MS = 3000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay() {
  return Math.floor(Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS + 1)) + DELAY_MIN_MS;
}

/**
 * Check if a URL returns 200 (exists) or 404 (not found)
 */
async function checkUrl(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'de,en-US;q=0.9,en;q=0.8',
      }
    });
    return response.status === 200;
  } catch (error) {
    console.error(`  Error fetching ${url}: ${error.message}`);
    return false;
  }
}

/**
 * Find the correct article for a word by trying all three articles
 */
async function findCorrectArticle(word) {
  for (const article of ARTICLES) {
    const url = `${BASE_URL}/${article}/${encodeURIComponent(word)}.html`;
    const exists = await checkUrl(url);
    
    if (exists) {
      return {
        article,
        pageUrl: url,
        audioUrl: `${BASE_URL}/audio/${encodeURIComponent(word.toLowerCase())}.mp3`
      };
    }
    
    await sleep(100); // Small delay between article checks
  }
  
  return null; // Word not found on the website
}

/**
 * Parse range argument
 * Formats:
 *   "1-10"  -> words 1 to 10
 *   "200-"  -> from 200 to end
 *   "-50"   -> from 1 to 50
 * Note: User provides 1-based indices, we convert to 0-based
 */
function parseRange(arg) {
  // Format: "200-" (from 200 to end)
  const openEndMatch = arg.match(/^(\d+)-$/);
  if (openEndMatch) {
    const start = parseInt(openEndMatch[1], 10) - 1;
    return { start, end: Infinity };
  }
  
  // Format: "-50" (from 1 to 50)
  const openStartMatch = arg.match(/^-(\d+)$/);
  if (openStartMatch) {
    const end = parseInt(openStartMatch[1], 10) - 1;
    return { start: 0, end };
  }
  
  // Format: "1-10" (from 1 to 10)
  const match = arg.match(/^(\d+)-(\d+)$/);
  if (!match) {
    throw new Error('Invalid range format. Use: <start>-<end>, <start>-, or -<end>');
  }
  
  const start = parseInt(match[1], 10) - 1; // Convert to 0-based
  const end = parseInt(match[2], 10) - 1;   // Convert to 0-based
  
  if (start < 0 || end < start) {
    throw new Error('Invalid range. Start must be >= 1 and end must be >= start');
  }
  
  return { start, end };
}

async function main() {
  const rangeArg = process.argv[2];
  const dictArg = process.argv[3] || 'A1';
  
  if (!rangeArg) {
    console.log('Usage: node verify-articles.js <range> [dictionary]');
    console.log('\nRange formats:');
    console.log('  1-10   Words 1 to 10');
    console.log('  200-   From 200 to end');
    console.log('  -50    From 1 to 50');
    console.log('  missing  Only entries without audio_url');
    console.log('\nExamples:');
    console.log('  node verify-articles.js 1-10');
    console.log('  node verify-articles.js 200- A2');
    console.log('  node verify-articles.js missing A1_new');
    console.log('\nDefault dictionary: A1');
    process.exit(1);
  }

  // Determine JSON path based on dictionary
  const jsonPath = path.join(__dirname, `app/data/dictionaries/${dictArg}.json`);

  // Load cache
  const cache = loadCache();
  const cacheSize = Object.keys(cache).length;
  console.log(`\nLoaded cache with ${cacheSize} words`);

  // Read the JSON file
  console.log(`Reading ${jsonPath}...`);
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const totalWords = data.length;

  // Build list of indices to process
  let indices;
  if (rangeArg === 'missing') {
    indices = data
      .map((entry, i) => (entry.audio_url ? -1 : i))
      .filter((i) => i >= 0);
    console.log(`Total words in dictionary: ${totalWords}`);
    console.log(`Processing ${indices.length} entries without audio_url\n`);
  } else {
    const { start, end } = parseRange(rangeArg);
    const actualEnd = Math.min(end, totalWords - 1);
    indices = [];
    for (let i = start; i <= actualEnd; i++) indices.push(i);
    console.log(`Total words in dictionary: ${totalWords}`);
    console.log(`Processing range: ${start + 1}-${actualEnd + 1} (${indices.length} words)\n`);
  }
  
  let updated = 0;
  let notFound = 0;
  let unchanged = 0;
  let fromCache = 0;
  
  // Track details for summary
  const correctedWords = [];  // { noun, oldArticle, newArticle }
  const notFoundWords = [];   // list of nouns
  
  for (let idx = 0; idx < indices.length; idx++) {
    const i = indices[idx];
    const entry = data[i];
    const { noun, article: currentArticle } = entry;

    console.log(`[${idx + 1}/${indices.length}] #${i + 1} Checking "${noun}" (current: ${currentArticle})...`);
    
    // Check cache first
    const cacheKey = noun.toLowerCase();
    if (cache[cacheKey]) {
      const cached = cache[cacheKey];
      
      // Handle cached "not found" entries
      if (cached.notFound) {
        console.log(`  📦 Found in cache: NOT FOUND`);
        notFoundWords.push(noun);
        notFound++;
        fromCache++;
        continue;
      }
      
      console.log(`  📦 Found in cache: ${cached.article}`);
      
      entry.audio_url = cached.audio_url;
      
      if (cached.article !== currentArticle) {
        console.log(`  🔄 Article mismatch! Updating: ${currentArticle} → ${cached.article}`);
        entry.article = cached.article;
        correctedWords.push({ noun, oldArticle: currentArticle, newArticle: cached.article });
        updated++;
      } else {
        unchanged++;
      }
      fromCache++;
      continue;
    }
    
    // Not in cache, fetch from website
    const result = await findCorrectArticle(noun);
    
    if (!result) {
      console.log(`  ⚠️  Word not found on der-artikel.de`);
      notFoundWords.push(noun);
      notFound++;
      // Cache the "not found" result too
      cache[cacheKey] = { article: null, audio_url: null, notFound: true };
    } else {
      const { article: correctArticle, audioUrl } = result;
      
      // Save to cache
      cache[cacheKey] = {
        article: correctArticle,
        audio_url: audioUrl
      };
      
      // Always add/update audio URL
      entry.audio_url = audioUrl;
      
      if (correctArticle !== currentArticle) {
        console.log(`  🔄 Article mismatch! Updating: ${currentArticle} → ${correctArticle}`);
        entry.article = correctArticle;
        correctedWords.push({ noun, oldArticle: currentArticle, newArticle: correctArticle });
        updated++;
      } else {
        console.log(`  ✓ Article correct (${correctArticle}), audio URL added`);
        unchanged++;
      }
    }
    
    if (idx < indices.length - 1) {
      const delay = randomDelay();
      console.log(`  ⏳ Waiting ${(delay / 1000).toFixed(1)}s...`);
      await sleep(delay);
    }
  }
  
  // Save cache
  console.log(`\nSaving cache (${Object.keys(cache).length} words)...`);
  saveCache(cache);
  
  // Save the updated JSON
  console.log(`Saving updated JSON...`);
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
  
  // Summary
  console.log('\n========== Summary ==========');
  console.log(`Total processed: ${indices.length}`);
  console.log(`From cache: ${fromCache}`);
  console.log(`Fetched from web: ${indices.length - fromCache}`);
  console.log(`Updated articles: ${updated}`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`Not found on website: ${notFound}`);
  console.log('==============================');
  
  // List corrected words
  if (correctedWords.length > 0) {
    console.log('\n🔄 Corrected words:');
    correctedWords.forEach(({ noun, oldArticle, newArticle }) => {
      console.log(`   ${noun}: ${oldArticle} → ${newArticle}`);
    });
  }
  
  // List not found words
  if (notFoundWords.length > 0) {
    console.log('\n⚠️  Words not found on der-artikel.de:');
    notFoundWords.forEach(noun => {
      console.log(`   - ${noun}`);
    });
  }
  
  console.log('');
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
