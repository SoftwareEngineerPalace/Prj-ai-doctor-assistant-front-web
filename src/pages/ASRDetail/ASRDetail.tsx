import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Card } from "antd";
import { LeftOutlined } from "@ant-design/icons";
import "./ASRDetail.less";
import DetailChatSession from "@/components/DetailChatSession";
import {
  service_getTaskDetail,
  service_getDetailJson,
} from "@/service/business_service";
import { aliCloudLog } from "@/service/aliCloudLog";
import { AuthContext } from "@/state/auth/authContext";
function ASRDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [visitId, setVisiteId] = useState("暂无");

  const [chatList, setChatList] = useState<any[]>([]);
  const [, setDetail] = useState<any>({});
  // 获取当前 URL 的 protocol 和 hostname
  const websiteBaseUrl = `${window.location.protocol}//${window.location.hostname}`;

  const { state } = useContext(AuthContext);

  useEffect(() => {
    const getDetail = async () => {
      const searchParams = new URLSearchParams(location.search);
      const task_id: string = searchParams.get("id") as string;
      try {
        const rsp = await service_getTaskDetail(task_id);

        const url = rsp.data.data.stt_asr_rst_json_file_url.replace(
          "{{website}}",
          websiteBaseUrl,
        );
        setDetail(rsp.data.data);
        setVisiteId(rsp.data.data.visit_id);

        try {
          const jsonRsp = await service_getDetailJson(url.replace("191", "31"));
          const list = jsonRsp.data.map((v: any) => {
            return { channel: v[1], text: v[2].text, time: v[2].start };
          });
          // setChatList(list.slice(0, 8));
          setChatList(list);
        } catch (error) {
          console.log("🚀 ~ getDetail ~ error:", error);
          aliCloudLog(
            `Detail页面 service_getDetailJson error: ${error}` +
              state.accountName,
          );
        }
      } catch (error) {
        console.log("🚀 ~ getDetail ~ error:", error);
        aliCloudLog(
          `Detail页面 service_getDetail error: ${error}` + state.accountName,
        );
      }
    };
    getDetail();
  }, []);

  const navigateBack = () => {
    navigate("/application/asrList");
  };

  // const download = React.useCallback(() => {
  //     const file = transformRecord(detail);
  //     downloadRecordFile(file);
  // }, [detail]);

  return (
    <div className="detail-wrapper">
      <div className="detail-wrapper__inner">
        <div className="detail-wrapper__header">
          <div className="left-group">
            <Button icon={<LeftOutlined />} onClick={navigateBack}>
              退出
            </Button>
            <span className="title-visit-id">登录号:</span>
            <span className="visit-id">{visitId}</span>
          </div>
          {/* <Button type="primary" className='btn-download' icon={<DownloadOutlined />} onClick={download}>下载</Button> */}
        </div>

        <Card
          className="card-detail"
          styles={{ body: { height: "100%", padding: "0px" } }}
        >
          <DetailChatSession
            chatList={chatList}
            isDetailMode={true}
          ></DetailChatSession>
        </Card>
      </div>
    </div>
  );
}

export default ASRDetail;
