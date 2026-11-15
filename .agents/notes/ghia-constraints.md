# ghia constraints that shape the primitives

What `@ghia/solid` and `@ghia/native` (a GPU-rendered runtime with a DOM-like API, not a browser) cannot do, what the port has not yet adopted, and the ghia behaviours that explain code here which looks odd from a browser's point of view. Row-level detail is in [base-ui-audit.md](./base-ui-audit.md#summary); the ghia repo's FORK.md describes each ghia deviation. Commit hashes below are ghia repo commits. macOS only: Windows and Linux keep async event dispatch and are out of scope.

## Blocked by ghia

Nothing is blocked as of `@ghia/solid` after 0.12.1 (the dev dependency is a link to ghia's HEAD). A capability ghia lacks goes here with the behaviour it blocks; probe a row again before treating it as permanent.

## Gaps: ghia has the API, the port has not adopted it

A ghia capability not yet picked up is a **gap**, not blocked; the audit row names the API:

- CSS `transform` scale and rotate (`style={{ transform: 'scaleY(0.96)', transformOrigin }}`, or the `scale`, `rotate` and `translate` properties; ghia `docs/reference.md` "### Transforms", present in 0.11.1): Select and Combobox popup `scaleY` entrance. FF's popup does opacity plus a 4 px slide.
- `<input type="range">` (`value`, `defaultValue`, `min`, `max`, `step`, `valueAsNumber`, `stepUp()`, `stepDown()`; ghia `docs/reference.md` "### Range inputs"): the native range input under each slider thumb. It is focusable with the `slider` role, takes the arrow, Page and Home/End keys (firing `input` then `change`), has nothing painted in it and no pointer drag, so the Slider keeps its own pointer handling. Thumbs are `role="slider"` with ARIA attributes today.
- `display: contents`: menu `RadioGroup`'s `role="group"` wrapper.
- `<input disabled>`: Combobox `disabled` (currently `readOnly` plus `tabIndex` -1).
- `maskImage`, `onScroll` offsets and rounded overflow clip: scroll fade and thumb inside Select and Combobox popups.
- Motion values (`createMotionValue` / `createSpring`): a switch drag that starts from the live thumb mid-spring.
- Per-element pointer enter and leave without capturing the ancestor: switch hover count.

Fixing one means changing the row's status to `fixed (sha)`.

## ghia behaviour the primitives depend on

- **Window `mousemove` reaches a window listener over bare background** (null target for a move outside the root). The safe-polygon hover tracker depends on it.
- **Pointer capture is explicit.** There is no implicit capture, so a drag gets moves and release outside the element only if it asks. Hence `utils/pointer-capture.ts` (slider control, switch thumb drag): capture from the press, and end the drag on lost capture too.
- **Events bubble along the logical tree** with DOM capture, target and bubble phases. A keydown on a focused row reaches the popup panel, where the menu handles its keys. Because a key can act twice, menu and composite nav keys call `stopPropagation` and ignore Ctrl/Cmd/Alt chords; the row list deliberately does neither (see [api-and-packaging-decisions.md](./api-and-packaging-decisions.md)).
- **`document.activeElement` is `document.body` when nothing is focused**, not `null`. Popup close paths that hand focus back to the trigger test for `body` (dialog and popover press refocus, menu and select close, the menu trigger remembered on open).
- **`focus()` does nothing on an element that is not rendered**: not in a mounted root, not focusable, `display: none` or `content-visibility: hidden` on it or an ancestor, `visibility: hidden`, or inside an `inert` subtree. No focus change, no event. The decision reads the element's style at the call, so an element mounted in the same tick takes focus.
- **Text `onChange` fires on commit, `onInput` per edit.** `input` fires once per edit of an `<input>` or `<textarea>`; `change` fires on blur or Enter when the value differs from the last commit. A primitive that follows every keystroke (the Combobox input) listens to `onInput`.
- **Focus calls take `nativeId`.** A host element's `id` is the DOM string id; `renderer.focusElement` and `focusNextWithin` take the number `el.nativeId`. A host element is an `HTMLElement`, and `childList` lists its nodes where `children` is elements only (the modal's outside-hiding walks `childList`).
- **Focus timing.** `focus()`, `blur()` and `focusNext` deliver focus events synchronously, in DOM order (pointerdown, mousedown, blur, focus). The press's own focus move (or blur over nothing focusable) runs after the `mousedown` handlers return; `preventDefault` on mousedown cancels it. Consequences: a popup-opening press toggle calls `preventDefault`; a scrollbar press does too, because native scrollbars never move focus; an outside press that closes a popup needs `refocusAfterPress` (see [focus-and-ff-conflicts.md](./focus-and-ff-conflicts.md)). A newly mounted popup's tab order exists only after it paints, which is why `FocusFirst` waits a tick.
- **Event `target`, `currentTarget` and `relatedTarget` are elements**, not ids.
- **The test renderer is not a live window** and can disagree with live macOS on pointer opens. Its `press` sends key-down then key-up, so Space-on-key-up (switch) fits a committed scenario; only a held Space needs the native key-down alone, and `style.active` does not show for it. The audit's harness note has details.
- **A scroller's integer range is exact since ghia f7b62f11**: it ends at `scrollHeight - clientHeight`, so `scrollAlong` clamps to it, compares with the current position, and returns true after writing. Its test fakes a scroller that clamps `scrollTo` like Chrome. On older ghia, fractional content (29 rows of 19.5 px plus 16 px padding = 581.5 px) rounds `scrollHeight` and `clientHeight` half up while `scrollTop` clamps to the fractional range, so the wheel sticks at the end instead of chaining to the page.
- **`onLayout` and `ResizeObserver` arrive after the painted frame** (ghia 8352e66c); a forced layout (bounds read, `scrollTop` write) does not deliver them, so state built from `onLayout` sizes lags the live element after content grows or is filtered. Scroll-area keys and the track wheel therefore do not check the thumb (built from `onLayout` sizes): `scrollAlong` clamps to the viewport's live `scrollHeight - clientHeight`, and a key acts only when that range along its axis is above 0. The Combobox filter effect sets `revealOnMeasure` so the highlighted row is revealed again once the filtered rects are measured; ArrowDown right after typing would otherwise reveal against the pre-filter rect.
- **appRegion** (window-drag regions, one per line fragment for inline spans) matters to FF's frame bar, not to any primitive here; a primitive inside a drag region would lose presses to the window drag.
