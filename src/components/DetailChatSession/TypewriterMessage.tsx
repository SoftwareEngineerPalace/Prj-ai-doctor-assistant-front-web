import { useState, useEffect } from "react";
import React from "react";

// 单独的消息组件，用于处理打字机效果
function TypewriterMessage({
  text,
  className,
}: {
  text: string;
  className?: string;
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
  }, [text]);
  return <div className={className}>{displayText}</div>;
}

export default TypewriterMessage;
