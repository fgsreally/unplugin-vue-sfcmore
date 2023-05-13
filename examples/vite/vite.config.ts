import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { sfc } from 'unplugin-vue-sfcmore/vite'
// https://vitejs.dev/config/
export default defineConfig({
  build: {
    cssCodeSplit: true,
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: format => `my-lib.${format}.js`,
    },
    rollupOptions: {
      external: ['vue'],
    },
  },

  plugins: [vue(), sfc({
    write: true,
    meta: true,
  })],
  server: {
    port: 4000,
  },
})
