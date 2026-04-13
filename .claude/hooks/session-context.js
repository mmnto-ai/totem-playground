#!/usr/bin/env node
/**
 * SessionStart hook — injects static context about the playground repo.
 *
 * stdout → agent context (JSON with additionalContext field)
 * stderr → diagnostics only
 */

import { execSync } from 'node:child_process';

function getBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'main';
  }
}

function extractTicket(branch) {
  const match = branch.match(/(\d+)/);
  return match ? match[1] : null;
}

function main() {
  const branch = getBranch();
  const ticket = extractTicket(branch);

  const lines = [];

  lines.push('── Session Context (totem-playground) ──');
  lines.push(`Branch: ${branch}`);
  if (ticket) lines.push(`Ticket: #${ticket}`);
  lines.push('');

  lines.push('This is the totem-playground repo — a broken Next.js app with');
  lines.push('5 intentional violations used as a demo and regression test suite.');
  lines.push('');
  lines.push('IMPORTANT: Files in src/app/api/, src/lib/, and src/middleware/');
  lines.push('contain INTENTIONAL violations. Do NOT fix them.');
  lines.push('');

  lines.push('Knowledge tools available via MCP:');
  lines.push('  - mcp__totem__search_knowledge: lessons, rules, code context');
  lines.push('  - mcp__totem__add_lesson: add governance lessons');
  lines.push('  - mcp__totem__verify_execution: verify against rules');
  lines.push('  - mcp__totem__describe_project: project overview');
  lines.push('');

  lines.push('Key commands:');
  lines.push('  - pnpm exec totem lint [--staged]');
  lines.push('  - pnpm exec totem review');
  lines.push('  - pnpm exec totem status');
  lines.push('  - pnpm exec totem doctor');
  lines.push('  - pnpm exec totem rule list');
  lines.push('');

  lines.push('── End Session Context ──');

  const output = JSON.stringify({ additionalContext: lines.join('\n') });
  process.stdout.write(output);
}

main();
