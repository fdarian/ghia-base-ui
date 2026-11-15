import { solid } from '@ghia/solid/vite';
import { ghia } from 'ghia';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [ghia(), solid()],
	test: { environment: 'node' },
});
