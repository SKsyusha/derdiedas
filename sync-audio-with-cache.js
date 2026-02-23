#!/usr/bin/env node

/**
 * Ensure .article-cache.json has audio entries for all words in A1/A2/B1
 * and keep dictionaries in sync with the cache.
 *
 * For each word in A1.json, A2.json, B1.json:
 * - If there is a valid cache entry with audio_url:
 *     - ensure dictionary entry has the same audio_url
 *     - optionally update article if it differs
 * - If there is NO valid cache entry:
 *     - remove audio_url from the dictionary entry (if present)
 *     - query der-artikel.de to find correct article + audio URL
 *     - update dictionary entry and cache
 *
 * After running this script you can call:
 *   node download-audio.js
 * to download all missing audio files based on the updated cache.
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://der-artikel.de';
const ARTICLES = ['der', 'die', 'das'];

const CACHE_PATH = path.join(__dirname, '.article-cache.json');
const DICT_DIR = path.join(__dirname, 'app', 'data', 'dictionaries');
const DICT_FILES = ['A1.json', 'A2.json', 'B1.json'];

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function loadCache() {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      return loadJson(CACHE_PATH);
    }
  } catch (error) {
    console.log('Warning: could not load cache, starting fresh:', error.message);
  }
  return {};
}

function saveCache(cache) {
  saveJson(CACHE_PATH, cache);
}

// Delay between network requests (1–3s) to be polite
const DELAY_MIN_MS = 1000;
const DELAY_MAX_MS = 3000;

function randomDelay() {
  return Math.floor(Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS + 1)) + DELAY_MIN_MS;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkUrl(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'de,en-US;q=0.9,en;q=0.8',
      },
    });
    return response.status === 200;
  } catch (error) {
    console.error(`  Error fetching ${url}: ${error.message}`);
    return false;
  }
}

/**
 * Try der/die/das on der-artikel.de and return
 * { article, pageUrl, audioUrl } or null when not found.
 */
async function findCorrectArticle(word) {
  for (const article of ARTICLES) {
    const encoded = encodeURIComponent(word);
    const pageUrl = `${BASE_URL}/${article}/${encoded}.html`;
    const exists = await checkUrl(pageUrl);

    if (exists) {
      return {
        article,
        pageUrl,
        audioUrl: `${BASE_URL}/audio/${encodeURIComponent(word.toLowerCase())}.mp3`,
      };
    }

    // Small pause between article variants
    await sleep(100);
  }

  return null;
}

async function processDictionary(dictFile, cache) {
  const jsonPath = path.join(DICT_DIR, dictFile);
  const data = loadJson(jsonPath);

  console.log(`\n=== ${dictFile} ===`);
  console.log(`Total entries: ${data.length}`);

  let okFromCache = 0;
  let fixedFromCache = 0;
  let fetched = 0;
  let notFound = 0;
  let audioUrlRemoved = 0;
  let articleUpdated = 0;

  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    const noun = entry.noun;
    if (!noun) continue;

    const cacheKey = noun.toLowerCase();
    const cached = cache[cacheKey];
    const hasCachedAudio = cached && cached.audio_url && !cached.notFound;

    // 1) Cache already has a good audio_url
    if (hasCachedAudio) {
      okFromCache++;

      // Ensure dictionary has the same audio URL
      if (!entry.audio_url) {
        entry.audio_url = cached.audio_url;
        fixedFromCache++;
      } else if (entry.audio_url !== cached.audio_url) {
        console.log(
          `  [#${i + 1}] "${noun}": dictionary audio_url differs from cache, syncing to cache value`
        );
        entry.audio_url = cached.audio_url;
        fixedFromCache++;
      }

      // Optionally sync article with cache
      if (cached.article && cached.article !== entry.article) {
        console.log(
          `  [#${i + 1}] "${noun}": article mismatch ${entry.article} -> ${cached.article}`
        );
        entry.article = cached.article;
        articleUpdated++;
      }

      continue;
    }

    // 2) No valid cached audio: clean up dictionary audio_url (if any)
    if (entry.audio_url) {
      delete entry.audio_url;
      audioUrlRemoved++;
    }

    console.log(
      `[#${i + 1}] "${noun}" - no valid cache entry, querying der-artikel.de...`
    );

    const result = await findCorrectArticle(noun);

    if (!result) {
      console.log(`   ⚠️  Not found on der-artikel.de, caching as notFound`);
      cache[cacheKey] = { article: null, audio_url: null, notFound: true };
      notFound++;
    } else {
      const { article: correctArticle, audioUrl } = result;

      cache[cacheKey] = {
        article: correctArticle,
        audio_url: audioUrl,
      };

      entry.audio_url = audioUrl;
      fetched++;

      if (correctArticle !== entry.article) {
        console.log(
          `   🔄 Article mismatch: ${entry.article} -> ${correctArticle}`
        );
        entry.article = correctArticle;
        articleUpdated++;
      } else {
        console.log(`   ✓ Article OK (${correctArticle}), audio_url added`);
      }
    }

    if (i < data.length - 1) {
      const delay = randomDelay();
      console.log(`   ⏳ Waiting ${(delay / 1000).toFixed(1)}s...`);
      await sleep(delay);
    }
  }

  // Save updated dictionary
  saveJson(jsonPath, data);

  console.log(`\nSummary for ${dictFile}:`);
  console.log(`  From cache (valid audio): ${okFromCache}`);
  console.log(`  Synced audio_url from cache: ${fixedFromCache}`);
  console.log(`  Fetched from web: ${fetched}`);
  console.log(`  Marked as not found: ${notFound}`);
  console.log(`  Removed stale audio_url in dict: ${audioUrlRemoved}`);
  console.log(`  Updated articles: ${articleUpdated}`);
}

async function main() {
  console.log('Loading cache...');
  const cache = loadCache();
  console.log(`Existing cache entries: ${Object.keys(cache).length}`);

  for (const dictFile of DICT_FILES) {
    await processDictionary(dictFile, cache);
  }

  console.log('\nSaving updated cache...');
  saveCache(cache);
  console.log(`Done. Cache size: ${Object.keys(cache).length}`);

  console.log('\nNext step (optional):');
  console.log('  node download-audio.js');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

