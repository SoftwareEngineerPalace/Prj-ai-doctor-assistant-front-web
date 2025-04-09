import React, { useState, useContext, useEffect } from "react";
import {
  RecordContext,
  RecordState,
  WsState,
} from "../../state/record/recordContext";
import {
  PlayCircleOutlined,
  BorderOutlined,
  PauseCircleOutlined,
  AudioMutedOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import "./Recorder.less";
import { Modal, Tooltip } from "antd";

const Recorder = (props: any) => {
  const { recordState, wsState, setRecordState, isRecordReady } = useContext(
    RecordContext,
  ) as any;
  // const [duration, setDuration] = React.useState(0);
  const [, setNoticeText] = React.useState("");
  useEffect(() => {
    // console.log("VisitInput useEffect:", wsState);
    if (wsState === WsState.open) {
      if (recordState === RecordState.RECORDING && isRecordReady) {
        setAlertType("info");
        setNoticeText("正在录音中，点击红色按钮，停止并保存录音");
      }
    } else {
      props.onClearTimer();
      setAlertType("error");
      setNoticeText("请先确认就诊方式及登记号");
    }
  }, [wsState, recordState, isRecordReady, props, setRecordState]);

  const onResume = () => {
    console.log("Recorder click onResume");
    props.onClickBtnResume();
  };

  const onPause = () => {
    console.log("Recorder click onPause");
    props.onClickBtnPause();
  };

  const onStop = React.useCallback(() => {
    // 这里有报错 Recorder.tsx:38 Warning: [antd: Modal] Static function can not consume context like dynamic theme. Please use 'App' component instead.
    Modal.confirm({
      title: "确认结束录音？",
      content: "结束后会保存录音并返回到音频列表页",
      okText: "确认",
      okButtonProps: { type: "primary", style: { backgroundColor: "#339352" } },
      cancelButtonProps: {
        ghost: true,
        style: { color: "#339352", borderColor: "#339352" },
      },
      cancelText: "取消",
      onCancel: () => {},
      onOk: () => {
        props.onClearTimer();
        props.onClickBtnStop();
      },
    });
  }, []);

  const [, setAlertType] = useState<"success" | "info" | "warning" | "error">(
    "success",
  );

  useEffect(() => {
    console.log({ recordState });
  }, [recordState]);

  return (
    <div className="recorder-wrapper">
      {props.isLoadingBtnShow && (
        <LoadingOutlined
          className="element"
          style={{ fontSize: "40px", color: "#339352" }}
        />
      )}
      {/* 录音中：显示暂停、停止按钮 wsState === WsState.open && recordState === RecordState.RECORDING*/}
      {!props.isLoadingBtnShow &&
        wsState === WsState.open &&
        recordState === RecordState.RECORDING &&
        isRecordReady && (
          <div className="">
            <Tooltip title="暂停">
              <PauseCircleOutlined
                onClick={onPause}
                className="pause element"
                style={{ fontSize: "40px", color: "#339352" }}
              />
            </Tooltip>

            <Tooltip title="结束">
              <BorderOutlined
                onClick={onStop}
                className="stop element"
                style={{ fontSize: "40px", color: "red" }}
              />
            </Tooltip>
          </div>
        )}

      {/* 录音暂停：显示继续录音、停止按钮 */}
      {!props.isLoadingBtnShow && recordState === RecordState.PAUSED && (
        <div className="">
          <Tooltip title="继续">
            <PlayCircleOutlined
              onClick={onResume}
              className="pause element"
              style={{ fontSize: "40px", color: "#339352" }}
            />
          </Tooltip>

          <Tooltip title="结束">
            <BorderOutlined
              onClick={onStop}
              className="stop element"
              style={{ fontSize: "40px", color: "red" }}
            />
          </Tooltip>
        </div>
      )}

      {/* 显示禁止录音按钮: wsState !== WsState.open*/}
      {!props.isLoadingBtnShow &&
        (recordState === RecordState.DEFAULT ||
          recordState === RecordState.STOPPED) && (
          <AudioMutedOutlined
            className="element"
            style={{ fontSize: "40px", color: "gray" }}
          />
        )}

      {/* <div className="time element">{formatTime(props.duration)}</div> */}
      {/* <Alert message={noticeText} type={alertType}></Alert> */}
    </div>
  );
};

export default Recorder;
