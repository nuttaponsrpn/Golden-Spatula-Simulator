// server/api/dev/components.get.ts
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { defineEventHandler, createError } from 'h3';

export default defineEventHandler(async (event) => {
  // Only allow in development mode
  if (!import.meta.dev) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Dev only',
    });
  }

  const docsDir = path.join(process.cwd(), 'app/documents');
  console.log(`[Dev Explorer API] Scanning directory: ${docsDir}`);
  console.log(`[Dev Explorer API] Current working directory: ${process.cwd()}`);
  const components: any[] = [];

  /**
   * Recursively scans app/documents/ for .md files
   */
  async function walk(dir: string) {
    try {
      const files = await fs.readdir(dir, { withFileTypes: true });
      console.log(`[Dev Explorer API] Found ${files.length} items in ${dir}`);
      for (const file of files) {
        const res = path.resolve(dir, file.name);
        if (file.isDirectory()) {
          await walk(res);
        } else if (file.name.endsWith('.md')) {
          console.log(`[Dev Explorer API] Parsing: ${file.name}`);
          const content = await fs.readFile(res, 'utf-8');
          const relativePath = path.relative(docsDir, res);
          // parseComponentMarkdown is auto-imported from server/utils/markdown.ts
          components.push(parseComponentMarkdown(content, relativePath));
        }
      }
    } catch (e) {
      console.error(`[Dev Explorer API] Error walking directory ${dir}:`, e);
    }
  }

  // Check if directory exists before walking
  try {
    await fs.access(docsDir);
    await walk(docsDir);
  } catch (e) {
    console.warn('app/documents directory not found');
  }

  return components;
});
