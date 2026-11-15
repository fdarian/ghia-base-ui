# Base UI on `@ghia/solid`

The concepts the primitives in `src/` share, so code, audit rows and reviews use one word for each. Adapted from the
[glossary](https://github.com/ZerNico/base-ui-solid/blob/596f82a/GLOSSARY.md) of ZerNico/base-ui-solid (MIT), keeping what
exists in this repo's code. [PORTING.md](PORTING.md) says how upstream becomes these functions.

## Language

### Popups

**Popup**:
Content shown on top of the page while it is open, such as a popover, menu, tooltip, dialog or select list.
_Avoid_: floating element, floating, overlay
_In code_: `createTooltipPopup`, `createPopoverPopup`, `createDialogPopup`; `popupProps` on the select and the menu list, `popupRef` on select; `popupElement` in the tooltip and submenu triggers. `floating-ui-solid` keeps Floating UI's `floating` for the popup element (the `floating` option of `createHoverHandleClose`).

**Root**:
The part that holds a popup's open state and groups its other parts. It renders no element of its own.
_Avoid_: provider, container
_In code_: `create*Root` returns the root object; the other parts take it as their first argument (`createCollapsibleTrigger(root)`). A tooltip _provider_ is a different thing: Base UI's name for the shared delays (`createTooltipProvider`).

**Trigger**:
An element the user interacts with to open or close a popup.
_Avoid_: reference, reference element, DOM reference
_In code_: `create*Trigger`, `triggerProps`, `triggerRef` and `triggerElement`. `floating-ui-solid` keeps Floating UI's `domReference` for it (the `domReference` option of `createHoverHandleClose`). Nothing in `src/` handles several triggers for one popup.

**Anchor**:
The element a popup is positioned against, usually its trigger. A submenu is anchored inside its row.
_Avoid_: reference, position reference, DOM reference
_In code_: `@ghia/native`'s `<anchored>` element does the placing. `createPlacementState` (`internals/use-anchor-positioning.ts`) keeps what it reports: the side the popup opened on and the height left there.

**Positioner**:
The part that places a popup next to its anchor and keeps it there. Base UI renders it as an element; this port leaves the element out and returns the props for the consumer's `<anchored>`.
_Avoid_: floating element, floating wrapper
_In code_: `createPopoverPopup(root, options).positioner` holds `side`, `align`, `gap` and `onPlacement` for the `<anchored>`.

**Presence**:
Whether a popup is open and whether it is still mounted, which outlives the open state by the exit animation. Base UI's `transitionStatus`; here a timed exit, not CSS animations.
_Avoid_: transition status, visibility
_In code_: `createPresence(exitMs)` returns `open`, `mounted`, `show()`, `hide()` and `release()`; each popup root exposes it as `presence`.

**Hover intent**:
The logic that decides when hovering a trigger opens its popup and when leaving closes it: the open delay, waiting for the pointer to rest, and the safe polygon that keeps the popup open while the pointer travels from the trigger to it.
_Avoid_: hover state, useHover
_In code_: the close decision is shared: `createHoverHandleClose` runs `safePolygon`. The open timing is per trigger: the tooltip's rest delay (`restMs` upstream, `createTooltipTrigger`) and the submenu's `hoverOpenMs` (`createMenuSubmenuTrigger`). There is no single object per popup, as in upstream's later `HoverIntent`.

**Floating UI modules**:
The files under `floating-ui-solid/` mirror `floating-ui-react/` (`safe-polygon.ts`, `use-click.ts`, `use-typeahead.ts`, `mark-others.ts`, `utils/element.ts`), so they stay recognisable next to the library they came from. File names follow upstream; exported functions follow the repo's `create*` convention, except where upstream's name is kept (`safePolygon`, `refocusAfterPress`). The _Avoid_ lists above apply to the popup concepts, not to these module names.
