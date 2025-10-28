import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const certDir = path.resolve(__dirname, "./certs");
  const certFile = path.join(certDir, "localhost.pem");
  const keyFile = path.join(certDir, "localhost-key.pem");

  // If cert files exist, enable https for local dev (works well with mkcert)
  const httpsConfig = fs.existsSync(certFile) && fs.existsSync(keyFile)
    ? {
        https: {
          cert: fs.readFileSync(certFile),
          key: fs.readFileSync(keyFile),
        },
      }
    : undefined;

  return {
    server: {
      host: "localhost",
      port: 8080,
      ...(httpsConfig || {}),
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
