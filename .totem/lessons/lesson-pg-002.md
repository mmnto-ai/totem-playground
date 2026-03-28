## Lesson - Never swallow errors with empty catch blocks  
  
**Domain:** typescript, universal  
**Tags:** typescript, error-handling, debugging  
**Phase:** runtime  
  
Never leave a catch block empty. An empty catch silently discards the error, making failures invisible and debugging nearly impossible. At minimum log the error; preferably handle it explicitly or let it propagate to a centralized error handler. 
