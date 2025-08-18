import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Note: We intentionally avoid single-file output to enable effective code-splitting

// https://vite.dev/config/
export default defineConfig({
    server: {
        host: '0.0.0.0',
    },
    plugins: [react()],
    base: './', // Use relative paths to reduce absolute URL visibility
    build: {
        assetsDir: '', // Puts all assets (e.g., JS, CSS) at the root of `dist/`
        rollupOptions: {
            output: {
                entryFileNames: `index-[hash].js`,
                chunkFileNames: `chunk-[hash].js`,
                assetFileNames: `asset-[hash][extname]`,
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('@mui')) return 'mui';
                        if (id.includes('@dnd-kit')) return 'dnd-kit';
                        if (id.includes('react-markdown') || id.includes('remark-gfm')) return 'markdown';
                        if (id.includes('motion')) return 'motion';
                        if (id.includes('appwrite')) return 'appwrite';
                        if (id.includes('react-router')) return 'router';
                        if (id.includes('/react/') || id.includes('react-dom')) return 'react';
                        return 'vendor';
                    }
                },
            },
        },
    },
});
