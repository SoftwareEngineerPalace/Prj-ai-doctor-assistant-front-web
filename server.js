import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import compression from "compression";
import expressStaticGzip from "express-static-gzip";

// 加载环境变量
dotenv.config();

const app = express();
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 80;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 获取基本路径
// eslint-disable-next-line no-undef
const basePath = process.env.VITE_APP_BASE_PATH || "/";
console.log("basePath:", basePath);

// 启用 gzip 压缩中间件
app.use(compression());

// 设置静态文件目录
app.use(
  basePath,
  expressStaticGzip(path.join(__dirname, "dist"), {
    enableBrotli: false, // 如果你还使用了 brotli 压缩，则设置为 true
    orderPreference: ["gz"],
  }),
);

// 处理所有路由请求
app.get(`${basePath}*`, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
