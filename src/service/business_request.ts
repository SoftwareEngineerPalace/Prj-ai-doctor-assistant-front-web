import axios, { InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { aliCloudLog } from "@/service/aliCloudLog";

// 创建 axios 实例
const service = axios.create({
  baseURL: `${import.meta.env.VITE_API_BUSINESS_BASE_URL}/`,
  timeout: 2000000, //2000秒
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
});

// 刷新 token 请求
async function refreshAccessToken(): Promise<any> {
  const refreshToken = localStorage.getItem("refresh_token") || "";
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }
  console.log("refreshAccessToken: ", refreshToken);
  try {
    const response = await service({
      url: "v1/account/v2/accesstoken",
      method: "post",
      data: {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      },
    });
    console.log("refreshAccessToken: ", response);
    localStorage.setItem("access_token", response?.data.access_token);
    localStorage.setItem("expire_in", String(response?.data.expire_in));
    localStorage.setItem("refresh_token", response?.data.refresh_token);

    return response.data.access_token; // 返回新的 access_token
  } catch (error) {
    console.error("Failed to refresh token:", error);
    throw error;
  }
}

// 请求拦截器
service.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    console.log(
      "business_request 请求拦截器 service.interceptors.request.use:",
    );
    const token = localStorage.getItem("access_token") || "";
    const expire_in = Number(localStorage.getItem("expire_in") || 0);
    const currentTime = Math.floor(Date.now() / 1000);

    if (token && currentTime >= expire_in - 600) {
      try {
        config.headers.Authorization = `Bearer ${await refreshAccessToken()}`;
      } catch (error) {
        console.error("Failed to refresh token:", error);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("expire_in");
        const basename = import.meta.env.VITE_APP_BASE_PATH || "/";
        window.location.href = basename + "login";
        return Promise.reject(error);
      }
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: any) => {
    return Promise.resolve(error);
  },
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const authInfo = localStorage.getItem("authInfo");
    // console.log('business_request 响应拦截器 service.interceptors.response.use:', response);
    const { status } = response;
    if (status === 203) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("expire_in");
      const basename = import.meta.env.VITE_APP_BASE_PATH || "/";
      window.location.href = basename + "login";
    }
    aliCloudLog(
      `service.interceptors.response.use response: 
            status: ${response.status},
            response.request.responseURL: ${response.request.responseURL},
            data: ${JSON.stringify(response.data)},
            ` + authInfo
        ? JSON.parse(authInfo || "")?.accountName
        : "",
    );
    return response;
  },
  (err: any) => {
    const authInfo = localStorage.getItem("authInfo");
    console.error("service.interceptors.response.use:", err);
    aliCloudLog(
      `service.interceptors.response.use err: 
            err.code: ${err.code},
            err.message: ${err.message},
            err.response.request.responseURL: ${err.response.request.responseURL},
            err.response.data: ${JSON.stringify(err.response.data)},
            err.response.status: ${err.response.status},
            err.response.statusText: ${err.response.statusText},
            err: ${JSON.stringify(err)}
            ` + authInfo
        ? JSON.parse(authInfo || "")?.accountName
        : "",
    );
    return Promise.resolve(err);
  },
);

// 导出 axios 实例
export default service;
