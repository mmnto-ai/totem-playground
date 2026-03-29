import type { TotemConfig } from '@mmnto/totem';

const config: TotemConfig = {
  embedding: {
    provider: 'gemini',
    model: 'gemini-embedding-2-preview',
  },
  orchestrator: {
    provider: 'gemini',
    defaultModel: 'gemini-2.5-pro',
  },
  targets: [
    { glob: 'src/**/*.ts', type: 'code', strategy: 'typescript-ast' },
    { glob: 'src/**/*.tsx', type: 'code', strategy: 'typescript-ast' },
    { glob: 'README.md', type: 'spec', strategy: 'markdown-heading' },
  ],

  ignorePatterns: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
};

export default config;
