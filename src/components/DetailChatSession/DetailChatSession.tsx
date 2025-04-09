import React, { useEffect, useRef } from "react";
import "./DetailChatSession.less";
import TypewriterMessage from "./TypewriterMessage";
import { formatMillisecondsToTime } from "@/utils/asrEditUtils";
import { PlayCircleOutlined, PauseOutlined } from "@ant-design/icons";

/** 医生为左，患者为右 */
function DetailChatSession(props: any) {
  console.log("🚀 ~ ChatSession ~ props:", props);
  const {
    chatList,
    channelInfo,
    isDetailMode,
    audioIsloading,
    onGetPalyPauseData,
  } = props;
  const prevLength = useRef(0);
  const scrollContainerRef = useRef(null);
  useEffect(() => {
    prevLength.current = chatList.length;
    // 当新消息到达时，自动滚动到最新一行
    // if (scrollContainerRef.current) {
    //     scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    // }
  }, [chatList]);

  return (
    <div ref={scrollContainerRef} className="session-wrapper">
      {props?.chatList?.map((currentMessage: any, index: number) => {
        // 判断是否为新增消息
        const isNewMessage = index >= prevLength.current;
        const shouldUseTypewriter = isNewMessage && !isDetailMode;
        const role =
          currentMessage?.channel === channelInfo?.doctor_channel
            ? "doctor"
            : "patient";

        return (
          <div className={`chat`} key={index}>
            <div className="head-group">
              <div
                className="head"
                style={{
                  backgroundColor:
                    role === "doctor" ? "#be148033" : "#00c8c833",
                }}
              >
                {role === "doctor" ? "医" : "患"}
              </div>
              <span className="range_time">
                {formatMillisecondsToTime(currentMessage?.start_ms) +
                  " - " +
                  formatMillisecondsToTime(currentMessage?.end_ms)}
              </span>
            </div>
            <div className="right-group">
              {audioIsloading ? (
                <>
                  <PlayCircleOutlined
                    className="icon"
                    style={{ color: "#ccc" }}
                  />
                </>
              ) : (
                <>
                  {currentMessage?.isPlaying ? (
                    <PauseOutlined
                      className="icon"
                      style={{
                        color: role === "doctor" ? "#c800c8" : "#00c8c8",
                      }}
                      onClick={() => onGetPalyPauseData(currentMessage, index)}
                    />
                  ) : (
                    <PlayCircleOutlined
                      className="icon"
                      style={{
                        color: role === "doctor" ? "#c800c8" : "#00c8c8",
                      }}
                      onClick={() => onGetPalyPauseData(currentMessage, index)}
                    />
                  )}
                </>
              )}
              {shouldUseTypewriter ? (
                <TypewriterMessage
                  text={currentMessage?.content}
                  className="message"
                />
              ) : (
                <div className="message">{currentMessage?.content}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default DetailChatSession;
