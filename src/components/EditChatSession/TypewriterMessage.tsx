import { useState, useEffect } from "react";
import React from "react";
import { Input } from "antd";

// 单独的消息组件，用于处理打字机效果
function TypewriterMessage({
  text,
  onTextChange,
}: {
  text: string;
  onTextChange: (newText: string) => void;
}) {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let currentIndex = 0;
    const typeWriter = setInterval(() => {
      if (currentIndex < text.length) {
        const charToAdd = text[currentIndex] || "";
        setDisplayText((prevText) => prevText + charToAdd);
        currentIndex++;
      } else {
        clearInterval(typeWriter);
      }
    }, 100); // 打字机速度，可自定义
    return () => clearInterval(typeWriter);
  }, [text]);

  return (
    <Input.TextArea
      showCount
      maxLength={2000}
      value={displayText}
      onChange={(e) => onTextChange(e.target.value)}
    />
  );
}

export default TypewriterMessage;
