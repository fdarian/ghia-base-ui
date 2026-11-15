Headless Base UI primitives for Solid on `@ghia/solid`, ported from `@base-ui/react` 1.9.0 (tag v1.9.0, ad7ecda). Published to npm as `ghia-base-ui`; no styling, no theme tokens. Only what a known consumer uses is ported: `~/code/fdarian/ghia-fluid-functionalism` (FF), and `ghia-solid-stack` (a benchmark app on ghia; it needs `avatar`, `input` and `button`, which FF does not use). FF and every other consumer install the tsdown build in `dist/` from npm.

## Layout

- `src/<folder>/<part>/<kebab-name>.ts` mirrors `packages/react/src/<folder>/<part>/<PascalName>.tsx` upstream (reference clone: `~/.claude/notes/base-ui-source`). Each folder has an `index.ts`; `exports` is `"./*": "./src/*/index.ts"` (what a local checkout resolves), so consumers import `ghia-base-ui/<folder>`, nested folders included (`.../internals/composite`). `publishConfig.exports` repoints the same pattern at `dist/<folder>/index.{js,d.ts}`, which `tsdown.config.ts` emits (one entry per `src/**/index.ts`, peers external).
- Component folders: `accordion collapsible tabs checkbox checkbox-group radio radio-group switch slider menu select combobox dialog drawer popover tooltip scroll-area avatar input button`. Each exports `create*` functions returning state and prop objects, not components.
- Shared: `internals/` (composite key navigation and `createRowList`, `filter`, `use-transition-status`, `use-anchor-positioning`), `floating-ui-solid/` (click, typeahead, `safe-polygon` with the hover tracker that runs it, `mark-others`), `utils/` (`pointer-capture`, `form-value`).
- [UPSTREAM.md](UPSTREAM.md) — the pin, how to sync, the upstream-to-port file map and the port-only files; read before moving the pin or adding a primitive.
- [PORTING.md](PORTING.md) — how to translate Base UI's React into this repo's Solid 1, and how to use ZerNico's Solid 2 port as the pattern reference; read before porting or filling an audit gap.
- [GLOSSARY.md](GLOSSARY.md) — Popup, Root, Trigger, Anchor, Hover intent and the identifiers that carry them in `src/`; read with PORTING.md.
- [Base UI audit](./.agents/notes/base-ui-audit.md) — Base UI vs port, row by row, with `src/...` and `ff:src/...` refs; update the rows you touch.
- Files use relative imports, never `#/*`: `exports` points at `src/`, so a consumer resolving it compiles this source with its own tsconfig.
- No JSX in `src`: the npm build is tsdown's plain JS, and ghia 0.12's `ghia:solid-libraries` path compiles library JSX only under ghia's Vite `solid()` plugin (untested here), so a published `.tsx` is not safe. Build host elements with `jsx()` from `@ghia/solid/jsx-runtime` (see `utils/form-value.ts`).
- Primitives take timings and sizes as options; the consumer owns styling constants. Refs are returned as functions because a spread `ref` applies late in `@ghia/solid` JSX.

## Commands

- `pnpm check:type` / `pnpm check:test` (vitest through `bun --bun vitest run`, headless; `vitest.config.ts` loads `ghia()` and `solid()`) / `pnpm check` / `pnpm format` / `pnpm build` (tsdown into `dist/`)
- Releases: `pnpm changeset` adds a changeset; merging to `main` runs `.github/workflows/release.yml` (Changesets version PR, then npm publish via OIDC, no token). `prepublishOnly` refuses a local publish.

## Gotchas

- `@ghia/solid`, `@ghia/native` and `ghia` are temporary `link:../ghia/packages/*` dev dependencies on ghia's unreleased HEAD, not the npm versions; they become exact npm versions once ghia publishes. The link needs `~/code/fdarian/ghia` checked out beside this repo and built: `bun run build` at ghia's root, after its `pnpm install`.
- This repo installs standalone (`pnpm install` here); FF depends on `ghia-base-ui` from npm. Exactly one runtime instance of `solid-js` may exist, and it holds only because both repos pin `solid-js` 1.9.15 under pnpm's global virtual store (`enableGlobalVirtualStore`): a `solid-js` bump in ghia breaks it until this repo's pin follows.
- `tsconfig` keeps `noUncheckedIndexedAccess` on; no `!` and no fake fallbacks to satisfy it.

## Rules

- Port only what FF or ghia-solid-stack uses; no unused parts or props "for completeness". Parts FF styles itself (`Portal`, `Positioner`, `Backdrop`, `Arrow`, `Indicator`) are left out on purpose.
- Where Base UI and FF disagree, FF wins (each audit section lists its "FF-vs-Base-UI conflicts"). The one exception is popup focus, which follows Base UI.
- Don't move the 1.9.0 pin on merit: it is whatever FF's upstream (`mickadesign/fluid-functionalism`) pins.

## Notes

- [API and packaging decisions](./.agents/notes/api-and-packaging-decisions.md) — why `create*` functions, controllable highlight, refs as functions, two composite helpers, packaging rules; read before reshaping a primitive's API or touching `package.json`/workspace config
- [Focus model and FF conflicts](./.agents/notes/focus-and-ff-conflicts.md) — popup focus rule and every deliberate FF-over-Base-UI divergence; read before a sync or a "fix" toward Base UI
- [ghia constraints](./.agents/notes/ghia-constraints.md) — what `@ghia/solid`/`@ghia/native` can't do, and the event/focus/scroll/layout timing that explains odd-looking code
- [Audit rows that may be stale](./.agents/notes/audit-stale-notes.md) — base-ui-audit.md Notes not re-checked against code
