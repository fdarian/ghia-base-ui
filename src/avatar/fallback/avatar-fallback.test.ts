import { createRoot } from 'solid-js';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createAvatarRoot } from '../root/avatar-root';
import { createAvatarFallback } from './avatar-fallback';

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	vi.useRealTimers();
});

describe('createAvatarFallback', () => {
	test('no delay: visible until the image loads', () => {
		createRoot((dispose) => {
			const root = createAvatarRoot();
			const fallback = createAvatarFallback(root);
			expect(fallback.visible()).toBe(true);
			root.setImageLoadingStatus('loaded');
			expect(fallback.visible()).toBe(false);
			dispose();
		});
	});

	test('delay: hidden until it passes, then follows the status', () => {
		createRoot((dispose) => {
			const root = createAvatarRoot();
			const fallback = createAvatarFallback(root, { delay: 100 });
			expect(fallback.visible()).toBe(false);
			vi.advanceTimersByTime(99);
			expect(fallback.visible()).toBe(false);
			vi.advanceTimersByTime(1);
			expect(fallback.visible()).toBe(true);
			root.setImageLoadingStatus('loaded');
			expect(fallback.visible()).toBe(false);
			root.setImageLoadingStatus('error');
			expect(fallback.visible()).toBe(true);
			dispose();
		});
	});

	test('cleanup clears the delay timer', () => {
		createRoot((dispose) => {
			createAvatarFallback(createAvatarRoot(), { delay: 100 });
			dispose();
		});
		expect(vi.getTimerCount()).toBe(0);
	});
});
