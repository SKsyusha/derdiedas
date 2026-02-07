import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/db";
import { userDictionaries, userDictionaryWords } from "@/app/db/schema";
import { eq } from "drizzle-orm";
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

function rowToWord(row: {
  noun: string;
  article: string;
  alternativeArticles: string | null;
  translation: string | null;
  translationRu: string | null;
  translationEn: string | null;
  translationUk: string | null;
  exampleSentence: string | null;
  level: string | null;
  topic: string | null;
  audioUrl: string | null;
}): Word {
  return {
    noun: row.noun,
    article: row.article as Word["article"],
    ...(row.translation && { translation: row.translation }),
    ...(row.translationRu && { translation_ru: row.translationRu }),
    ...(row.translationEn && { translation_en: row.translationEn }),
    ...(row.translationUk && { translation_uk: row.translationUk }),
    ...(row.exampleSentence && { exampleSentence: row.exampleSentence }),
    ...(row.level && { level: row.level as Word["level"] }),
    ...(row.topic && { topic: row.topic }),
    ...(row.alternativeArticles && {
      alternative_articles: JSON.parse(row.alternativeArticles) as string[],
    }),
    ...(row.audioUrl && { audio_url: row.audioUrl }),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [dict] = await db
      .select()
      .from(userDictionaries)
      .where(eq(userDictionaries.id, id));

    if (!dict) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const rows = await db
      .select()
      .from(userDictionaryWords)
      .where(eq(userDictionaryWords.dictionaryId, id));

    const words = rows.map(rowToWord);

    return NextResponse.json({
      id: dict.id,
      name: dict.name,
      words,
    });
  } catch (error) {
    console.error("GET /api/dictionaries/[id]:", error);
    return NextResponse.json(
      { error: "Failed to load dictionary" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [dict] = await db
      .select()
      .from(userDictionaries)
      .where(eq(userDictionaries.id, id));

    if (!dict) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      public?: boolean;
      words?: Word[];
    };

    if (body.name !== undefined) {
      await db
        .update(userDictionaries)
        .set({ name: body.name })
        .where(eq(userDictionaries.id, id));
    }

    if (body.public !== undefined) {
      await db
        .update(userDictionaries)
        .set({ public: body.public })
        .where(eq(userDictionaries.id, id));
    }

    if (body.words !== undefined) {
      await db
        .delete(userDictionaryWords)
        .where(eq(userDictionaryWords.dictionaryId, id));
      if (body.words.length > 0) {
        await db.insert(userDictionaryWords).values(
          body.words.map((w) => wordToRow(id, w))
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/dictionaries/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update dictionary" },
      { status: 500 }
    );
  }
}

