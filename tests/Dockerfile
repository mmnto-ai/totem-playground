FROM node:22-slim

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Setup git
RUN git init && git config user.email "test@test.com" && git config user.name "Test"

# Copy baseline files only (no violation files)
COPY .gitignore package.json tsconfig.json totem.config.ts /app/
COPY .totem/compiled-rules.json /app/.totem/compiled-rules.json
COPY src/app/page.tsx /app/src/app/page.tsx
COPY src/app/layout.tsx /app/src/app/layout.tsx
COPY README.md /app/

# Commit baseline
RUN git add -A && git commit -m "baseline" && git branch -M main

# Now copy violation files and commit on a feature branch
COPY src/app/api/ /app/src/app/api/
COPY src/lib/ /app/src/lib/
COPY src/middleware/ /app/src/middleware/

RUN git checkout -b feat/add-routes && \
    git add -A && \
    git commit -m "violations"

# Copy and run test script
COPY tests/run-test.sh /app/tests/run-test.sh
RUN chmod +x /app/tests/run-test.sh

ENTRYPOINT ["/app/tests/run-test.sh"]
