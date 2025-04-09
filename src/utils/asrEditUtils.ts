import CryptoJS from "crypto-js";

export const encryptFileSHA256 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = event.target?.result as ArrayBuffer;
      const wordArray = CryptoJS.lib.WordArray.create(fileData);
      const sha256 = CryptoJS.SHA256(wordArray).toString();
      resolve(sha256);
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file."));
    };
    reader.readAsArrayBuffer(file);
  });
};

export const formatMillisecondsToTime = (milliseconds: number): string => {
  // 将毫秒转换为秒
  const totalSeconds = Math.floor(milliseconds / 1000);

  // 计算小时、分钟和秒
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // 格式化为 hh:mm:ss
  const formattedTime = [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ].join(":");

  return formattedTime;
};
