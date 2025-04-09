import { useContext, useEffect, useState } from "react";
import "./Audio.less";
import { RecordContext } from "../../state/record/recordContext";
import { Alert } from "antd";
import React from "react";
const Audio = () => {
  const { audioUrl, isRecordingSaved } = useContext(RecordContext);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (isRecordingSaved) {
      setMessage("录音已保存");
    } else {
      setMessage("录音已结束，请点击保存按钮");
    }
  }, [isRecordingSaved]);
  return (
    <div className="audio-wrapper">
      <audio
        controls
        preload="auto"
        className="audio-player"
        src={audioUrl}
      ></audio>
      <div className="audio-text">
        <Alert message={message} type="info"></Alert>
      </div>
    </div>
  );
};

export default Audio;
