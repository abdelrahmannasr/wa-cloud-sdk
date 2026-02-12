import { defineConfig } from 'tsup';

export default defineConfig({
  tsconfig: 'tsconfig.build.json',
  entry: {
    index: 'src/index.ts',
    'errors/index': 'src/errors/index.ts',
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
