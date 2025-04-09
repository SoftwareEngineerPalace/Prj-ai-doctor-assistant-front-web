import React, { createContext, useEffect, useReducer, useState } from "react";
import { authReducer, initialState } from "./authReducer";
import { initAliCloudLog } from "../../service/aliCloudLog";
// import { service_getLocalMachineCode } from '@/service/local_server_service';
// import { notification } from 'antd';
// import getOS from '@/utils/sysUtils';

export const AuthContext = createContext(null);

export function AuthProvider({ children }: any) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  // const [api, contextHolder] = notification.useNotification();
  const [isLoading, setIsLoading] = useState(true);

  // const getLocalMachineCode = async () => {
  //     const rsp = await service_getLocalMachineCode();
  //     const machineCode = rsp?.data?.data?.machine_code || '';
  //     if (!machineCode) {
  //         api.error({
  //             placement: 'top',
  //             message: '系统启动失败',
  //             description: '请稍后刷新网页，如长时间没启动成功请联系管理员',
  //             duration: 999999,
  //         });
  //     } else {
  //         dispatch({ type: 'saveMachineCode', payload: { machineCode } });
  //     }
  //     const os = getOS();
  //     dispatch({ type: 'setOS', payload: { os } }); // TODO 改成真实的系统类型
  //     // dispatch({ type: 'setOS', payload: { os: 'Windows' } }); // TODO 改成真实的系统类型
  // };

  useEffect(() => {
    // TODO 去掉登录页，则每次都需要登录
    const authInfo = localStorage.getItem("authInfo");
    console.log("authContext 初始化 登录了吗", !!authInfo); // TODO 执行了两次，为什么？
    // if (!authInfo) return;
    if (authInfo) {
      const payload = JSON.parse(authInfo);
      console.log(
        "authContext 已经登录了 则用 storage 里数据初始化登录 doctorId=",
        payload.doctorId,
      );
      initAliCloudLog(payload.doctorId);
      // 存到 redux
      dispatch({ type: "login", payload });
    }

    // 获取本地机器码
    // getLocalMachineCode();
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ state, dispatch, isLoading }}>
      {/* {contextHolder} */}
      {children}
    </AuthContext.Provider>
  );
}
