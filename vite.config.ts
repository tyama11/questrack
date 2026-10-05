import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

const cdnPackages: Record<string, string> = {
  react: "https://esm.sh/react@19.3.0",
  "react/jsx-runtime": "https://esm.sh/react@19.3.0/jsx-runtime",
  "react-dom": "https://esm.sh/react-dom@19.3.0",
  "react-dom/client": "https://esm.sh/react-dom@19.3.0/client",
  "lucide-react": "https://esm.sh/lucide-react@1.48.0",
  clsx: "https://esm.sh/clsx@2.1.1",
  "tailwind-merge": "https://esm.sh/tailwind-merge@3.7.0",
};

function cdnImportMapPlugin(enabled: boolean): Plugin {
  return {
    name: "vite-plugin-cdn-import-map",
    transformIndexHtml(html) {
      if (!enabled) return html;
      const importMapJson = JSON.stringify({ imports: cdnPackages }, null, 2);
      const scriptTag = `\n    <!-- CDN Libraries for GitHub Pages -->\n    <script type="importmap">\n${importMapJson}\n    </script>\n  `;
      return html.replace("</head>", `${scriptTag}</head>`);
    },
  };
}

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Desktop mode: embed all libraries locally for offline independence
  // Default / Pages mode: externalize libraries and fetch from CDN via browser import maps
  const isDesktop = mode === "desktop" || Boolean(process.env.TAURI_ENV_PLATFORM);

  return {
    plugins: [tailwindcss(), react(), cdnImportMapPlugin(!isDesktop)],
    base: "./",
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        external: isDesktop ? [] : Object.keys(cdnPackages),
      },
    },
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
};
});

