import React, { useEffect, useState } from "react";
import { service_getUserInfo } from "@/service/account_service";
import { useLocation, Navigate } from "react-router-dom";
function RequireAuth({
  children,
  componentName,
}: {
  children: JSX.Element;
  componentName: string;
}) {
  // if (import.meta.env.VITE_DEVELOPER === 'xiaojianjun') {
  //     return children;
  // }
  console.log("🚀 ~ RequireAuth ~ ", componentName);
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const access_token = localStorage.getItem("access_token");

  const checkTokenValidity = async () => {
    try {
      const res = await service_getUserInfo();
      if (res.status === 200) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("鉴权失败", error);
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    if (access_token) {
      console.log("useEffect 如果 token 存在，验证 token");
      checkTokenValidity();
    } else {
      console.log("useEffect 如果没有 token，直接设置为未登录");
      setIsLoggedIn(false);
    }
  }, [access_token]);

  if (isLoggedIn === null) {
    return <div>正在加载中...</div>;
  }

  console.log("🚀 ~ isLoggedIn", isLoggedIn, "; componentName=", componentName);
  // 判断是否在 login 页面
  if (componentName === "Login") {
    if (isLoggedIn) {
      console.log("已登录，准备去login页面，重定向至list页面");
      return (
        <Navigate
          to="/application/audioList"
          state={{ from: location }}
          replace
        />
      );
    } else {
      return children;
    }
  } else {
    if (isLoggedIn) {
      return children;
    } else {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }
}

export default RequireAuth;
