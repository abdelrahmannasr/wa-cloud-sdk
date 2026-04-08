import { defineConfig } from 'tsup';

export default defineConfig({
  tsconfig: 'tsconfig.build.json',
  entry: {
    index: 'src/index.ts',
    'errors/index': 'src/errors/index.ts',
    'messages/index': 'src/messages/index.ts',
    'webhooks/index': 'src/webhooks/index.ts',
    'media/index': 'src/media/index.ts',
    'templates/index': 'src/templates/index.ts',
    'phone-numbers/index': 'src/phone-numbers/index.ts',
    'multi-account/index': 'src/multi-account/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  target: 'node18',
  outDir: 'dist',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});
