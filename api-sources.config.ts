export interface ApiSource {
  /** Source name — used as the output filename at app/types/api/<name>.ts */
  name: string;
  /** URL of openapi.json — supports env vars via \ */
  url: string;
  /** Output path (optional) — default: app/types/api/<name>.ts */
  output?: string;
  /** Additional headers, e.g. auth token for a private API (optional) */
  headers?: Record<string, string>;
}

export const apiSources: ApiSource[] = [
  {
    name: 'main',
    url: '\/openapi.json',
  },
];
