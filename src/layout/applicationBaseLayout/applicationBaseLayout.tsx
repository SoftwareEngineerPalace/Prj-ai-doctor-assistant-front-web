import Header from "@/components/Header";
import SideMenu from "@/components/SideMenu";
import React from "react";
import { Outlet } from "react-router-dom";
import style from "./applicationBaseLayoutCSS.module.css";
// import Marquee from 'react-fast-marquee';
// import { Alert } from 'antd';

const ApplicationBaseLayout = () => {
  return (
    <div className={style.applicationLayout}>
      <Header />
      <div className={style.mainContent}>
        <SideMenu />
        <Outlet />
      </div>
    </div>
  );
};

export default ApplicationBaseLayout;
