import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from "vite-plugin-singlefile"

// https://vite.dev/config/
export default defineConfig({
    server: {
        host: '0.0.0.0',
    },
    plugins: [react(), tailwindcss(), viteSingleFile()],
    base: './', // Use relative paths to reduce absolute URL visibility
    build: {
        assetsDir: '', // Puts all assets (e.g., JS, CSS) at the root of `dist/`
        // rollupOptions: {
        //     output: {
        //         entryFileNames: `index.js`, // Flatten filenames
        //         chunkFileNames: `chunk-[hash].js`,
        //         assetFileNames: `asset-[hash][extname]`,
        //         manualChunks(id) {
        //             if (id.includes('node_modules')) {
        //                 if (id.includes('@mui')) return 'mui';
        //                 if (id.includes('@dnd-kit')) return 'dnd-kit';
        //                 if (id.includes('react')) return 'react-vendors';
        //                 if (id.includes('appwrite')) return 'appwrite';
        //                 return 'vendor';
        //             }
        //         },
        //     },
        // },
    },
});
