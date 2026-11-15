---
"ghia-base-ui": minor
---

Three new entry points, added for `ghia-solid-stack`:

- `ghia-base-ui/avatar`: `createAvatarRoot`, `createAvatarImage` and `createAvatarFallback`. The image status comes from the rendered `<img>`'s `onLoad` and `onError` (there is no off-DOM preload), so keep the element rendered and hide it while `visible()` is false.
- `ghia-base-ui/input`: `createInput`, Base UI's `Input` without `Field`. `onValueChange(value)` fires on every `input` event, not on commit.
- `ghia-base-ui/button`: `createButton`, Base UI's `Button` for a non-native element: spread `buttonProps` for `role`, the tab stop, Enter and Space activation and `aria-disabled`, with `disabled` and `focusableWhenDisabled`.
