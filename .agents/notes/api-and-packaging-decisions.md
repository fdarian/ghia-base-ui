# API shape, layout and packaging decisions

Why the port is headless `create*` functions laid out file-for-file like Base UI, and the packaging rules that keep it usable both as source and as the npm package. The _what_ is in [PORTING.md](../../PORTING.md) ("Public API differences") and [UPSTREAM.md](../../UPSTREAM.md) ("File map", "Port-only files").

## Headless `create*` functions, not compound components

Base UI is React compound components (`<Select.Root>`, `<Select.Trigger>`). Here each part is a Solid function returning state accessors and prop objects the consumer spreads on its own `@ghia/solid` elements. FF owns every visual (fluid hover, focus rings, popup surfaces, springs) and a `@ghia/solid` popup needs its own components (`<anchored>`, `DismissableLayer`, `Dialog`), so hook-shaped primitives let FF keep its markup and take behaviour from one place.

## Layout mirrors upstream, file for file

`src/<component>/<part>/<kebab-name>.ts` maps to `packages/react/src/<component>/<part>/<PascalName>.tsx`. Nothing here is a git fork (React/DOM to Solid rewrites every line), so syncing means reading upstream diffs and porting by hand; a one-to-one layout turns that into a lookup, and the audit's "Base UI ref" column can be grepped for the rows a change touches. Shared code sits where upstream keeps it (`internals/`, `floating-ui-solid/` for `floating-ui-react/`, `utils/`).

`exports` is `"./*": "./src/*/index.ts"` so adding a folder never edits a shared file.

## Scope: only what FF uses

Do not add unused parts or props "for completeness". Parts FF styles itself (`Portal`, `Positioner`, `Backdrop`, `Arrow`, `Indicator`, data-attribute and CSS-variable files) are left out on purpose. FF-only layers (fluid hover, focus-ring visuals, the inline `Dropdown` panel, command menu, sidebar) stay in FF. The exceptions live here because they are woven into a primitive's key handling: the menu search field, the slider's `steps` mapping, the switch thumb drag.

The pin (1.9.0) is not chosen on merit: it is what FF's own upstream (`mickadesign/fluid-functionalism`) pins in its `package-lock.json`. Move it only when that moves.

## Controllable highlight with reasons

Select, Combobox and Menu take the highlighted index as an option and report every change through `onHighlightChange(index, reason)`. Base UI highlights the hovered item itself; FF's fluid hover picks the nearest row (including gaps between rows) and animates to it, so FF owns pointer highlighting. The reason lets FF follow keyboard, typeahead, focus, open and reset changes. The menu list never reports a pointer reason: it only takes FF's pointer handlers to tell keyboard from pointer.

## Hover close is shared, open delays are not

Tooltip and menu submenus both keep the popup open while the pointer travels toward it, using Base UI's safe polygon (`floating-ui-solid/safe-polygon.ts`) run by one tracker, `createHoverHandleClose`, listening to the window `mousemove` from the trigger's leave until the polygon closes the popup. Open logic differs (the tooltip has a rest delay, the submenu its own hover-intent), so each trigger keeps its own open timers and only the close decision is shared.

Base UI's `blockPointerEvents` is approximated: upstream sets `pointer-events: none` on the parent popup while the pointer heads to a submenu. Here the menu list ignores pointer movement for that row (`blockedIndex`), so the trigger stays lit, but a click on a sibling row still lands.

## Refs as functions; Select rows set props one by one

A spread `ref` in `@ghia/solid` JSX applies in an effect after the element exists, after props that depend on it were read. A Select open focuses a row as the popup mounts; a `tabIndex` that arrived through a spread landed too late. So primitives return `triggerRef`, `popupRef`, `itemRef(...)` as separate functions for `ref={...}`, and FF's Select rows set props individually instead of spreading `itemProps`. Do not "simplify" a consumer back to one spread.

## Dialogs build on `@ghia/solid`'s `Dialog` family

Dialog and drawer return props for `@ghia/solid`'s `Dialog` and popup rather than re-implementing the layer, focus trap and Escape stack, which other popups (the tooltip) also join. Two pieces `@ghia/solid` lacks are port-only: `dialog/popup/focus-first.ts` and `floating-ui-solid/utils/mark-others.ts`. See [focus-and-ff-conflicts.md](./focus-and-ff-conflicts.md) for `focus-first`.

## Consumer vs. here

Styling constants stay in FF (popup exit durations, dialog fallback timings and offsets, slide offsets, focus-ring visuals); primitives take timings and sizes as options. The exception is `POPUP_MARGIN` in `internals/use-anchor-positioning.ts`: it is Base UI's default collision padding, i.e. shipped behaviour, not styling.

## `createCompositeRoot` and `createRowList` stay separate

Both do arrow keys over a list, but the semantics differ and each consumer depends on them. The composite root stands in for upstream's `useCompositeRoot` (Tabs, Accordion): one orientation's step keys, a modifier-key guard, `preventDefault` and `stopPropagation` on consumed keys. The row list (radio-group, checkbox-group) orders rows by index, activates with Space and Enter, works on both axes, and has no modifier guard or `stopPropagation`. Merging needs a flag per difference and silently changes a consumer if defaults move.

## Menu search is FF's layer, woven into the list

`menu/input/menu-search.ts` has no upstream file. Base UI's `Menu.Input` is a virtual-focus filter; FF's dropdown search is a real-focus field that is one more stop in the arrow ring. Its key handling is interleaved with the menu list's keys, so it cannot be layered on from outside.

## Packaging rules

- **Relative imports only.** FF compiles this source with FF's own tsconfig, so a `#/*` alias would resolve into FF's tree.
- **Source and npm at once.** `exports` points at `src/*/index.ts` for FF's link; `publishConfig.exports` swaps in the tsdown build at publish, with `solid-js` and `@ghia/solid` external peers.
- **No JSX in `src`.** `@ghia/solid`'s Bun plugin skips `node_modules`, so a published `.tsx` would not compile. Use `jsx()` from `@ghia/solid/jsx-runtime`.
- **One runtime instance of `solid-js` and `@ghia/solid`** across both repos; two break context and reactivity silently. A plain `link:` fails because `file:` dependencies get a store path per project directory, so each repo gets its own `@ghia/solid`. FF's pnpm workspace includes this folder and installs run from FF's root; FF's single-instance check guards it.
- **`verifyDepsBeforeRun: false`** in `pnpm-workspace.yaml`: pnpm 12 auto-installs before running a script, and from this folder that relinks a second `@ghia/solid`. Keep it off.
- **`noUncheckedIndexedAccess` stays on** here. Satisfy it without `!` or fake fallbacks.
