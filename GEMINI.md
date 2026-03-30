# Totem Playground — Development Rules

## Essentials

- **pnpm only** (never npm/yarn). Use `pnpm dlx` (never `npx`). Windows 11 + Git Bash. TypeScript strict mode.
- `main` is protected. Feature branches + PRs. Never amend commits on feature branches.
- Use `Closes #NNN` in PR descriptions.
- `kebab-case.ts` files, `err` (never `error`) in catch blocks, no empty catches.
- **NEVER put secrets in config files.** `.env` only.

## Detailed Rules

- See `.gemini/styleguide.md` for full code style, naming, and architecture rules.
