import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    // OneDrive가 기존 dist 파일을 잠그더라도 빌드가 중단되지 않게 합니다.
    emptyOutDir: false,
  },

  server: {
    host: true,

    // cloudflared 임시 터널 주소로 휴대폰에서 접속할 수 있게 허용합니다.
    allowedHosts: [".trycloudflare.com"],

    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
