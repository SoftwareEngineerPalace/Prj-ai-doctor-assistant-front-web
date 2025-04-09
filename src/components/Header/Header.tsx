import { Dropdown, MenuProps, message } from "antd";
import React, { useEffect, useState } from "react";
import style from "./Header.module.less";
import { useContext } from "react";
import { AuthContext } from "@/state/auth/authContext";
import { useNavigate, useLocation } from "react-router-dom";
import { UserOutlined, LoginOutlined } from "@ant-design/icons";
import CollectQrcodeModal from "@/components/CollectQrcodeModal";
import { service_getCollectQrcodeUrl } from "@/service/business_service";
import { aliCloudLog } from "@/service/aliCloudLog";

const Header: React.FC = () => {
  const { dispatch, state } = useContext(AuthContext);
  const { username } = state;
  // const hospital_name = hospital?.name;
  const navigate = useNavigate();
  const location = useLocation();
  const [paddingRight, setPaddingRight] = React.useState<string>("24px");
  // 动态获取 base path
  const basePath = import.meta.env.VITE_APP_BASE_PATH || "/";

  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);

  useEffect(() => {
    if (["/login", "/asrDetail", "/"].includes(location.pathname)) {
      setPaddingRight("24px");
    } else {
      setPaddingRight("32px");
    }
  }, [location]);

  const gotoList = () => {
    navigate("/application/audioList");
  };

  const logout = () => {
    dispatch({ type: "logout" });
    localStorage.setItem("authInfo", "");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("expire_in");
    navigate("/login");
  };

  /** setting dropdown */
  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <div
          onClick={logout}
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <LoginOutlined /> <div style={{ marginLeft: "8px" }}>退出登录</div>
        </div>
      ),
    },
  ];

  const [qrcodeUrl, setQrcodeUrl] = useState("");
  const getQrcodeUrl = async () => {
    try {
      const res = await service_getCollectQrcodeUrl();
      // console.log('Header getQrcodeUrl res=', res);
      aliCloudLog("Header getQrcodeUrl res=" + JSON.stringify(res.data));
      if (res.status === 200) {
        if (res.data.code === 10000) {
          setQrcodeUrl(res.data.data.qrcode_url);
        } else {
          message.error(res.data.msg);
        }
      }
    } catch (error) {
      console.log("获取二维码地址 error=", error);
      aliCloudLog(
        "Header getQrcodeUrl error=" + JSON.stringify(error),
        "error",
      );
    }
  };
  const handleQrcodeError = (error: any) => {
    console.log("二维码请求资源 error=", error);
    aliCloudLog(
      "Header handleQrcodeError error=" + JSON.stringify(error),
      "error",
    );
    getQrcodeUrl();
  };

  useEffect(() => {
    getQrcodeUrl();
  }, []);

  return (
    <div className={style.headerWrapper} style={{ paddingRight }}>
      <div className={style.headerInnerWrapper}>
        <img
          onClick={gotoList}
          style={{ width: "200px", height: "48px", cursor: "pointer" }}
          src={`${basePath}logo/friend_hospital_name.png`}
        ></img>
        <div style={{ display: "flex" }}>
          {qrcodeUrl && (
            <div
              onClick={() => setIsCollectModalOpen(true)}
              style={{ marginRight: "16px" }}
            >
              <img
                style={{ width: 40, height: 40, borderRadius: "4px" }}
                src={qrcodeUrl}
                alt=""
                onError={handleQrcodeError}
              />
            </div>
          )}
          <Dropdown
            menu={{ items }}
            overlayStyle={{ padding: "0px" }}
            placement="bottomRight"
          >
            <div
              className={style.groupAvatar}
              style={{
                opacity:
                  location.pathname !== "/login" && location.pathname !== "/"
                    ? 1
                    : 0,
              }}
            >
              <UserOutlined style={{ color: "white" }} />
              <div className="doctor-name">{`${username}`}</div>
            </div>
          </Dropdown>
        </div>
      </div>
      <CollectQrcodeModal
        imgUrl={qrcodeUrl}
        isCollectModalOpen={isCollectModalOpen}
        setIsCollectModalOpen={setIsCollectModalOpen}
      />
    </div>
  );
};

export default Header;
