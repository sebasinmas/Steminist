import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
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
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        },
    };
});
