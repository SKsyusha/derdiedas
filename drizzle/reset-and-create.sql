-- 1. Drop tables (order: words first due to FK)
DROP TABLE IF EXISTS user_dictionary_words;
DROP TABLE IF EXISTS user_dictionaries;

-- 2. Create tables from current schema
CREATE TABLE user_dictionaries (
  id text PRIMARY KEY,
  name text NOT NULL,
  public integer NOT NULL DEFAULT 1,
  created_at integer NOT NULL
);

CREATE TABLE user_dictionary_words (
  id integer PRIMARY KEY AUTOINCREMENT,
  dictionary_id text NOT NULL REFERENCES user_dictionaries(id) ON DELETE CASCADE,
  noun text NOT NULL,
  article text NOT NULL,
  alternative_articles text,
  translation text,
  translation_ru text,
  translation_en text,
  translation_uk text,
  example_sentence text,
  level text,
  topic text,
  audio_url text
);
