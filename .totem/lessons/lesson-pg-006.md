## Lesson - Never use explicit any type annotations in application code  
  
**Domain:** typescript  
**Tags:** typescript, type-safety, architecture  
**Phase:** build  
  
Avoid using the any type annotation in TypeScript application code. Explicit any disables the type checker for that value, allowing type errors to propagate silently through the codebase. Use unknown for truly untyped values, or define proper interfaces for structured data like API request bodies. 
