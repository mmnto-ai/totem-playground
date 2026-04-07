## Lesson — Never build SQL queries with string concatenation  
  
**Domain:** database, universal  
**Tags:** typescript, security, sql  
**Phase:** data  
  
Never construct SQL queries by concatenating user input into query strings. Use parameterized queries, prepared statements, or an ORM. String concatenation is the most common SQL injection vector and has been a top OWASP vulnerability for over two decades.

**Pattern:** `(SELECT|INSERT|UPDATE|DELETE)\s+.*(\+|\$\{)`
**Engine:** regex
**Scope:** src/**/*.ts, src/**/*.tsx
**Severity:** error

