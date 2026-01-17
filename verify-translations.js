#!/usr/bin/env node

/**
 * Script to verify English translations from dictionary files using MyMemory API
 * 
 * Usage: node verify-translations.js <start>-<end> [dictionary]
 * Example: node verify-translations.js 1-10
 * Example: node verify-translations.js 1-10 A2
 * 
 * The script will:
 * 1. Translate each German noun to English using MyMemory API
 * 2. Compare with existing translation_en field
 * 3. Report mismatches for manual review
 * 4. Cache results to avoid duplicate requests across runs
 */

const fs = require('fs');
const path = require('path');

const API_URL = 'https://api.mymemory.translated.net/get';
const CACHE_PATH = path.join(__dirname, '.translation-cache.json');

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
 * Translate text using MyMemory API
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code (de)
 * @param {string} targetLang - Target language code (en)
 * @returns {Promise<{translation: string, match: number}|null>}
 */
async function translateText(text, sourceLang = 'de', targetLang = 'en') {
  try {
    const url = new URL(API_URL);
    url.searchParams.set('q', text);
    url.searchParams.set('langpair', `${sourceLang}|${targetLang}`);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`  HTTP Error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.responseStatus !== 200) {
      console.error(`  API Error: ${data.responseStatus} - ${data.responseDetails}`);
      return null;
    }
    
    return {
      translation: data.responseData.translatedText.toLowerCase(),
      match: data.responseData.match
    };
  } catch (error) {
    console.error(`  Error translating "${text}": ${error.message}`);
    return null;
  }
}

/**
 * Normalize translation for comparison
 * - lowercase
 * - trim whitespace
 * - remove articles (a, an, the)
 * - remove trailing parentheses content like "(female)"
 */
function normalizeTranslation(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/^(a|an|the)\s+/i, '')  // Remove leading articles
    .replace(/\s*\([^)]*\)\s*$/g, '') // Remove trailing parentheses
    .trim();
}

/**
 * Check if two translations are similar enough
 * Returns true if they match or are very similar
 */
function translationsMatch(current, api) {
  const normCurrent = normalizeTranslation(current);
  const normApi = normalizeTranslation(api);
  
  // Exact match
  if (normCurrent === normApi) return true;
  
  // One contains the other (e.g. "sender" vs "the sender")
  if (normCurrent.includes(normApi) || normApi.includes(normCurrent)) return true;
  
  // Check if one is a substring of the other with some tolerance
  const shorter = normCurrent.length < normApi.length ? normCurrent : normApi;
  const longer = normCurrent.length < normApi.length ? normApi : normCurrent;
  
  // If shorter is at least 60% of longer and is contained, consider it a match
  if (shorter.length >= longer.length * 0.6 && longer.includes(shorter)) return true;
  
  return false;
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
    console.log('Usage: node verify-translations.js <range> [dictionary]');
    console.log('\nRange formats:');
    console.log('  1-10   Words 1 to 10');
    console.log('  200-   From 200 to end');
    console.log('  -50    From 1 to 50');
    console.log('\nExamples:');
    console.log('  node verify-translations.js 1-10');
    console.log('  node verify-translations.js 200- A2');
    console.log('  node verify-translations.js 1-100 B1');
    console.log('\nDefault dictionary: A1');
    process.exit(1);
  }
  
  const { start, end } = parseRange(rangeArg);
  
  // Determine JSON path based on dictionary
  let jsonPath;
  if (dictArg === 'B1') {
    jsonPath = path.join(__dirname, 'data/dictionaries/B1.json');
  } else {
    jsonPath = path.join(__dirname, `app/data/dictionaries/${dictArg}.json`);
  }
  
  // Load cache
  const cache = loadCache();
  const cacheSize = Object.keys(cache).length;
  console.log(`\nLoaded cache with ${cacheSize} words`);
  
  // Read the JSON file
  console.log(`Reading ${jsonPath}...`);
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  
  const totalWords = data.length;
  const actualEnd = Math.min(end, totalWords - 1);
  
  console.log(`Total words in dictionary: ${totalWords}`);
  console.log(`Processing range: ${start + 1}-${actualEnd + 1} (${actualEnd - start + 1} words)\n`);
  
  let matched = 0;
  let mismatch = 0;
  let failed = 0;
  let fromCache = 0;
  
  // Track details for summary
  const mismatchedWords = [];  // { noun, current, api }
  const failedWords = [];      // list of nouns
  
  for (let i = start; i <= actualEnd; i++) {
    const entry = data[i];
    const { noun, translation_en: currentTranslation } = entry;
    
    console.log(`[${i + 1}/${actualEnd + 1}] Checking "${noun}" (current: "${currentTranslation}")...`);
    
    // Check cache first
    const cacheKey = noun.toLowerCase();
    if (cache[cacheKey]) {
      const cached = cache[cacheKey];
      
      // Handle cached "failed" entries
      if (cached.failed) {
        console.log(`  📦 Found in cache: FAILED`);
        failedWords.push(noun);
        failed++;
        fromCache++;
        continue;
      }
      
      console.log(`  📦 Found in cache: "${cached.translation}"`);
      
      if (!translationsMatch(currentTranslation, cached.translation)) {
        console.log(`  ⚠️  Translation mismatch!`);
        console.log(`      Current: "${currentTranslation}"`);
        console.log(`      API:     "${cached.translation}"`);
        mismatchedWords.push({ noun, current: currentTranslation, api: cached.translation });
        mismatch++;
      } else {
        console.log(`  ✓ Translation matches`);
        matched++;
      }
      fromCache++;
      continue;
    }
    
    // Not in cache, fetch from API
    const result = await translateText(noun);
    
    if (!result) {
      console.log(`  ⚠️  Failed to translate`);
      failedWords.push(noun);
      failed++;
      // Cache the "failed" result too
      cache[cacheKey] = { translation: null, failed: true };
    } else {
      const { translation: apiTranslation, match: matchScore } = result;
      
      // Save to cache
      cache[cacheKey] = {
        translation: apiTranslation,
        matchScore
      };
      
      console.log(`  🌐 API translation: "${apiTranslation}" (match: ${(matchScore * 100).toFixed(0)}%)`);
      
      if (!translationsMatch(currentTranslation, apiTranslation)) {
        console.log(`  ⚠️  Translation mismatch!`);
        console.log(`      Current: "${currentTranslation}"`);
        console.log(`      API:     "${apiTranslation}"`);
        mismatchedWords.push({ noun, current: currentTranslation, api: apiTranslation });
        mismatch++;
      } else {
        console.log(`  ✓ Translation matches`);
        matched++;
      }
    }
    
    const delay = randomDelay();
    console.log(`  ⏳ Waiting ${(delay / 1000).toFixed(1)}s...`);
    await sleep(delay);
  }
  
  // Save cache
  console.log(`\nSaving cache (${Object.keys(cache).length} words)...`);
  saveCache(cache);
  
  // Summary
  console.log('\n========== Summary ==========');
  console.log(`Total processed: ${actualEnd - start + 1}`);
  console.log(`From cache: ${fromCache}`);
  console.log(`Fetched from API: ${actualEnd - start + 1 - fromCache}`);
  console.log(`Matched: ${matched}`);
  console.log(`Mismatched: ${mismatch}`);
  console.log(`Failed: ${failed}`);
  console.log('==============================');
  
  // List mismatched words
  if (mismatchedWords.length > 0) {
    console.log('\n⚠️  Mismatched translations (review manually):');
    mismatchedWords.forEach(({ noun, current, api }) => {
      console.log(`   ${noun}:`);
      console.log(`      Current: "${current}"`);
      console.log(`      API:     "${api}"`);
    });
  }
  
  // List failed words
  if (failedWords.length > 0) {
    console.log('\n❌ Failed to translate:');
    failedWords.forEach(noun => {
      console.log(`   - ${noun}`);
    });
  }
  
  console.log('');
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
