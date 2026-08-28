import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vite.dev/config/
export default defineConfig({
    server: {
        host: '0.0.0.0',
    },
    plugins: [react(), tailwindcss(), viteSingleFile()],
    base: './', // Use relative paths to reduce absolute URL visibility
    build: {
        assetsDir: '', // Puts all assets (e.g., JS, CSS) at the root of `dist/`
    },
});
