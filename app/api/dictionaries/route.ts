import { NextResponse } from "next/server";
import { db } from "@/app/db";
import { userDictionaries, userDictionaryWords } from "@/app/db/schema";
import type { Word } from "@/app/types";

export const dynamic = "force-static";

function wordToRow(dictionaryId: string, word: Word) {
  return {
    dictionaryId,
    noun: word.noun,
    article: word.article,
    alternativeArticles: word.alternative_articles
      ? JSON.stringify(word.alternative_articles)
      : null,
    translation: word.translation ?? null,
    translationRu: word.translation_ru ?? null,
    translationEn: word.translation_en ?? null,
    translationUk: word.translation_uk ?? null,
    exampleSentence: word.exampleSentence ?? null,
    level: word.level ?? null,
    topic: word.topic ?? null,
    audioUrl: word.audio_url ?? null,
  };
}

function rowToWord(row: {
  noun: string;
  article: string;
  alternative_articles: string | null;
  translation: string | null;
  translation_ru: string | null;
  translation_en: string | null;
  translation_uk: string | null;
  example_sentence: string | null;
  level: string | null;
  topic: string | null;
  audio_url: string | null;
}): Word {
  return {
    noun: row.noun,
    article: row.article as Word["article"],
    ...(row.translation && { translation: row.translation }),
    ...(row.translation_ru && { translation_ru: row.translation_ru }),
    ...(row.translation_en && { translation_en: row.translation_en }),
    ...(row.translation_uk && { translation_uk: row.translation_uk }),
    ...(row.example_sentence && { exampleSentence: row.example_sentence }),
    ...(row.level && { level: row.level as Word["level"] }),
    ...(row.topic && { topic: row.topic }),
    ...(row.alternative_articles && {
      alternative_articles: JSON.parse(row.alternative_articles) as string[],
    }),
    ...(row.audio_url && { audio_url: row.audio_url }),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name: string; words: Word[] };
    const { name, words } = body;
    if (!name || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: "name and non-empty words required" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const now = new Date();

    await db.insert(userDictionaries).values({
      id,
      name,
      createdAt: now,
    });

    if (words.length > 0) {
      await db.insert(userDictionaryWords).values(
        words.map((w) => wordToRow(id, w))
      );
    }

    return NextResponse.json({ id });
  } catch (error) {
    console.error("POST /api/dictionaries:", error);
    return NextResponse.json(
      { error: "Failed to create dictionary" },
      { status: 500 }
    );
  }
}
