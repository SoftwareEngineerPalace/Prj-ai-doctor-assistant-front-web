interface IScoreVO {
  score: number;
  name: string;
}

interface MedicalRecordVO {
  en_name: string;
  cn_name: string;
  value: string;
  children: MedicalRecordVO[];
}

interface MedicalRecordVOForDescription {
  title: string;
  items: any[];
  maxScore: number;
  column: number;
  /** 要被评分的项目的名字 */
  scoreItemName: string;
  /** 模型评分 默认值 */
  defaultModelScore: number;
  /** 医生评分 默认值 */
  defaultDoctorScore: number;
}

interface ScoreEntity {
  basic_information: number;
  chief_complaint: number;
  present_illness: number;
  past_history: number;
  personal_history_marital_reproductive_history_family_history: number;
  auxiliary_examination: number;
  admission_diagnosis: number;
  [key: string]: number;
}

enum MedicalRecordGenerationStatus {
  Success = "Success",
  Fail = "Fail",
  Doing = "Doing",
}

export {
  IScoreVO,
  MedicalRecordVO,
  MedicalRecordVOForDescription,
  ScoreEntity,
  MedicalRecordGenerationStatus,
};
