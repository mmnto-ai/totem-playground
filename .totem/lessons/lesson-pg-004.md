## Lesson — Use structured logging instead of console.log in API routes  
  
**Domain:** nextjs, api  
**Tags:** typescript, observability, api  
**Phase:** runtime  
  
Replace console.log calls in API route handlers with a structured logger (e.g., pino, winston) that attaches request IDs and log levels. Console output in production loses context, cannot be filtered, and is invisible to log aggregation tools.

**Pattern:** `console\.(log|warn|info|debug)\s*\(`
**Engine:** regex
**Scope:** src/app/api/**/*.ts, src/app/api/**/*.tsx
**Severity:** warning

