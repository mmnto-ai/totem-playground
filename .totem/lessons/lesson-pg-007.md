## Lesson — Mark of incomplete work in source files

Flag every occurrence of the substring `TODO` (case-insensitive) in TypeScript source files — in identifiers, string literals, comments, and regex literals alike. Start broad on purpose: context telemetry drives later refinement into a code-only ast-grep pattern via `totem compile --upgrade <hash>`.

**Bad:**
```ts
const todoList: string[] = [];
const message = "TODO: fix this before shipping";
// TODO: document the API surface
const fixmePattern = /TODO|FIXME/g;
```

**Good:**
```ts
const items: string[] = [];
const message = "ready to ship";
// Document the API surface
const fixmePattern = /FIXME/g;
```
