import type { Options } from 'tsup'

export const tsup: Options = {
  entry: ['src/vite.ts', 'src/webpack.ts', 'src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  clean: true,
  shims: false,
}
