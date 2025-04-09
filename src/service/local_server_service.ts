import { AxiosPromise } from "axios";
import local_server_request from "./local_server_request";
import { ISyncAudioFile } from "@/common/const";

// 获取音频最后片段
function service_getMedicalRecordLastSegment(
  audiofile_local_path: string,
  duration_ms: number = 170,
): AxiosPromise {
  const data = {
    audiofile_local_path,
    duration_ms,
  };
  return local_server_request({
    url: `/v1/audio/record/last-segment`,
    headers: { "Content-Type": "application/json" },
    method: "post",
    data,
  });
}

/** 删除本地录音记录 */
function service_deleteLocalAudioFile(
  audiofile_local_path: string,
): AxiosPromise {
  const data = {
    audiofile_local_path,
  };
  return local_server_request({
    url: `/v1/audio/record/delete`,
    headers: { "Content-Type": "application/json" },
    method: "post",
    data,
  });
}

/** 音频同步 */
function service_syncLocalAudioToCloud(list: ISyncAudioFile[]): AxiosPromise {
  return local_server_request({
    url: `/v1/audio/record/sync`,
    headers: { "Content-Type": "application/json" },
    method: "post",
    data: { sync_records: list },
  });
}

/** 获取本地音频播放链接 */
function service_getAudioFileUrl(audiofile_local_path: string): AxiosPromise {
  const data = {
    audiofile_local_path,
  };
  return local_server_request({
    url: `/v1/audio/record/audiourl`,
    headers: { "Content-Type": "application/json" },
    method: "post",
    data,
  });
}

/** 播放本地音频文件 */
function service_playLocalAudioFile(file_path: string): AxiosPromise {
  const data = {
    file_path,
  };
  return local_server_request({
    url: `/v1/audio/record/audiourl`,
    headers: { "Content-Type": "application/json" },
    method: "get",
    data,
  });
}

/** 获取本地机器码 */
function service_getLocalMachineCode(): AxiosPromise {
  return local_server_request({
    url: `/v1/machine/code`,
    headers: { "Content-Type": "application/json" },
    method: "get",
  });
}

export {
  service_getMedicalRecordLastSegment,
  service_deleteLocalAudioFile,
  service_syncLocalAudioToCloud,
  service_getAudioFileUrl,
  service_playLocalAudioFile,
  service_getLocalMachineCode,
};
