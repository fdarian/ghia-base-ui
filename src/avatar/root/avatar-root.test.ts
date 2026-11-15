import { describe, expect, test } from 'vitest';
import { createAvatarRoot } from './avatar-root';

describe('createAvatarRoot', () => {
	test('starts idle and holds what the image reports', () => {
		const root = createAvatarRoot();
		expect(root.imageLoadingStatus()).toBe('idle');
		root.setImageLoadingStatus('loaded');
		expect(root.imageLoadingStatus()).toBe('loaded');
	});
});
