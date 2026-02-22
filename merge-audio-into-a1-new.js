const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'app/data/dictionaries');
const a1Path = path.join(dir, 'A1.json');
const a1NewPath = path.join(dir, 'A1_new.json');
const cachePath = path.join(__dirname, '.article-cache.json');

const a1New = JSON.parse(fs.readFileSync(a1NewPath, 'utf8'));

// 1) From A1.json (exact noun+article match)
if (fs.existsSync(a1Path)) {
  const a1 = JSON.parse(fs.readFileSync(a1Path, 'utf8'));
  const audioByKey = new Map();
  for (const entry of a1) {
    if (entry.audio_url) {
      const key = `${entry.noun}\t${entry.article}`;
      audioByKey.set(key, entry.audio_url);
    }
  }
  for (const entry of a1New) {
    if (entry.audio_url) continue;
    const key = `${entry.noun}\t${entry.article}`;
    const url = audioByKey.get(key);
    if (url) entry.audio_url = url;
  }
}

// 2) From .article-cache.json (by noun only; same pronunciation for same word)
const AUDIO_BASE = 'https://der-artikel.de/audio';
let fromCache = 0;
if (fs.existsSync(cachePath)) {
  const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  for (const entry of a1New) {
    if (entry.audio_url) continue;
    const key = entry.noun.toLowerCase();
    const cached = cache[key];
    if (!cached || cached.notFound) continue;
    if (cached.audio_url) {
      entry.audio_url = cached.audio_url;
      fromCache++;
    } else if (cached.article != null) {
      // Cache has article but no URL — build URL from noun (same pattern as site)
      entry.audio_url = `${AUDIO_BASE}/${encodeURIComponent(key)}.mp3`;
      fromCache++;
    }
  }
}

const withAudio = a1New.filter((e) => e.audio_url).length;
fs.writeFileSync(a1NewPath, JSON.stringify(a1New, null, 2), 'utf8');
console.log(`A1_new.json: ${withAudio}/${a1New.length} entries have audio (filled ${fromCache} from cache).`);
