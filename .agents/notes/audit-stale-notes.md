# Audit rows that may be stale

[base-ui-audit.md](./base-ui-audit.md) prose can lag the code. These rows were flagged as not re-checked against the code (as of the 2026-11-03 wiki snapshot), so re-read the code before trusting them:

- **tabs `activateOnFocus`**: the pointer-activation-timing Note.
- **Tab rows of the menu and of the color picker's format menu.**
- **The color picker's own rows**: check their refs before relying on them.

Fix a row's Note when you touch it. Delete this note once all three are verified.
