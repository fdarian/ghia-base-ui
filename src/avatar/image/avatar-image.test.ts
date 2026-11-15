import { createRoot, createSignal } from 'solid-js';
import { describe, expect, test } from 'vitest';
import { createAvatarFallback } from '../fallback/avatar-fallback';
import { createAvatarRoot } from '../root/avatar-root';
import { createAvatarImage } from './avatar-image';

function setup(initialSrc: string | undefined) {
	return createRoot((dispose) => {
		const [src, setSrc] = createSignal(initialSrc);
		const changes: string[] = [];
		const root = createAvatarRoot();
		const image = createAvatarImage(root, {
			src,
			onLoadingStatusChange: (status) => changes.push(status),
		});
		const fallback = createAvatarFallback(root);
		return { root, image, fallback, setSrc, changes, dispose };
	});
}

describe('createAvatarImage', () => {
	test('no src: error, fallback visible', () => {
		const t = setup(undefined);
		expect(t.image.status()).toBe('error');
		expect(t.root.imageLoadingStatus()).toBe('error');
		expect(t.image.visible()).toBe(false);
		expect(t.fallback.visible()).toBe(true);
		expect(t.changes).toEqual(['error']);
		t.dispose();
	});

	test('src: loading, then onLoad loads and hides the fallback', () => {
		const t = setup('a.png');
		expect(t.image.imageProps.src).toBe('a.png');
		expect(t.image.status()).toBe('loading');
		expect(t.fallback.visible()).toBe(true);
		t.image.imageProps.onLoad();
		expect(t.image.status()).toBe('loaded');
		expect(t.root.imageLoadingStatus()).toBe('loaded');
		expect(t.image.visible()).toBe(true);
		expect(t.fallback.visible()).toBe(false);
		expect(t.changes).toEqual(['loading', 'loaded']);
		t.dispose();
	});

	test('onError: error, fallback visible', () => {
		const t = setup('a.png');
		t.image.imageProps.onError();
		expect(t.image.status()).toBe('error');
		expect(t.image.visible()).toBe(false);
		expect(t.fallback.visible()).toBe(true);
		expect(t.changes).toEqual(['loading', 'error']);
		t.dispose();
	});

	test('src change resets to loading', () => {
		const t = setup('a.png');
		t.image.imageProps.onLoad();
		t.setSrc('b.png');
		expect(t.image.imageProps.src).toBe('b.png');
		expect(t.image.status()).toBe('loading');
		expect(t.fallback.visible()).toBe(true);
		t.setSrc(undefined);
		expect(t.image.status()).toBe('error');
		t.dispose();
	});

	test('an event without a src is ignored', () => {
		const t = setup('a.png');
		t.setSrc(undefined);
		t.image.imageProps.onLoad();
		expect(t.image.status()).toBe('error');
		expect(t.changes).toEqual(['loading', 'error']);
		t.dispose();
	});

	test('cleanup resets the root to idle', () => {
		const t = setup('a.png');
		t.image.imageProps.onLoad();
		expect(t.root.imageLoadingStatus()).toBe('loaded');
		t.dispose();
		expect(t.root.imageLoadingStatus()).toBe('idle');
	});
});
