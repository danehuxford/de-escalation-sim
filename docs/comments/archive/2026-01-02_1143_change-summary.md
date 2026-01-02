Summary of changes:
- Updated DEES engine prompt to define the runtime JSON contract and strict output/constraint rules.

Files modified:
- docs/prompts/dees_engine.md: Clarified JSON authority, constraint enforcement, output mode, and actor type rules.

Schema changes:
- None.

Behavior changes:
- Prompt now requires patient/family utterance-only output when specified by response_instructions.

Rationale:
- Align prompt with the runtime JSON pipeline as the authoritative source of scenario/persona/constraints.

Assumptions / known limitations:
- None.

Follow-up notes:
- None.
