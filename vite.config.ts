import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// React に依存するパッケージは ?external=react で importmap の react を共有させる
// （esm.sh が別バージョンの react を解決すると React が二重に読み込まれ白画面になる）
const cdnPackages: Record<string, string> = {
  react: "https://esm.sh/react@19.3.0",
  "react/jsx-runtime": "https://esm.sh/react@19.3.0/jsx-runtime",
  "react-dom": "https://esm.sh/react-dom@19.3.0?external=react",
  "react-dom/client": "https://esm.sh/react-dom@19.3.0/client?external=react",
  "lucide-react": "https://esm.sh/lucide-react@1.48.0?external=react",
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

const SEO_DESC =
  "Questrack(クエストラック)は、問題演習で間違えた問題(✕)だけを抽出して復習できる問題追跡アプリです。資格試験や受験の過去問演習に。ブラウザまたはデスクトップアプリ(macOS / Windows)で使えます。";

const SEO_JSONLD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Questrack",
  url: "https://tyama11.github.io/questrack/",
  description: SEO_DESC,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web, macOS, Windows",
  image: "https://tyama11.github.io/questrack/app-icon.png",
});

const SEO_HEAD_TAGS = [
  '<meta name="google-site-verification" content="8gyf0epD2fOstHMcVqJ9szbLza7T4MvDH0SRVi2XlCc" />',
  `<meta name="description" content="${SEO_DESC}" />`,
  '<link rel="canonical" href="https://tyama11.github.io/questrack/" />',
  '<meta property="og:type" content="website" />',
  '<meta property="og:site_name" content="Questrack" />',
  '<meta property="og:locale" content="ja_JP" />',
  '<meta property="og:title" content="Questrack - 問題追跡・復習アプリ" />',
  `<meta property="og:description" content="${SEO_DESC}" />`,
  '<meta property="og:url" content="https://tyama11.github.io/questrack/" />',
  '<meta property="og:image" content="https://tyama11.github.io/questrack/app-icon.png" />',
  '<meta name="twitter:card" content="summary" />',
  `<script type="application/ld+json">${SEO_JSONLD}</script>`,
].join("\n    ");

const SEO_BODY_TAGS =
  '<nav aria-label="About Questrack" class="text-center text-xs text-slate-500 dark:text-slate-400 py-4"><a href="./about/">Questrack について</a> · <a href="./about/en/" hreflang="en">About Questrack</a></nav>';

function pagesSeoPlugin(enabled: boolean): Plugin {
  return {
    name: "vite-plugin-pages-seo",
    transformIndexHtml(html) {
      if (!enabled) return html;
      const headBlock = `\n    ${SEO_HEAD_TAGS}\n  `;
      const bodyBlock = `\n    ${SEO_BODY_TAGS}\n  `;
      return html
        .replace("</head>", () => `${headBlock}</head>`)
        .replace("</body>", () => `${bodyBlock}</body>`);
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
    plugins: [
      tailwindcss(),
      react(),
      cdnImportMapPlugin(!isDesktop),
      pagesSeoPlugin(!isDesktop),
    ],
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

