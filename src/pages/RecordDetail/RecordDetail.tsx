import {
  Card,
  Button,
  Alert,
  Tooltip,
  Slider,
  Tag,
  Dropdown,
  MenuProps,
  Spin,
} from "antd";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import "./RecordDetail.less";
import {
  PauseOutlined,
  LeftOutlined,
  UndoOutlined,
  RedoOutlined,
  CaretRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { service_getRecordDetail } from "@/service/business_service";
import { service_getAudioFileUrl } from "@/service/local_server_service";
import { useLocation } from "react-router-dom";
import { GenderEnToCn, MedicalMethod } from "@/common/const";
import { aliCloudLog } from "@/service/aliCloudLog";
import { AuthContext } from "@/state/auth/authContext";
import { useWavesurfer } from "@wavesurfer/react";
import Timeline from "wavesurfer.js/dist/plugins/timeline.esm.js";
import { formatTimeInRecordDetail } from "@/utils/timeUtil";
import { pcmToAudioBuffer, audioBufferToWav } from "@/utils/audioUtil";

function Detail() {
  const navigate = useNavigate();
  const { state } = useContext(AuthContext) as any;
  const { os } = state;
  const location = useLocation();
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [audioLocalPath, setAudioLocalPath] = useState<string>("");
  const [audioLocalPath_macOS, setAudioLocalPath_macOS] = useState<string>("");
  const [audioLocalPath_pre_windows, setAudioLocalPath_pre_windows] =
    useState<string>("");
  const [audioLocalPath_suffix_windows, setAudioLocalPath_suffix_windows] =
    useState<string>("");
  const [medicalMethod, setMedicalMethod] = useState("");
  const [visitId, setVisitId] = useState<string>("");
  const doctorContainerRef = useRef(null);
  const patientContainerRef = useRef(null);
  const currentAudio = useRef<string>(""); // 用来标记当前操作的是哪个音频
  const [loading, setIsLoading] = useState(true);
  const [speedRatio, setSpeedRatio] = useState(1);
  // 总时长，单位秒
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(0);
  const [mvInquiryId, setMvInquiryId] = useState<number>(-1);
  const [visitorName, setVisitorName] = useState();
  const [visitorGender, setVisitorGender] = useState<string>("male");
  const [visitorBirth, setVisiterBirth] = useState();
  const [visitorPhone, setVisitorPhone] = useState();

  // 第一个音频的 Wavesurfer 配置 (代表左声道) 医生
  const {
    wavesurfer: doctorWaveSurfer,
    isPlaying: isDoctorPlaying,
    currentTime: doctorCurTime,
  } = useWavesurfer({
    container: doctorContainerRef,
    height: 100,
    waveColor: "rgb(200, 0, 200)",
    progressColor: "rgb(100, 0, 100)",
    dragToSeek: true,
    minPxPerSec: 50,
    barHeight: 2, // 增加波形条高度
    barWidth: 3, // 增加波形条宽度
    plugins: useMemo(() => [Timeline.create()], []),
  });

  // 第二个音频的 Wavesurfer 配置 (代表右声道) 患者
  const {
    wavesurfer: patientWaveSurfer,
    // isPlaying: isPatientPlaying,
    // currentTime: patientCurTime,
  } = useWavesurfer({
    container: patientContainerRef,
    height: 80,
    waveColor: "rgb(0, 200, 200)",
    progressColor: "rgb(0, 100, 100)",
    dragToSeek: true,
    minPxPerSec: 50,
    barHeight: 2, // 增加波形条高度
    barWidth: 3, // 增加波形条宽度
    plugins: useMemo(() => [Timeline.create()], []),
  });

  useEffect(() => {
    console.log("RecordDetail useEffect 获取详情");
    getDetail();
  }, []);

  useEffect(() => {
    if (audioUrl) {
      console.log("useEffect 加载和解码音频，分离声道");
      separateChannels(audioUrl);
    }
  }, [audioUrl]);

  // 监听 interaction 事件进行同步
  useEffect(() => {
    if (!loading && doctorWaveSurfer && patientWaveSurfer) {
      console.log("RecordDetail useEffect 监听 interaction 事件进行同步");
      doctorWaveSurfer.on("interaction", () => {
        currentAudio.current = "doctor"; // 标记当前操作的是医生音频
        syncAudioScroll();
      });
      patientWaveSurfer.on("interaction", () => {
        currentAudio.current = "patient"; // 标记当前操作的是患者音频
        syncAudioScroll();
      });
      doctorWaveSurfer.on("ready", () => {
        const duration = doctorWaveSurfer.getDuration();
        setTotalDurationSeconds(duration);
      });
    }

    return () => {
      if (doctorWaveSurfer && patientWaveSurfer) {
        doctorWaveSurfer.un("interaction", syncAudioScroll);
        patientWaveSurfer.un("interaction", syncAudioScroll);
      }
    };
  }, [loading]);

  useEffect(() => {
    if (doctorWaveSurfer && patientWaveSurfer) {
      console.log("RecordDetail useEffect 监听到倍速变化");
      doctorWaveSurfer.setPlaybackRate(speedRatio, true);
      patientWaveSurfer.setPlaybackRate(speedRatio, true);
    }
  }, [speedRatio]);

  /** 页面数据详情 */
  const getDetail = React.useCallback(async () => {
    const param = Object.fromEntries(new URLSearchParams(location.search));
    let detail: any;
    try {
      detail = await service_getRecordDetail(param.mvid);
    } catch (error) {
      aliCloudLog(
        `service_getDetail 入参=${JSON.stringify(param)}, 报错=${JSON.stringify(error)}` +
          state.accountName,
      );
    }
    const {
      visit_type,
      mv_inquiry_id,
      visitor_name,
      visitor_gender,
      visitor_birth,
      visitor_phone,
    } = detail.data.data;
    // eslint-disable-next-line prefer-const
    let { audiofile_local_path } = detail.data.data;
    console.log(
      `service_getDetail 入参=${param.mvid}, 返回=${JSON.stringify(detail.data.data)}`,
      state.accountName,
    );
    aliCloudLog(
      `service_getDetail 入参=${param.mvid}, 返回=${JSON.stringify(detail.data.data)}`,
      state.accountName,
    );
    setVisitId(param.visit_id); // 登录号
    setMedicalMethod(MedicalMethod[visit_type]); // 就诊方式

    // audiofile_local_path = 'D:\\audio_storage_dir\\hs\\1\\doctors\\102\\visits\\22222222/22222222_2121_48000_16_2.pcm';

    setAudioLocalPath(audiofile_local_path);

    if (os === "MacOS") {
      setAudioLocalPath_macOS(audiofile_local_path); // 音频本地地址
    } else if (os === "Windows") {
      setAudioLocalPath_pre_windows(audiofile_local_path.split(":")[0]);
      setAudioLocalPath_suffix_windows(audiofile_local_path.split(":")[1]);
    }

    const rsp = await service_getAudioFileUrl(audiofile_local_path);

    const audioUrl = rsp.data.data.audio_url;
    console.log("getDetail 获取音频地址 audioUrl=", audioUrl);
    setAudioUrl(audioUrl);
    setMvInquiryId(mv_inquiry_id);
    if (mv_inquiry_id >= 0) {
      setVisitorName(visitor_name);
      setVisitorGender(visitor_gender);
      setVisiterBirth(visitor_birth);
      setVisitorPhone(visitor_phone);
    }
  }, [location, os]);

  // 加载和解码音频，分离声道
  const separateChannels = useCallback(
    async (_audioUrl: string) => {
      if (!doctorWaveSurfer || !patientWaveSurfer) return;
      setIsLoading(true);

      try {
        console.log("separateChannels 获取音频地址", _audioUrl);

        const response = await fetch(_audioUrl);
        // console.log('separateChannels 0');
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await pcmToAudioBuffer(arrayBuffer, 48000, 2);
        if (audioBuffer.numberOfChannels < 2) {
          throw new Error("音频文件需要包含双声道"); // 验证双声道
        }
        // console.log('separateChannels 0');
        // 分离声道数据
        const leftChannel = audioBuffer.getChannelData(0); // 左声道
        const rightChannel = audioBuffer.getChannelData(1); // 右声道
        // console.log('separateChannels 0');
        // 创建单声道 Buffer
        const createMonoBuffer = (channelData: Float32Array) => {
          const audioContext = new window.AudioContext();
          const buffer = audioContext.createBuffer(
            1,
            channelData.length,
            audioBuffer.sampleRate,
          );
          buffer.copyToChannel(channelData, 0);
          return buffer;
        };
        // console.log('separateChannels 1');
        const leftBuffer = createMonoBuffer(leftChannel);
        const rightBuffer = createMonoBuffer(rightChannel);
        // console.log('separateChannels 2');
        // 将 AudioBuffer 转换为 WAV Blob
        const leftBlob = audioBufferToWav(leftBuffer); // 左声道的 WAV Blob
        const rightBlob = audioBufferToWav(rightBuffer); // 右声道的 WAV Blob
        // console.log('separateChannels 3');
        // 使用 loadBlob 加载左右声道音频
        doctorWaveSurfer.loadBlob(leftBlob); // 只加载左声道
        patientWaveSurfer.loadBlob(rightBlob); // 只加载右声道
        // console.log('separateChannels 4');
        // setTotalDurationSeconds(doctorWaveSurfer.getDuration());
        setIsLoading(false);
      } catch (error) {
        console.error("音频处理失败:", error);
        setIsLoading(false);
      }
    },
    [doctorWaveSurfer, patientWaveSurfer],
  );

  // 3 工具类

  const navigateBack = () => {
    // navigate('/application/audioList');
    navigate(-1);
  };

  /** 播放/暂停音频 */
  const switchPlayAndPause = useCallback(() => {
    if (doctorWaveSurfer && patientWaveSurfer) {
      doctorWaveSurfer.playPause();
      patientWaveSurfer.playPause();
    }
  }, [doctorWaveSurfer, patientWaveSurfer]);

  /** 同步音频滚动 */
  const syncAudioScroll = useCallback(() => {
    if (doctorWaveSurfer && patientWaveSurfer) {
      if (currentAudio.current === "doctor") {
        const process =
          doctorWaveSurfer.getCurrentTime() / doctorWaveSurfer.getDuration();
        patientWaveSurfer.seekTo(process);
        // console.log('syncAudioScroll 同步医生音频');
      } else if (currentAudio.current === "patient") {
        const process =
          patientWaveSurfer.getCurrentTime() / patientWaveSurfer.getDuration();
        doctorWaveSurfer.seekTo(process);
        // console.log('syncAudioScroll 同步患者音频');
      }
    }
  }, [doctorWaveSurfer, patientWaveSurfer, currentAudio]);

  const onSiderChange = (seconds: number) => {
    if (!doctorWaveSurfer || !patientWaveSurfer) return;
    console.log("onSiderChange", seconds);
    // setCurSeconds(seconds);
    const process = seconds / totalDurationSeconds;
    doctorWaveSurfer.seekTo(process); // 同步医生音频
    patientWaveSurfer.seekTo(process); // 同步患者音频
  };

  const onBackward = () => {
    if (doctorWaveSurfer && patientWaveSurfer) {
      doctorWaveSurfer?.skip(-5);
      patientWaveSurfer?.skip(-5);
    }
  };

  const onForward = () => {
    if (doctorWaveSurfer && patientWaveSurfer) {
      doctorWaveSurfer?.skip(5);
      patientWaveSurfer?.skip(5);
    }
  };

  const items: MenuProps["items"] = [
    {
      key: 2,
      label: <span onClick={() => setSpeedRatio(2)}>X 2</span>,
    },
    {
      key: 1.5,
      label: <span onClick={() => setSpeedRatio(1.5)}>X 1.5</span>,
    },
    {
      key: 1,
      label: <span onClick={() => setSpeedRatio(1)}>X 1</span>,
    },
    {
      key: 0.5,
      label: <span onClick={() => setSpeedRatio(0.5)}>X 0.5</span>,
    },
  ];

  const speedRatioSelectChange = (e: any) => {
    console.log("speedRatioOpenChange", e.key);
    setSpeedRatio(parseFloat(e.key));
  };

  // console.log({ os, audioLocalPath_macOS });

  return (
    <div className="detail-page">
      <div className="record-wrapper__header">
        <div className="left-group">
          <Button
            className="btn-back"
            icon={<LeftOutlined />}
            onClick={navigateBack}
          >
            退出
          </Button>
        </div>
      </div>
      <div className="record-wrapper__content">
        <Card
          styles={{
            body: {
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              height: "100%",
            },
          }}
        >
          <p style={{ whiteSpace: "nowrap" }}>
            <span>就诊方式：</span>
            <span>{medicalMethod}</span>
          </p>
          <p style={{ whiteSpace: "nowrap", marginBottom: "0px" }}>
            <span>登录号：</span>
            <span>{visitId}</span>
          </p>
        </Card>
        <Card>
          {audioLocalPath ? (
            <React.Fragment>
              <div className="audio-local-path-wrapper">
                <p>录音已保存到以下路径:</p>
                {os === "MacOS" && (
                  <p style={{ wordBreak: "break-all", marginBottom: 0 }}>
                    {audioLocalPath_macOS}
                  </p>
                )}
                {os === "Windows" && (
                  <p style={{ wordBreak: "break-all", marginBottom: 0 }}>
                    <span
                      className="windows_pre"
                      style={{ wordBreak: "break-all", marginBottom: 0 }}
                    >{`${audioLocalPath_pre_windows}`}</span>
                    <span>&#58;</span>
                    <span
                      style={{ wordBreak: "break-all", marginBottom: 0 }}
                    >{`${audioLocalPath_suffix_windows}`}</span>
                  </p>
                )}
              </div>
            </React.Fragment>
          ) : (
            <Alert showIcon type="warning" message={`还没有录音文件`}></Alert>
          )}
        </Card>
        {mvInquiryId < 0 ? (
          <div></div>
        ) : (
          <Card
            className="three"
            styles={{
              body: {
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                height: "100%",
              },
            }}
          >
            <p style={{ fontWeight: 500, marginBottom: "1.5em" }}>
              已关联的采集信息
            </p>
            <p style={{ whiteSpace: "nowrap" }}>
              <span>姓名：</span>
              <span style={{}}>{visitorName}</span>
            </p>
            <p style={{ whiteSpace: "nowrap" }}>
              <span>性别：</span>
              <span style={{}}>
                {GenderEnToCn[visitorGender as keyof typeof GenderEnToCn]}
              </span>
            </p>
            <p style={{ whiteSpace: "nowrap" }}>
              <span>出生日期：</span>
              <span style={{}}>{visitorBirth}</span>
            </p>
            <p style={{ whiteSpace: "nowrap" }}>
              <span>手机号：</span>
              <span style={{}}>{visitorPhone}</span>
            </p>
          </Card>
        )}

        <Card
          className="card-player"
          styles={{
            body: {
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              height: "100%",
            },
          }}
        >
          {/* 1 */}
          <Tooltip title="后退 5 秒">
            <UndoOutlined
              className="btn-audio btn-backward"
              onClick={() => onBackward()}
            />
          </Tooltip>

          {/* 2 */}
          <div onClick={() => switchPlayAndPause()}>
            {isDoctorPlaying ? (
              <Tooltip title="暂停">
                <PauseOutlined className="btn-audio btn-pause" />
              </Tooltip>
            ) : (
              <Tooltip title="播放">
                <CaretRightOutlined className="btn-audio btn-play" />
              </Tooltip>
            )}
          </div>

          {/* 3 */}
          <Tooltip title="前进 5 秒">
            <RedoOutlined
              className="btn-audio btn-forward"
              onClick={() => onForward()}
            />
          </Tooltip>

          {/* 4 */}
          <Dropdown
            menu={{ items, onClick: speedRatioSelectChange }}
            placement="top"
          >
            <Tag style={{ fontSize: 14 }}>
              {speedRatio === 1 ? "正常倍速" : ` X ${speedRatio}`}
            </Tag>
          </Dropdown>

          {/* 5 */}
          <div style={{ marginLeft: 8 }}>
            {formatTimeInRecordDetail(doctorCurTime)}
          </div>

          {/* 6 */}
          <Slider
            tooltip={{ open: false }}
            min={0}
            style={{ flex: 1, marginLeft: "16px" }}
            max={totalDurationSeconds}
            styles={{ track: { width: "100%", backgroundColor: "#339352" } }}
            onChange={onSiderChange}
            step={0.02}
            value={doctorCurTime}
          />

          {/* 7 */}
          <div style={{ marginLeft: "16px" }}>
            {formatTimeInRecordDetail(totalDurationSeconds)}
          </div>
        </Card>
        {mvInquiryId < 0 && <div></div>}
        <Card
          className="card-wave"
          styles={{
            body: { display: "flex", flexDirection: "column", width: "100%" },
          }}
        >
          <div className="wave-container" style={{ opacity: loading ? 0 : 1 }}>
            <div className="info">
              <div className="top">
                <span className="label-doctor">医生</span>
              </div>
            </div>
            <div className="waveform-container" ref={doctorContainerRef} />
          </div>

          <div className="wave-container" style={{ opacity: loading ? 0 : 1 }}>
            <div className="info">
              <div className="top">
                <span className="label-patient">患者</span>
              </div>
            </div>
            <div className="waveform-container" ref={patientContainerRef} />
          </div>

          {loading && (
            <Spin
              size="large"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            ></Spin>
          )}
        </Card>
      </div>
    </div>
  );
}

export default Detail;
