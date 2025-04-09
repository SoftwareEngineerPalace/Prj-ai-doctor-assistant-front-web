import axios, { InternalAxiosRequestConfig, AxiosResponse } from "axios";

// 创建 axios 实例
const service = axios.create({
  baseURL: `${import.meta.env.VITE_API_LOCALSERVER_BASE_URL}/`,
  timeout: 10000,
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
});

// 请求拦截器
service.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: any) => {
    return Promise.resolve(error);
  },
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (err: any) => {
    console.error(
      "local_server_request service.interceptors.response.use:",
      err,
    );
    return Promise.resolve(err);
  },
);

// 导出 axios 实例
export default service;
