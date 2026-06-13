// app/types/dev.ts

export interface ComponentExample {
  name: string;
  props: Record<string, any>;
  usage: string;
}

export interface ComponentMetadata {
  name: string;
  path: string;
  description: string;
  type: 'Pure' | 'Smart';
  componentPath: string;
  examples: ComponentExample[];
}
