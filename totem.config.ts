import type { TotemConfig } from '@mmnto/totem';

const config: TotemConfig = {
  embedding: { provider: 'gemini', model: 'gemini-embedding-2-preview', dimensions: 768 },
  orchestrator: { provider: 'anthropic', defaultModel: 'claude-sonnet-4-6' },
  targets: [
    { glob: 'src/**/*.ts', type: 'code', strategy: 'typescript-ast' },
    { glob: 'src/**/*.tsx', type: 'code', strategy: 'typescript-ast' },
    { glob: 'README.md', type: 'spec', strategy: 'markdown-heading' },
  ],

  ignorePatterns: ['**/node_modules/**', '**/.next/**', '**/dist/**'],

  linkedIndexes: ['../totem', '../totem-strategy'],
};

export default config;

