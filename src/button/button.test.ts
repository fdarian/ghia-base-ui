import {
	createComponent,
	GpuixContext,
	type HostPointerEvent,
	type KeyEvent,
} from '@ghia/solid';
import { type ComponentProps, createRoot } from 'solid-js';
import { describe, expect, test } from 'vitest';
import { type ButtonOptions, createButton } from './button';

function key(name: string, extra: { target?: object } = {}) {
	let prevented = false;
	const target = extra.target ?? {};
	const event = {
		key: name,
		repeat: false,
		elementId: 7,
		target,
		currentTarget: target,
		get defaultPrevented() {
			return prevented;
		},
		preventDefault: () => {
			prevented = true;
		},
	} as unknown as KeyEvent;
	return { event, prevented: () => prevented };
}

function setup(options: ButtonOptions = {}) {
	const clicked: number[] = [];
	const renderer = {
		clickElement: (id: number) => clicked.push(id),
	};
	let button: ReturnType<typeof createButton> | undefined;
	createRoot(() => {
		const value = {
			renderer,
		} as unknown as ComponentProps<typeof GpuixContext.Provider>['value'];
		createComponent(GpuixContext.Provider, {
			value,
			get children() {
				button = createButton(options);
				return undefined;
			},
		});
	});
	if (button === undefined) throw new Error('createButton did not run');
	const props = button.buttonProps as unknown as {
		role: string;
		tabIndex: number;
		onClick: (event: HostPointerEvent) => void;
		onKeyDown: (event: KeyEvent) => void;
		onKeyUp: (event: KeyEvent) => void;
	};
	return { button, props, clicked };
}

describe('createButton', () => {
	test('is a button with a tab stop and no aria-disabled', () => {
		const result = setup();
		const button = result.button;
		const props = result.props;

		expect(props.role).toBe('button');
		expect(props.tabIndex).toBe(0);
		expect(button.buttonProps['aria-disabled']).toBeUndefined();
		expect(button.disabled()).toBe(false);
	});

	test('Enter clicks on key down, Space on key up', () => {
		const result = setup();
		const props = result.props;
		const clicked = result.clicked;

		props.onKeyDown(key('Enter').event);
		expect(clicked).toEqual([7]);
		const space = key(' ');
		props.onKeyDown(space.event);
		expect(space.prevented()).toBe(true);
		expect(clicked).toEqual([7]);
		props.onKeyUp(key(' ').event);
		expect(clicked).toEqual([7, 7]);
	});

	test('a key bubbling from a nested element does not click', () => {
		const result = setup();
		const props = result.props;
		const clicked = result.clicked;

		const bubbled = key('Enter').event as unknown as { target: object };
		bubbled.target = {};
		props.onKeyDown(bubbled as unknown as KeyEvent);
		expect(clicked).toEqual([]);
	});

	test('runs onClick and onKeyDown', () => {
		const calls: string[] = [];
		const { props } = setup({
			onClick: () => calls.push('click'),
			onKeyDown: (event) => calls.push(`key:${event.key}`),
		});
		props.onClick({} as HostPointerEvent);
		props.onKeyDown(key('a').event);
		expect(calls).toEqual(['click', 'key:a']);
	});

	test('disabled blocks click and keys, leaves the tab order, reports aria-disabled', () => {
		const calls: string[] = [];
		const { button, props, clicked } = setup({
			disabled: () => true,
			onClick: () => calls.push('click'),
			onKeyDown: () => calls.push('key'),
		});
		props.onClick({} as HostPointerEvent);
		props.onKeyDown(key('Enter').event);
		props.onKeyUp(key(' ').event);
		expect(calls).toEqual([]);
		expect(clicked).toEqual([]);
		expect(props.tabIndex).toBe(-1);
		expect(button.buttonProps['aria-disabled']).toBe(true);
		expect(button.disabled()).toBe(true);
	});

	test('focusableWhenDisabled keeps the tab stop and swallows every key but Tab', () => {
		const { button, props, clicked } = setup({
			disabled: () => true,
			focusableWhenDisabled: true,
		});
		expect(props.tabIndex).toBe(0);
		expect(button.buttonProps['aria-disabled']).toBe(true);
		for (const name of ['Enter', ' ', 'ArrowDown']) {
			const pressed = key(name);
			props.onKeyDown(pressed.event);
			expect(pressed.prevented()).toBe(true);
		}
		const tab = key('Tab');
		props.onKeyDown(tab.event);
		expect(tab.prevented()).toBe(false);
		props.onKeyUp(key(' ').event);
		expect(clicked).toEqual([]);
	});

	test('follows a reactive disabled', () => {
		let disabled = false;
		const result = setup({ disabled: () => disabled });
		const button = result.button;
		const props = result.props;

		expect(props.tabIndex).toBe(0);
		disabled = true;
		expect(props.tabIndex).toBe(-1);
		expect(button.buttonProps['aria-disabled']).toBe(true);
	});
});
