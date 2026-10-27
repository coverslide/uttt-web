/** @type {import('vite').UserConfig} */
export default {
  base: './',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
      },
      '/ws': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
  build: {
    // The deployable site is written to the parent game directory.
    outDir: '..',
    emptyOutDir: false,
  },
}
