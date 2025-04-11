import React, {
  memo,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import "./Login.less";
import { Form, Input, Button, message, Checkbox, Card } from "antd";
import { useNavigate } from "react-router-dom";
import {
  service_login,
  service_getUserInfo,
} from "../../service/account_service";
import { AuthContext } from "../../state/auth/authContext";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { initAliCloudLog, aliCloudLog } from "../../service/aliCloudLog";

const Login: React.FC = () => {
  const { dispatch } = useContext(AuthContext) as any;

  const [form] = Form.useForm();

  // 动态获取 base path
  const basePath = import.meta.env.VITE_APP_BASE_PATH || "/";

  // const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  const [initialFormValues] = useState<any>({ username: "", password: "" });
  const [test0, setTest0] = useState<any>("test0");
  const [test1, setTest1] = useState<any>("test1");

  useEffect(() => {
    const rememberMeInfoStr = localStorage.getItem("rememberMeInfo");
    if (!rememberMeInfoStr) return;
    const rememberMeInfo = JSON.parse(rememberMeInfoStr);
    if (!rememberMeInfo) return;
    console.log("🚀 ~ Login mount ~ rememberMeInfo:", rememberMeInfo);
    const { username, password, rememberMe } = rememberMeInfo;
    if (rememberMe) {
      form.setFieldsValue({ username, password, rememberMe });
    }
  }, []);

  // TODO用宏 Dev 实现更优雅
  console.log("login render");

  const onFinish = async (values: any) => {
    setTest0("test0 + 0");
    setTest1("test1 + 1");
    // return;
    // TODO 不优雅，待优化
    const { username, password, rememberMe } = values;
    // 登录
    try {
      const rsp = await service_login({ username, password });
      if (rsp?.status === 200) {
        console.log("🚀 ~ 登录 ~ rsp:", rsp);
        const token = rsp.data.access_token;
        const expire_in = rsp.data.expire_in;
        const refresh_token = rsp.data.refresh_token;

        // 存登录信息
        localStorage.setItem("access_token", token);
        localStorage.setItem("expire_in", String(expire_in));
        localStorage.setItem("refresh_token", refresh_token);

        // 获取用户信息
        const userInfo = await service_getUserInfo();
        aliCloudLog("Login页面 登录成功" + userInfo);
        console.log("🚀 ~ 获取用户信息 ~ userInfo:", userInfo);
        const {
          hospital,
          aid: doctorId,
          account_name: accountName,
        } = userInfo.data.data.account;
        initAliCloudLog(doctorId);

        // 登录信息存到本地
        const authInfo = {
          token,
          username: userInfo.data.data.account.username,
          isAuthenticated: true,
          hospital,
          doctorId,
          accountName,
        };
        localStorage.setItem("authInfo", JSON.stringify(authInfo));

        const rememberMeInfo = { username, password, rememberMe };
        console.log("登录成功保存　rememberMeInfo", rememberMeInfo);
        localStorage.setItem("rememberMeInfo", JSON.stringify(rememberMeInfo));

        // 存到 redux
        dispatch({ type: "login", payload: authInfo });
        navigate("/application/audioList");
      } else {
        message.error("用户名或密码错误");
        aliCloudLog(
          `Login页面 用户名或密码错误 rsp: ${JSON.stringify(rsp)}` + username
        );
      }
    } catch (error) {
      aliCloudLog(
        `Login页面 登录失败 error: ${JSON.stringify(error)}` + username
      );
    }
  };

  const Compo = memo(({ tabName }: any) => {
    const list = [];
    console.log("Compo render=", tabName);
    console.time("time");
    if (tabName === "test2") {
      for (let i = 0; i < 50000; i++) {
        list.push(<span key={i}>{i}</span>);
      }
    }
    console.timeEnd("time");

    return (
      <div style={{ color: "black" }}>
        {tabName === "test1" && <div>test1</div>}
        {tabName === "test2" && <p>{list}</p>}
        {tabName === "test3" && <div>test3</div>}
      </div>
    );
  });

  Compo.displayName = "Compo";

  const tabList = ["test1", "test2", "test3"];
  const [activeTab, setActiveTab] = useState(tabList[0]);
  const [activeTabName, setActiveTabName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  console.log("activeTab=", activeTab, "isPending=", isPending);
  return (
    <div className="login-wrapper">
      <p>
        {tabList.map((tabName) => {
          return (
            <span
              key={tabName}
              style={{ color: activeTabName === tabName ? "red" : "black" }}
              onClick={() => {
                setActiveTabName(tabName);
                startTransition(() => {
                  setActiveTab(tabName);
                });
              }}
            >
              {tabName}
            </span>
          );
        })}
      </p>
      <Compo tabName={activeTab} />
      <div className="hbox">
        <img
          className="img-logo"
          style={{ width: "64px", height: "64px" }}
          src={`${basePath}logo/beijing_friend_hospital_logo.png`}
        ></img>
        <div className="title-container">
          {/* <span className='title-sub'>诊室听译</span> */}
          <span className="title-main">{test0 + ":" + test1}</span>
        </div>
      </div>
      <Card className="card-login">
        <Form
          name="basic"
          form={form}
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 24 }}
          // 270px 有可能不合适
          style={{ maxWidth: 1000, width: "270px" }}
          initialValues={initialFormValues}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          layout="horizontal"
        >
          <Form.Item<FieldType>
            label=""
            name="username"
            rules={[{ required: true, message: "请输入用户名" }]}
            layout="horizontal"
          >
            <Input
              prefix={<UserOutlined />}
              size="large"
              placeholder="请输入用户名"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item<FieldType>
            label=""
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              style={{ width: "100%" }}
              autoComplete=""
            />
          </Form.Item>

          <Form.Item<FieldType>
            name="rememberMe"
            wrapperCol={{ span: 24 }}
            valuePropName="checked"
          >
            <Checkbox style={{ width: "100%" }}>记住我</Checkbox>
          </Form.Item>

          <Form.Item wrapperCol={{ span: 24 }}>
            <Button
              type="primary"
              className="btn-login"
              size="large"
              htmlType="submit"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        {/* <div className="card-footer">
                    <a style={{ color: '#000000A6', fontSize: '12px' }} onClick={gotoIntro}>使用说明</a>
                    <a style={{ color: '#000000A6', fontSize: '12px', textDecoration: 'underline' }} download href="http://bfh-interpreter.zhilanmed.com:28501/static/clinic-assist/client/0.2.0/zhilanmed_clinic_assist_clientv0.2.0.202407.rar ">录音客户端下载</a>
                </div> */}
      </Card>
      {/* <div className="container-test">
        <span className="sub" style={{ fontSize: "1rem" }}>
          111
        </span>
        <span className="sub" style={{ fontSize: "1rem" }}>
          222
        </span>
        <span className="sub" style={{ fontSize: "1rem" }}>
          333
        </span> */}
      {/* </div> */}
    </div>
  );
};

type FieldType = {
  username?: string;
  password?: string;
  rememberMe?: string;
};

export default Login;
