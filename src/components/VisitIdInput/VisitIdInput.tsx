import { Button, Input, Select, message, Form, Checkbox } from "antd";
import type { CheckboxProps } from "antd";
import React, { useContext, useState, useEffect, useRef } from "react";
import "./VisitIdInput.less";
import { RecordContext, WsState } from "../../state/record/recordContext";
import { AuthContext } from "../../state/auth/authContext";
import {
  service_createMedicalRecord,
  service_updateMedicalRecordInfoByMvid,
} from "../../service/business_service";
import { aliCloudLog } from "../../service/aliCloudLog";
import CollectInfoListModal from "../../components/CollectInfoListModal/CollectInfoListModal";

const VisitIdInput = (props: any) => {
  type FieldType = {
    vtype?: string;
    vid?: string;
    check?: boolean;
  };

  const [form] = Form.useForm();
  const {
    visitid,
    setVisitid,
    visittype,
    setVisittype,
    wsState,
    setWsState,
    mvid,
    setMvid,
    isRecordReady,
  } = useContext(RecordContext) as any;
  const { state } = useContext(AuthContext) as any;
  const { machineCode } = state;
  const [loadings, setLoadings] = useState<boolean>(false); // 按钮加载中
  const [checked, setChecked] = useState(false);
  const label = `${checked ? "已关联采集信息" : "关联采集信息"}`;
  const [isCollectInfoListModalOpen, setIsCollectInfoListModalOpen] =
    useState(false);
  const { mvInquiryId, setMvInquiryId, setConnectCollectInfo } = props;
  const mvInquiryIdRef = useRef(-1);
  const mvidRef = useRef(-1);
  const machineCodeRef = useRef("");

  useEffect(() => {
    form.setFieldsValue({
      vid: visitid,
      vtype: visittype,
      check: mvInquiryId > 0,
    });
    setChecked(mvInquiryId > 0);
    machineCodeRef.current = machineCode;
  }, [visitid, visittype, mvInquiryId, machineCode]);

  useEffect(() => {
    mvInquiryIdRef.current = mvInquiryId;
    mvidRef.current = mvid;
  }, [mvInquiryId, mvid]);

  useEffect(() => {
    console.log("VisitInput useEffect:", isRecordReady);
    if (wsState === WsState.open) {
      if (isRecordReady) {
        setLoadings(false);
        // 注册成功后变灰且不可编辑
        props.setIsEditable(false);
      }
    } else {
      setLoadings(false);
      setWsState(WsState.default);
    }
    if (isRecordReady) {
      // 开始计时
      props.onStartTimer();
    }
  }, [wsState, isRecordReady]);

  const handleInputChange = (event: any) => {
    setVisitid(event.target.value); // 输入框内容变化时，更新inputid状态
  };

  const createMedicalRecord = async (
    visit_id: string,
    visit_type: number,
    audiofile_machine_id: string,
    mv_inquiry_id: number,
  ) => {
    try {
      const res: any = await service_createMedicalRecord(
        visit_id,
        visit_type,
        audiofile_machine_id,
        mv_inquiry_id,
      );
      console.log("RecordBoard VisitIdInput createMedicalRecord res:", res);
      if (res.data.code === 10000) {
        const { mvid: _mvid } = res.data.data;
        setMvid(_mvid);
        mvidRef.current = _mvid;
      } else {
        const errMsg = res.data.msg;
        aliCloudLog(
          `RecordBoard VisitIdInput createMedicalRecord error ${JSON.stringify(errMsg)} ` +
            state.accountName,
        );
      }
    } catch (error) {
      aliCloudLog(
        `RecordBoard VisitIdInput createMedicalRecord error ${JSON.stringify(error)} ` +
          state.accountName,
      );
    }
  };

  const updateMedicalRecordInfoByMvid = async (
    mvid: string,
    is_confirmed: boolean,
    audiofile_local_path: string,
    record_status: string,
  ) => {
    try {
      const res: any = await service_updateMedicalRecordInfoByMvid(
        mvid,
        is_confirmed,
        audiofile_local_path,
        record_status,
      );
      console.log(
        "RecordBoard VisitIdInput updateMedicalRecordInfoByMvid:",
        res,
      );
      if (res.data.code !== 10000) {
        aliCloudLog(
          `RecordBoard VisitIdInput updateMedicalRecordInfoByMvid error ${JSON.stringify(res)} ` +
            state.accountName,
        );
      }
    } catch (error) {
      aliCloudLog(
        `RecordBoard VisitIdInput updateMedicalRecordInfoByMvid error ${JSON.stringify(error)} ` +
          state.accountName,
      );
    }
  };

  const handleRegisterClick = async () => {
    try {
      // 表单验证
      const values = await form.validateFields();
      console.log("vaules:", values);
      setLoadings(true);

      // 1.创建录音记录
      await createMedicalRecord(
        visitid,
        visittype,
        machineCodeRef.current,
        mvInquiryIdRef.current,
      );
      // 2.进行ws连接
      try {
        await props.onWsConnet();
        console.log("WebSocket connected successfully.");

        // 开始录音 收发消息
        console.log("VisitIdInput mvid:", mvid);
        props.onStartRecord();
        console.log(
          "VisitInput handleRegisterClick isRecordReady:",
          isRecordReady,
        );
      } catch (error) {
        console.error("WebSocket connection failed:", error);
        await updateMedicalRecordInfoByMvid(
          mvidRef.current.toString(),
          false,
          "",
          "failed",
        );
      }
    } catch (error: any) {
      setLoadings(false);
      const msg = error.response?.data?.detail;
      if (msg) message.error(msg);
    }
  };

  const handleTypeChange = (value: any) => {
    console.log("🚀 ~ onVisitTypeChange ~ val:", value);
    setVisittype(value);
  };

  const onCheckboxChange: CheckboxProps["onChange"] = (e) => {
    console.log("onChange e:", e);
    console.log("checked = ", e.target.checked);
    const newChecked = e.target.checked;
    // 执行不同操作
    if (newChecked !== checked) {
      if (newChecked) {
        // 从 false 变为 true，执行的操作
        console.log("执行从 false 变为 true 的操作");
        setIsCollectInfoListModalOpen(true);
      } else {
        // 从 true 变为 false，执行的操作
        console.log("执行从 true 变为 false 的操作");
        setMvInquiryId(-1);
        setConnectCollectInfo({});
      }
    }
    setChecked(newChecked);
  };

  return (
    <>
      <Form
        className="visitinput"
        form={form}
        initialValues={{
          vtype: 1, // 设置就诊方式初始值为 '门诊'
        }}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
      >
        <div className="items-container">
          <Form.Item<FieldType>
            name="vtype"
            label="就诊方式"
            rules={[{ required: true, message: "请选择就诊方式" }]}
          >
            <Select
              className="typeselect"
              placeholder="请选择就诊方式"
              disabled={!props.isEditable}
              onChange={handleTypeChange}
              style={{ textAlign: "center" }}
              dropdownStyle={{ textAlign: "center" }}
              options={[
                { label: "门诊", value: 1 },
                { label: "住院", value: 2 },
              ]}
              value={visittype}
            />
          </Form.Item>

          <Form.Item<FieldType>
            name="vid"
            label="登记号"
            rules={[
              { required: true, message: "请输入登记号" },
              { pattern: /^\d{8}$/, message: "请输入8位数字的登记号" },
            ]}
          >
            <Input
              className="input-field"
              placeholder="请输入8位数字登记号"
              value={visitid} // 设置输入框的值为inputid状态
              onChange={handleInputChange} // 添加onChange事件处理器
              disabled={!props.isEditable}
              allowClear
              style={{ textAlign: "center" }}
            />
          </Form.Item>

          <Form.Item
            name="check"
            wrapperCol={{ span: 24 }}
            style={{ textAlign: "center" }}
          >
            <Checkbox
              checked={checked}
              disabled={!props.isEditable}
              onChange={onCheckboxChange}
            >
              {label}
            </Checkbox>
          </Form.Item>

          <Form.Item wrapperCol={{ span: 24 }}>
            <div className="buttons">
              <Button
                className="register-button"
                disabled={!props.isEditable}
                loading={loadings}
                onClick={handleRegisterClick}
              >
                确定并开始录音
              </Button>
            </div>
          </Form.Item>
        </div>
      </Form>
      <CollectInfoListModal
        isCollectInfoListModalOpen={isCollectInfoListModalOpen}
        setIsCollectInfoListModalOpen={setIsCollectInfoListModalOpen}
        setChecked={setChecked}
        setMvInquiryId={setMvInquiryId}
        visitid={visitid}
        setConnectCollectInfo={setConnectCollectInfo}
      />
    </>
  );
};

export default VisitIdInput;
