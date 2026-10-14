import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const observerTarget = process.env.OBSERVER_TRANSPORT_URL ?? "http://127.0.0.1:8765";
const proxy = {
  "/v1": {
    target: observerTarget,
    changeOrigin: false,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 4173,
    proxy,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    proxy,
  },
});

