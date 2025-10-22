/// <reference types='vitest' />
import angular from '@analogjs/vite-plugin-angular';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig, Plugin, UserConfig } from 'vite';

export default defineConfig((): UserConfig => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/ngrx-toolkit',
  plugins: [angular() as unknown as Plugin, nxViteTsPaths() as unknown as Plugin, nxCopyAssetsPlugin(['*.md']) as unknown as Plugin],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  test: {
    name: 'ngrx-toolkit',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/libs/ngrx-toolkit',
      provider: 'v8' as const,
    },
  },
}));
