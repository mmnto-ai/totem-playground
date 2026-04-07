## Lesson — Never build SQL queries with string concatenation  
  
**Domain:** database, universal  
**Tags:** typescript, security, sql  
**Phase:** data  
  
Never construct SQL queries by concatenating user input into query strings. Use parameterized queries, prepared statements, or an ORM. String concatenation is the most common SQL injection vector and has been a top OWASP vulnerability for over two decades.

**Pattern:** `\b(?:[Ss][Ee][Ll][Ee][Cc][Tt]|[Ii][Nn][Ss][Ee][Rr][Tt]|[Uu][Pp][Dd][Aa][Tt][Ee]|[Dd][Ee][Ll][Ee][Tt][Ee])\b[\s\S]*?(\+|\$\{)`
**Engine:** regex
**Scope:** src/**/*.ts, src/**/*.tsx
**Severity:** error

