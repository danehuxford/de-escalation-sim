Summary of changes:
- Added Coach Me variability control (low/medium/high) and passed it to the server.
- Applied variability to the OpenAI call via temperature.

Files modified:
- app/sim/[sessionId]/page.tsx: added variability selector to Coach Me and sent to API.
- app/api/sim/coach-me/route.ts: accepted selectedVariability and mapped to temperature.

Schema changes:
- None.

Behavior changes:
- “Get Coaching Suggestions” now supports adjustable variability per request.

Rationale:
- Increase suggestion diversity when desired.

Assumptions/known limitations:
- Temperature values are low/medium/high = 0.2/0.6/1.0.
