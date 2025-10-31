import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    assetsInlineLimit: 0, // Don't inline any assets
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          // Keep audio files in their original structure
          if (assetInfo.name.match(/\.(mp3|wav|ogg|m4a)$/)) {
            return 'assets/audio/[name][extname]';
          }
          return 'assets/[name].[hash].[ext]';
        }
      }
    }
  },
  server: {
    open: true
  }
});
