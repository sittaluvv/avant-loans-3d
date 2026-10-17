import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
export default defineConfig({
  base: "/avant-loans-3d/",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        apply: path.resolve(__dirname, "apply/index.html"),
        v2: path.resolve(__dirname, "v2/index.html"),
        applyv2: path.resolve(__dirname, "apply-v2/index.html"),
      },
    },
  },
})
