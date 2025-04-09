import React, {
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useState,
} from "react";
import "./ASRDetailAudio.less";
import { useWavesurfer } from "@wavesurfer/react";
import Timeline from "wavesurfer.js/dist/plugins/timeline";
import "./ASRDetailAudio.less";
import { Radio, ConfigProvider, Dropdown, Slider, Spin } from "antd";
import type { RadioChangeEvent, MenuProps } from "antd";
import { PlayCircleOutlined, PauseOutlined } from "@ant-design/icons";
import voice_icon_url from "../../assets/voice_icon.svg";
import voice_disable_icon_url from "../../assets/voice_disable_icon.svg";

const items: MenuProps["items"] = [
  {
    key: "0.5",
    label: "0.5",
  },
  {
    key: "1",
    label: "1",
  },
  {
    key: "2",
    label: "2",
  },
  {
    key: "3",
    label: "3",
  },
];

const ASRDetailAudio = (props: any) => {
  const {
    audioUrl,
    channelInfo,
    timeoutRef,
    currentOperateData,
    onChangeAreaPlay,
    onLoadingComplete,
  } = props;
  const pattern = useRef("open");
  const [radioValue, setRadioVlaue] = useState("open");

  const containerRef1 = useRef(null);
  const containerRef2 = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAllPlaying, setIsAllPlaying] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState("1");
  const [selectedDoctorSpeed, setSelectedDoctorSpeed] = useState("1");
  const [selectedPatientSpeed, setSelectedPatientSpeed] = useState("1");
  const [selectedVolume, setSelectedVolume] = useState<number>();
  const [isSelectAllVolume, setIsSelectAllVolume] = useState(false);
  const [selectedDoctorVolume, setSelectedDoctorVolume] = useState<number>();
  const [isSelectDoctorVolume, setIsSelectDoctorVolume] = useState(false);
  const [selectedPatientVolume, setSelectedPatientVolume] = useState<number>();
  const [isSelectPatientVolume, setIsSelectPatientVolume] = useState(false);
  const currentAudio = useRef<string>("");

  const onChange = ({ target: { value } }: RadioChangeEvent) => {
    pattern.current = value;
    setRadioVlaue(value);
    console.log("onChange pattern=", pattern.current);
    if (doctorWavesurfer && patientWavesurfer) {
      setIsAllPlaying(false);
      doctorWavesurfer.pause();
      patientWavesurfer.pause();
      // 倍速
      doctorWavesurfer.setPlaybackRate(1);
      patientWavesurfer.setPlaybackRate(1);
      setSelectedSpeed("1");
      setSelectedDoctorSpeed("1");
      setSelectedPatientSpeed("1");
    }
  };

  // 第一个音频的 Wavesurfer 配置 (代表左声道)
  const {
    wavesurfer: doctorWavesurfer,
    isPlaying: isDoctorPlaying,
    currentTime: currentDoctorTime,
  } = useWavesurfer({
    container: containerRef1,
    height: 80,
    waveColor: "rgb(200, 0, 200)",
    progressColor: "rgb(100, 0, 100)",
    dragToSeek: true,
    minPxPerSec: 50,
    barHeight: 2, // 增加波形条高度
    barWidth: 3, // 增加波形条宽度
    plugins: useMemo(() => [Timeline.create()], []),
  });

  // 第二个音频的 Wavesurfer 配置 (代表右声道)
  const {
    wavesurfer: patientWavesurfer,
    isPlaying: isPatientPlaying,
    currentTime: currentPatientTime,
  } = useWavesurfer({
    container: containerRef2,
    height: 80,
    waveColor: "#00c8c8",
    progressColor: "#00c8c8",
    dragToSeek: true,
    minPxPerSec: 50,
    barHeight: 2, // 增加波形条高度
    barWidth: 3, // 增加波形条宽度
    plugins: useMemo(() => [Timeline.create()], []),
  });

  const audioBufferToWav = (audioBuffer: AudioBuffer) => {
    const numOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const bufferLength = audioBuffer.length;
    const wavData = new DataView(
      new ArrayBuffer(44 + bufferLength * numOfChannels * 2),
    );

    const writeHeader = (
      view: DataView,
      bufferLength: number,
      numOfChannels: number,
      sampleRate: number,
    ) => {
      const RIFF = "RIFF".split("").map((c) => c.charCodeAt(0));
      const WAVE = "WAVE".split("").map((c) => c.charCodeAt(0));
      const fmt = "fmt ".split("").map((c) => c.charCodeAt(0));
      const data = "data".split("").map((c) => c.charCodeAt(0));

      const subChunk1Size = 16;
      const audioFormat = 1; // PCM
      const byteRate = sampleRate * numOfChannels * 2;
      const blockAlign = numOfChannels * 2;
      const bitsPerSample = 16;

      // RIFF
      view.setUint8(0, RIFF[0]);
      view.setUint8(1, RIFF[1]);
      view.setUint8(2, RIFF[2]);
      view.setUint8(3, RIFF[3]);
      view.setUint32(4, 36 + bufferLength * numOfChannels * 2, true); // Chunk size
      view.setUint8(8, WAVE[0]);
      view.setUint8(9, WAVE[1]);
      view.setUint8(10, WAVE[2]);
      view.setUint8(11, WAVE[3]);

      // fmt
      view.setUint8(12, fmt[0]);
      view.setUint8(13, fmt[1]);
      view.setUint8(14, fmt[2]);
      view.setUint8(15, fmt[3]);
      view.setUint32(16, subChunk1Size, true);
      view.setUint16(20, audioFormat, true);
      view.setUint16(22, numOfChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, byteRate, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitsPerSample, true);

      // data
      view.setUint8(36, data[0]);
      view.setUint8(37, data[1]);
      view.setUint8(38, data[2]);
      view.setUint8(39, data[3]);
      view.setUint32(40, bufferLength * numOfChannels * 2, true);
    };

    const writeAudioData = (
      view: DataView,
      audioBuffer: AudioBuffer,
      numOfChannels: number,
    ) => {
      let offset = 44;
      for (let channel = 0; channel < numOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = 0; i < audioBuffer.length; i++) {
          const sample = channelData[i] * 32767;
          view.setInt16(offset, sample, true);
          offset += 2;
        }
      }
    };

    writeHeader(wavData, bufferLength, numOfChannels, sampleRate);
    writeAudioData(wavData, audioBuffer, numOfChannels);

    return new Blob([wavData.buffer], { type: "audio/wav" });
  };
  // 分离声道, 声道代表什么根据后端数据定：1左声道，2右声道
  const separateChannels = useCallback(
    async (channelInfo: any) => {
      if (!doctorWavesurfer || !patientWavesurfer) return;
      setIsLoading(true);

      try {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // 验证是否双声道
        if (audioBuffer.numberOfChannels < 2) {
          throw new Error("音频文件需要包含双声道");
        }

        // 分离声道数据-Float32Array
        const leftChannel = audioBuffer.getChannelData(
          Number(channelInfo.doctor_channel) - 1,
        );
        const rightChannel = audioBuffer.getChannelData(
          Number(channelInfo.patient_channel) - 1,
        );

        // 创建单声道 AudioBuffer
        const createMonoBuffer = (channelData: Float32Array) => {
          const buffer = audioContext.createBuffer(
            1,
            channelData.length,
            audioBuffer.sampleRate,
          );
          buffer.copyToChannel(channelData, 0);
          return buffer;
        };

        const leftBuffer = createMonoBuffer(leftChannel);
        const rightBuffer = createMonoBuffer(rightChannel);

        // 将 AudioBuffer 转换为 WAV Blob
        const leftBlob = audioBufferToWav(leftBuffer);
        const rightBlob = audioBufferToWav(rightBuffer);

        // 使用 loadBlob 加载左右声道音频
        doctorWavesurfer.loadBlob(leftBlob);
        patientWavesurfer.loadBlob(rightBlob);

        setIsLoading(false);
        onLoadingComplete(false);
      } catch (error) {
        console.error("音频处理失败:", error);
        setIsLoading(false);
      }
    },
    [doctorWavesurfer, patientWavesurfer],
  );

  useEffect(() => {
    if (channelInfo) {
      console.log("开始分离声道，channel Info：", channelInfo, audioUrl);
      separateChannels(channelInfo);
    }
  }, [channelInfo, separateChannels]);

  const clearTimeoutHandle = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  useEffect(() => {
    if (currentOperateData) {
      if (!doctorWavesurfer || !patientWavesurfer) return;
      if (pattern.current === "open") {
        // 医生和患者是同一个音频，所以总时长一致，取哪个都行
        const duration = doctorWavesurfer.getDuration();
        doctorWavesurfer.seekTo(currentOperateData?.startTime / duration);
        patientWavesurfer.seekTo(currentOperateData?.startTime / duration);
        if (currentOperateData?.isPlaying) {
          doctorWavesurfer.play();
          patientWavesurfer.play();
          timeoutRef.current = setTimeout(
            () => {
              doctorWavesurfer.pause();
              patientWavesurfer.pause();
              onChangeAreaPlay();
            },
            (currentOperateData?.endTime - currentOperateData?.startTime) *
              1000,
          );
        } else {
          doctorWavesurfer.pause();
          patientWavesurfer.pause();
          clearTimeoutHandle();
        }
      } else {
        if (currentOperateData?.role === "doctor" && doctorWavesurfer) {
          const doctorDuration = doctorWavesurfer.getDuration();
          doctorWavesurfer.seekTo(
            currentOperateData?.startTime / doctorDuration,
          );
          if (currentOperateData?.isPlaying) {
            doctorWavesurfer.play();
            // 播放结束后暂停播放
            timeoutRef.current = setTimeout(
              () => {
                doctorWavesurfer.pause();
                onChangeAreaPlay();
              },
              (currentOperateData?.endTime - currentOperateData?.startTime) *
                1000,
            );
          } else {
            doctorWavesurfer.pause();
            clearTimeoutHandle();
          }
        } else if (
          currentOperateData?.role === "patient" &&
          patientWavesurfer
        ) {
          const patientDuration = patientWavesurfer.getDuration();
          patientWavesurfer.seekTo(
            currentOperateData?.startTime / patientDuration,
          );
          if (currentOperateData?.isPlaying) {
            patientWavesurfer.play();
            // 播放结束后暂停播放
            timeoutRef.current = setTimeout(
              () => {
                patientWavesurfer.pause();
                onChangeAreaPlay();
              },
              (currentOperateData?.endTime - currentOperateData?.startTime) *
                1000,
            );
          } else {
            patientWavesurfer.pause();
            clearTimeoutHandle();
          }
        }
      }
    } else {
      if (doctorWavesurfer && patientWavesurfer) {
        doctorWavesurfer.pause();
        patientWavesurfer.pause();
      }
    }
  }, [currentOperateData]);

  const onPalyPause = useCallback(
    (type: string = "") => {
      console.log("点击播放,锁定模式:", pattern.current, "身份：", type);
      if (pattern.current === "open") {
        if (doctorWavesurfer && patientWavesurfer) {
          if (isDoctorPlaying || isPatientPlaying) {
            doctorWavesurfer.pause();
            patientWavesurfer.pause();
          } else {
            doctorWavesurfer.play();
            patientWavesurfer.play();
          }
        }
      } else if (pattern.current === "close") {
        if (type === "doctor" && doctorWavesurfer) {
          doctorWavesurfer.playPause();
        } else if (type === "patient" && patientWavesurfer) {
          patientWavesurfer.playPause();
        }
      }
    },
    [doctorWavesurfer, patientWavesurfer, isDoctorPlaying, isPatientPlaying],
  );
  useEffect(() => {
    if (pattern.current === "open") {
      setIsAllPlaying(isDoctorPlaying);
    }
    console.log(
      "医生当前进度：",
      currentDoctorTime,
      "患者当前进度：",
      currentPatientTime,
    );
  }, [isDoctorPlaying, isPatientPlaying]);

  const onClickSpeed = (e: any, type: string = "") => {
    console.log(
      `pattent: ${pattern.current}, Selected speed: ${e.key}, for ${type}`,
    );
    if (pattern.current === "open") {
      setSelectedSpeed(e.key);
      if (doctorWavesurfer && patientWavesurfer) {
        doctorWavesurfer.setPlaybackRate(Number(e.key));
        patientWavesurfer.setPlaybackRate(Number(e.key));
      }
    } else {
      if (type === "doctor") {
        setSelectedDoctorSpeed(e.key);
        if (doctorWavesurfer) doctorWavesurfer.setPlaybackRate(Number(e.key));
      } else if (type === "patient") {
        setSelectedPatientSpeed(e.key);
        if (patientWavesurfer) patientWavesurfer.setPlaybackRate(Number(e.key));
      }
    }
  };

  useEffect(() => {
    if (doctorWavesurfer && patientWavesurfer) {
      const doctorV = doctorWavesurfer.getVolume();
      const paitentV = patientWavesurfer.getVolume();
      console.log("医生音量：", doctorV, "患者音量：", paitentV);

      setSelectedVolume((doctorV + paitentV / 2) * 100);
      setSelectedDoctorVolume(doctorV * 100);
      setSelectedPatientVolume(paitentV * 100);
    }
  }, [doctorWavesurfer, patientWavesurfer, radioValue]);
  const handleVolumeChange = (value: number, type: string = "") => {
    console.log("音量值：", value, "身份：", type);
    // 将音量值从 0-100 转换回 0-1，并应用到医生和患者的音量
    const volume = value / 100;
    if (pattern.current === "open") {
      if (doctorWavesurfer && patientWavesurfer) {
        doctorWavesurfer.setVolume(volume);
        patientWavesurfer.setVolume(volume);
        setSelectedVolume(value);
        setTimeout(() => {
          setIsSelectAllVolume(false);
        }, 1000);
      }
    } else {
      if (type === "doctor" && doctorWavesurfer) {
        doctorWavesurfer.setVolume(volume);
        setSelectedDoctorVolume(value);
        setTimeout(() => {
          setIsSelectDoctorVolume(false);
        }, 1000);
      } else if (type === "patient" && patientWavesurfer) {
        patientWavesurfer.setVolume(volume);
        setSelectedPatientVolume(value);
        setTimeout(() => {
          setIsSelectPatientVolume(false);
        }, 1000);
      }
    }
  };

  const syncAudioScroll = useCallback(() => {
    console.log("syncAudioScroll pattern状态=", pattern.current);
    if (doctorWavesurfer && patientWavesurfer && pattern.current === "open") {
      console.log("进度条-当前操作的音频是：", currentAudio.current);
      if (currentAudio.current === "doctor") {
        const doctorPro =
          doctorWavesurfer.getCurrentTime() / doctorWavesurfer.getDuration();
        patientWavesurfer.seekTo(doctorPro);
      } else if (currentAudio.current === "patient") {
        const patientPro =
          patientWavesurfer.getCurrentTime() / patientWavesurfer.getDuration();
        doctorWavesurfer.seekTo(patientPro);
      }
    }
  }, [doctorWavesurfer, patientWavesurfer, currentAudio]);
  useEffect(() => {
    if (pattern.current === "open") {
      if (doctorWavesurfer && patientWavesurfer) {
        doctorWavesurfer.on("interaction", () => {
          currentAudio.current = "doctor";
          syncAudioScroll();
        });
        patientWavesurfer.on("interaction", () => {
          currentAudio.current = "patient";
          syncAudioScroll();
        });
      }
    } else {
      currentAudio.current = "";
    }

    return () => {
      if (doctorWavesurfer && patientWavesurfer) {
        doctorWavesurfer.un("interaction", syncAudioScroll);
        patientWavesurfer.un("interaction", syncAudioScroll);
      }
    };
  }, [doctorWavesurfer, patientWavesurfer, currentAudio, syncAudioScroll]);

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: "#00967a" },
      }}
    >
      <div className="edit-audio-container">
        <div className="header">
          <span>锁定模式：</span>
          <Radio.Group
            options={[
              { label: "开启", value: "open" },
              { label: "关闭", value: "close" },
            ]}
            onChange={onChange}
            value={radioValue}
          />
          <div className="header-tool">
            {isLoading ? (
              <>
                <Spin style={{ marginLeft: 24 }}>
                  <div></div>
                </Spin>
                <span className="tip">音频正在处理，请稍等</span>
              </>
            ) : (
              <>
                {pattern.current === "open" && (
                  <>
                    {isAllPlaying ? (
                      <PauseOutlined
                        className="icon"
                        onClick={() => onPalyPause()}
                      />
                    ) : (
                      <PlayCircleOutlined
                        className="icon"
                        onClick={() => onPalyPause()}
                      />
                    )}
                    <Dropdown
                      menu={{
                        items,
                        selectedKeys: [selectedSpeed],
                        onClick: (e) => onClickSpeed(e),
                      }}
                      placement="bottom"
                      arrow={{ pointAtCenter: true }}
                    >
                      <span className="speed">{selectedSpeed + "X"}</span>
                    </Dropdown>
                    <div className="voice">
                      <img
                        className="voice-img"
                        src={voice_icon_url}
                        alt=""
                        onClick={() => setIsSelectAllVolume(!isSelectAllVolume)}
                      />
                      {isSelectAllVolume && (
                        <div className="voice-slider-header">
                          <Slider
                            className="voice-slider"
                            defaultValue={selectedVolume}
                            onChange={handleVolumeChange}
                            min={0}
                            max={100}
                            step={5}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="main-container">
          <div className="audio-container">
            <div className="info">
              <div className="top">
                <span>医生</span>
                {pattern.current === "open" ? (
                  <PlayCircleOutlined className="disable-icon" />
                ) : (
                  <>
                    {isDoctorPlaying ? (
                      <PauseOutlined
                        className="icon"
                        style={{ color: "#c800c8" }}
                        onClick={() => onPalyPause("doctor")}
                      />
                    ) : (
                      <PlayCircleOutlined
                        className="icon"
                        style={{ color: "#c800c8" }}
                        onClick={() => onPalyPause("doctor")}
                      />
                    )}
                  </>
                )}
              </div>
              <div className="bottom">
                {pattern.current === "open" ? (
                  <>
                    <span style={{ color: "#ccc" }}>
                      {selectedDoctorSpeed + "X"}
                    </span>
                    <img
                      className="voice-disabled-img"
                      src={voice_disable_icon_url}
                      alt=""
                    />
                  </>
                ) : (
                  <>
                    <Dropdown
                      menu={{
                        items,
                        selectedKeys: [selectedDoctorSpeed],
                        onClick: (e) => onClickSpeed(e, "doctor"),
                      }}
                      placement="bottom"
                      arrow={{ pointAtCenter: true }}
                    >
                      <span>{selectedDoctorSpeed + "X"}</span>
                    </Dropdown>
                    <div className="voice">
                      <img
                        className="voice-img"
                        src={voice_icon_url}
                        alt=""
                        onClick={() =>
                          setIsSelectDoctorVolume(!isSelectDoctorVolume)
                        }
                      />
                      {isSelectDoctorVolume && (
                        <div className="voice-slider-container">
                          <Slider
                            className="voice-slider"
                            vertical
                            defaultValue={selectedDoctorVolume}
                            onChange={(e) => handleVolumeChange(e, "doctor")}
                            min={0}
                            max={100}
                            step={5}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="waveform-container" ref={containerRef1} />
          </div>

          <div className="audio-container">
            <div className="info">
              <div className="top">
                <span>患者</span>
                {pattern.current === "open" ? (
                  <PlayCircleOutlined className="disable-icon" />
                ) : (
                  <>
                    {isPatientPlaying ? (
                      <PauseOutlined
                        className="icon"
                        style={{ color: "#00c8c8" }}
                        onClick={() => onPalyPause("patient")}
                      />
                    ) : (
                      <PlayCircleOutlined
                        className="icon"
                        style={{ color: "#00c8c8" }}
                        onClick={() => onPalyPause("patient")}
                      />
                    )}
                  </>
                )}
              </div>
              <div className="bottom">
                {pattern.current === "open" ? (
                  <>
                    <span style={{ color: "#ccc" }}>
                      {selectedPatientSpeed + "X"}
                    </span>
                    <img
                      className="voice-disabled-img"
                      src={voice_disable_icon_url}
                      alt=""
                    />
                  </>
                ) : (
                  <>
                    <Dropdown
                      menu={{
                        items,
                        selectedKeys: [selectedPatientSpeed],
                        onClick: (e) => onClickSpeed(e, "patient"),
                      }}
                      placement="bottom"
                      arrow={{ pointAtCenter: true }}
                    >
                      <span>{selectedPatientSpeed + "X"}</span>
                    </Dropdown>
                    <div className="voice">
                      <img
                        className="voice-img"
                        src={voice_icon_url}
                        alt=""
                        onClick={() =>
                          setIsSelectPatientVolume(!isSelectPatientVolume)
                        }
                      />
                      {isSelectPatientVolume && (
                        <div className="voice-slider-container">
                          <Slider
                            className="voice-slider"
                            vertical
                            defaultValue={selectedPatientVolume}
                            onChange={(e) => handleVolumeChange(e, "patient")}
                            min={0}
                            max={100}
                            step={5}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="waveform-container" ref={containerRef2} />
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default ASRDetailAudio;
