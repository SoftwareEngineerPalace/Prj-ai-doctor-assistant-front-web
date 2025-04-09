import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import "./index.less";
import "@/style/reset.less";
import "antd/dist/reset.css";
import { AuthProvider } from "./state/auth/authContext.js";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import zhCN from "antd/lib/locale/zh_CN";

// 动态获取 basename
const basename = import.meta.env.VITE_APP_BASE_PATH || "/";

const Root = () => (
  <AuthProvider>
    <BrowserRouter basename={basename}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: "#339352",
          },
        }}
      >
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </AuthProvider>
);

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<Root />);
} else {
  console.error("Root element not found");
}
