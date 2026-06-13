// server/utils/markdown.ts
import type { ComponentExample, ComponentMetadata } from '~/types/dev';

/**
 * Parses a component markdown file from app/documents/
 * Follows the template defined in GEMINI.md
 */
export function parseComponentMarkdown(content: string, filePath: string): ComponentMetadata {
  const lines = content.split('\n');
  const name = lines[0]?.replace('# ', '').trim() ?? '';
  
  const descriptionMatch = content.match(/> (.*)/);
  const description = (descriptionMatch && descriptionMatch[1]) ? descriptionMatch[1].trim() : '';
  
  const typeMatch = content.match(/\*\*Type:\*\* (Pure|Smart)/);
  const type = (typeMatch ? typeMatch[1] : 'Pure') as 'Pure' | 'Smart';
  
  const componentPathMatch = content.match(/\*\*Component:\*\* `(.*)`/);
  const componentPath = componentPathMatch?.[1] ?? '';

  const examples: ComponentExample[] = [];
  const examplesSectionMatch = content.split('## Examples')[1];
  const exampleSections = examplesSectionMatch ? examplesSectionMatch.split('### ') : [];
  
  for (const section of exampleSections) {
    if (!section.trim()) continue;
    const lines = section.split('\n');
    const exampleName = lines[0]?.trim() ?? 'Default';
    
    const jsonMatch = section.match(/```json\n([\s\S]*?)\n```/);
    const vueMatch = section.match(/```vue\n([\s\S]*?)\n```/);
    
    if (jsonMatch && jsonMatch[1]) {
      try {
        examples.push({
          name: exampleName,
          props: JSON.parse(jsonMatch[1]),
          usage: (vueMatch && vueMatch[1]) ? vueMatch[1].trim() : ''
        });
      } catch (e) {
        // Log the error but continue parsing other examples/files
        console.error(`Failed to parse JSON in ${filePath}: ${e}`);
      }
    }
  }

  return {
    name,
    path: filePath,
    description,
    type,
    componentPath: componentPath ?? '',
    examples
  };
}
