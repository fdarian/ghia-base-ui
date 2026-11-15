# ghia-base-ui

## 0.2.0

### Minor Changes

- 873bd37: Three new entry points, added for `ghia-solid-stack`:
  
  - `ghia-base-ui/avatar`: `createAvatarRoot`, `createAvatarImage` and `createAvatarFallback`. The image status comes from the rendered `<img>`'s `onLoad` and `onError` (there is no off-DOM preload), so keep the element rendered and hide it while `visible()` is false.
  - `ghia-base-ui/input`: `createInput`, Base UI's `Input` without `Field`. `onValueChange(value)` fires on every `input` event, not on commit.
  - `ghia-base-ui/button`: `createButton`, Base UI's `Button` for a non-native element: spread `buttonProps` for `role`, the tab stop, Enter and Space activation and `aria-disabled`, with `disabled` and `focusableWhenDisabled`.
- dada9b6: The primitives now require the `@ghia/solid` release after 0.12.1 (the `HostElement`-extends-`HTMLElement` API) and no longer work on 0.11 or earlier. What consumers see:
  
  - `createComboboxRoot`'s input props listen to `onInput` instead of `onChange`: the query and the open state follow every edit, not only the commit on blur or Enter. Spreading `input` props and then overriding `onInput` replaces the primitive's handler, as `onChange` did before.
  - Focus is moved by the host element's `nativeId`, not its `id`, which is now the DOM string id.
  - A popup hands focus back to its trigger when nothing is focused, which `@ghia/solid` now reports as `document.activeElement === document.body` instead of `null`. This covers the dialog/popover press refocus, menu and select close, and the menu trigger it remembers on open.
  - The modal's outside-hiding walks `childList` since `children` is elements-only.

### Patch Changes

- 82ea690: Develop and test against the published `ghia`, `@ghia/solid` and `@ghia/native` 0.13.0 instead of local links. No change to the primitives' API.

## 0.1.1

### Patch Changes

- b26fdd4: Declare the menu item's `role` and `aria-haspopup`, and the tabs list's `role`, as their literal types instead of `string`, so spreading them onto an `@ghia/solid` element type-checks.

## 0.1.0

### Minor Changes

- 13e094d: First release as `ghia-base-ui` on npm (formerly base-ui-solid-gpuix).
