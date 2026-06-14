// Robustly extract the first balanced JSON object from a string that may be
// wrapped in markdown code fences and/or surrounded by conversational prose.
//
// Gemini frequently ignores "output only JSON" instructions and emits things
// like: `Sure! Here's the comp:\n```json\n{...}\n```\nHope this helps! 😊`.
// A naive `^```...```$` strip fails the moment any prose leads or trails the
// block. This scanner finds the first `{`, then walks forward tracking brace
// depth (while respecting string literals and escapes) until the matching `}`.
//
// Pure — no Vue/Nuxt context. Mirrored on the client at app/utils/extractJson.ts.

/**
 * Returns the substring of the first top-level balanced `{...}` object, or null
 * if no balanced object exists. String literals (including braces inside them)
 * are skipped so `{ "x": "}" }` parses correctly.
 */
export function extractJsonObject(raw: string): string | null {
  if (!raw) return null;

  const start = raw.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return raw.slice(start, i + 1);
      }
    }
  }

  // Unbalanced (e.g. still streaming) — return from the first brace to the end
  // so callers attempting a parse get the best available candidate.
  return raw.slice(start);
}

/**
 * Extract + JSON.parse the first balanced object. Returns null on any failure
 * (no object found, or the candidate is not valid JSON yet).
 */
export function parseJsonObject<T = unknown>(raw: string): T | null {
  const candidate = extractJsonObject(raw);
  if (!candidate) return null;
  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
}
