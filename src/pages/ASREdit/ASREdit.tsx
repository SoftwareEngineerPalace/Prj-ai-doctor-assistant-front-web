import React, { useEffect, useState, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Card,
  Modal,
  ConfigProvider,
  Spin,
  message,
  Empty,
  Upload,
  Image,
} from "antd";
import { LeftOutlined, CloseOutlined, UploadOutlined } from "@ant-design/icons";
import "./ASREdit.less";
import EditChatSession from "@/components/EditChatSession";
import DetailChatSession from "@/components/DetailChatSession";
import {
  service_getTaskDetail,
  service_getDialoguesContent,
  service_updateTaskContent,
  service_generateMedicalRecord,
  service_updateAsrRstEditStatus,
  service_getMedicalImageList,
  service_getMedicalImageUploadUrl,
  service_changeChannelInfo,
  service_delMedicalImage,
} from "@/service/business_service";
import { debounce } from "lodash";
import { aliCloudLog } from "@/service/aliCloudLog";
import { AuthContext } from "@/state/auth/authContext";
import ASRDetailAudio from "@/components/ASRDetailAudio";
import { encryptFileSHA256 } from "@/utils/asrEditUtils";

function ASREdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const [visitId, setVisiteId] = useState("患者"); // 登记号

  const [currBtn, setCurrBtn] = useState(""); // 当前展示的按钮
  const [entrypoint, setEntrypoint] = useState("");
  const [editStatus, setEditStatus] = useState(); // 对话的编辑状态
  const [audioUrl, setAudioUrl] = useState("");
  const [saveTip, setSaveTip] = useState("");
  const isChange = useRef(false);
  const [chatList, setChatList] = useState<any>(null);
  const [, setDetail] = useState<any>({});
  const searchParams = new URLSearchParams(location.search);
  const taskId: string = searchParams.get("id") as string;
  const [loading, setLoading] = useState(false);
  const { state } = useContext(AuthContext) as any;
  const [currOperateData, setCurrOperateData] = useState<any>(null);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(
    null,
  );
  const [channelInfo, setChannelInfo] = useState<any>(null);
  const timeoutRef = useRef<any>(null);
  const [audioIsloading, setAudioIsLoading] = useState(true);
  const [isImageListLoading, setIsImageListLoading] = useState(false);
  const [medicalImageList, setMedicalImageList] = useState<any>([]);
  const dialoguesCradRef = useRef<any>(null);
  const [audioCardWidth, setAudioCardWidth] = useState();
  const [fileList, setFileList] = useState<any[]>([]);

  const getDetail = async () => {
    try {
      const rsp = await service_getTaskDetail(taskId);
      console.log("ASREdit-获取转录编辑任务详情:", rsp);
      if (rsp.status === 200) {
        if (rsp.data.code === 10000) {
          setDetail(rsp.data.data);
          setVisiteId(rsp.data.data.visit_id);
          setAudioUrl(rsp.data.data.stt_audio_mp3_file_url);
          // setAudioUrl('https://bfh-interpreter.zhilanmed.com/offline-stt-task/14324522/1918/1727086551584/14324522_1918_48000_16_2.mp3'); // 测试
          setEditStatus(rsp.data.data.asr_rst_edit_status);
          setChannelInfo(rsp.data.data.role_channel_info);
        }
        aliCloudLog(
          `ASREdit页面 getDetail 
                    taskId=${taskId}, 
                    response.data.data=${JSON.stringify(rsp?.data?.data)},` +
            state.accountName,
        );
      }
    } catch (error) {
      console.error("🚀 ~ getDetail ~ error:", error);
      aliCloudLog(
        `ASREdit页面 getDetail error: ${JSON.stringify(error)}` +
          state.accountName,
      );
    }
  };

  const getDialoguesContent = async () => {
    try {
      const response = await service_getDialoguesContent(taskId);
      console.log("获取对话内容:", response);
      if (response.status === 200) {
        const doctorDialogues =
          response.data.data.dialogues.map((e: any) => {
            e.isPlaying = false;
            return e;
          }) || [];
        setChatList([...doctorDialogues]);
        aliCloudLog(
          `ASREdit页面 getDialoguesContent 
                    taskId=${taskId}, 
                    response.data.data=${JSON.stringify(response?.data?.data)},` +
            state.accountName,
        );
      } else {
        message.error("获取对话内容失败");
        aliCloudLog(
          `ASREdit页面 getDialoguesContent 获取对话内容失败 response: ${JSON.stringify(response)}`,
          state.accountName,
        );
      }
    } catch (error) {
      console.log("🚀 ~ getDialoguesContent~ error:", error);
      aliCloudLog(
        `ASREdit页面 getDialoguesContent error: ${JSON.stringify(error)}` +
          state.accountName,
      );
    }
  };

  const getMedicalImageList = async () => {
    try {
      setIsImageListLoading(true);
      const res = await service_getMedicalImageList(Number(taskId));
      console.log("获取病历图片列表getMedicalImageList res:", res);
      if (res.status === 200 && res.data.code === 10000) {
        setMedicalImageList(res.data.data);
      }
    } catch (error) {
      console.log("获取病历图片列表getMedicalImageList error:", error);
    } finally {
      setIsImageListLoading(false);
    }
  };

  const updateTaskConent = async (isSubmit = false) => {
    try {
      const response = await service_updateTaskContent(taskId, chatList);
      console.log("updateTaskContent response:", response);
      if (response.status === 200) {
        if (isSubmit) {
          await handleGenerateMedicalRecord();
        } else {
          setSaveTip("内容已保存");
        }
        aliCloudLog(
          `ASREdit页面 updateTaskConent 
                    taskId=${taskId}, 
                    chatList=${chatList},
                    response=${JSON.stringify(response)},` + state.accountName,
        );
      } else {
        message.error("更新对话内容失败");
        aliCloudLog(
          `ASREdit页面 updateTaskConent 更新对话内容失败 response: ${JSON.stringify(response)}`,
          state.accountName,
        );
      }
    } catch (error) {
      console.error("updateTaskContent error:", error);
      aliCloudLog(
        `ASREdit页面 updateTaskContent error: ${JSON.stringify(error)}` +
          state.accountName,
      );
    }
  };

  const handleGenerateMedicalRecord = async () => {
    try {
      const response = await service_generateMedicalRecord(taskId);
      console.log("generateMedicalRecord response:", response);
      if (response.status === 200) {
        message.success("病历已生成");
        aliCloudLog(
          `ASREdit页面 handleGenerateMedicalRecord 
                    taskId=${taskId}, 
                    response=${JSON.stringify(response)},` + state.accountName,
        );
        navigate(
          "/application/medicalRecordDetail?taskId=" +
            response.data.data.task_id,
          { replace: true },
        );
      } else {
        message.error("病历生成失败");
        aliCloudLog(
          `ASREdit页面 handleGenerateMedicalRecord 病历生成失败 response: ${JSON.stringify(response)}` +
            state.accountName,
        );
      }
      setLoading(false);
    } catch (error) {
      console.error("generateMedicalRecord error:", error);
      message.error("病历生成失败");
      aliCloudLog(
        `ASREdit页面 handleGenerateMedicalRecord error: ${JSON.stringify(error)}` +
          state.accountName,
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    const entrypoint: string = searchParams.get("entrypoint") as string;
    setEntrypoint(entrypoint);
    getDetail();
    getDialoguesContent();
    getMedicalImageList();
  }, []);

  // 监听 resize 事件，动态设置音频区域的宽度
  useEffect(() => {
    const handleResize = () => {
      if (dialoguesCradRef.current) {
        const width = dialoguesCradRef.current.offsetWidth;
        setAudioCardWidth(width);
        console.log("问诊卡片元素宽度:", width);
      }
    };

    // 初始获取宽度
    handleResize();

    // 添加 resize 事件监听器
    window.addEventListener("resize", handleResize);

    // 清理事件监听器
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (entrypoint === "check") {
      if (editStatus === 4) {
        setCurrBtn("edit");
      } else {
        setCurrBtn("");
      }
    } else if (entrypoint === "edit") {
      if (editStatus === 4) {
        navigate(`/application/asrEdit?id=${taskId}&entrypoint=check`);
      } else {
        setCurrBtn("submit");
      }
    }
  }, [editStatus, entrypoint]);

  const debouncedUpdateTaskContent = debounce(() => {
    updateTaskConent();
    setSaveTip("内容已保存");
  }, 1000);

  useEffect(() => {
    if (isChange.current) {
      if (chatList.length > 0) {
        setSaveTip("正在保存...");
        debouncedUpdateTaskContent();
      }
    }

    // 在组件卸载时清除防抖函数
    return () => debouncedUpdateTaskContent.cancel();
  }, [chatList]);

  const navigateBack = () => {
    navigate("/application/asrList");
  };

  const handleChatListUpdate = (updatedChatList: any[]) => {
    isChange.current = true;
    setChatList([...updatedChatList]);
  };

  const onsubmit = async () => {
    Modal.confirm({
      title: "提示",
      content: "提交后会根据内容自动生成一份病历，确认提交吗？",
      okText: "确定",
      cancelText: "取消",
      centered: true,
      onOk: async () => {
        setLoading(true);
        console.log("确认提交", chatList);
        aliCloudLog(
          `ASREdit页面 onsubmit 
                    taskId=${taskId},
                    chatList=${chatList}` + state.accountName,
        );
        updateTaskConent(true);
      },
    });
  };

  const onAgainEdit = async () => {
    Modal.confirm({
      title: "提示",
      content: "重新编辑后原生成的病历会作废，确认重新编辑吗？",
      okText: "确定",
      cancelText: "取消",
      centered: true,
      onOk: async () => {
        console.log("确认重新编辑");
        aliCloudLog(
          `ASREdit页面 onAgainEdit 
                    taskId=${taskId},
                    chatList=${chatList}` + state.accountName,
        );
        await updateEditStatus();
      },
    });
  };

  const updateEditStatus = async () => {
    try {
      const res = await service_updateAsrRstEditStatus(taskId, 4);
      console.log(res);
      if (res.status === 200) {
        setCurrBtn("submit");
        aliCloudLog(
          `ASREdit页面 updateEditStatus 
                    taskId=${taskId}, 
                    response=${JSON.stringify(res)},` + state.accountName,
        );
      } else {
        message.error("更新编辑状态失败");
        aliCloudLog(
          `ASREdit页面 updateEditStatus 更新编辑状态失败 response: ${JSON.stringify(res)}` +
            state.accountName,
        );
      }
    } catch (error: any) {
      message.error(error.response.data["detail"]);
      aliCloudLog(
        `ASREdit页面 updateEditStatus error: ${JSON.stringify(error)}` +
          state.accountName,
      );
    }
  };

  const onGetPalyPauseData = (row: any, index: number) => {
    console.log("接收-对话点击播放数据：", row);
    if (currentPlayingIndex !== null && currentPlayingIndex !== index) {
      console.log("停止当前播放的音频", currentPlayingIndex);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // 停止当前播放的音频
      setChatList((prevList: any) =>
        prevList.map((item: any, idx: number) =>
          idx === currentPlayingIndex ? { ...item, isPlaying: false } : item,
        ),
      );
    }
    setCurrentPlayingIndex(index);
    const data = {
      role: row?.role,
      startTime: row?.start_ms / 1000,
      endTime: row?.end_ms / 1000,
      isPlaying: !row?.isPlaying,
    };
    setCurrOperateData(data);
    setChatList((prevList: any) =>
      prevList.map((item: any, idx: number) =>
        idx === index ? { ...item, isPlaying: !item.isPlaying } : item,
      ),
    );
  };

  const onChangeAreaPlay = () => {
    console.log(
      "onChangeAreaPlay currOperateData: ",
      currOperateData,
      "currentPlayingIndex=",
      currentPlayingIndex,
    );
    setChatList((prevList: any) =>
      prevList.map((item: any, idx: number) =>
        idx === currentPlayingIndex
          ? { ...item, isPlaying: !item.isPlaying }
          : item,
      ),
    );
    setCurrOperateData(null);
    setCurrentPlayingIndex(null);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("只支持上传图片文件");
      return false;
    }
    // 20兆
    const isLint = file.size / 1024 / 1024 < 20;
    if (!isLint) {
      message.error("图片尺寸过大，请选择合适尺寸的图片");
    }
    return isLint;
  };
  // const handleFileChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
  //     console.log('fileList=', newFileList);
  // };

  const handleCustomRequest = async (option: any) => {
    console.log("upload option=", option);
    try {
      const file_sha256 = await encryptFileSHA256(option.file);
      const file_type = option.file.type;
      const data = {
        filename: option.file.name,
        filecontent_sha256: file_sha256,
        filecontent_type: file_type,
      };
      const res = await service_getMedicalImageUploadUrl(Number(taskId), data);
      console.log("获取上传地址 response:", res);
      if (res.status === 200 && res.data.code === 10000) {
        const uploadResponse = await fetch(res.data.data.upload_oss_url, {
          method: "PUT",
          body: option.file,
        });
        console.log("put图片到上传地址 response:", uploadResponse);
        if (!uploadResponse.ok) {
          message.error(`"${data?.filename}"上传失败`);
        } else {
          message.success(`"${data?.filename}"上传成功`);
          getMedicalImageList();
        }
        if (option.onSuccess) option.onSuccess(uploadResponse, option.file);
      } else {
        message.error(res.data.msg || "获取上传地址失败");
      }
    } catch (error: any) {
      console.error("上传病历 error：", error);
      message.error(error.response.data["detail"] || "上传过程中发生错误");
      if (option.onError) option.onError(error);
    }
  };
  const handleDeleteImage = async (img_id: string) => {
    Modal.confirm({
      title: `确定删除该图片吗？`,
      okText: "确定",
      okType: "danger",
      cancelText: "取消",
      centered: true,
      onOk: async () => {
        try {
          const res = await service_delMedicalImage(
            Number(taskId),
            Number(img_id),
          );
          console.log("ASREdit页面 handleDeleteImage response:", res);
          if (res.status === 200 && res.data.code === 10000) {
            message.success("删除成功");
            getMedicalImageList();
          } else {
            message.error(res.data?.msg || "删除失败");
          }
        } catch (error) {
          console.log("ASREdit页面 handleDeleteImage error:", error);
        }
      },
    });
  };

  const onChangeChannel = debounce(async () => {
    try {
      const data = {
        doctor_channel: channelInfo.patient_channel,
        patient_channel: channelInfo.doctor_channel,
      };
      const res = await service_changeChannelInfo(Number(taskId), data);
      console.log("ASREdit页面 一键换位 onChangeChannel response:", res);
      if (res.status === 200 && res.data.code === 10000) {
        setChannelInfo(res.data?.data?.role_channel_info);
      } else {
        message.error(res.data.msg || "一键换位失败");
      }
    } catch (error) {
      console.log("ASREdit页面 一键换位 onChangeChannel error:", error);
    }
  }, 500);

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#339352" } }}>
      <div className="edit-wrapper">
        <div className="edit-wrapper__header">
          <div className="left-group">
            <Button icon={<LeftOutlined />} onClick={navigateBack}>
              退出
            </Button>
          </div>
          <div>
            {currBtn == "edit" && (
              <Button type="primary" onClick={onAgainEdit}>
                重新编辑
              </Button>
            )}
            {currBtn == "submit" && (
              <>
                <span style={{ marginRight: "16px", color: "#000" }}>
                  {saveTip}
                </span>
                <Button type="primary" loading={loading} onClick={onsubmit}>
                  提交
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="edit-wrapper__inner">
          {/* 顶部信息和音频区域 */}
          <div className="audio_wrapper">
            <div className="audio_detail">
              <span style={{ marginBottom: 8 }}>就诊方式：住院</span>
              <span>登记号：{visitId}</span>
            </div>
            <div className="audio_play" style={{ width: audioCardWidth }}>
              {audioUrl ? (
                <ASRDetailAudio
                  audioUrl={audioUrl}
                  channelInfo={channelInfo}
                  timeoutRef={timeoutRef}
                  currentOperateData={currOperateData}
                  onChangeAreaPlay={onChangeAreaPlay}
                  onLoadingComplete={(loading: boolean) =>
                    setAudioIsLoading(loading)
                  }
                />
              ) : (
                <Spin tip="加载中...">
                  <div style={{ padding: 50 }}></div>
                </Spin>
              )}
            </div>
          </div>
          <div className="card-detail-wrapper">
            <Card
              title={currBtn == "submit" ? "病历上传" : "病历图片"}
              className="medical-card"
              styles={{ body: { height: "100%", padding: 0 } }}
            >
              <div className="medical-card-body">
                {currBtn == "submit" && (
                  <Upload
                    multiple
                    listType="text"
                    beforeUpload={beforeUpload}
                    customRequest={handleCustomRequest}
                    // 期望成功之后，不显示上传列表
                    fileList={fileList}
                    onChange={({ fileList }) => {
                      // 过滤掉已上传完成的文件
                      const filteredList = fileList.filter(
                        (file) => file.status !== "done",
                      );
                      setFileList(filteredList);
                    }}
                    onRemove={(file) => {
                      setFileList((prevList) =>
                        prevList.filter((item) => item.uid !== file.uid),
                      );
                      return true;
                    }}
                  >
                    <Button type="primary" icon={<UploadOutlined />}>
                      上传病历图片
                    </Button>
                  </Upload>
                )}
                {isImageListLoading ? (
                  <Spin tip="加载中...">
                    <div style={{ padding: 50 }}></div>
                  </Spin>
                ) : (
                  <>
                    {medicalImageList?.length > 0 ? (
                      <>
                        <div className="medical-image-list">
                          {medicalImageList?.map((item: any) => {
                            return (
                              <div className="image-wrapper" key={item?.id}>
                                <Image src={item?.preview_url} />
                                {currBtn === "submit" && (
                                  <CloseOutlined
                                    className="del-button"
                                    onClick={() => handleDeleteImage(item?.id)}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        {entrypoint === "check" && (
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={"暂无病历图片"}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </Card>
            <Card
              ref={dialoguesCradRef}
              title={"问诊语音转写"}
              className="dialogue-card"
              styles={{
                body: { height: "100%", padding: 0, paddingBottom: 48 },
              }}
              extra={
                currBtn == "submit" ? (
                  <Button type="primary" onClick={onChangeChannel}>
                    一键换位
                  </Button>
                ) : null
              }
            >
              {chatList ? (
                <>
                  {chatList.length > 0 ? (
                    currBtn === "submit" ? (
                      <EditChatSession
                        channelInfo={channelInfo}
                        onChatListUpdate={handleChatListUpdate}
                        visitId={visitId}
                        chatList={chatList}
                        isDetailMode={true}
                        audioIsloading={audioIsloading}
                        onGetPalyPauseData={onGetPalyPauseData}
                      />
                    ) : (
                      <DetailChatSession
                        channelInfo={channelInfo}
                        audioIsloading={audioIsloading}
                        onGetPalyPauseData={onGetPalyPauseData}
                        chatList={chatList}
                        isDetailMode={true}
                      />
                    )
                  ) : (
                    <div
                      style={{
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Empty
                        description={"未识别出信息，请重新转录或联系工作人员"}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    </div>
                  )}
                </>
              ) : (
                <Spin tip="加载中...">
                  <div style={{ padding: 50 }}></div>
                </Spin>
              )}
            </Card>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}

export default ASREdit;
