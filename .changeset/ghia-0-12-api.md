---
"ghia-base-ui": minor
---

The primitives now require the `@ghia/solid` release after 0.12.1 (the `HostElement`-extends-`HTMLElement` API) and no longer work on 0.11 or earlier. What consumers see:

- `createCombobox`'s input props listen to `onInput` instead of `onChange`: the query and the open state follow every edit, not only the commit on blur or Enter. Spreading `input` props and then overriding `onInput` replaces the primitive's handler, as `onChange` did before.
- Focus is moved by the host element's `nativeId`, not its `id`, which is now the DOM string id.
- A popup hands focus back to its trigger when nothing is focused, which `@ghia/solid` now reports as `document.activeElement === document.body` instead of `null`. This covers the dialog/popover press refocus, menu and select close, and the menu trigger it remembers on open.
- The modal's outside-hiding walks `childList` since `children` is elements-only.
