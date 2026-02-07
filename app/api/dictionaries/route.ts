import { NextResponse } from "next/server";
import { db } from "@/app/db";
import { userDictionaries, userDictionaryWords } from "@/app/db/schema";
import type { Word } from "@/app/types";

export const dynamic = "force-dynamic";

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
