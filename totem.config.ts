import type { TotemConfig } from '@mmnto/totem';

const config: TotemConfig = {
  embedding: { provider: 'ollama', model: 'nomic-embed-text' },
  orchestrator: { provider: 'anthropic', defaultModel: 'claude-sonnet-4-6' },
  targets: [
    { glob: 'src/**/*.ts', type: 'code', strategy: 'typescript-ast' },
    { glob: 'src/**/*.tsx', type: 'code', strategy: 'typescript-ast' },
    { glob: 'README.md', type: 'spec', strategy: 'markdown-heading' },
  ],

  ignorePatterns: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
};

export default config;

