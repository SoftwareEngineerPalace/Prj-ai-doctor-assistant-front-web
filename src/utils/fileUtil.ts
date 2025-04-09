import CryptoJS from "crypto-js";
import { formatDate, formatTime } from "./timeUtil";

/** 获取文件的 sha256 */
const getFileSHA256 = async (file: File): Promise<string> => {
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

/** 获取文本的 sha256 */
async function calculateSHA256(input: any) {
  const hash = CryptoJS.SHA256(input);
  return hash.toString(CryptoJS.enc.Hex);
}
const transformRecord = (item: any) => {
  return {
    key: item.id,
    index: item.id,
    visitId: item.visit_id,
    uploadTime: formatDate(item.created),
    audioDuration: formatTime(Math.floor(item.audio_duration_ms / 1000)),
    audioFileName: item.audio_file_name,
    audioFileSha256: item.audio_file_sha256,
    uploadId: item.upload_id,
    deleted: item.deleted,
    ttsTextFileUrl: item.tts_text_file_url,
    originalRstFileUrl: item.original_rst_file_url,
  };
};

export { calculateSHA256, transformRecord, getFileSHA256 };
