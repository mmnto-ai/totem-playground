// Adversarial fixtures for the Refinement Engine demo.
//
// Each section below intentionally trips the "Mark of incomplete work" rule
// ([Tt][Oo][Dd][Oo]) in a DIFFERENT AST context so totem's per-line context
// telemetry accumulates a noisy distribution. `totem doctor` uses that
// distribution to flag the rule as a regex→ast-grep upgrade candidate.
//
// totem's AST classifier decides context per-line by looking at the first
// non-whitespace character and walking up the Tree-sitter ancestry. The
// string / comment / regex fixtures below are therefore structured so the
// match lands on a line that BEGINS inside the corresponding literal node —
// not on an `export const` line, which would classify as code regardless of
// what substring the match was inside.
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

// 4. REGEX context — TODO lives on a line whose first non-whitespace
//    character is inside a regex_pattern AST node. Using true RegExp literals
//    (not quoted strings joined later) is what makes the classifier walk up
//    into a `regex` ancestor instead of `string`.
export const markerPatterns = [
  /FIXME/,
  /TODO: convert this to an issue/,
  /HACK/,
];
export const markerSource = markerPatterns.map((p) => p.source).join('|');
