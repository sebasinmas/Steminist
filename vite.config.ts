import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    // Antes: base: mode === "production" ? "/Steminist/" : "/",
    base: "/", // <-- siempre raíz, sin prefijo /Steminist/
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react()],
    define: {
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src/"),
      },
    },
  };
});