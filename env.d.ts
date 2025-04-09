/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEVELOPER: string;
  // 其他环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
