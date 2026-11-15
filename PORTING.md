# Porting guide: `@base-ui/react` → Solid 1 on `@ghia/solid`

This repo ports Base UI to Solid 1 as headless `create*` functions. Once consumers can move to Solid 2, it will be deprecated in
favour of [ZerNico/base-ui-solid](https://github.com/ZerNico/base-ui-solid), which ports the whole library to Solid 2.0 as
components. It stays until then because most libraries are still on Solid 1.

So every gap filled here should translate React the way that port does, with the same names, the same split of state and
effects, and the same deviations where React and Solid differ. Moving over later is then mechanical. What stays different
on purpose is the API shape (headless functions, no components), Solid 1, and `@ghia/solid`.

This guide is adapted from [ZerNico's `PORTING.md`](https://github.com/ZerNico/base-ui-solid/blob/596f82a/PORTING.md) (MIT, see
[Credit](#credit)), section by section, keeping the rules that apply here and translating the Solid 2 ones. Read it before
porting upstream changes or filling an audit gap. [UPSTREAM.md](UPSTREAM.md) has the pin, the sync steps and the file map;
[GLOSSARY.md](GLOSSARY.md) the shared vocabulary.

## Goal

A file-by-file port of `@base-ui/react` 1.9.0: same folder layout, file order, behaviour and event reasons as upstream, limited
to the parts and props Fluid Functionalism (FF) uses. Deviate only where React and Solid fundamentally differ, where
`@ghia/solid` cannot do what the DOM does, or where FF wins over Base UI (the audit lists each). Mark every deviation that is
not forced by the API shape with a `Port note:` comment saying what upstream does and why this differs. Older files cite
upstream in prose without the prefix; new ones use it, so `rg 'Port note'` finds them.

## Naming

Upstream paths are relative to `packages/react/src/`. ZerNico's are the same path under `packages/solid/src/`, except that their
`@base-ui-solid/utils/*` (upstream `packages/utils/src`) is `packages/utils/src/`.

| Upstream                           | ZerNico's port                  | This repo                                                                                                                                                          |
| :--------------------------------- | :------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<folder>/<part>/<PascalName>.tsx` | same path                       | `src/<folder>/<part>/<kebab-name>.ts`                                                                                                                              |
| Part component `AccordionRoot`     | component `AccordionRoot`       | `createAccordionRoot(options)`                                                                                                                                     |
| Hook `useCollapsibleRoot`          | hook `useCollapsibleRoot`       | `createCollapsibleRoot(options)`                                                                                                                                   |
| `useTransitionStatus`              | `useTransitionStatus`           | `createPresence` (the name changes with the shape; the [file map](UPSTREAM.md#file-map) lists each)                                                                |
| `useXContext`                      | `useXContext`                   | `useXContext`, kept: it reads a context (`useDialogRootContext`, `useTooltipProvider`)                                                                             |
| `XRootProps`                       | `XRootProps`                    | `XRootOptions`, and `type XRoot = ReturnType<typeof createXRoot>`; dependent parts take the root as the first argument (`createCollapsibleTrigger(root, options)`) |
| `floating-ui-react/`               | `utils/popups/` (see below)     | `floating-ui-solid/`                                                                                                                                               |
| `@base-ui/utils/*`                 | `@base-ui-solid/utils/*`        | `utils/` for what ghia or FF needs (`pointer-capture.ts`, `form-value.ts`); shared Base UI internals in `internals/`; a one-off helper beside its caller (`clamp`) |
| `X.test.tsx`                       | `X.test.tsx`, `X.port.test.tsx` | `<file>.test.ts` beside the file                                                                                                                                   |
| `ReactStore`, `Store`              | `SolidStore`, `Store`           | none: state is signals in the `create*` closure                                                                                                                    |

The exported function is always `create*`. The file prefix is not uniform: `use-` in `accordion`, `collapsible`, `tabs`,
`select`, `combobox`, `dialog`, `drawer` and `scroll-area` (`use-accordion-root.ts`); none in `checkbox`, `checkbox-group`,
`radio`, `radio-group`, `switch`, `slider`, `menu`, `tooltip` and `popover` (`menu-root.ts`). A new file follows its folder.
A new folder takes no prefix and names its files after the upstream part (`avatar/root/avatar-root.ts`), or after the
component when upstream has one file (`button/button.ts`, `input/input.ts`); `avatar`, `input` and `button` do this.

## Public API differences

Base UI is React compound components; this port is headless `create*` functions. A part is a function; the consumer spreads
its prop objects on its own `@ghia/solid` elements.

- **A function per part, not a component.** `createSelectRoot(options)` returns accessors and prop objects (`triggerProps`,
  `popupProps`, `itemProps(item, index)`) that the consumer spreads on its own elements. There is no styling, no theme token
  and no animation library in this repo; timings and sizes arrive as options.
- **Refs are returned as functions.** A spread `ref` applies late in `@ghia/solid` JSX, after props that depend on the element
  (for instance a row's `tabIndex` against the open's focus), so the primitives return ref functions and the consumer sets
  props and refs one by one where order matters.
- **Controllable highlight with reasons.** Select, Combobox and Menu take the highlighted index as an option and report every
  change through `onHighlightChange(index, reason)` with a reason (`keyboard`, `typeahead`, `focus`, `pointer`, `reset`, and
  so on), so the consumer's own highlight (fluid hover) can follow or ignore it.
- **Pointer highlight belongs to the consumer.** Base UI highlights on hover itself. Here the consumer's fluid hover owns it,
  and the menu list takes its pointer handlers (`pointer: { onMouseEnter, onMouseMove, onMouseLeave }`).
- **Dialogs build on `@ghia/solid`'s `Dialog` family.** The dialog and drawer functions return props for `@ghia/solid`'s
  `Dialog` and its popup instead of re-implementing the layer, focus trap and Escape stack; `FocusFirst` and `mark-others`
  cover what Base UI's focus manager and `markOthers` do beyond it.
- **One `@ghia/solid` instance.** The primitives import `@ghia/solid` and `solid-js` as peers; see the README for the
  single-instance rule.

Row by row, against ZerNico's table of the same name:

| Upstream (React)                                         | ZerNico's port (Solid 2)                                | This repo                                                                                                                                                         |
| :------------------------------------------------------- | :------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Props, reactive ones read on render                      | Props read lazily (`props.x`)                           | One `options` object. A reactive option is an accessor (`open?: () => boolean \| undefined`), an initial-only one a plain value (`defaultOpen`), a callback plain |
| `className`, `style`, `render`, `children`               | `class`, `style`, `render` (function, tag or component) | None: the consumer owns the elements and every visual                                                                                                             |
| `ref` (object or callback), `actionsRef`, `inputRef`     | `ref` callbacks                                         | Functions on the returned object (`triggerRef(element)`, `itemRef(index, element)`, `inputRef(element)`); like Solid's, not called with `null` on unmount         |
| `tabIndex`, `readOnly` and other camelCase attributes    | Lowercase (`tabindex`)                                  | camelCase, as in React (`@ghia/solid` elements)                                                                                                                   |
| Native events, `event.nativeEvent`                       | Native events, no `nativeEvent`                         | `@ghia/solid`'s `DomEvent`, `KeyEvent`, `HostMouseEvent`; no `nativeEvent`; `target` and `relatedTarget` are elements                                             |
| `onOpenChange(open, eventDetails)`, event reasons        | Same                                                    | The callback takes the new value only; reasons appear on highlight changes (`onHighlightChange(index, reason)`)                                                   |
| Data attributes, CSS variables, `stateAttributesMapping` | Ported                                                  | Not ported: the consumer styles from the returned accessors (`open()`)                                                                                            |
| `mergeProps` returns a plain object                      | A reactive object, handlers and refs composed           | Solid's `mergeProps`: later sources win per key, handlers are not composed. Reactive values in a prop object are getters (`get 'aria-expanded'()`)                |
| Context for sharing state between parts                  | Context holding accessors                               | The root object is passed to each part. Only `DialogRootContext` and `TooltipProviderContext` exist, for the consumer to provide                                  |
| `Portal`, `Positioner`, `Backdrop`, `Arrow`, `Indicator` | Ported                                                  | Left out: FF styles them. `@ghia/native`'s `<anchored>` places a popup, `@ghia/solid`'s `Dialog` owns the layer                                                   |
| `useFloating` (Floating UI)                              | Floating UI DOM behind the same API                     | `createPlacementState` reports what `<anchored fit="flip">` decided (`internals/use-anchor-positioning.ts`)                                                       |

## Translation rules

### Parts and options

- `React.forwardRef(function X(props, ref))` → `function createX(options)`. The ref becomes a returned function.
- Never destructure. `options.open?.()`, `options.onOpenChange?.(next)`; not `const { open } = options`. Reading through the
  object at the point of use is what keeps an accessor live.
- Initial-only options (`defaultOpen`, `defaultValue`) are read once at setup. The setup of a `create*` call is untracked
  when the consumer calls it from a component body; if you read one inside an effect or memo, wrap the read in `untrack`.
- Callbacks are read from `options` when called (`options.onOpenChange?.(next)`), so a changed callback takes effect. There is
  no `useStableCallback` to port.
- Derive state from options instead of copying it in an effect. A controlled value is `options.open?.() ?? internalOpen()`,
  not an effect that writes the prop into a signal.

### Hooks → primitives

- `useX` runs once per instance → `createX` runs once per call, in the consumer's component body. Reactive parameters are
  accessors (`open: () => props.open`); reactive return values are accessors; callbacks and constants are plain.
- `useState` → `createSignal`. Outside a `batch` or an effect a write is visible at once (`setOpen(next)`, then `open()`
  reads `next`), so `ReactDOM.flushSync(fn)` → `fn()`. Inside an effect writes land when it ends.
- A value upstream computes during render → a plain function (`const open = () => …`) or `createMemo` when it is expensive or
  must not re-run its readers.
- Render-phase `setState` (adjusting state while rendering) → derive it. When the state must also be writable, keep a signal for
  what was written and read through a function that decides between it and the derived value. Where a write must follow an
  option change, an effect that sets the signal with `untrack` (`menu-submenu-root.ts` applies a controlled `open` this way,
  because `presence` owns the exit timer).
- `useEffect` / `useLayoutEffect` / `useIsoLayoutEffect` with deps → `createEffect(on(deps, fn))`. React runs the effect on
  mount; Solid's `on` does too, so add `{ defer: true }` only where upstream skips the first run or the state is already set at creation
  (`createPresence.follow`). A
  returned cleanup becomes `onCleanup` inside the effect. A cleanup may write signals in Solid 1.
- `useRef` for an element → a `let` variable set by a ref function the part returns, and read in handlers. A ref read inside a
  memo or effect has to be a signal.
- `useRef` for a mutable value → a `let` in the closure.
- `useCallback`, `useMemo` for identity, `useStableCallback` → drop.
- `useId` → `createUniqueId`.
- `useTimeout`, `useAnimationFrame` → `setTimeout` with `onCleanup(() => clearTimeout(timer))`.
- `useControlled` → the controlled-or-internal pattern in `createCollapsibleRoot`.
- `process.env.NODE_ENV !== 'production'` dev warnings → no dev flag exists here. Code that is wrong to call throws
  (`useDialogRootContext`), always.
- React effects run child layout effects before the parent's. Solid 1 runs effects in the order they were created, and a
  `create*` call creates its effects when the consumer calls it, so call order is the order. Anything upstream that relies on
  child-first ordering needs a check.
- A React `setState` made in an animation frame lands after that frame paints; a Solid write applies at once. Where the frame
  must paint the current state first (`data-starting-style` before a transition), defer the write to a task.
- `React.Activity`-specific logic has no equivalent. Drop it with a `Port note:`.

### Elements: no JSX in `src`

The npm build is tsdown's plain JS, and ghia 0.12's `ghia:solid-libraries` path compiles library JSX only under ghia's Vite `solid()` plugin (untested here), so a published `.tsx` is not safe. Build host elements with `jsx()` from
`@ghia/solid/jsx-runtime` (`utils/form-value.ts`), passing reactive attributes as getters. A part that upstream renders as an
element returns props and refs instead.

### Contexts

- `createContext<T>()` with no default; `useContext` returns `undefined` outside a provider. The `useXContext` helper decides
  whether that is an error (`useDialogRootContext` throws) or fine (`useTooltipProvider` returns `undefined` for a tooltip on
  its own). ZerNico's `createContext<T | null>(null)` exists because Solid 2 throws on a missing default; Solid 1 does not.
- Context values hold accessors or getters, not snapshots (`createTooltipProvider` returns getters).
- The consumer renders the provider (`<DialogRootContext.Provider value={…}>`).

### Events

- Handlers receive ghia's events. There is no `nativeEvent`: use the event.
- Event names that differ from React's:
  - `onFocus` / `onBlur` → `onFocusIn` / `onFocusOut` where upstream relies on React's bubbling (`tooltip-trigger.ts`: the
    child takes focus, not the wrapper). `onFocus` / `onBlur` stay where the handler is on the element that takes focus
    (`menu-item.ts`, `use-select-root.ts`).
  - `onChange` on a text control → `onInput`: React's `onChange` is the per-edit event; on current ghia that is `input`, and
    `change` is the commit (`combobox/root/use-combobox-root.ts`).
  - `onMouseEnter` / `onMouseLeave` do not bubble in either framework.
- A coordinate or value an event may lack is not defaulted: throw (`toHoverEvent` in `use-hover-reference-interaction.ts`).

### Popups, focus and hover

- Positioning is `<anchored>` from `@ghia/native`; this repo only reports and caps (`createPlacementState`). Floating UI's
  middleware, `useFloating` and `FloatingPortal` have no port.
- Hover close is shared (`createHoverHandleClose` runs `safePolygon`); each trigger keeps its own open timers.
- Popup focus follows Base UI, not FF ([focus-and-ff-conflicts.md](.agents/notes/focus-and-ff-conflicts.md)). Event, focus,
  scroll and layout timing differ from a browser's ([ghia-constraints.md](.agents/notes/ghia-constraints.md)); read it when
  code you are porting depends on any of them.
- Drag logic that uses `setPointerCapture` inline upstream goes through `utils/pointer-capture.ts`.

### Inputs

`CheckboxRoot`, `SwitchRoot` and `RadioRoot` render a hidden `<input>` upstream. Here it is `FormValue`
(`utils/form-value.ts`), a component the consumer renders; the `create*` functions do not.

## Using ZerNico's port as the pattern reference

To fill a gap or port a change:

1. **Read upstream at the pin.** The audit row cites the file as `<folder>/<part>/<File>.tsx:lines`; the clone is
   `~/.claude/notes/base-ui-source` at `v1.9.0`.
2. **Diff upstream between the pins before copying anything.** ZerNico tracks upstream commit `5aacdbb`, which is ahead of
   v1.9.0 (the tag is its ancestor). Their code can contain behaviour or fixes 1.9.0 does not have, and the port here must not
   move ahead on merit. With the clone fetched (`git -C ~/.claude/notes/base-ui-source fetch origin master`):

   ```bash
   B=~/.claude/notes/base-ui-source
   git -C $B diff v1.9.0 5aacdbb7852487518b982ea397885c8322a3ebc6 -- packages/react/src/<path>
   ```

   Several files moved, so use the new path for the diff and for their port:

   | Upstream at v1.9.0 (`packages/react/src/`)                | At `5aacdbb`                                                        |
   | :-------------------------------------------------------- | :------------------------------------------------------------------ |
   | `floating-ui-react/hooks/useClick.ts`, `useTypeahead.ts`  | `utils/popups/interactions/` (same names)                           |
   | `floating-ui-react/hooks/useHoverReferenceInteraction.ts` | `utils/popups/interactions/useHoverTriggerInteraction.ts`           |
   | `floating-ui-react/hooks/useHoverFloatingInteraction.ts`  | `utils/popups/interactions/useHoverPopupInteraction.ts` (rewritten) |
   | `floating-ui-react/hooks/useHoverShared.ts`               | `utils/popups/interactions/useHoverShared.ts`                       |
   | `floating-ui-react/safePolygon.ts`                        | `utils/popups/interactions/safePolygon.ts`                          |
   | `floating-ui-react/utils/markOthers.ts`                   | `utils/popups/focus/markOthers.ts`                                  |
   | `floating-ui-react/utils/element.ts`                      | `utils/popups/element.ts`                                           |

   The component folders and `internals/` files in the [file map](UPSTREAM.md#file-map) keep their paths.
3. **Read ZerNico's port of the same file** at `~/.claude/notes/base-ui-solid-zernico/packages/solid/src/<same path>`
   (`packages/utils/src` for `@base-ui/utils`). If the clone is gone:

   ```bash
   git clone https://github.com/ZerNico/base-ui-solid ~/.claude/notes/base-ui-solid-zernico
   git -C ~/.claude/notes/base-ui-solid-zernico checkout 596f82a
   ```

   Their `Port note:` comments mark every place React and Solid needed a different shape; read them first.
4. **Translate** with the table below and the rules above. Take their structure, names and the order of effects. Leave behind
   what has no counterpart here: `useRenderElement` and `render`, `class` and `style` merging, the `Store` and its derived
   keys, SSR and hydration, Floating UI DOM, docs links.
5. **Update the audit row** (`.agents/notes/base-ui-audit.md`): status, notes, the upstream line refs and the `src/...:lines`
   refs, and add a row for new behaviour FF or ghia-solid-stack uses. Add a file to the [file map](UPSTREAM.md#file-map) if you created one.

### Solid 2 → Solid 1

For reading their code. The last column is where this repo already does it; "no precedent yet" means `src/` has no example and
the Solid 1 idiom is the one to use.

| Their code (Solid 2)                                         | Here (Solid 1)                                                                                                                   | Example in `src/`                                                              |
| :----------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| `omit(props, 'a', 'b')`                                      | `splitProps(options, ['a', 'b'])`. Options objects are read as `options.x`, so a rest split rarely comes up                      | no precedent yet                                                               |
| `merge(a, b)`                                                | `mergeProps(a, b)`. It keeps getters lazy, later sources win, handlers are not composed                                          | `collapsible/trigger/use-collapsible-trigger.ts`                               |
| `createSignal(prev => …)` (writable memo)                    | A signal for what was written plus a function (or `createMemo`) that picks between it and the derived value; or `createComputed` | no precedent yet (nearest: `collapsible/root/use-collapsible-root.ts`)         |
| Batched setters, `flush()`, `fn(); flush();` for `flushSync` | Writes apply at once outside a `batch` or an effect; `fn()`. Use `batch` to group writes                                         | `collapsible/root/use-collapsible-root.ts` (`batch`: no precedent yet)         |
| `onSettled(fn)`                                              | `onMount(fn)`                                                                                                                    | `menu/root/menu-root.ts`                                                       |
| `onCleanupWithWrites`, `runCleanup`                          | `onCleanup`: Solid 1 has no write-in-cleanup restriction                                                                         | `internals/use-transition-status.ts`                                           |
| `@solidjs/web` (`Portal`, `isServer`, `render`)              | `@ghia/solid` (renderer through `useGpuixRequired`, `jsx` from `@ghia/solid/jsx-runtime`) and `solid-js`. No portal              | `utils/form-value.ts`                                                          |
| `useIsoLayoutEffect(effect, () => [deps])`                   | `createEffect(on(deps, effect))`; `{ defer: true }` only if upstream skips the first run. `createRenderEffect` has no precedent  | `select/root/use-select-root.ts` (with and without `defer`)                    |
| `IS_DEV`                                                     | Nothing to gate on: warnings become throws                                                                                       | no precedent yet (`dialog/root/dialog-root-context.ts` throws)                 |
| `<X value={ctx}>`                                            | `X.Provider`, rendered by the consumer; inside `src` it would be `jsx(X.Provider, { value, children })`                          | no precedent yet (`dialog/root/use-dialog-root.ts` says the consumer provides) |
| `createContext<T \| null>(null)`                             | `createContext<T>()`                                                                                                             | `dialog/root/dialog-root-context.ts`                                           |
| `useControlled({ controlled: () => props.x, default, … })`   | `options.x?.() ?? internal()` with a signal for the uncontrolled case                                                            | `collapsible/root/use-collapsible-root.ts`                                     |
| `useTimeout`, `useAnimationFrame`                            | `setTimeout` plus `onCleanup(clearTimeout)`; rAF has no precedent                                                                | `internals/use-transition-status.ts`                                           |
| `useTrackedRef` (a ref read in a memo)                       | A signal set by the ref function                                                                                                 | no precedent yet (`select/root/use-select-root.ts` keeps a `let`)              |
| `useId`                                                      | `createUniqueId`                                                                                                                 | `collapsible/root/use-collapsible-root.ts`                                     |
| `Store`, `store.useState`, `useStore(store, selector)`       | Signals in the `create*` closure; parts take the root                                                                            | `collapsible/trigger/use-collapsible-trigger.ts`                               |
| `onFocusIn` / `onFocusOut` for React's bubbling focus        | The same names                                                                                                                   | `tooltip/trigger/tooltip-trigger.ts`                                           |

## Tests

Vitest runs headless through `bun --bun vitest run` (`vitest.config.ts` loads the `ghia()` and `solid()` plugins);
`pnpm check:test`, `pnpm check:type` and `pnpm check` run them. There is no browser matrix.

- A test sits beside its file (`<file>.test.ts`) and drives the `create*` function directly, with `vitest`. Wrap anything
  that makes effects or memos in `createRoot` (`menu/list/menu-list.test.ts`), and pass handlers literal `KeyEvent` or
  `DomEvent` objects.
- When porting a behaviour, port the scenario of upstream's test for it (`X.test.tsx`, and ZerNico's port of that test shows
  the Solid shape). Names follow the behaviour; the repo does not mirror upstream's file and test names, and has no
  conformance suites.
- The test renderer is not a live window and can disagree with macOS on pointer and focus timing
  ([ghia-constraints.md](.agents/notes/ghia-constraints.md)). Pointer opens and focus handoffs need the running app.
- Where a behaviour cannot be tested headless, say so in the audit row's Note.

## Known pitfalls

- **Their code is ahead of the pin.** Copy structure, not behaviour you have not diffed (step 2 above).
- **Do not copy their derived stores.** They replace upstream's layout-effect syncing with derived keys to satisfy Solid 2's
  diagnostics. Here the state is plain signals; derive instead of copying where it is free, as `open()` does.
- **Parent effects before children's** in Solid 2; here, creation order (see Hooks → primitives). Upstream code that depends
  on React's child-first order needs checking either way.
- **A spread `ref` applies late.** Return a ref function instead and have the consumer set it on the element, or props that
  depend on the element land after the open's focus.
- **A key can act twice** along ghia's logical tree: consumed navigation keys call `stopPropagation`, and the row list
  deliberately does not ([api-and-packaging-decisions.md](.agents/notes/api-and-packaging-decisions.md)).

## Credit

Adapted from [ZerNico/base-ui-solid](https://github.com/ZerNico/base-ui-solid) `PORTING.md` at commit `596f82a`, MIT licensed
(Copyright (c) 2019 Material-UI SAS, Copyright (c) 2026 Base UI Solid contributors), which in turn ports
[mui/base-ui](https://github.com/mui/base-ui) (MIT).
