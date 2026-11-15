import type { DomEvent } from '@ghia/solid';
import { createSignal } from 'solid-js';

export interface InputOptions {
	/** Controlled value. While it returns a string the input never holds the value itself. */
	value?: () => string | undefined;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	disabled?: () => boolean;
}

export type Input = ReturnType<typeof createInput>;

/**
 * Port note: Base UI's `Input` is `Field.Control` without a `Field`. Field state (dirty, touched, filled, focused, validation)
 * and its data attributes are not ported; no consumer reads them and this port has no `field/`. Edits arrive through
 * `onInput` because `onChange` on a text control only fires on commit.
 */
export function createInput(options: InputOptions) {
	const [internalValue, setInternalValue] = createSignal(
		options.defaultValue ?? '',
	);
	const value = () => options.value?.() ?? internalValue();
	const disabled = () => options.disabled?.() ?? false;

	return {
		value,
		inputProps: {
			get value() {
				return value();
			},
			get disabled() {
				return disabled();
			},
			onInput(event: DomEvent) {
				const next = event.value;
				if (next === undefined) throw new Error('Input edit without a value');
				if (options.value?.() === undefined) setInternalValue(next);
				options.onValueChange?.(next);
			},
		},
	};
}
