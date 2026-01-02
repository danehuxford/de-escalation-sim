Summary of changes:
- Fixed malformed string escaping in follow-through scoring logic so the file compiles.

Files modified:
- lib/scoring.ts: corrected follow-through regex and string literals.

Schema changes:
- None.

Behavior changes:
- None intended; restores intended follow-through detection without syntax errors.

Rationale:
- The previous edit introduced escaped quotes/backslashes that broke TypeScript parsing.

Assumptions/known limitations:
- None.
