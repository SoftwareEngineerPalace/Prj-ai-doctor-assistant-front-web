import React, { useEffect, useRef, useContext } from "react";
import "./EditChatSession.less";
import TypewriterMessage from "./TypewriterMessage";
import { Input, Button, Dropdown, Modal } from "antd";
import type { MenuProps } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import { AuthContext } from "@/state/auth/authContext";
import { formatMillisecondsToTime } from "@/utils/asrEditUtils";

/** 医生为左，患者为右 */
function EditChatSession({
  visitId,
  chatList,
  channelInfo,
  isDetailMode,
  audioIsloading,
  onChatListUpdate,
  onGetPalyPauseData,
}: {
  visitId: string;
  chatList: any[];
  channelInfo: any;
  isDetailMode: boolean;
  audioIsloading: boolean;
  onChatListUpdate: (updatedChatList: any[]) => void;
  onGetPalyPauseData: (data: any, index: number) => void;
}) {
  const { state } = useContext(AuthContext);
  const { username } = state;

  const prevLength = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    prevLength.current = chatList.length;
    // 当新消息到达时，自动滚动到最新一行
    // if (scrollContainerRef.current) {
    //     scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    // }
  }, [chatList]);

  const formatChatList = () => {
    return chatList.map((item: any) => {
      const updatedItem = {
        channel: item.channel,
        content: item.content,
        start_ms: item.start_ms,
        end_ms: item.end_ms,
      };
      return updatedItem;
    });
  };

  const updateText = (text: string, index: number) => {
    const updatedChatList = formatChatList();
    updatedChatList[index].content = text; // 更新内容属性
    onChatListUpdate(updatedChatList);
  };

  const addChatItem = (channel: number, index: number) => {
    const newChatItem = { channel, content: "", start_ms: 0, end_ms: 0 };
    const updatedChatList = formatChatList();
    updatedChatList.splice(index + 1, 0, newChatItem); // 在当前的下方插入新消息
    onChatListUpdate(updatedChatList);
  };

  const removeChatItem = (index: number) => {
    Modal.confirm({
      title: "提示",
      content: "确认删除吗？",
      okText: "确定",
      cancelText: "取消",
      centered: true,
      onOk: () => {
        const updatedChatList = formatChatList();
        updatedChatList.splice(index, 1);
        onChatListUpdate(updatedChatList);
      },
    });
  };

  return (
    <div ref={scrollContainerRef} className="session-wrapper">
      {chatList?.map((currentMessage: any, index: number) => {
        // 判断是否为新增消息
        const isNewMessage = index >= prevLength.current;
        const shouldUseTypewriter = isNewMessage && !isDetailMode;
        const role =
          currentMessage?.channel === channelInfo?.doctor_channel
            ? "doctor"
            : "patient";
        const items: MenuProps["items"] = [
          {
            key: "doctor",
            label: "医生",
            onClick: () => {
              addChatItem(channelInfo?.doctor_channel, index);
            },
          },
          {
            key: "patient",
            label: "患者",
            onClick: () => {
              addChatItem(channelInfo?.patient_channel, index);
            },
          },
        ];

        return (
          <div className={`chat`} key={index}>
            <div className="header-group">
              <div
                style={{
                  color: role === "doctor" ? "#c800c8" : "#00c8c8",
                  width: "60px",
                  whiteSpace: "nowrap",
                }}
              >
                {role === "doctor" ? username : visitId}
              </div>
              <span className="range_time">
                {formatMillisecondsToTime(currentMessage?.start_ms) +
                  " - " +
                  formatMillisecondsToTime(currentMessage?.end_ms)}
              </span>
            </div>
            <div className="edit-group">
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
                  onTextChange={(newText: string) => updateText(newText, index)}
                />
              ) : (
                <Input.TextArea
                  autoSize
                  showCount
                  maxLength={2000}
                  value={currentMessage?.content}
                  onChange={(e) => updateText(e.target.value, index)}
                />
              )}
              <Dropdown
                menu={{ items }}
                trigger={["click"]}
                placement="top"
                arrow
              >
                <Button
                  icon={<PlusOutlined />}
                  style={{ marginLeft: "16px" }}
                ></Button>
              </Dropdown>
              <Button
                onClick={() => removeChatItem(index)}
                icon={<DeleteOutlined />}
                style={{ marginLeft: "16px" }}
              ></Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default EditChatSession;
