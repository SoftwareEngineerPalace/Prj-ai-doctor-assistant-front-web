import React, { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import "./RecordBoardWave.less";

const RecordBoardWave = (props: any) => {
  const { audioBuffer, os } = props;
  const wavesurferLeftRef = useRef<any>(null); // 用于左声道
  const wavesurferRightRef = useRef<any>(null); // 用于右声道
  const leftBlobUrlRef = useRef<string | null>(null);
  const rightBlobUrlRef = useRef<string | null>(null);

  // 创建 Wavesurfer 实例
  const createWaveSurfer = () => {
    if (wavesurferLeftRef.current) {
      wavesurferLeftRef.current.destroy();
    }
    if (wavesurferRightRef.current) {
      wavesurferRightRef.current.destroy();
    }

    const leftWaveSurfer = WaveSurfer.create({
      container: "#leftWaveform", // 显示左声道的容器
      waveColor: "rgb(200, 0, 200)",
      progressColor: "rgb(200, 0, 200)",
      cursorWidth: 0,
      height: 150,
      barHeight: os === "Windows" ? 5 : 2, // 增加波形条高度
      barWidth: 3, // 增加波形条宽度
    });

    const rightWaveSurfer = WaveSurfer.create({
      container: "#rightWaveform", // 显示右声道的容器
      waveColor: "rgb(0, 200, 200)",
      progressColor: "rgb(0, 200, 200)",
      cursorWidth: 0,
      height: 150,
      barHeight: os === "Windows" ? 5 : 2, // 增加波形条高 // 增加波形条高度
      barWidth: 3, // 增加波形条宽度
    });

    wavesurferLeftRef.current = leftWaveSurfer;
    wavesurferRightRef.current = rightWaveSurfer;
  };

  useEffect(() => {
    createWaveSurfer();
    return () => {
      if (leftBlobUrlRef.current) {
        URL.revokeObjectURL(leftBlobUrlRef.current);
      }
      if (rightBlobUrlRef.current) {
        URL.revokeObjectURL(rightBlobUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // console.log('RecordBoardWave audioBuffer:', audioBuffer);
    if (
      wavesurferLeftRef.current &&
      wavesurferRightRef.current &&
      audioBuffer
    ) {
      // 释放旧的 Blob URL
      if (leftBlobUrlRef.current) {
        URL.revokeObjectURL(leftBlobUrlRef.current);
      }
      if (rightBlobUrlRef.current) {
        URL.revokeObjectURL(rightBlobUrlRef.current);
      }

      const leftChannelData = audioBuffer.getChannelData(0);
      const rightChannelData = audioBuffer.getChannelData(1);

      const duration = audioBuffer.duration;

      const blobLeft = new Blob([leftChannelData], { type: "audio/wav" });
      const peaksLeft = [audioBuffer.getChannelData(0)];
      wavesurferLeftRef.current.loadBlob(blobLeft, peaksLeft, duration);

      const blobRight = new Blob([rightChannelData], { type: "audio/wav" });
      const peaksRight = [audioBuffer.getChannelData(1)];
      wavesurferRightRef.current.loadBlob(blobRight, peaksRight, duration);
    }
  }, [audioBuffer]);

  return (
    <div>
      <div className="group">
        <div className="label" style={{ color: "rgb(200, 0, 200)" }}>
          医生：
        </div>
        <div id="leftWaveform" className="waveform-container"></div>{" "}
        {/* 左声道 */}
      </div>
      <div className="group">
        <div className="label" style={{ color: "rgb(0, 200, 200)" }}>
          患者：
        </div>
        <div id="rightWaveform" className="waveform-container"></div>{" "}
        {/* 右声道 */}
      </div>
    </div>
  );
};

export default RecordBoardWave;
