// Adversarial fixtures for the Refinement Engine demo.
//
// Each line below intentionally trips the "Mark of incomplete work" rule
// (\b[Tt][Oo][Dd][Oo]) in a DIFFERENT context so totem's context telemetry
// accumulates a noisy distribution. `totem doctor` uses that distribution
// to flag the rule as a regex→ast-grep upgrade candidate.
//
// totem's AST classifier decides context per-line by looking at the first
// non-whitespace character and walking up the Tree-sitter ancestry. That's
// why the string / regex fixtures below are multi-line template literals
// or constructor calls — the match has to start inside the literal node,
// not on an `export const` line that would classify as code.
//
// These are demo props — not real code. They exist only to exercise the
// refinement loop end-to-end.

// 1. CODE context — identifier match (camelCase variable, first char on line
//    is the `export` keyword → AST classifier marks the line as 'code')
export const todoList: string[] = [];

// 2. STRING context — TODO lives on a line whose first non-whitespace
//    character sits inside a template_string AST node
export const releaseNotes = `
New in this release:
TODO: finalize changelog before shipping
More features coming soon.
`;

// 3. COMMENT context — legitimate target of the rule (first char is `/`,
//    line classifies as 'comment')
// TODO: optional enhancement for v2

// 4. REGEX context — constructing a RegExp from a multi-line string where
//    the TODO match lands inside a string_fragment. (A literal /TODO/ on
//    an `export const` line would classify as code, not regex.)
export const markerSource = [
  'FIXME',
  'TODO: convert this to an issue',
  'HACK',
].join('|');
