Summary of changes:
- Switched the dev panels container to a full-screen overlay while keeping the Show/Hide Dev Panels button.

Files modified:
- app/sim/[sessionId]/page.tsx: full-screen dev panel layout and close control.

Schema changes:
- None.

Behavior changes:
- Dev panels now open as a full-screen overlay with scrollable content.

Rationale:
- Provide enough space to view all dev panels at once.

Assumptions/known limitations:
- Overlay blocks interaction with the main page while open.
