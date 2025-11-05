import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
    
    return {
        // --- LA SOLUCIÓN ---
        // Esto le dice a Vite:
        // 1. Si estamos en 'production' (npm run build), la ruta base es /Steminist/
        // 2. Si estamos en 'development' (npm run dev), la ruta base es / (la raíz)
        base: mode === 'production' ? '/Steminist/' : '/',
        
        // --- Tu configuración existente ---
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        },
    };
});
