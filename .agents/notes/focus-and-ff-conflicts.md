# Focus model and FF-vs-Base-UI conflicts

The two rules that decide what "correct" means when Base UI 1.9.0 and Fluid Functionalism (FF) disagree. Read before a sync or a bug fix that would "correct" a behaviour back toward Base UI.

## Popups: focus moves into the popup, as in Base UI (decided 2026-10-16)

When a popup opens, real focus moves into it; it does not stay on the trigger with a separate visual highlight. In code:

- **Rows are real focus targets.** Menu and Select rows take focus with a roving `tabIndex`; the highlighted row is the focused row. The menu search field is a real focus stop, not Base UI's virtual-focus `Menu.Input`.
- **Dialogs focus their first tab stop.** `@ghia/solid`'s `Dialog` focuses the popup element; `dialog/popup/focus-first.ts` moves on to the first tab stop, where Base UI's focus manager puts it. It waits one tick because `@ghia/native`'s tab order exists only once the popup has painted.
- **Focus returns to the trigger on close**, only if focus was still in the popup or nowhere. A control that took focus meanwhile keeps it.
- **An outside press needs `refocusAfterPress`** (`floating-ui-solid/hooks/use-click.ts`, rationale in its doc comment). Press toggles (trigger `mousedown`) are the opposite case: they call `preventDefault` to cancel the focus move that would pull focus back from the popup they just focused.
- **Combobox is the exception by design**: focus stays in the input, rows are highlighted, as in Base UI.

Per-row evidence: the audit's Menu, Select and Dialog tables.

## Everything else: FF wins

The port exists to be what FF renders. Each audit section ends with an "FF-vs-Base-UI conflicts" list; those lists are the source of truth ([UPSTREAM.md](../../UPSTREAM.md#ff-vs-base-ui-conflicts) indexes them). By category:

- **Keyboard behaviour from FF's Radix-based docs.** FF's docs import the Radix registry, not `registry/base`, so the accordion's Up, Down, Home and End (Base UI 1.9.0 has no accordion arrow keys) and tab roving that skips disabled tabs are kept.
- **Activation keys.** Checkbox toggles on Enter and acts on Space keydown (Base UI refuses Enter, acts on keyup). Radio selects on Enter, Home and End (Base UI turns Home and End off) and re-selecting the current value fires `onValueChange` again.
- **Pointer and hover ownership.** FF's fluid hover lights the nearest row, including over gaps. A click anywhere on a switch row toggles; dragging the thumb past the midpoint toggles. The slider uses FF's own track, drag and collision logic, and gives a press on stacked thumbs to thumb 0.
- **Popup opening and closing.** A pointer-opened menu focuses its panel, then its first row (FF's two-frame effect); Base UI lights nothing. Select is non-modal, does not align the selected item with the trigger, and closes 300 ms after a pick. Combobox uses `autoHighlight="always"`. Menu radio items close on click for single selection.
- **Timings.** Tooltip provider delays are 200 and 300 ms (Base UI: 600 and 400).
- **Structure.** FF's inline `Dropdown` is a `role="group"`, not a menu, and stays FF code. Submenus open on a physical side (right). A dialog reports a replayed close once. The scroll area keeps Base UI-style bars because `@ghia/native` has no touch.
- **Tooltip has no ARIA.** A recorded gap, not a decision to keep.
- **Accordion** calling `onValueChange` without a value is an FF quirk; it lives in FF, not here.

Easy to "correct" wrongly: the menu's typeahead forgets its query after 500 ms and Select's after 750 ms, both matching Base UI. `useTypeahead` defaults to 750; the menu list passes `MENU_TYPEAHEAD_RESET_MS` (500) explicitly. A new typeahead consumer must choose, not inherit.

Some disagreements are undecided and listed under "Open judgement calls" in each audit section (for example, whether arrow keys land on disabled rows).
