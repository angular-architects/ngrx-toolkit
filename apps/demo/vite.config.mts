/// <reference types="vitest" />

import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig, ConfigEnv, UserConfig, Plugin } from 'vite';

// Extend Vite's config type to include Vitest's `test` field
interface VitestConfig extends UserConfig {
  test?: {
    globals?: boolean;
    environment?: string;
    setupFiles?: string[];
    include?: string[];
    reporters?: string[];
  };
}

export default defineConfig((config: ConfigEnv): VitestConfig => {
  const { mode } = config;

  return {
    plugins: [angular() as unknown as Plugin, nxViteTsPaths()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test-setup.ts'],
      include: ['src/**/*.spec.ts'],
      reporters: ['default'],
    },
    define: {
      'import.meta.vitest': mode !== 'production',
    },
  };
});
