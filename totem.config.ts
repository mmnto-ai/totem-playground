import type { TotemConfig } from '@mmnto/totem';

const config: TotemConfig = {
  targets: [
    { glob: 'src/**/*.ts', type: 'code', strategy: 'typescript-ast' },
    { glob: 'src/**/*.tsx', type: 'code', strategy: 'typescript-ast' },
    { glob: 'README.md', type: 'spec', strategy: 'markdown-heading' },
  ],

  ignorePatterns: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
};

export default config;
