Summary of changes:
- Added a .gitignore entry set to exclude local/secret/generated files before initial commit.

Files modified:
- .gitignore: Added .env.local, .DS_Store, .next/, node_modules/.

Schema changes:
- None.

Behavior changes:
- Git now ignores local environment and build artifacts.

Rationale:
- Prevent committing secrets and build artifacts.

Assumptions / known limitations:
- None.

Follow-up notes:
- Proceed with git add/commit/push.
