/**
 * gen-api.ts — fetch openapi.json จากทุก source ใน api-sources.config.ts
 * แล้ว generate TypeScript types ลง app/types/api/<name>.ts
 *
 * Usage:
 *   pnpm gen:api          # regenerate types
 *   pnpm gen:api --check  # CI mode: diff committed files vs fresh generate
 */

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

import openapiTS, { astToString } from "openapi-typescript";

import { apiSources, type ApiSource } from "../api-sources.config";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const DEFAULT_OUTPUT_DIR = join(ROOT, "app", "types", "api");
const CHECK_MODE = process.argv.includes("--check");

const ENV_VAR_PATTERN = /\$\{([A-Z0-9_]+)\}/g;

function resolveEnvVars(input: string, missing: Set<string>): string {
  return input.replace(ENV_VAR_PATTERN, (_, key: string) => {
    const value = process.env[key];
    if (value === undefined || value === "") {
      missing.add(key);
      return "";
    }
    return value;
  });
}

function resolveSource(source: ApiSource): {
  url: string;
  headers: Record<string, string>;
  missing: string[];
} {
  const missing = new Set<string>();
  const url = resolveEnvVars(source.url, missing);
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(source.headers ?? {})) {
    headers[k] = resolveEnvVars(v, missing);
  }
  return { url, headers, missing: [...missing] };
}

async function fetchOpenApi(source: ApiSource): Promise<unknown> {
  const { url, headers, missing } = resolveSource(source);
  if (missing.length > 0) {
    throw new Error(
      `[${source.name}] missing env vars: ${missing.join(", ")} (referenced in api-sources.config.ts)`,
    );
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`[${source.name}] fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function generateForSource(source: ApiSource, outputDir: string): Promise<string> {
  const schema = await fetchOpenApi(source);
  const ast = await openapiTS(schema as Parameters<typeof openapiTS>[0]);
  const body = astToString(ast);
  const outputPath = source.output
    ? resolve(ROOT, source.output)
    : join(outputDir, `${source.name}.ts`);

  const header = [
    "// AUTO-GENERATED — DO NOT EDIT.",
    `// Source: ${source.name}`,
    "// Run `pnpm gen:api` to regenerate.",
    "",
    "",
  ].join("\n");

  const content = header + body;
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, "utf8");
  return outputPath;
}

async function generateIndex(outputDir: string): Promise<string> {
  const lines = ["// AUTO-GENERATED — DO NOT EDIT.", "// Run `pnpm gen:api` to regenerate.", ""];
  for (const source of apiSources) {
    if (source.output) continue; // custom output paths ไม่รวมใน index
    const ns = source.name.replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase());
    const namespace = ns.charAt(0).toUpperCase() + ns.slice(1) + "Api";
    lines.push(`export * as ${namespace} from "./${source.name}";`);
  }
  const indexPath = join(outputDir, "index.ts");
  const content = lines.join("\n") + "\n";
  await writeFile(indexPath, content, "utf8");
  return indexPath;
}

async function readIfExists(path: string): Promise<string | null> {
  if (!existsSync(path)) return null;
  return readFile(path, "utf8");
}

async function run(): Promise<void> {
  if (apiSources.length === 0) {
    console.warn("⚠ no API sources defined in api-sources.config.ts");
    return;
  }

  if (CHECK_MODE) {
    const tmpDir = join(tmpdir(), `gen-api-check-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
    try {
      const drift: string[] = [];
      for (const source of apiSources) {
        const tmpPath = await generateForSource(source, tmpDir);
        const committedPath = source.output
          ? resolve(ROOT, source.output)
          : join(DEFAULT_OUTPUT_DIR, `${source.name}.ts`);
        const fresh = await readFile(tmpPath, "utf8");
        const committed = await readIfExists(committedPath);
        if (committed !== fresh) {
          drift.push(relative(ROOT, committedPath));
        }
      }
      // index check
      const tmpIndex = await generateIndex(tmpDir);
      const committedIndex = await readIfExists(join(DEFAULT_OUTPUT_DIR, "index.ts"));
      if ((await readFile(tmpIndex, "utf8")) !== committedIndex) {
        drift.push(relative(ROOT, join(DEFAULT_OUTPUT_DIR, "index.ts")));
      }

      if (drift.length > 0) {
        console.error("✗ API contract drift detected. Run `pnpm gen:api` and commit:");
        for (const f of drift) console.error(`  - ${f}`);
        process.exit(1);
      }
      console.log("✓ API contract is in sync");
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
    return;
  }

  await mkdir(DEFAULT_OUTPUT_DIR, { recursive: true });
  for (const source of apiSources) {
    const path = await generateForSource(source, DEFAULT_OUTPUT_DIR);
    console.log(`✓ generated ${relative(ROOT, path)}`);
  }
  const indexPath = await generateIndex(DEFAULT_OUTPUT_DIR);
  console.log(`✓ generated ${relative(ROOT, indexPath)}`);
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
