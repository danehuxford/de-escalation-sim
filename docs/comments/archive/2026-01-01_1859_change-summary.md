# Change Summary

## Summary of changes
- Added DEES runtime prompt schema types and a deterministic builder.
- Rewired the simulation model call to build and send DEES runtime JSON per turn.
- Added a DEES runtime dev panel with optional escalation override and JSON visibility.
- Added the DEES engine system prompt.

## Files modified
- `lib/deesRuntime.ts`: New runtime prompt schema types and builder utilities.
- `app/api/sim/next/route.ts`: Built runtime JSON from session/scenario/turns and updated model call.
- `app/sim/[sessionId]/page.tsx`: Added dev panel controls and runtime JSON handling.
- `docs/prompts/dees_engine.md`: New DEES engine system prompt.

## Schema changes
- None.

## Behavior changes
- Each user turn now builds a DEES runtime JSON payload and sends it to the model.
- Patient responses are generated from the DEES engine prompt with runtime context.
- Dev mode can display the last runtime JSON and override escalation level for testing.

## Rationale for changes
- Provide the required runtime prompt schema and wire it into the DEES GPT pipeline.

## Assumptions / known limitations
- Coach responses continue to use local fallback logic, not model output.
- Runtime JSON is logged and returned only when debug mode is enabled.

## Follow-up notes
- Confirm `DEES_MODEL` and `DEES_TEMPERATURE` environment variables if needed.
