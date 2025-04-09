import React, { useState, useEffect, useRef, useContext } from "react";
import {
  Row,
  Col,
  Card,
  Divider,
  Flex,
  Button,
  Modal,
  Upload,
  UploadProps,
  message,
  Spin,
} from "antd";
import style from "./medicalRecordDetail.module.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeftOutlined,
  LoadingOutlined,
  PlusOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Typography } from "antd";
import ScoreUnit from "@/components/ScoreUnit/ScoreUnit";
import {
  IScoreVO,
  MedicalRecordGenerationStatus,
  MedicalRecordVO,
  MedicalRecordVOForDescription,
  ScoreEntity,
} from "@/common/types";
import type { GetProp } from "antd";
import {
  service_getMedicalRecordDetail,
  service_getMedicalRecordScoreRule,
  service_getPreviewUrl,
  service_getUploadOSSURL,
  service_updateAIScore,
  service_updateDoctorRecordScore,
  service_uploadWordMedicalRecord,
} from "@/service/business_service";
import ScoreRules from "./scoreRules";
import { getFileSHA256 } from "@/utils/fileUtil";
import { aliCloudLog } from "@/service/aliCloudLog";
import DoctorRecordScoreUnit from "@/components/DoctorRecordScoreUnit/DoctorRecordScoreUnit";
import { fixPdfUrl, produceObj } from "@/utils/objectUtils";
import PdfViewer from "@/components/PdfViewer";
import { AuthContext } from "@/state/auth/authContext";
import DialogInfoModal from "@/components/DialogInfoModal";

const { Text, Title } = Typography;

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

const wordTypeDict: { [key: string]: string } = {
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

const MixedThreeRecords = [
  "personal_history",
  "marital_and_reproductive_history",
  "family_history",
];
const KeyOfMixedThree =
  "personal_history_marital_reproductive_history_family_history";

/** 有些乱，有空再整理 */
const MedicalRecordDetail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { state } = useContext(AuthContext) as any;

  // 全局数据
  const [visit_id, setVisit_id] = useState("");
  const [rules, setRules] = useState<any[]>([]);

  /** taskId */
  const refTaskId = useRef("");

  // 关于 UI
  const [modelUnits, setModelUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /** 医生病历 pdf url */
  const [doctorRecordUrl, setDoctorRecordUrl] = useState("");

  // 模型得分
  const [modelScoresDict, setModelScoresDict] = useState<ScoreEntity>(
    {} as ScoreEntity,
  );
  const [modelTotalScore, setModelTotalScore] = useState(0);

  // 医生病历得分
  const [doctorRecordScoresDict, setDoctorRecordScoresDict] =
    useState<ScoreEntity>({} as ScoreEntity);
  const [doctorRecordTotalScore, setdDctorRecordTotalScore] = useState(0);

  const [
    needToUpdateModelScoresAfterMount,
    setNeedToUpdateModelScoresAfterMount,
  ] = useState(false);
  const [
    needToUpdateDoctorScoresAfterMount,
    setNeedToUpdateDoctorScoresAfterMount,
  ] = useState(false);

  const [isDialogModalOpen, setIsDialogModalOpen] = useState(false);

  // 初始化
  useEffect(() => {
    init();
    initSSE();
    return () => {
      if (eventSourceRef.current) {
        aliCloudLog("medicalRecordDetail sse close" + state.accountName);
        eventSourceRef.current.close();
      }
    };
  }, []);

  const beforeUpload = async (value: FileType) => {
    const { type } = value as any;
    const isWord = Object.keys(wordTypeDict).includes(type);
    return isWord;
  };

  // 更新 模型 总分
  useEffect(() => {
    const sum = Object.values(modelScoresDict).reduce(
      (pre, cur) => pre + cur,
      0,
    );
    setModelTotalScore(sum);
  }, [modelScoresDict]);

  // 更新 医生病历 总分
  useEffect(() => {
    const sum = Object.values(doctorRecordScoresDict).reduce(
      (pre, cur) => pre + cur,
      0,
    );
    setdDctorRecordTotalScore(sum);
  }, [doctorRecordScoresDict]);

  const [modelRecordGenerationStatus, setModelRecordGenerationStatus] =
    useState("");

  /** 获取模型病历 */
  const getModelRecord = async () => {
    const res_detail = await service_getMedicalRecordDetail(refTaskId.current);
    if (res_detail.data.data.status === "success") {
      setModelRecordGenerationStatus(MedicalRecordGenerationStatus.Success);
      init(); // TODO 这里有重复执行的问题，有空再处理
    }
  };

  /** 这个得拆 */
  const init = async () => {
    // 1 获取评分规则
    const res_rules = await service_getMedicalRecordScoreRule();
    const rules = res_rules.data?.data || {};
    setRules(rules);

    // 2 模型得分 Dict
    const _modelScoresDict: ScoreEntity = {} as ScoreEntity;
    Object.keys(rules).forEach((key: string) => {
      _modelScoresDict[key] = 0;
    });
    setModelScoresDict(_modelScoresDict);
    setDoctorRecordScoresDict(_modelScoresDict);

    // 3 模型病历 list
    const taskId = searchParams.get("taskId") || "";
    refTaskId.current = taskId;
    const res_detail = await service_getMedicalRecordDetail(taskId);
    const {
      aig_emr,
      visit_id,
      aig_emr_score_info,
      control_emr_score_info,
      control_emr_preview_url,
      status,
    } = res_detail.data.data;
    if (status === "success") {
      setModelRecordGenerationStatus(MedicalRecordGenerationStatus.Success);
    } else if (status === "failed") {
      setModelRecordGenerationStatus(MedicalRecordGenerationStatus.Fail);
      // setTimeout(() => {
      //     navigate('/application/asrList', { replace: true });
      // }, 3000);
    } else if (status === "doing") {
      setModelRecordGenerationStatus(MedicalRecordGenerationStatus.Doing);
    }

    // 4 回显模型总分
    setModelTotalScore(aig_emr_score_info?.score ?? 0);

    // 4.1 恢复模型各项得分数据
    const modelScores = aig_emr_score_info?.score_detail || {};
    if (Object.keys(modelScores).length > 0) {
      const score = produceObj(_modelScoresDict, modelScores);
      setNeedToUpdateModelScoresAfterMount(true);
      setModelScoresDict(score);
    }

    // 5 回显医生评分总分
    setdDctorRecordTotalScore(control_emr_score_info?.score ?? 0);

    // 5.1 恢复医生各项得分数据
    const doctorScores = control_emr_score_info?.score_detail || {};
    if (Object.keys(modelScores).length > 0) {
      const score = produceObj(_modelScoresDict, doctorScores);
      setNeedToUpdateDoctorScoresAfterMount(true);
      setDoctorRecordScoresDict(score);
    }

    // visit_id
    const list: any[] = aig_emr;
    setVisit_id(visit_id);

    // 6 回显医生病历 pdf
    const doctorPdfRecordUrl = fixPdfUrl(control_emr_preview_url);
    if (doctorPdfRecordUrl) {
      setDoctorRecordUrl(doctorPdfRecordUrl);
    }

    // 7 把个人史、婚育史、家族史三项合并评分
    // 7.1 抽出婚育史、家族史、个人史
    const mixedThreeList: MedicalRecordVO[] = list.filter(
      (v: MedicalRecordVO) => MixedThreeRecords.includes(v.en_name),
    );
    const recordVO: MedicalRecordVO = {
      en_name: KeyOfMixedThree,
      value: "",
      cn_name: "",
      children: mixedThreeList,
    };

    // 7.2 过滤
    const filteredList: MedicalRecordVO[] = list.filter(
      (v: MedicalRecordVO) => !MixedThreeRecords.includes(v.en_name),
    );

    // 7.3 插入位置
    const insertIndex = filteredList.findIndex(
      (v: MedicalRecordVO) => v.en_name === "auxiliary_examination",
    );
    filteredList.splice(insertIndex, 0, recordVO);

    // 7.4 整理结构
    const _modelUnits = filteredList.map((unit: MedicalRecordVO) => {
      const children = unit?.children || [];
      const maxScore = rules[unit.en_name]?.max ?? 0;
      // TODO 下面两类合为一类，回头再说
      if (children.length > 0) {
        // 有子项的项目
        const title = unit.cn_name;
        const items = unit.children.map((sub: MedicalRecordVO) => {
          return {
            key: sub.en_name,
            label: sub.cn_name,
            children: sub.value,
          };
        });
        return {
          title,
          items,
          maxScore,
          en_name: unit.en_name,
          scoreItemName: unit.en_name,
          column: unit.en_name === KeyOfMixedThree ? 1 : 3,
          defaultModelScore:
            unit.en_name === KeyOfMixedThree
              ? aig_emr_score_info?.score_detail[KeyOfMixedThree]
              : aig_emr_score_info?.score_detail[unit.en_name],
          defaultDoctorScore:
            unit.en_name === KeyOfMixedThree
              ? control_emr_score_info?.score_detail[KeyOfMixedThree]
              : control_emr_score_info?.score_detail[unit.en_name],
        };
      } else {
        // 没有子项的项目
        return {
          title: "",
          items: [
            {
              key: unit.en_name,
              label: unit.cn_name,
              children: <Text>{unit?.value}</Text>,
            },
          ],
          column: 1,
          scoreItemName: unit.en_name,
          maxScore,
          defaultModelScore: aig_emr_score_info?.score_detail[unit.en_name],
          defaultDoctorScore:
            control_emr_score_info?.score_detail[unit.en_name],
        };
      }
    });
    setModelUnits(_modelUnits);
  };

  const eventSourceRef = useRef<EventSource>();
  const initSSE = () => {
    eventSourceRef.current = new EventSource(
      `${import.meta.env.VITE_EVENT_SOURCE_BASE_URL}/v1/stream/msg/status`,
    );
    eventSourceRef.current.onopen = () => {
      aliCloudLog("MedicalRecordDetail sse onopen" + state.accountName);
    };
    eventSourceRef.current.onerror = () => {
      aliCloudLog("MedicalRecordDetail sse onerror" + state.accountName);
    };
    eventSourceRef.current.addEventListener("connecttime", (evt) => {
      aliCloudLog(
        "MedicalRecordDetail sse connecttime" +
          JSON.parse(evt.data) +
          state.accountName,
      );
    });
    eventSourceRef.current.onmessage = async (evt) => {
      const value = JSON.parse(evt.data);
      aliCloudLog(
        "MedicalRecordDetail sse onmessage" + value + state.accountName,
      );
      const { aig_emr_task_id, event, status } = value;
      if (
        aig_emr_task_id.toString() !== refTaskId.current.toString() ||
        status !== "success"
      ) {
        return;
      }
      if (event === "convert_document_format_docx_to_pdf") {
        // docx 转为 pdf 成功
        getDoctorRecordPdfUrl();
      } else if (event === "aig_emr_task") {
        // 模型病历生成成功
        getModelRecord();
      }
    };
  };

  const getDoctorRecordPdfUrl = async () => {
    const rsp = await service_getPreviewUrl(refTaskId.current);
    let { control_emr_preview_url } = rsp.data.data;
    control_emr_preview_url = fixPdfUrl(control_emr_preview_url);
    setDoctorRecordUrl(control_emr_preview_url);
  };

  /** 模型单个评分 回调 */
  const onModelOneScoreChange = (vo: IScoreVO) => {
    setModelScoresDict((pre) => {
      const _pre = { ...pre };
      _pre[vo.name] = vo.score;
      return _pre;
    });
  };

  /** 模型评分更新到后端 */
  const updateModelScoresToServer = async (
    task_id: string,
    scores: ScoreEntity,
  ) => {
    const rsp = await service_updateAIScore(task_id, scores);
    aliCloudLog(
      "MedicalRecordDetail service_updateAIScore rsp=" +
        rsp +
        state.accountName,
    );
    // if (rsp.status === 200) {
    //     message.success('模型得分更新成功');
    // }
  };

  /** 监听 7 项模型评分都评完 */
  useEffect(() => {
    if (needToUpdateModelScoresAfterMount) {
      setNeedToUpdateModelScoresAfterMount(false);
      return;
    }
    const isAllScorePositive =
      Object.values(modelScoresDict).length > 0 &&
      Object.values(modelScoresDict).every((v) => v > 0);
    if (isAllScorePositive) {
      updateModelScoresToServer(refTaskId.current, modelScoresDict);
    }
  }, [modelScoresDict]);

  /** 医生 单个评分更新 */
  const onDoctorRecordScoreHandle = (vo: IScoreVO) => {
    setDoctorRecordScoresDict((pre) => {
      const _pre = { ...pre };
      _pre[vo.name] = vo.score;
      return _pre;
    });
  };

  /** 更新医生病历评分 */
  const updateDoctorScoresToServer = async (
    taskId: string,
    scores: ScoreEntity,
  ) => {
    const rsp = await service_updateDoctorRecordScore(taskId, scores);
    aliCloudLog(
      "MedicalRecordDetail service_updateDoctorRecordScore rsp=" +
        rsp +
        state.accountName,
    );
    if (rsp.status === 200) {
      // message.success('医生病历评分成功');
    }
  };

  /** 医生病历，监听到 7 项评分都评完 */
  useEffect(() => {
    if (needToUpdateDoctorScoresAfterMount) {
      setNeedToUpdateDoctorScoresAfterMount(false);
      return;
    }
    const isAllScorePositive =
      Object.values(doctorRecordScoresDict).length > 0 &&
      Object.values(doctorRecordScoresDict).every((v) => v > 0);
    if (isAllScorePositive) {
      updateDoctorScoresToServer(refTaskId.current, doctorRecordScoresDict);
    }
  }, [doctorRecordScoresDict]);

  /** 上传了 docx，更新 pdf */
  const handleChange: UploadProps["onChange"] = async (info: any) => {
    setDoctorRecordUrl("");
    const { status, originFileObj, name, type } = info.file;
    // 偶尔有这里同时调用两次的情况，应该忽略第二次，2024-10-24没有重现，再出现再说
    aliCloudLog("Upload handleChange ~ status:" + status + state.accountName);
    if (status === "uploading") {
      setLoading(true);
      // 获取上传 oss url
      const taskId = searchParams.get("taskId") || "";
      const sha256 = await getFileSHA256(originFileObj as File);
      const filetype = wordTypeDict[type as string];
      const res_ossUrl = await service_getUploadOSSURL(taskId, {
        filename: name,
        visit_id: visit_id,
        filecontent_sha256: sha256,
        filetype,
      });
      const { upload_oss_url } = res_ossUrl.data.data;
      const rsp_uploadWordMedicalRecord_flag =
        await service_uploadWordMedicalRecord(
          upload_oss_url,
          taskId,
          originFileObj as File,
          type as string,
        );
      aliCloudLog(
        "MedicalRecordDetail 上传 docx 是否成功 =" +
          rsp_uploadWordMedicalRecord_flag +
          state.accountName,
      );
      if (rsp_uploadWordMedicalRecord_flag) {
        setLoading(false);
        message.success("上传成功，正在由 .docx 转换成 .pdf");
      }
    }
  };

  const handleCustomRequest = (evt: any) => {
    console.warn("MedicalRecordDetail handleCustomRequest evt=", evt);
  };

  return (
    <div className={style.baseRecordDetail}>
      <Row
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Col>
          <Button
            onClick={() => {
              navigate("/application/medicalRecordList");
            }}
            icon={<ArrowLeftOutlined />}
          >
            退出
          </Button>
        </Col>
        <Col>
          <Text
            underline
            onClick={() => setIsDialogModalOpen(true)}
            style={{ cursor: "pointer", marginLeft: 24 }}
          >
            对话信息
          </Text>
          <Text
            underline
            onClick={() => {
              Modal.info({
                title: "评分标准",
                centered: true,
                width: 800,
                maskClosable: true,
                footer: null,
                okText: "我知道了",
                content: <ScoreRules></ScoreRules>,
                onOk() {},
              });
            }}
            style={{ cursor: "pointer", marginLeft: 24 }}
          >
            评分标准
          </Text>
          <Text
            style={{ color: "#339352" }}
          >{`    ( 7 项全打分，总分才会更新到数据库 )`}</Text>
        </Col>
      </Row>

      <Flex justify="space-evenly">
        {/* 1 左面 div */}
        <div style={{ width: "60%", display: "flex", flexDirection: "column" }}>
          <Flex justify="space-between" align="flex-end">
            <Title level={5} style={{ marginBottom: 0 }}>
              模型生成病历
            </Title>
            <Title style={{ color: "#339352", marginBottom: 0 }} level={5}>
              {`总分: ${modelTotalScore}`}
            </Title>
          </Flex>
          <Card style={{ marginTop: 8, flex: 1 }} actions={undefined}>
            {modelRecordGenerationStatus ===
              MedicalRecordGenerationStatus.Success &&
              modelUnits.map(
                (unit: MedicalRecordVOForDescription, index: number) => {
                  const {
                    items,
                    title,
                    maxScore,
                    column,
                    scoreItemName,
                    defaultModelScore,
                  } = unit;
                  return (
                    <React.Fragment key={index}>
                      <ScoreUnit
                        items={items}
                        title={title}
                        maxScore={maxScore}
                        onScoreChanged={onModelOneScoreChange}
                        column={column}
                        scoreItemName={scoreItemName}
                        defaultValue={defaultModelScore}
                      ></ScoreUnit>
                      {index !== modelUnits.length - 1 && <Divider></Divider>}
                    </React.Fragment>
                  );
                },
                [],
              )}
            {modelRecordGenerationStatus ===
              MedicalRecordGenerationStatus.Doing && (
              <div
                style={{
                  width: "100%",
                  height: "570px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
                />
                <Text style={{ marginTop: 24 }}>正在生成模型病历</Text>
              </div>
            )}
            {modelRecordGenerationStatus ===
              MedicalRecordGenerationStatus.Fail && (
              <div
                style={{
                  width: "100%",
                  height: "570px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "#ff4d4f",
                }}
              >
                <WarningOutlined style={{ fontSize: 48 }} />
                <Text style={{ marginTop: 24 }}>生成模型病历失败</Text>
                {/* <Text style={{ marginTop: 0 }}>3 秒后会跳转到转录编辑页</Text>
                                <Text style={{ marginTop: 0 }}>请重新生成</Text> */}
              </div>
            )}
          </Card>
        </div>

        {/* 2 右面 div */}
        <div
          style={{
            width: "40%",
            marginLeft: 16,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* 2.1 上面的 Header  */}
          <Flex justify="space-between" align="flex-end">
            <Title level={5} style={{ marginBottom: 0 }}>
              医生病历
            </Title>
            <Title style={{ color: "#339352", marginBottom: 0 }} level={5}>
              {`总分: ${doctorRecordTotalScore}`}
            </Title>
          </Flex>
          {/* 2.2 下面的 Card */}
          <Card
            style={{ marginTop: 8, flex: 1 }}
            styles={{
              body: {
                alignItems: "flex-start",
                display: "flex",
                flexDirection: "row",
                paddingLeft: 24,
              },
            }}
          >
            {/* 2.2.1 左侧的 pdf */}
            <Flex
              vertical
              align="center"
              style={{
                flex: 1,
                paddingTop: doctorRecordUrl ? 0 : 184,
                height: "100%",
              }}
            >
              {doctorRecordUrl && (
                //  doctorRecordUrl 从 'xxx' 变为 'yyy' 时，React 会认为 <div> 和 <PdfViewer> 是新渲染的组件，实际上是一个新的 UI 实例
                <div style={{ flex: 1 }}>
                  <PdfViewer
                    url={doctorRecordUrl}
                    scale={0.35}
                    toPreview={() => {
                      Modal.info({
                        title: "医生病历预览",
                        centered: true,
                        width: 1000,
                        maskClosable: true,
                        footer: null,
                        okText: "我知道了",
                        content: (
                          <PdfViewer
                            url={doctorRecordUrl}
                            scale={1.2}
                          ></PdfViewer>
                        ),
                        onOk() {},
                      });
                    }}
                  ></PdfViewer>
                </div>
              )}
              <Upload
                name="doctor-medical-record"
                accept=".docx"
                listType="picture-circle"
                className={style.doctorMedicalRecordUploader}
                showUploadList={false}
                beforeUpload={beforeUpload}
                onChange={handleChange}
                customRequest={handleCustomRequest}
              >
                <button style={{ border: 0, background: "none" }} type="button">
                  {loading ? <LoadingOutlined /> : <PlusOutlined />}
                  <div style={{ marginTop: 8 }}>Upload</div>
                </button>
              </Upload>
              <Text
                style={{
                  marginTop: 16,
                  color: "#339352",
                  fontWeight: "bold",
                }}
              >{`${doctorRecordUrl ? "重新" : ""}上传对照病历`}</Text>
              <Text style={{ textAlign: "center" }}>
                仅支持有医院结构化数据的 .docx 文件{" "}
              </Text>
            </Flex>

            {/* 2.2.2 右面的打分 */}
            <Flex vertical style={{ width: 120, marginLeft: 16 }}>
              {modelUnits.map(
                (unit: MedicalRecordVOForDescription, index: number) => {
                  const { title, maxScore, scoreItemName, defaultDoctorScore } =
                    unit;
                  return (
                    <React.Fragment key={index}>
                      <DoctorRecordScoreUnit
                        title={title}
                        maxScore={maxScore}
                        onScoreChanged={onDoctorRecordScoreHandle}
                        scoreItemName={scoreItemName}
                        rules={rules}
                        defaultScore={defaultDoctorScore}
                      ></DoctorRecordScoreUnit>
                    </React.Fragment>
                  );
                },
                [],
              )}
            </Flex>
          </Card>
        </div>
      </Flex>

      <DialogInfoModal
        id={refTaskId.current}
        entrypoint={"record"}
        isDialogModalOpen={isDialogModalOpen}
        setIsDialogModalOpen={setIsDialogModalOpen}
      />
    </div>
  );
};

export default MedicalRecordDetail;
