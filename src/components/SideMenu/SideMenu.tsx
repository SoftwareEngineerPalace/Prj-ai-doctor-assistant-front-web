import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import style from "./SideMenu.module.less";
import { Layout } from "antd";
const { Sider } = Layout;

const SideMenu = () => {
  const [level3route, setLevel3route] = React.useState<string>("");
  const location = useLocation();
  useEffect(() => {
    // 1 初始化谁被选中
    const _level3route = location.pathname.split("/")[2];
    console.log("SideMenu mount level3route=", _level3route);
    setLevel3route(_level3route);
  }, []);

  useEffect(() => {
    // 2 监听路由变化
    const _level3route = location.pathname.split("/")[2];
    console.log("SideMenu update level3route=", _level3route);
    setLevel3route(_level3route);
  }, [location]);

  const [collapsed] = useState(false);

  return (
    <Sider
      width={160}
      className={style.sideMenuWrapper}
      // breakpoint="xl"
      collapsedWidth="0"
      onBreakpoint={(broken) => {
        console.log({ broken });
      }}
      // onCollapse={(collapsed, type) => {
      //   console.log({ collapsed, type });
      //   setCollapsed(collapsed);
      // }}
    >
      {!collapsed && (
        <ul>
          <li>
            <Link
              id="audioList"
              className={`${style.li} ${level3route === "audioList" || level3route === "recordBoard" || level3route === "recordDetail" ? style.selected : ""}`}
              to="/application/audioList"
            >
              录音列表
            </Link>
          </li>
          <li>
            <Link
              id="asr"
              className={`${style.li} ${level3route === "asrList" || level3route === "asrDetail" || level3route === "asrEdit" ? style.selected : ""}`}
              to="/application/asrList"
            >
              转录编辑
            </Link>
          </li>
          <li>
            <Link
              className={`${style.li} ${level3route === "collectInfoList" ? style.selected : ""}`}
              to="/application/collectInfoList"
            >
              采集信息
            </Link>
          </li>
          <li>
            <Link
              className={`${style.li} ${level3route === "medicalRecordList" || level3route === "medicalRecordDetail" ? style.selected : ""}`}
              to="/application/medicalRecordList"
            >
              病历生成
            </Link>
          </li>
        </ul>
      )}
    </Sider>
  );
};

export default SideMenu;
