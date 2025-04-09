import axios, { AxiosPromise } from "axios";
import business_request from "./business_request";
import { ListAPIParams } from "@/types/collectInfoList";
import { FileInfo } from "@/types/asrEdit";
import { ScoreEntity } from "@/common/types";

function getToken(): string {
  return localStorage.getItem("access_token") || "";
}

// *******************************************   1. 录音列表相关  *******************************************
// ********************** 1.1 录音列表 **********************

/** 录音列表 */
const service_getAudioList = ({
  page_index,
  page_size,
  s_visitor_phone,
  s_visit_id,
  s_visit_type,
  s_record_status,
  s_sync_status,
}: any) => {
  return business_request({
    url: `/v1/medvisit/records`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    method: "get",
    params: {
      page_index,
      page_size,
      s_visitor_phone,
      s_visit_id,
      s_visit_type,
      s_record_status,
      s_sync_status,
    },
  });
};

/** 获取未同步的录音列表 */
const service_getUnSyncedAudioList = (machine_code: string) => {
  return business_request({
    url: `/v1/medvisit/records/unsynced`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    method: "get",
    params: {
      machine_code,
    },
  });
};

/** 删除录音记录 */
const service_deleteRecord = (mvid: string) => {
  return business_request({
    url: `/v1/medvisit/records/${mvid}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    method: "delete",
    params: {
      mvid,
    },
  });
};

const service_getDepartment = ({
  hsid,
  doctor_id,
}: {
  hsid: string;
  doctor_id: string;
}) => {
  return business_request({
    url: `/v1/std/hs/${hsid}/doctor/${doctor_id}/department-room`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    method: "get",
  });
};

const service_getRecordDetail = (mvid: string) => {
  return business_request({
    url: `/v1/medvisit/records/${mvid}`,
    method: "get",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

/**
 * 向服务器同步音频同步任务状态
 *
 * @param mvid 录音ID
 * @returns 业务请求结果
 */
const service_patchAudioSyncTaskStatusToServer = (data: any) => {
  return business_request({
    url: `/v1/medvisit/records/sync-status`,
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    data,
  });
};

// ********************** 1.2 创建录音 **********************

// 创建录音记录
function service_createMedicalRecord(
  visit_id: string,
  visit_type: number,
  audiofile_machine_id: string,
  mv_inquiry_id: number,
): AxiosPromise {
  const data = {
    visit_type,
    visit_id,
    audiofile_machine_id,
    mv_inquiry_id,
  };
  return business_request({
    url: `/v1/medvisit/records`,
    headers: {
      "Content-Type": "application/json",
    },
    method: "post",
    data,
  });
}

// 获取录音详情by mvid
function service_getMedicalRecordInfoByMvid(mvid: string): AxiosPromise {
  const mvid2nim = parseInt(mvid);
  return business_request({
    url: `/v1/medvisit/records/${mvid2nim}`,
    method: "get",
  });
}

// 更新录音信息
function service_updateMedicalRecordInfoByMvid(
  mvid: string,
  is_confirmed: boolean,
  audiofile_local_path: string,
  record_status: string,
): AxiosPromise {
  const mvid2nim = parseInt(mvid);
  const data = {
    is_confirmed,
    audiofile_local_path,
    record_status,
  };
  return business_request({
    url: `/v1/medvisit/records/${mvid2nim}`,
    headers: {
      "Content-Type": "application/json",
    },
    method: "patch",
    data,
  });
}

// *******************************************   2. 转录编辑相关  *******************************************
// ********************** 1.1 转录列表 **********************
function service_getTaskList(
  pageIndex: number,
  pageSize: number,
  filter_visitor_id: string = "",
  filter_visitor_phone: string = "",
  filter_visitor_type: string = "-1",
  editStatus: number = -1,
): AxiosPromise {
  return business_request({
    url: `/v1/offline/stt/tasks?page_index=${pageIndex}&page_size=${pageSize}&filter_visitor_id=${filter_visitor_id}&filter_visitor_phone=${filter_visitor_phone}&filter_visitor_type=${filter_visitor_type}&filter_edit_status=${editStatus}`,
    method: "get",
  });
}

function service_deleteSTTTask(task_id: string): AxiosPromise {
  return business_request({
    url: `/v1/offline/stt/task/${task_id}`,
    method: "delete",
  });
}

function service_redoSTTTask(task_id: string): AxiosPromise {
  return business_request({
    url: `/v1/offline/stt/task/${task_id}/redo`,
    method: "post",
    headers: { "Content-Type": "application/json" },
    data: { task_id },
  });
}

// ********************** 1.2 转录编辑详情 **********************
function service_changeChannelInfo(
  task_id: number,
  data: { doctor_channel: number; patient_channel: number },
): AxiosPromise {
  return business_request({
    url: `/v1/offline/stt/tasks/${task_id}/role-channel-info`,
    method: "post",
    data,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
function service_delMedicalImage(
  task_id: number,
  attachment_id: number,
): AxiosPromise {
  return business_request({
    url: `/v1/offline/stt/tasks/${task_id}/emr/attachments/${attachment_id}`,
    method: "delete",
    headers: {
      "Content-Type": "application/json",
    },
  });
}
function service_getMedicalImageUploadUrl(
  task_id: number,
  data: FileInfo,
): AxiosPromise {
  return business_request({
    url: `/v1/offline/stt/tasks/${task_id}/emr/attachments/upload-oss-url`,
    method: "post",
    data,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
// 获取病历图片列表
function service_getMedicalImageList(task_id: number): AxiosPromise {
  return business_request({
    url: `/v1/offline/stt/tasks/${task_id}/emr/attachments`,
    method: "get",
  });
}

// 更新编辑状态
function service_updateAsrRstEditStatus(
  task_id: string,
  status: number,
): AxiosPromise {
  return business_request({
    url: `/v1/offline/stt/tasks/${task_id}/asr-rst/review-rst/asr-rst-edit-status`,
    method: "post",
    data: {
      asr_rst_edit_status: status,
    },
    headers: {
      "Content-Type": "application/json",
    },
  });
}
// 生成病历
function service_generateMedicalRecord(task_id: string): AxiosPromise {
  return business_request({
    url: `/v1/offline/stt/tasks/${task_id}/review-rst/ai-emr`,
    method: "post",
  });
}
// 更新任务对话内容
function service_updateTaskContent(
  task_id: string,
  chatList: any[],
): AxiosPromise {
  return business_request({
    url: `/v1/offline/stt/tasks/${task_id}/asr-rst/review-rst`,
    method: "post",
    data: { dialogues: chatList },
    headers: {
      "Content-Type": "application/json",
    },
  });
}

// 获取任务对话内容
function service_getDialoguesContent(task_id: string): AxiosPromise {
  return business_request({
    url: `/v1/offline/stt/task/${task_id}/asr-rst/diglogue`,
    method: "get",
  });
}

// 获取任务详情
function service_getTaskDetail(task_id: string): AxiosPromise {
  return business_request({
    url: `/v1/offline/stt/task/${task_id}`,
    method: "get",
  });
}

function service_getDetailJson(url: string): AxiosPromise {
  return business_request({
    url,
    method: "get",
  });
}

//// *******************************************   3. 采集信息相关  *******************************************

function service_getCollectInfoList(params: ListAPIParams): AxiosPromise {
  return business_request({
    url: `/v1/medvisit/inquiry/list`,
    method: "get",
    params,
    headers: { "Content-Type": "application/json" },
  });
}

function service_deleteCollectInfo(mv_inquiry_id: number): AxiosPromise {
  return business_request({
    url: `/v1/medvisit/inquiry/record/${mv_inquiry_id}`,
    method: "delete",
  });
}

function service_getCollectDialogInfo(mv_inquiry_id: number): AxiosPromise {
  return business_request({
    url: `/v1/medvisit/inquiry/record/${mv_inquiry_id}/dialogues`,
    method: "get",
  });
}

function service_collectInfoToMedicalRecord(
  mv_inquiry_id: number,
): AxiosPromise {
  return business_request({
    url: `/v1/medvisit/inquiry/record/${mv_inquiry_id}/ai-emr`,
    method: "post",
  });
}

function service_getDialogInfo(task_id: number): AxiosPromise {
  return business_request({
    url: `/v1/emrs/buildtasks/${task_id}/dialogues`,
    method: "get",
  });
}

// 获取采集二维码
function service_getCollectQrcodeUrl(): AxiosPromise {
  return business_request({
    url: `/v1/med-consultation/qrcode`,
    method: "post",
  });
}

// *******************************************   4. 病历生成相关  *******************************************

// *******************************************   5. 待分类的  *******************************************

function service_uploadFile(file: File, sha256: string): AxiosPromise {
  const formData = new FormData();
  formData.append("file", file);
  return business_request({
    url: `/v1/offline/stt/audiofile/upload?sha256=${sha256}`,
    method: "post",
    data: formData,
  });
}

function service_createSTTTask(
  visit_id: string,
  audio_file_name: string,
  audio_file_sha256: string,
  audio_duration_ms: number,
  upload_id: string,
): AxiosPromise {
  const taskData = {
    visit_id,
    audio_file_name,
    audio_file_sha256,
    audio_duration_ms,
    upload_id,
  };
  return business_request({
    url: "/v1/offline/stt/task",
    method: "post",
    headers: { "Content-Type": "application/json" },
    data: taskData,
  });
}

function service_getMedicalRecordList(
  pageIndex: number,
  pageSize: number,
  searchInput: string = "",
  aig_type = "audio",
): AxiosPromise {
  return business_request({
    url: `/v1/emrs/buildtasks?page_index=${pageIndex}&page_size=${pageSize}&aig_type=${aig_type}&search_input=${searchInput}`,
    method: "get",
  });
}

function service_deleteMedicalRecordTask(task_id: string): AxiosPromise {
  return business_request({
    url: `/v1/emrs/buildtasks/${task_id}`,
    method: "delete",
  });
}

/** 病历详情 */
function service_getMedicalRecordDetail(task_id: string): AxiosPromise {
  return business_request({
    url: `/v1/emrs/buildtasks/${Number(task_id)}`,
    method: "get",
  });
}

/** 病历打分规则 */
function service_getMedicalRecordScoreRule(): AxiosPromise {
  return business_request({
    url: `/v1/emrs/buildtask/ai_emr/score/rules`,
    method: "get",
  });
}

/** 获取上传的 OSS URL */
function service_getUploadOSSURL(
  task_id: string,
  data: RequestControlEmrUploadUrlParam,
): AxiosPromise {
  return business_request({
    url: `/v1/emrs/buildtasks/${task_id}/control-emr/upload-oss-url`,
    method: "post",
    headers: { "Content-Type": "application/json" },
    data,
  });
}

/** 上传医生的 doc 病历 */
async function service_uploadWordMedicalRecord(
  oss_upload_url: string,
  task_id: string,
  file: File,
  type: string,
) {
  return new Promise((resolve) => {
    const service = axios.create({}); // 临时创建 axios 实例，最后用自己写好的 request 基类
    service.put(oss_upload_url, file, {
      headers: {
        "Content-Type": type, // 设置文件的 MIME 类型
      },
      onUploadProgress: (progressEvent: any) => {
        // 可以监听上传进度
        const progress = Math.round(
          (progressEvent.loaded / progressEvent.total) * 100,
        );
        console.log(
          `${file.name} service_uploadWordMedicalRecord 把 docs 上传到阿里云进度: ${progress}%`,
        );
        if (progress === 100) {
          resolve(true);
        }
      },
    });
  });
}

/** 更新所有 AI 评分 */
function service_updateAIScore(
  task_id: string,
  data: ScoreEntity,
): AxiosPromise {
  return business_request({
    url: `/v1/emrs/buildtasks/${task_id}/ai_emr/score`,
    method: "post",
    headers: { "Content-Type": "application/json" },
    data,
  });
}

/** 更新医生上传的病历的评分 */
function service_updateDoctorRecordScore(
  task_id: string,
  data: ScoreEntity,
): AxiosPromise {
  return business_request({
    url: `/v1/emrs/buildtasks/${task_id}/control_emr/score`,
    method: "post",
    headers: { "Content-Type": "application/json" },
    data,
  });
}

/** 更新医生上传的病历的评 */
function service_getPreviewUrl(task_id: string): AxiosPromise {
  return business_request({
    url: `/v1/emrs/buildtasks/${task_id}/control-emr/previewurl`,
    method: "get",
    headers: { "Content-Type": "application/json" },
  });
}

// 注册登记号
const service_setVisitid = ({
  hsid,
  doctor_id,
  visit_id,
  visit_type,
}: {
  hsid: string;
  doctor_id: string;
  visit_id: string;
  visit_type: number;
}) => {
  return business_request({
    url: `/v1/std/hs/${hsid}/doctor/${doctor_id}/visit`,
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      visit_id: visit_id,
      visit_type: visit_type,
      department_room: "default_room",
    },
  });
};
// 获取录音链接
const service_getAudiourl = ({
  hsid,
  doctor_id,
  visit_id,
  mvid,
}: {
  hsid: string;
  doctor_id: string;
  visit_id: string;
  mvid: string;
}) => {
  return business_request({
    url: `/v1/std/hs/${hsid}/doctor/${doctor_id}/visit/${visit_id}/audiourl?mvid=${mvid}`,
    method: "get",
  });
};

// 确认录音有效
const service_setAudioConfirmed = ({
  hsid,
  doctor_id,
  visit_id,
  mvid,
  audioLocalPath,
  audiofileMachineId,
}: {
  hsid: string;
  doctor_id: string;
  visit_id: string;
  mvid: string;
  audioLocalPath: string;
  audiofileMachineId: string;
}) => {
  return business_request({
    url: `/v1/std/hs/${hsid}/doctor/${doctor_id}/visit/${visit_id}?mvid=${mvid}`,
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      is_confirmed: true,
      audiofile_local_path: audioLocalPath,
      audiofile_machine_id: audiofileMachineId,
    },
  });
};

interface RequestControlEmrUploadUrlParam {
  filename: string;
  visit_id: string;
  filecontent_sha256: string;
  filetype: string;
}

export {
  // 录音相关
  service_createMedicalRecord,
  service_updateMedicalRecordInfoByMvid,
  service_getMedicalRecordInfoByMvid,
  service_getAudioList,
  service_getDepartment,
  service_getRecordDetail,
  service_getUnSyncedAudioList,
  service_deleteRecord,
  service_patchAudioSyncTaskStatusToServer,
  // 转录编辑
  service_redoSTTTask,
  service_deleteSTTTask,
  service_getTaskList,
  service_changeChannelInfo,
  service_delMedicalImage,
  service_getMedicalImageUploadUrl,
  service_getMedicalImageList,
  service_getTaskDetail,
  service_getDetailJson,
  service_getDialoguesContent,
  service_updateTaskContent,
  service_generateMedicalRecord,
  service_updateAsrRstEditStatus,
  // 采集信息
  service_getCollectInfoList,
  service_deleteCollectInfo,
  service_collectInfoToMedicalRecord,
  service_getCollectDialogInfo,
  service_getDialogInfo,
  service_getCollectQrcodeUrl,
  // 以后还没分好类
  service_uploadFile,
  service_createSTTTask,
  service_getMedicalRecordList,
  service_deleteMedicalRecordTask,
  service_getMedicalRecordDetail,
  service_getMedicalRecordScoreRule,
  service_getUploadOSSURL,
  service_uploadWordMedicalRecord,
  service_updateAIScore,
  service_updateDoctorRecordScore,
  service_getPreviewUrl,
  service_setVisitid,
  service_getAudiourl,
  service_setAudioConfirmed,
};
