/** @type {import('vite').UserConfig} */
export default {
  base: "./",
  build: {
    outDir: "../",
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
      },
      "/ws": {
        target: "http://localhost:3000",
        ws: true,
      },
    },
  },
};
