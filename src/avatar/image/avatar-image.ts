import { createComputed, createSignal, on, onCleanup } from 'solid-js';
import type { AvatarRoot, ImageLoadingStatus } from '../root/avatar-root';

export interface AvatarImageOptions {
	src: () => string | undefined;
	onLoadingStatusChange?: (status: ImageLoadingStatus) => void;
}

export type AvatarImage = ReturnType<typeof createAvatarImage>;

/**
 * Port note: upstream preloads through an off-DOM `new window.Image()` (its `keepMounted`
 * off mode). ghia has none, so the status comes from the rendered `<img>`'s own `onLoad` and
 * `onError`, as upstream's `keepMounted` mode does. The consumer keeps the element rendered
 * and hides it while `visible()` is false; ghia loads a hidden `<img>` all the same.
 */
export function createAvatarImage(
	root: AvatarRoot,
	options: AvatarImageOptions,
) {
	const [status, setStatusSignal] = createSignal<ImageLoadingStatus>('idle');

	const setStatus = (next: ImageLoadingStatus) => {
		if (next === status()) return;
		setStatusSignal(next);
		options.onLoadingStatusChange?.(next);
		root.setImageLoadingStatus(next);
	};

	createComputed(
		on(options.src, (src) => {
			setStatus(src ? 'loading' : 'error');
		}),
	);

	onCleanup(() => root.setImageLoadingStatus('idle'));

	// ghia's events carry no `src`, so a late event of a replaced `src` cannot be told from
	// the current one. Only an event that arrives while there is no `src` is known stale.
	const settle = (next: 'loaded' | 'error') => {
		if (!options.src()) return;
		setStatus(next);
	};

	return {
		status,
		visible: () => status() === 'loaded',
		imageProps: {
			get src() {
				return options.src();
			},
			onLoad() {
				settle('loaded');
			},
			onError() {
				settle('error');
			},
		},
	};
}
