import { createSignal, onCleanup } from 'solid-js';
import type { AvatarRoot } from '../root/avatar-root';

export interface AvatarFallbackOptions {
	/** Milliseconds to wait before showing the fallback. */
	delay?: number;
}

export function createAvatarFallback(
	root: AvatarRoot,
	options?: AvatarFallbackOptions,
) {
	const delay = options?.delay ?? 0;
	const [delayPassed, setDelayPassed] = createSignal(delay === 0);

	if (delay > 0) {
		const timer = setTimeout(() => setDelayPassed(true), delay);
		onCleanup(() => clearTimeout(timer));
	}

	return {
		visible: () => root.imageLoadingStatus() !== 'loaded' && delayPassed(),
	};
}
