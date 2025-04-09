/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createHtmlPlugin } from "vite-plugin-html";
import viteCompression from "vite-plugin-compression";

// 用 fileURLToPath 获取当前模块的路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  // 加载环境变量
  // eslint-disable-next-line no-undef
  const env = loadEnv(mode, process.cwd());
  const base = env.VITE_APP_BASE_PATH || "/";
  return {
    test: {
      globals: true,
    },
    plugins: [
      react(),
      viteCompression({
        algorithm: "gzip",
        threshold: 10240,
        verbose: false,
        deleteOriginFile: true,
      }),
      createHtmlPlugin({
        inject: {
          data: {
            BASE_URL: base,
          },
        },
      }),
    ],
    // base: '/',
    // base: '/asr-frontend/',
    base,
    resolve: {
      alias: [
        {
          find: "@",
          replacement: resolve(__dirname, "./src"),
        },
      ],
    },
    css: {
      preprocessorOptions: {
        less: {
          modifyVars: {
            hack: `true; @import "${resolve(__dirname, "src/style/variables.less")}";`,
          },
          javascriptEnabled: true,
        },
      },
    },
    build: {
      // 压缩JS代码
      minify: "terser",
      // 压缩CSS代码
      cssCodeSplit: true,
      //生产环境时移除console
      // terserOptions: {
      //   compress: {
      //     drop_console: true,
      //     drop_debugger: true,
      //   },
      // },
      //rollup打包后的静态资源名称格式
      rollupOptions: {
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]",
        },
      },
    },
    // server: {
    //   proxy: {
    //     '/api': {
    //       target: 'http://192.168.191.4:8502',
    //       changeOrigin: true,
    //       rewrite: (path) => path.replace(/^\/api/, '')
    //     }
    //   }
    // }
  };
});
