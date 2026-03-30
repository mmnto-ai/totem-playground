FROM node:22-slim

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

# Setup git
RUN git init && git config user.email "test@test.com" && git config user.name "Test"

# Copy baseline files only (no violation files)
COPY .gitignore package.json pnpm-lock.yaml tsconfig.json totem.config.ts /app/
COPY .totem/compiled-rules.json /app/.totem/compiled-rules.json
COPY src/app/page.tsx /app/src/app/page.tsx
COPY src/app/layout.tsx /app/src/app/layout.tsx
COPY README.md /app/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Commit baseline
RUN git add -A && git commit -m "baseline" && git branch -M main

# Copy violation files and stage (but do not commit) so lint always
# sees them in the diff — even when resilience tests modify rules
COPY src/app/api/ /app/src/app/api/
COPY src/lib/ /app/src/lib/
COPY src/middleware/ /app/src/middleware/
RUN git add src/

# Copy and run test script (sed strips Windows CRLF from build context)
COPY tests/run-test.sh /app/tests/run-test.sh
RUN sed -i 's/\r$//' /app/tests/run-test.sh && chmod +x /app/tests/run-test.sh

ENTRYPOINT ["/app/tests/run-test.sh"]
