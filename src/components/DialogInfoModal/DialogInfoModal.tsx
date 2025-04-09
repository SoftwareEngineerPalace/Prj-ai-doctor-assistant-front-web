import React, { useEffect, useState } from "react";
import { message, Modal, Empty } from "antd";
import "./DialogInfoModal.less";
import {
  service_getDialogInfo,
  service_getCollectDialogInfo,
} from "@/service/business_service";
import { aliCloudLog } from "@/service/aliCloudLog";

const formatPhoneNumber = (phoneNumber: string): string => {
  if (phoneNumber.length === 11) {
    return phoneNumber.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2");
  }
  return phoneNumber;
};

function DialogInfoModal(props: any) {
  const {
    isDialogModalOpen,
    setIsDialogModalOpen,
    id,
    entrypoint = "collect",
  } = props;
  const [dialogInfo, setDialogInfo] = useState<any>([]);
  const [visitId, setVisitId] = useState("");
  const [phone, setPhone] = useState("");

  const getDialogInfo = async () => {
    try {
      let res: any;
      if (entrypoint === "collect") {
        res = await service_getCollectDialogInfo(id);
      } else {
        res = await service_getDialogInfo(id);
      }
      console.log("获取对话信息", res);
      aliCloudLog(
        `DialogInfoModal getDialogInfo: id=${id}, res=${JSON.stringify(res.data)}`,
      );
      if (res.status === 200) {
        if (res.data.code === 10000) {
          setDialogInfo(res.data.data.dialogues);
          setPhone(res.data.data.visitor_phone);
          setVisitId(res.data.data.visit_id);
        } else {
          message.error(res.data.msg);
        }
      }
    } catch (error) {
      console.log("获取对话信息 error=", error);
      aliCloudLog(
        `DialogInfoModal getDialogInfo: id=${id}, error=${JSON.stringify(error)}`,
        "error",
      );
    }
  };

  useEffect(() => {
    if (isDialogModalOpen) {
      getDialogInfo();
    }
  }, [isDialogModalOpen]);

  return (
    <Modal
      title={null}
      footer={null}
      open={isDialogModalOpen}
      onOk={() => setIsDialogModalOpen(false)}
      onCancel={() => setIsDialogModalOpen(false)}
      centered
    >
      <div className="base-info">
        <h2>基础信息</h2>
        <>
          <p>登记号：{visitId || "————"}</p>
          <p>手机号：{(phone && formatPhoneNumber(phone)) || "————"}</p>
        </>
      </div>
      <div className="dialog-info">
        <h2>对话信息</h2>
        <div className="dialog-info-list">
          {dialogInfo && dialogInfo.length > 0 ? (
            dialogInfo.map((item: any, index: number) => (
              <>
                {item.content && (
                  <div
                    key={index + Math.random()}
                    className={`dialog-item ${item.role === "doctor" ? "doctor" : "patient"}`}
                  >
                    {item.role === "doctor" && <div className="avatar">AI</div>}
                    <span className="dialog-content">{item.content}</span>
                    {item.role === "patient" && (
                      <div className="avatar">患</div>
                    )}
                  </div>
                )}
              </>
            ))
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={"暂无对话信息"}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

export default DialogInfoModal;
