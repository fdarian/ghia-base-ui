import {
	type ButtonBehavior,
	buttonProps,
	type KeyEvent,
	useGpuixRequired,
} from '@ghia/solid';
import { mergeProps } from 'solid-js';

export interface ButtonOptions {
	disabled?: () => boolean | undefined;
	/** Keep a disabled button in the Tab order; it still never clicks. */
	focusableWhenDisabled?: boolean;
	onClick?: ButtonBehavior['onClick'];
	/** Runs before the button's own Enter / Space handling; not called while disabled. */
	onKeyDown?: (event: KeyEvent) => void;
}

export interface ButtonAria {
	'aria-disabled': true | undefined;
}

/**
 * Port of Base UI's `Button` for a non-native element (ghia has no `<button>`).
 * Spread `buttonProps` on the element: the tab stop, Enter on key down, Space
 * on key up and `aria-disabled`.
 */
export function createButton(options: ButtonOptions = {}) {
	const renderer = useGpuixRequired();
	const disabled = () => options.disabled?.() === true;

	return {
		disabled,
		// mergeProps keeps buttonProps' lazy getters; its type collapses to `unknown` against the index signature.
		buttonProps: mergeProps(
			buttonProps(
				{
					get disabled() {
						return disabled();
					},
					focusableWhenDisabled: options.focusableWhenDisabled,
					onClick: options.onClick,
					onKeyDown(event: KeyEvent) {
						if (disabled()) {
							// Keeps Space and arrows from scrolling a button that stays in the Tab order.
							if (options.focusableWhenDisabled && event.key !== 'Tab') {
								event.preventDefault();
							}
							return;
						}
						options.onKeyDown?.(event);
					},
					tabIndex: 0,
				},
				renderer,
			),
			{
				get 'aria-disabled'() {
					return disabled() ? true : undefined;
				},
			},
		) as Record<string, unknown> & ButtonAria,
	};
}
