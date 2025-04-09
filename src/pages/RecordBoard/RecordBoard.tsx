import { Button, Card, Modal, Divider } from "antd";
import React, { useContext, useEffect, useRef, useState } from "react";
import "./RecordBoard.less";
import { LeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import VisitidInput from "../../components/VisitIdInput/VisitIdInput";
import Recorder from "../../components/Recorder";
import RecordBoardWave from "@/components/RecordBoardWave";
import CollectInfoCard from "@/components/CollectInfoCard";
import {
  RecordContext,
  RecordState,
  WsState,
} from "@/state/record/recordContext";
import { AuthContext } from "../../state/auth/authContext";
import { formatTime } from "../../utils/timeUtil";
import { RecordWebSocket } from "@/service/recordWebSocket";
import {
  service_getMedicalRecordInfoByMvid,
  service_updateMedicalRecordInfoByMvid,
} from "../../service/business_service";
import { service_getMedicalRecordLastSegment } from "../../service/local_server_service";
import { aliCloudLog } from "../../service/aliCloudLog";

function RecordBoard() {
  const navigate = useNavigate();
  const {
    recordState,
    setRecordState,
    visitid,
    setVisitid,
    mvid,
    setMvid,
    setVisittype,
    setWsState,
    isRecordReady,
    setIsRecordReady,
  } = useContext(RecordContext) as any;
  const { state } = useContext(AuthContext) as any;
  const { hospital, doctorId, os } = state;
  const { hsid } = hospital;
  const params = new URLSearchParams(window.location.search);

  const wsRef = React.useRef<RecordWebSocket | null>(null);
  const audioContextRef = useRef<any>();
  const [isLoadingBtnShow, setIsLoadingBtnShow] = useState(false);
  const [queryUrlParmas, setQueryUrlParams] = useState({
    recordStatus: "",
    mvid: "",
  });
  const [isEditable, setIsEditable] = useState(true); // 控制输入框的可编辑状态
  const [mvInquiryId, setMvInquiryId] = useState(-1);

  // record计时器
  const [duration, setDuration] = useState(0);
  const [timerId, setTimerId] = useState(null);

  const [audioLocalPath, setAudioLocalPath] = useState("");
  const [, setAudiofileMachineId] = useState("");
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>();
  const [connectCollectInfo, setConnectCollectInfo] = useState({});

  const mvidRef = useRef("");
  const audioLocalPathRef = useRef("");

  useEffect(() => {
    console.log("RecordBoard", { mvid, audioLocalPath });
    mvidRef.current = mvid;
    audioLocalPathRef.current = audioLocalPath;
  }, [mvid, audioLocalPath]);

  // 判断是 创建录音or 继续录音
  useEffect(() => {
    const recordStatus = params.get("recordStatus");
    const _mvid = params.get("mvid") || "";
    if (recordStatus === "create") {
      setQueryUrlParams({
        recordStatus: "create",
        mvid: "",
      });
    } else if (recordStatus === "resume") {
      setQueryUrlParams({
        recordStatus: "resume",
        mvid: _mvid,
      });
      if (_mvid !== "") setMvid(_mvid);
      resumeRecordInit(_mvid);
    }
  }, []);

  useEffect(() => {
    // 页面关闭或刷新前执行异步操作
    const handleBeforeUnload = async (event: any) => {
      if (recordState === RecordState.RECORDING) {
        event.preventDefault(); // 阻止默认行为，提示用户
        event.returnValue = "录音保存中..."; // 设置提示消息（不影响异步操作的执行）
        await pauseRecord();
        // 启动异步操作，但不等待其完成
        // setTimeout(pauseRecord, 0); // 延迟执行异步操作
      }
    };

    // 注册事件监听器
    window.addEventListener("beforeunload", handleBeforeUnload);

    // 清理函数
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [recordState]);

  // 继续录音-进入初始化
  const resumeRecordInit = async (_mvid: string) => {
    setIsEditable(false);
    console.log("RecordBoard resumeRecordInit _mvid:", _mvid);
    try {
      const res: any = await service_getMedicalRecordInfoByMvid(_mvid);
      console.log("RecordBoard resumeRecordInit res:", res);
      if (res.data.code === 10000) {
        const {
          mvid,
          visit_id,
          visit_type,
          audiofile_local_path,
          mv_inquiry_id,
          visitor_phone,
          visitor_name,
          visitor_gender,
          visitor_birth,
        } = res.data.data;
        setVisitid(visit_id);
        setVisittype(visit_type);
        setRecordState(RecordState.PAUSED);
        setAudioLocalPath(audiofile_local_path);
        setMvid(mvid);
        setMvInquiryId(mv_inquiry_id);
        const info = {
          visitor_phone,
          visitor_name,
          visitor_gender,
          visitor_birth,
        };
        setConnectCollectInfo(info);
        await getMedicalRecordLastSegment(audiofile_local_path);
      }
    } catch (error) {
      aliCloudLog(
        `RecordBoard resumeRecordInit error ${JSON.stringify(error)} ` +
          state.accountName,
      );
    }
  };

  // 继续录音-获取最后一节音频片段
  const getMedicalRecordLastSegment = async (audiofile_local_path: string) => {
    try {
      const res: any =
        await service_getMedicalRecordLastSegment(audiofile_local_path);
      console.log("RecordBoard getMedicalRecordLastSegment res:", res);
      if (res.data.code === 10000) {
        const { audio_data_base64, total_duration_ms } = res.data.data;
        if (total_duration_ms > 0) {
          base64String2AudioBuffer(audio_data_base64);
          setDuration(Math.floor(total_duration_ms / 1000));
        } else {
          console.error("RecordBoard getMedicalRecordLastSegment res:", res);
        }
      }
    } catch (error) {
      aliCloudLog(
        `RecordBoard getMedicalRecordLastSegment error ${JSON.stringify(error)} ` +
          state.accountName,
      );
    }
  };

  // 继续录音-将最后一节音频片段转为audiobuffer显示
  const base64String2AudioBuffer = (audio_data_base64: string) => {
    const binaryString = atob(audio_data_base64);
    const buffer = new ArrayBuffer(binaryString.length);
    const dataView = new DataView(buffer);
    for (let i = 0; i < binaryString.length; i++) {
      dataView.setUint8(i, binaryString.charCodeAt(i));
    }
    const int16Array = new Int16Array(buffer);
    onPcmMessageCallback(int16Array);
  };

  // 计时器-开始
  const startTimer = React.useCallback(() => {
    console.log("RecordBoard startTimer isRecordReady:", isRecordReady);
    if (isRecordReady) {
      console.log("RecordBoard startTimer");
      const id = setInterval(() => {
        setDuration((duration) => duration + 1);
      }, 1000);
      setTimerId(id);
    }
  }, [duration, isRecordReady]);

  // 计时器-清除
  const clearTimer = () => {
    // console.log('RecordBoard clearTimer')
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
  };

  // websocket连接
  const onWsConnet = async () => {
    return new Promise((resolve, reject) => {
      console.log("Record start connecting");
      wsRef.current = new RecordWebSocket({
        msgHandle: (msg: any) => {
          onMessageCallback(msg);

          if (msg.mtype === "audio_start") {
            console.log("audio_start");
            setIsRecordReady(true);
            setIsLoadingBtnShow(false);
            if (queryUrlParmas?.recordStatus === "create") {
              const currentUrl = new URL(window.location.href);
              currentUrl.searchParams.set("recordStatus", "resume");
              currentUrl.searchParams.set("mvid", `${mvidRef.current}`);
              window.history.replaceState({}, "", currentUrl);
            }
          }

          if (msg.mtype === "red_end") {
            setIsRecordReady(false);
          }
        },
        pcmHandle: (msg: any) => {
          onPcmMessageCallback(msg);
        },
        stateHandle: (state: any, e: any) => {
          console.log("RecordWebSocket stateHandle state=", state, e);
          if (state === "open") {
            setWsState(WsState.open);
          } else if (state === "error") {
            setIsRecordReady(false);
            setWsState(WsState.error);
            clearTimer();
          } else if (state === "close") {
            console.log("close e.code 1:", e.code);
            clearTimer();
            setIsLoadingBtnShow(false);
            setWsState(WsState.close);
            setIsRecordReady(false);
            if (e.code !== 1000) {
              Modal.warning({
                content: `录音服务异常，请稍后重试: ${e.reason}`,
                okText: "确认",
                okButtonProps: {
                  type: "primary",
                  style: { backgroundColor: "#339352" },
                },
                onOk: () => {
                  if (audioLocalPathRef.current) {
                    pauseRecord();
                  } else {
                    stopRecord();
                    // updateMedicalRecordInfoByMvid(mvidRef.current, false, audioLocalPathRef.current, 'failed');
                  }
                  setIsLoadingBtnShow(false);
                },
              });
            }
          }
        },
      });

      try {
        wsRef.current
          .wsStart()
          .then(() => {
            resolve("open");
          })
          .catch((error) => {
            console.log("WebSocket connection failed:", error);
            reject(error);
            // ...显示 Modal 警告的逻辑
          });
      } catch (error) {
        console.log("WebSocket connection failed:", error);
        reject(error);
        Modal.warning({
          content: "录音服务不可用，请稍后重试",
          okText: "确认",
          okButtonProps: {
            type: "primary",
            style: { backgroundColor: "#339352" },
          },
          onOk: () => {},
        });
      }
    });
  };

  const onMessageCallback = React.useCallback(
    async (message: any) => {
      console.log("🚀 ~ onMessageCallback ~ message:", message);
      if (message.mtype === "audiofile_local_path") {
        console.log("audiofile_local_path:", message.audiofile_local_path);
        await updateMedicalRecordInfoByMvid(
          mvidRef.current,
          true,
          message.audiofile_local_path,
          "in_progress",
        );
        audioLocalPathRef.current = message.audiofile_local_path;
        setAudioLocalPath(message.audiofile_local_path);
        setAudiofileMachineId(message.audiofile_machine_id);
      }
    },
    [],
    // [chatList],
  );

  const onPcmMessageCallback = (pcmData: any) => {
    // 如果 AudioContext 已关闭或没有创建过，重新初始化
    if (
      !audioContextRef.current ||
      audioContextRef.current.state === "closed"
    ) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
    const float32Data = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      float32Data[i] = pcmData[i] / 32768; // 16-bit PCM 转换为 Float32（范围 [-1, 1]）
    }
    // console.log({ pcmData });
    const Audiobuffer = audioContextRef.current.createBuffer(
      2,
      float32Data.length / 2,
      48000,
    );
    const leftChannel = Audiobuffer.getChannelData(0);
    const rightChannel = Audiobuffer.getChannelData(1);
    for (let i = 0; i < float32Data.length / 2; i++) {
      leftChannel[i] = float32Data[i * 2];
      rightChannel[i] = float32Data[i * 2 + 1];
    }
    setAudioBuffer(Audiobuffer);
    audioContextRef.current.close();
  };

  // 开始录音
  const startRecord = async () => {
    aliCloudLog(`startRecord` + state.accountName);
    setRecordState(RecordState.RECORDING);
    const param = {
      mtype: "rec_start",
      st: Math.floor(new Date().getTime() / 1000),
      params: {
        hsid: hsid,
        doctor_id: doctorId,
        visit_id: visitid,
        mvid: mvidRef.current,
      },
      audio_spec: {
        channels: 2, // 声道数
        bitdepth: 16, // 位深
        byteorder: "be", // 字节流大端小端
        format_rate: 48000, // 采样率
        encoding_format: "pcm", // 编码格式
      },
    };
    console.log("RecordBoard startRecord param:", param);
    const jsonString = `10\t${JSON.stringify(param)}`;
    const byteArray = new Uint8Array(jsonString.length);
    for (let i = 0, len = jsonString.length; i < len; i++) {
      byteArray[i] = jsonString.charCodeAt(i);
    }
    wsRef.current?.wsSend(byteArray);
  };

  // 暂停录音
  const pauseRecord = async () => {
    setIsLoadingBtnShow(true);
    setIsEditable(false);
    setRecordState(RecordState.PAUSED);
    clearTimer();
    aliCloudLog(`pauseRecord` + state.accountName);
    const param = {
      mtype: "rec_end",
      st: Math.floor(new Date().getTime() / 1000),
    };
    const jsonString = `10\t${JSON.stringify(param)}`;
    const byteArray = new Uint8Array(jsonString.length);
    for (let i = 0, len = jsonString.length; i < len; i++) {
      byteArray[i] = jsonString.charCodeAt(i);
    }
    wsRef.current?.wsSend(byteArray);
    setIsRecordReady(false);
    await updateMedicalRecordInfoByMvid(
      mvidRef.current,
      true,
      audioLocalPathRef.current,
      "paused",
    );
  };

  // 继续录音
  const resumeRecord = async () => {
    setIsLoadingBtnShow(true);
    aliCloudLog(`resumeRecord` + state.accountName);
    await onWsConnet();
    const param = {
      mtype: "rec_continue",
      st: Math.floor(new Date().getTime() / 1000),
      audiofile_local_path: audioLocalPathRef.current,
      audio_spec: {
        channels: 2, // 声道数
        bitdepth: 16, // 位深
        byteorder: "be", // 字节流大端小端
        format_rate: 48000, // 采样率
        encoding_format: "pcm", // 编码格式
      },
    };
    const jsonString = `10\t${JSON.stringify(param)}`;
    const byteArray = new Uint8Array(jsonString.length);
    for (let i = 0, len = jsonString.length; i < len; i++) {
      byteArray[i] = jsonString.charCodeAt(i);
    }
    wsRef.current?.wsSend(byteArray);
    setRecordState(RecordState.RECORDING);
    await updateMedicalRecordInfoByMvid(
      mvidRef.current,
      true,
      audioLocalPathRef.current,
      "in_progress",
    );
  };

  // 结束录音
  const stopRecord = async () => {
    aliCloudLog(`stopRecord` + state.accountName);
    clearTimer();
    setRecordState(RecordState.STOPPED);
    const param = {
      mtype: "rec_end",
      st: Math.floor(new Date().getTime() / 1000),
    };
    const jsonString = `10\t${JSON.stringify(param)}`;
    const byteArray = new Uint8Array(jsonString.length);
    for (let i = 0, len = jsonString.length; i < len; i++) {
      byteArray[i] = jsonString.charCodeAt(i);
    }
    wsRef.current?.wsSend(byteArray);
    setIsRecordReady(false);
    const rsp = await updateMedicalRecordInfoByMvid(
      mvidRef.current,
      true,
      audioLocalPathRef.current,
      "completed",
    );
    console.log("RecordBoard stopRecord rsp:", rsp);
    if (rsp.data.code === 10000) {
      navigate("/application/audioList");
    }
  };

  // 更新录音信息
  const updateMedicalRecordInfoByMvid = async (
    mvid: string,
    is_confirmed: boolean,
    audiofile_local_path: string,
    record_status: string,
  ) => {
    const res: any = await service_updateMedicalRecordInfoByMvid(
      mvid,
      is_confirmed,
      audiofile_local_path,
      record_status,
    );
    return res;
  };

  const onClickBtn = () => {
    if (recordState === RecordState.RECORDING) {
      Modal.warning({
        title: "正在录音中...",
        content: "请先暂停或结束录音后再退出页面",
        okText: "确认",
        okButtonProps: {
          type: "primary",
          style: { backgroundColor: "#339352" },
        },
        cancelButtonProps: {
          ghost: true,
          style: { color: "#339352", borderColor: "#339352" },
        },
        onOk: () => {},
      });
    } else {
      navigate("/application/audioList");
    }
  };

  return (
    <div className="recordboard-wrapper">
      <div className="record-wrapper__header">
        <div className="left-group">
          <Button
            className="btn-back"
            onClick={onClickBtn}
            icon={<LeftOutlined />}
          >
            退出
          </Button>
        </div>
      </div>
      <div className="record-wrapper__content">
        <div className="content-left">
          <Card className="card-userInput">
            <VisitidInput
              onWsConnet={onWsConnet}
              onStartRecord={startRecord}
              onStartTimer={startTimer}
              isEditable={isEditable}
              setIsEditable={setIsEditable}
              mvInquiryId={mvInquiryId}
              setMvInquiryId={setMvInquiryId}
              setConnectCollectInfo={setConnectCollectInfo}
            ></VisitidInput>
          </Card>
          {mvInquiryId > 0 && (
            <Card className="card-collectinfo">
              <CollectInfoCard connectCollectInfo={connectCollectInfo} />
            </Card>
          )}
        </div>

        <div className="content-right">
          <Card className="content-right-record">
            <Recorder
              onClickBtnPause={pauseRecord}
              onClickBtnResume={resumeRecord}
              onClickBtnStop={stopRecord}
              onClearTimer={clearTimer}
              duration={duration}
              onSetDuration={setDuration}
              isLoadingBtnShow={isLoadingBtnShow}
            ></Recorder>
          </Card>
          <Card className="content-right-wave">
            <div className="time">{formatTime(duration)}</div>
            <Divider />
            <RecordBoardWave
              className="wave"
              audioBuffer={audioBuffer}
              os={os}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default RecordBoard;
