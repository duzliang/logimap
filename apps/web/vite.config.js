import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-query': ['@tanstack/react-query'],
                    'vendor-ui': ['@logimap/ui'],
                    'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod'],
                    'vendor-table': ['@tanstack/react-table'],
                    'vendor-flow': ['@xyflow/react', '@dagrejs/dagre'],
                    'vendor-utils': ['date-fns', 'lucide-react', 'sonner'],
                },
            },
        },
    },
});
