-- Run this once (e.g. in Turso dashboard or a one-off script) to create tables.

CREATE TABLE IF NOT EXISTS user_dictionaries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  public INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_dictionary_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dictionary_id TEXT NOT NULL REFERENCES user_dictionaries(id) ON DELETE CASCADE,
  noun TEXT NOT NULL,
  article TEXT NOT NULL,
  alternative_articles TEXT,
  translation TEXT,
  translation_ru TEXT,
  translation_en TEXT,
  translation_uk TEXT,
  example_sentence TEXT,
  level TEXT,
  topic TEXT,
  audio_url TEXT
);
