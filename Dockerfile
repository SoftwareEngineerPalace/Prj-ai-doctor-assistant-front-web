# 使用官方 Node.js 运行时作为父镜像
FROM node:18.20.3 AS build-stage
WORKDIR /app
# 定义构建参数
ARG VITE_APP_BASE_PATH
ARG VITE_API_ACCOUNT_BASE_URL
ARG VITE_API_BUSINESS_BASE_URL
ARG VITE_EVENT_SOURCE_BASE_URL
# 复制源代码
COPY . .
# 安装依赖
RUN npm config set registry https://registry.npmmirror.com
RUN npm install -g cnpm --registry=https://registry.npmmirror.com
RUN cnpm install

# 在构建阶段创建 .env 文件
RUN if [ -z "${VITE_APP_BASE_PATH}" ]; then \
    echo "VITE_APP_BASE_PATH=/" > .env; \
  else \
    echo "VITE_APP_BASE_PATH=${VITE_APP_BASE_PATH}" > .env; \
  fi

RUN echo "VITE_API_ACCOUNT_BASE_URL=${VITE_API_ACCOUNT_BASE_URL:-http://127.0.0.1}" >> .env.development
RUN echo "VITE_API_BUSINESS_BASE_URL=${VITE_API_BUSINESS_BASE_URL:-http://127.0.0.1}" >> .env.development
RUN echo "VITE_EVENT_SOURCE_BASE_URL=${VITE_EVENT_SOURCE_BASE_URL:-http://127.0.0.1}" >> .env.development
# 构建 React 应用
RUN cnpm run build

# 使用 Node.js 运行时作为最终镜像
FROM node:18.20.3-alpine
WORKDIR /app
# 复制构建结果
COPY --from=build-stage /app/dist ./dist
# 复制 node_modules 文件夹
COPY --from=build-stage /app/node_modules ./node_modules
# 复制 server.js 和其他必要的启动文件
COPY --from=build-stage /app/package*.json ./
COPY --from=build-stage /app/server.js .
COPY --from=build-stage /app/.env .

# 启动应用
CMD ["node", "server.js"]