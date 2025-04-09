interface IAudio {
  mvid: string;
  department_room: string;
  saveTime: string;
  doctor_name: string;
  doctor_id: string;
  hsid: string;
  visit_id: string;
  created_time: string;
  record_audio_url: string;
  visit_type: string;
  audiofile_machine_id: string;
  audiofile_local_path: string;
  /** 同步状态 */
  sync_status_str: string;
  /** 录音中 */
  record_status_str: string;
}

const MedicalMethod = ["", "门诊", "住院"];
const MedicalMethodList = [
  { label: "门诊", value: "outpatient" },
  { label: "住院", value: "inpatient" },
];

const RecordStatusEnToCnDict = {
  all: "全部",
  in_progress: "录音中",
  paused: "录音已暂停",
  completed: "录音已完成",
  failed: "录音失败",
};

const SyncStatusEnToCnDict = {
  all: "全部",
  not_ready: "录音未完成",
  pending: "待同步",
  in_progress: "同步中",
  completed: "同步已完成",
  failed: "同步失败",
};

const GenderEnToCn = {
  female: "女",
  male: "男",
};
interface ISyncAudioFile {
  mvid: string;
  audiofile_local_path: string;
}

export type { IAudio, ISyncAudioFile };
export {
  MedicalMethod,
  MedicalMethodList,
  RecordStatusEnToCnDict,
  SyncStatusEnToCnDict,
  GenderEnToCn,
};
