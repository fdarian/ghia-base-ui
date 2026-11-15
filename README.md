# ghia-base-ui

Headless [Base UI](https://github.com/mui/base-ui) primitives for Solid on [`@ghia/solid`](https://github.com/fdarian/ghia), ported from `@base-ui/react` 1.9.0.

Each primitive is a `create*` function that returns state and prop objects to spread on your own `@ghia/solid` elements. There is no styling, no theme tokens and no animation in here; timings and sizes arrive as options.

## Status

This is a port of only what [Fluid Functionalism](https://github.com/fdarian/ghia-fluid-functionalism) (FF) uses: accordion, collapsible, tabs, checkbox, checkbox-group, radio, radio-group, switch, slider, menu, select, combobox, dialog, drawer, tooltip and scroll-area, plus the shared pieces under `internals/`, `floating-ui-solid/` and `utils/`. Base UI parts and props FF never touches are not ported. FF installs the built package from npm like everyone else.

## Install

```bash
pnpm add ghia-base-ui @ghia/solid solid-js
```

Peer dependencies are `solid-js` 1.9.15 and `@ghia/solid`. Exactly one runtime instance of each may exist in your app.

## Use it

Import by folder:

```ts
import { createSelectRoot } from 'ghia-base-ui/select';
import { createRowList } from 'ghia-base-ui/internals/composite';
```

`package.json` maps `ghia-base-ui/<folder>` to `src/<folder>/index.ts` in a checkout (`dist/<folder>/index.js` in the published package); nested folders work, and a new folder needs no config. Primitive files mirror upstream's layout (`accordion/root/use-accordion-root.ts` for `accordion/root/AccordionRoot.tsx`); the [file map](UPSTREAM.md#file-map) lists all of them.

## Commands

```bash
pnpm check:type   # tsc
pnpm check:test   # vitest, headless
pnpm check        # both
pnpm format       # biome check --write
pnpm build        # tsdown into dist/
```

## Development

The `@ghia/solid`, `@ghia/native` and `ghia` dev dependencies are `link:../ghia/packages/*` links to ghia's unreleased HEAD until ghia publishes. Check out [ghia](https://github.com/fdarian/ghia) beside this repo, run `pnpm install` and `bun run build` at its root, then `pnpm install` here.

## More

- [AGENTS.md](AGENTS.md): orientation for coding agents working in this repo.
- [LICENSE](LICENSE): MIT. Base UI is MIT, Copyright (c) 2019 Material-UI SAS.
