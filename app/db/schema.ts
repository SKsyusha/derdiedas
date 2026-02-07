import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const userDictionaries = sqliteTable("user_dictionaries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  public: integer("public", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const userDictionaryWords = sqliteTable("user_dictionary_words", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dictionaryId: text("dictionary_id")
    .notNull()
    .references(() => userDictionaries.id, { onDelete: "cascade" }),
  noun: text("noun").notNull(),
  article: text("article").notNull(),
  alternativeArticles: text("alternative_articles"),
  translation: text("translation"),
  translationRu: text("translation_ru"),
  translationEn: text("translation_en"),
  translationUk: text("translation_uk"),
  exampleSentence: text("example_sentence"),
  level: text("level"),
  topic: text("topic"),
  audioUrl: text("audio_url"),
});
