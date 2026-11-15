import type { DomEvent } from '@ghia/solid';
import { describe, expect, test } from 'vitest';
import { createInput } from './input';

const edit = (value: string) => ({ value }) as DomEvent;

describe('createInput', () => {
	test('uncontrolled: starts at defaultValue, follows edits and reports them', () => {
		const changes: string[] = [];
		const input = createInput({
			defaultValue: 'a',
			onValueChange: (value) => changes.push(value),
		});
		expect(input.value()).toBe('a');
		expect(input.inputProps.value).toBe('a');
		input.inputProps.onInput(edit('ab'));
		expect(input.value()).toBe('ab');
		expect(input.inputProps.value).toBe('ab');
		expect(changes).toEqual(['ab']);
	});

	test('controlled: reports the edit and leaves the value to the owner', () => {
		const changes: string[] = [];
		const input = createInput({
			value: () => 'x',
			defaultValue: 'a',
			onValueChange: (value) => changes.push(value),
		});
		input.inputProps.onInput(edit('xy'));
		expect(input.value()).toBe('x');
		expect(input.inputProps.value).toBe('x');
		expect(changes).toEqual(['xy']);
	});

	test('disabled follows the accessor and defaults to false', () => {
		let disabled = false;
		const input = createInput({ disabled: () => disabled });
		expect(input.inputProps.disabled).toBe(false);
		disabled = true;
		expect(input.inputProps.disabled).toBe(true);
		expect(createInput({}).inputProps.disabled).toBe(false);
	});
});
