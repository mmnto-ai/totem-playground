## Lesson - Use a validated config schema instead of direct process.env access  
  
**Domain:** nextjs, typescript  
**Tags:** typescript, configuration, reliability  
**Phase:** build, runtime  
  
Use a validated configuration module (e.g., Zod schema + a config.ts file) instead of accessing process.env directly in application code. Direct access scatters environment dependencies across the codebase and crashes at runtime rather than startup when a variable is missing. 
