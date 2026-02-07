import type { Word } from "@/app/types";

const BASE = "/api/dictionaries";

/** API response when creating a dictionary */
export interface CreateDictionaryResponse {
  id: string;
}

/** Dictionary as returned by GET /api/dictionaries/[id] */
export interface DictionaryDto {
  id: string;
  name: string;
  words: Word[];
}

/** Payload for PATCH /api/dictionaries/[id] */
export interface UpdateDictionaryPayload {
  name?: string;
  public?: boolean;
  words?: Word[];
}

/** Error response from API */
interface ApiErrorBody {
  error?: string;
}

async function parseApiError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return body.error ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    throw new Error(await parseApiError(res));
  }
  return res.json() as Promise<T>;
}

/**
 * Create a new user dictionary with the given name and words.
 * @returns The created dictionary id.
 */
export async function createDictionary(
  name: string,
  words: Word[]
): Promise<CreateDictionaryResponse> {
  return fetchJson<CreateDictionaryResponse>(BASE, {
    method: "POST",
    body: JSON.stringify({ name, words }),
  });
}

/**
 * Fetch a user dictionary by id.
 */
export async function getDictionary(id: string): Promise<DictionaryDto> {
  return fetchJson<DictionaryDto>(`${BASE}/${id}`);
}

/**
 * Update a user dictionary (name, public flag, and/or words).
 */
export async function updateDictionary(
  id: string,
  payload: UpdateDictionaryPayload
): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseApiError(res));
  }
}

/**
 * Whether the given id is a persisted dictionary id (UUID from the API).
 * Local/placeholder ids (e.g. "user-1") return false.
 */
export function isPersistedDictionaryId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}
