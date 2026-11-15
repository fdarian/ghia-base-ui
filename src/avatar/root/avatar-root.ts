import { createSignal } from 'solid-js';

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type AvatarRoot = ReturnType<typeof createAvatarRoot>;

export function createAvatarRoot() {
	const [imageLoadingStatus, setImageLoadingStatus] =
		createSignal<ImageLoadingStatus>('idle');

	return { imageLoadingStatus, setImageLoadingStatus };
}
