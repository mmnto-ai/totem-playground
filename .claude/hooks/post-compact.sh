#!/bin/bash
# Re-inject critical rules + capability manifest after context compaction
echo ""
echo "⚠️  CONTEXT COMPACTED — Critical rules:"
echo "  1. Run /prepush BEFORE pushing (lint + review)"
echo "  2. Use Closes #NNN in PR bodies"
echo "  3. Files in src/app/api/, src/lib/, src/middleware/ are INTENTIONAL violations — do NOT fix"
echo "  4. Call mcp__totem__search_knowledge before modifying systems"

cat << 'EOF'

📋 Capability Manifest (totem-playground):
  Commands: lint, review, status, doctor, rule list, lesson list, describe
  MCP Tools: search_knowledge, add_lesson, verify_execution, describe_project
  Skills: /preflight, /prepush, /postmerge, /signoff, /review-reply
  Hooks: PreToolUse (blocks push without review), PostCompact (this manifest)
  Engines: regex, ast (Tree-sitter), ast-grep

  PR Bot Protocol:
    CodeRabbit: reply inline freely
    GCA: ONE batched comment with @gemini-code-assist, never inline

EOF
