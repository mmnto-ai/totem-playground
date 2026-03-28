## Lesson - Use domain-specific error classes instead of raw throw new Error  
  
**Domain:** typescript, universal  
**Tags:** typescript, error-handling, architecture  
**Phase:** runtime  
  
Replace raw throw new Error() with domain-specific error classes (e.g., AuthError, ValidationError) that carry typed error codes and recovery hints. Raw errors provide no classification, making it impossible for callers to distinguish between recoverable and fatal failures. 
