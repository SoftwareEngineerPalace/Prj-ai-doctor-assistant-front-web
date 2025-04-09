import { useNavigate } from "react-router-dom";
import "./AvatarPopover.less";
import { Button, ConfigProvider } from "antd";
import React from "react";
import { useContext } from "react";
import { AuthContext } from "@/state/auth/authContext";
import { LoginOutlined } from "@ant-design/icons";

const AvatarPopover = () => {
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  const logout = () => {
    dispatch({ type: "logout" });
    localStorage.setItem("authInfo", "");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("expire_in");
    navigate("/login");
  };

  return (
    <div className="avatar-popover">
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#339352",
          },
        }}
      >
        {" "}
        <Button
          className="btn-logout"
          icon={<LoginOutlined />}
          type="text"
          onClick={logout}
        >
          退出登录
        </Button>
      </ConfigProvider>
    </div>
  );
};

export { AvatarPopover };
