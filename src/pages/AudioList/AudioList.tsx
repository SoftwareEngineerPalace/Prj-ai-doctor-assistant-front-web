import {
  Button,
  Form,
  Row,
  Input,
  Select,
  Table,
  Card,
  Empty,
  Col,
  Popconfirm,
  message,
} from "antd";
import React, { useContext, useEffect, useRef, useState } from "react";
import "./AudioList.less";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import classNames from "classnames";
// import { getPageCount } from '@/utils/pageUtil';

import {
  service_deleteRecord,
  service_getAudioList,
  service_getUnSyncedAudioList,
  service_patchAudioSyncTaskStatusToServer,
} from "@/service/business_service";
import { AuthContext } from "@/state/auth/authContext";
import queryString from "query-string";
import {
  GenderEnToCn,
  IAudio,
  ISyncAudioFile,
  MedicalMethod,
  RecordStatusEnToCnDict,
  SyncStatusEnToCnDict,
} from "@/common/const";
import { aliCloudLog } from "../../service/aliCloudLog";
import {
  service_deleteLocalAudioFile,
  service_syncLocalAudioToCloud,
} from "@/service/local_server_service";
import { debounce } from "lodash";
import { useNavigate } from "react-router-dom";
import { RecordContext } from "@/state/record/recordContext";

const DefaultPageSize = 10;

function AudioList() {
  const { state } = useContext(AuthContext) as any;
  const { audioListPageIndex, setAudioListPageIndex } = useContext(
    RecordContext,
  ) as any;
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const { doctorId, machineCode } = state;
  const [audioList, setAudioList] = React.useState<any[]>([]);
  const [visitTypeList] = React.useState<any[]>([
    { label: "全部", value: 0 },
    { label: "门诊", value: 1 },
    { label: "住院", value: 2 },
  ]);
  /** 注意第一页序号是 1 */
  // const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DefaultPageSize);
  const [audioCount, setAudioCount] = useState(5);
  const [visitId, setVisitId] = useState<string>("");
  const [visitType, setVisitType] = useState<number>(0);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [recordStatus, setRecordStatus] = useState<string>("all");
  const [syncStatus, setSyncStatus] = useState<string>("all");
  const mounted = React.useRef(false);

  // console.log('AudioList render audioListPageIndex', audioListPageIndex);

  // 下面两个 useEffect 是有顺序的
  useEffect(() => {
    if (mounted.current) {
      // console.log('AudioList useEffect 第一处');
      getAudioList();
    }
  }, [
    audioListPageIndex,
    pageSize,
    visitId,
    visitType,
    phoneNumber,
    recordStatus,
    syncStatus,
  ]);

  useEffect(() => {
    // TODO 要修
    if (mounted.current) return;
    mounted.current = true;
    // console.log('AudioList useEffect 第二处');
    getAudioList();

    // 测试用例，模拟同步完成事件
    // setTimeout(() => {
    //     updateSyncStatus(['1990'], 'sync_status_str', 'completed');
    // }, 3000);

    initSSE();
    return () => {
      if (eventSourceRef.current) {
        aliCloudLog("AudioList sse close" + state.accountName);
        eventSourceRef.current.close();
      }
    };
  }, []);

  const eventSourceRef = useRef<EventSource>();
  const initSSE = () => {
    // console.log('AudioList initSSE', state.accountName);
    eventSourceRef.current = new EventSource(
      `${import.meta.env.VITE_EVENT_SOURCE_BASE_URL}/v1/stream/msg/status`,
    );
    eventSourceRef.current.onopen = () => {
      aliCloudLog("AudioList sse onopen" + state.accountName);
      console.log("AudioList sse onopen", state.accountName);
    };
    eventSourceRef.current.onerror = (e: any) => {
      aliCloudLog("AudioList sse onerror" + state.accountName);
      console.log(
        "AudioList sse onerror",
        JSON.stringify(e),
        state.accountName,
      );
    };
    eventSourceRef.current.addEventListener("connecttime", (evt) => {
      aliCloudLog(
        "AudioList sse connecttime" + JSON.parse(evt.data) + state.accountName,
      );
      console.log(
        "AudioList sse connecttime",
        JSON.stringify(evt.data) + state.accountName,
      );
    });
    eventSourceRef.current.onmessage = async (evt) => {
      const value = JSON.parse(evt.data);
      console.log("AudioList sse onmessage", value, state.accountName);
      aliCloudLog("AudioList sse onmessage", value + state.accountName);
      const { mvid, event, status } = value;
      if (event === "machine_audiofile_upload" && status === "success") {
        // 同步成功
        updateSyncStatus([mvid.toString()], "sync_status_str", "completed");
        // messageApi.success('同步成功');
      }
    };
  };

  const updateSyncStatus = (
    targetMvidList: string[],
    attrName: string,
    attrVal: string,
  ) => {
    console.log(
      "AudioList updateSyncStatus targetMvidList=",
      targetMvidList,
      attrName,
      attrVal,
    );
    setAudioList((prevAudioList) =>
      prevAudioList.map((audio) => {
        if (targetMvidList.includes(audio.mvid.toString())) {
          console.log(
            "AudioList updateSyncStatus  把 mvid=",
            audio.mvid,
            "的属性",
            attrName,
            "改为",
            attrVal,
          );
          return {
            ...audio,
            [`${attrName}`]: attrVal,
          };
        } else {
          return audio;
        }
      }),
    );
  };

  const [filterForm] = Form.useForm();

  const startRecord = React.useCallback(() => {
    const search = queryString.stringify({
      recordStatus: "create",
    });
    navigate(`/application/recordBoard?${search}`);
  }, []);

  /** TODO Debounce */
  const onVisitIdChange = debounce((e: any) => {
    console.log("AudioList onVisitIdChange setAudioListPageIndex 1");
    setAudioListPageIndex(1);
    setVisitId(e.target.value);
  }, 500);

  const onPhoneNumberChange = debounce((e: any) => {
    const phoneNumber = e.target.value;
    console.log("AudioList onPhoneNumberChange setAudioListPageIndex 1");
    setAudioListPageIndex(1);
    setPhoneNumber(phoneNumber);
  }, 500);

  const onRecordStatusChange = (status: string) => {
    console.log("onRecordStatusChange", status);
    setRecordStatus(status);
  };

  const onSyncStatusChange = (status: string) => {
    console.log("onSyncStatusChange", status);
    setSyncStatus(status);
  };

  const onVisitTypeChange = (value: any) => {
    console.log("AudioList onVisitTypeChange setAudioListPageIndex 1");
    setAudioListPageIndex(1);
    setVisitType(value);
  };

  const getAudioList = React.useCallback(async () => {
    const param = {
      page_index: audioListPageIndex,
      page_size: pageSize,
      s_visitor_phone: phoneNumber,
      s_visit_id: visitId,
      s_visit_type: visitType,
      s_record_status: recordStatus,
      s_sync_status: syncStatus,
    };
    try {
      const {
        data: { data, total },
      } = await service_getAudioList(param);
      // console.log(`service_getAudioList 入参=${JSON.stringify(param)} 返回的列表长度=${data?.length}` + state.accountName);
      aliCloudLog(
        `service_getAudioList 入参=${JSON.stringify(param)} 返回的列表长度=${data?.length}` +
          state.accountName,
      );
      setAudioCount(total);
      setAudioList(data);
    } catch (error) {
      aliCloudLog(
        `service_getAudioList 入参=${JSON.stringify(param)} 报错=${JSON.stringify(error)}` +
          state.accountName,
      );
    }
  }, [
    phoneNumber,
    doctorId,
    audioListPageIndex,
    pageSize,
    visitId,
    visitType,
    recordStatus,
    syncStatus,
    state.accountName,
  ]);

  const deleteRecord = async (mvid: string, audiofile_local_path: string) => {
    // 删除线上的
    const deleteRecord_rsp = await service_deleteRecord(mvid);
    console.log("AudioList deleteRecord deleteRecord_rsp=", deleteRecord_rsp);
    // 删除本地的
    const deleteLocalRecord_rsp =
      await service_deleteLocalAudioFile(audiofile_local_path);
    console.log(
      "AudioList deleteRecord deleteLocalRecord_rsp=",
      deleteLocalRecord_rsp,
    );
    getAudioList();
    messageApi.success("删除成功");
    return true; // TODO 应该返回 true 吗
  };

  const columns: ColumnsType<IAudio> = [
    {
      title: "编号",
      dataIndex: "mvid",
      key: "mvid",
      align: "center",
      width: 80,
      render: (text) => (
        <span
          style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "登记号",
      dataIndex: "visit_id",
      key: "visit_id",
      align: "center",
      width: 80,
      render: (text) => (
        <span
          style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "手机号",
      dataIndex: "visitor_phone",
      key: "visitor_phone",
      align: "center",
      width: 80,
      render: (text) => (
        <span
          style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}
        >
          {text || "—"}
        </span>
      ),
    },
    {
      title: "性别",
      dataIndex: "visitor_gender",
      key: "visitor_gender",
      align: "center",
      width: 80,
      render: (text) => (
        <span style={{ whiteSpace: "nowrap" }}>
          {text ? GenderEnToCn[text as keyof typeof GenderEnToCn] : "—"}
        </span>
      ),
    },
    {
      title: "年龄",
      dataIndex: "visitor_age",
      key: "visitor_age",
      align: "center",
      width: 80,
      render: (text) => (
        <span style={{ whiteSpace: "nowrap" }}>{text ?? "—"}</span>
      ),
    },
    {
      title: "就诊方式",
      dataIndex: "visit_type",
      key: "visit_type",
      align: "center",
      width: 80,
      render: (text) => <span>{MedicalMethod[parseInt(text)]}</span>,
    },
    {
      title: "医院",
      dataIndex: "hospital_name",
      key: "hospital_name",
      align: "center",
      width: 80,
      render: (text) => <span>{text}</span>,
    },
    // 没有排序时间的需求
    {
      title: "采集完成时间",
      dataIndex: "inquiry_finished_time",
      key: "inquiry_finished_time",
      align: "center",
      width: 100,
      render: (text) => (
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {text
            ? dayjs(text).add(8, "hour").format("YYYY-MM-DD HH:mm:ss")
            : "—"}
        </span>
      ),
    },
    {
      title: "录音状态",
      dataIndex: "record_status_str",
      key: "record_status_str",
      align: "center",
      width: 80,
      render: (text: string) => (
        <span style={{ whiteSpace: "nowrap" }}>
          {RecordStatusEnToCnDict[text as keyof typeof RecordStatusEnToCnDict]}
        </span>
      ),
    },
    {
      title: "同步状态",
      dataIndex: "sync_status_str",
      key: "sync_status_str",
      align: "center",
      width: 80,
      render: (text: string) => (
        <span style={{ whiteSpace: "nowrap" }}>
          {text !== "not_ready"
            ? SyncStatusEnToCnDict[text as keyof typeof SyncStatusEnToCnDict]
            : "—"}
        </span>
      ),
    },
    {
      title: "操作",
      align: "center",
      width: 120,
      fixed: "right",
      render: (
        _,
        {
          hsid,
          visit_id,
          doctor_id,
          mvid,
          audiofile_machine_id,
          audiofile_local_path,
          sync_status_str,
          record_status_str,
        },
      ) => {
        // 录音中，不显示操作按钮
        if (record_status_str === "in_progress") {
          return <React.Fragment>—</React.Fragment>;
        }

        return (
          <React.Fragment>
            {/* 没有机器码 */}
            {!machineCode && (
              <span style={{ color: "#00000040" }}>系统启动失败</span>
            )}
            {/* 有机器码，但和本条录音的机器码不一致 */}
            {machineCode && machineCode !== audiofile_machine_id && (
              <span style={{ color: "#00000040" }}>非本机录音</span>
            )}
            {/* 有机器码，但和本条录音的机器码一致 */}
            {machineCode && machineCode === audiofile_machine_id && (
              <Row
                wrap={true}
                style={{ display: "flex", justifyContent: "center" }}
              >
                {(record_status_str === "completed" ||
                  record_status_str === "paused") && (
                  <Button
                    size="small"
                    variant="text"
                    color="primary"
                    className={classNames("btn-detail", {
                      "btn-detail--disabled": sync_status_str === "in_progress",
                    })}
                    disabled={sync_status_str === "in_progress"}
                    onClick={() => {
                      const search = queryString.stringify({
                        hsid,
                        doctor_id,
                        visit_id,
                        mvid,
                      });
                      navigate(`/application/recordDetail?${search}`);
                    }}
                  >
                    查看
                  </Button>
                )}
                {/* TODO: 按钮状态展示：根据录音状态展示录音还是继续录音 */}
                {record_status_str === "paused" && (
                  <Button
                    color="primary"
                    size="small"
                    variant="text"
                    className="btn-detail"
                    onClick={() => {
                      const search = queryString.stringify({
                        hsid,
                        doctor_id,
                        visit_id,
                        mvid,
                        recordStatus: "resume",
                      });
                      navigate(`/application/recordBoard?${search}`);
                    }}
                  >
                    继续录音
                  </Button>
                )}
                {/* 录音完成后才显示同步按钮 */}
                {sync_status_str !== "not_ready" && (
                  <Button
                    size="small"
                    color="primary"
                    variant="text"
                    className={classNames("btn-detail", {
                      "btn-detail--disabled": sync_status_str !== "pending",
                    })}
                    onClick={() => syncList([{ mvid, audiofile_local_path }])}
                    disabled={sync_status_str !== "pending"}
                  >
                    同步
                  </Button>
                )}

                <Popconfirm
                  title="警告"
                  description="本操作将把你的本地音频删除，你确定吗"
                  onConfirm={() => deleteRecord(mvid, audiofile_local_path)}
                  onOpenChange={() => console.log("open change")}
                  okType="danger"
                  okText="确定"
                >
                  <Button
                    size="small"
                    color="primary"
                    variant="text"
                    className={classNames("btn-detail", "btn-delete", {
                      "btn-detail--disabled": sync_status_str === "in_progress",
                    })}
                    disabled={sync_status_str === "in_progress"}
                  >
                    删除
                  </Button>
                </Popconfirm>
              </Row>
            )}
          </React.Fragment>
        );
      },
    },
  ];

  const onReset = () => {
    filterForm.resetFields();
    setPhoneNumber("");
    setVisitId("");
    setVisitType(0);
    console.log("AudioList onReset setAudioListPageIndex 1");
    setAudioListPageIndex(1);
    setRecordStatus("all");
    setSyncStatus("all");
    setPageSize(DefaultPageSize);
    messageApi.success("重置成功");
  };

  const syncAll = async () => {
    const syncAll_rsp = await service_getUnSyncedAudioList(machineCode);

    const audioList: ISyncAudioFile[] = syncAll_rsp.data.data.map(
      ({ mvid, audiofile_local_path }: any) => {
        return { mvid, audiofile_local_path };
      },
    );
    // console.log('AudioList syncAll audioList=', syncAll_rsp.data.data);
    if (audioList.length === 0) {
      messageApi.info("没有需要同步的录音");
      return;
    }
    syncList(audioList);
  };

  const syncList = async (list: ISyncAudioFile[]) => {
    updateSyncStatus(
      list.map((v) => v.mvid.toString()),
      "sync_status_str",
      "in_progress",
    );
    messageApi.success("开始同步");
    const syncOne_rsp = await service_syncLocalAudioToCloud(list);
    console.log("AudioList 同步结果 syncList=", syncOne_rsp);

    const patchAudioSyncTaskStatusToServer_rsp =
      await service_patchAudioSyncTaskStatusToServer(syncOne_rsp.data.data);
    console.log(
      "AudioList patchAudioSyncTaskStatusToServer_rsp=",
      patchAudioSyncTaskStatusToServer_rsp,
    );
  };

  return (
    <>
      <div className="list-wrapper audio-list">
        {contextHolder}
        <Card className="card-tools">
          <Form form={filterForm} style={{ width: "100%" }}>
            <Row
              gutter={[0, 24]}
              style={{ width: "100%", marginBottom: "20px" }}
              justify="space-around"
            >
              <Col span={6}>
                <Form.Item label="登记号" name="visitId">
                  <Input
                    placeholder="请输入登记号"
                    allowClear
                    onChange={onVisitIdChange}
                  ></Input>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="手机号" name="phone">
                  <Input
                    placeholder="请输入手机号"
                    onChange={onPhoneNumberChange}
                    allowClear
                  ></Input>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="就诊方式" name="visitType">
                  <Select
                    className="selected"
                    style={{ textAlign: "center" }}
                    dropdownStyle={{ textAlign: "center" }}
                    popupClassName="treat-mode-selector-popup"
                    placeholder="全部"
                    allowClear
                    onChange={onVisitTypeChange}
                  >
                    {visitTypeList.map((type: any) => (
                      <Select.Option key={type.value} value={type.value}>
                        {type.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row
              gutter={[0, 24]}
              style={{ width: "100%" }}
              justify="space-around"
            >
              <Col span={6}>
                <Form.Item label="录音状态" name="audioType">
                  <Select
                    className="selected"
                    style={{ textAlign: "center" }}
                    dropdownStyle={{ textAlign: "center" }}
                    placeholder="全部"
                    allowClear
                    popupClassName="treat-mode-selector-popup"
                    options={[
                      { value: "all", label: "全部" },
                      { value: "in_progress", label: "录音中" },
                      { value: "paused", label: "录音已暂停" },
                      { value: "completed", label: "录音已完成" },
                      { value: "failed", label: "录音失败" },
                    ]}
                    onChange={onRecordStatusChange}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="同步状态" name="asyncStatus">
                  <Select
                    className="selected"
                    style={{ textAlign: "center" }}
                    dropdownStyle={{ textAlign: "center" }}
                    placeholder="全部"
                    allowClear
                    popupClassName="treat-mode-selector-popup"
                    options={[
                      { value: "all", label: "全部" },
                      // { value: 'not_ready', label: '录音未完成' },
                      { value: "pending", label: "待同步" },
                      { value: "in_progress", label: "同步中" },
                      { value: "completed", label: "同步已完成" },
                      { value: "failed", label: "同步失败" },
                    ]}
                    onChange={onSyncStatusChange}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  style={{ display: "flex", justifyContent: "flex-end" }}
                >
                  <Button
                    size="middle"
                    type="primary"
                    className="btn-reset"
                    ghost
                    onClick={onReset}
                  >
                    重置
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        <Card className="card-audio-list">
          <div className="btns">
            <Button
              type="primary"
              className="btn-to-record-page"
              size="middle"
              onClick={() => syncAll()}
            >
              一键同步
            </Button>
            <Button
              type="primary"
              className="btn-to-record-page"
              onClick={startRecord}
              size="middle"
            >
              创建录音
            </Button>
          </div>
          <Table
            // sticky={true}
            columns={columns}
            scroll={{ x: "50%" }} // TODO
            rowKey={(audio) => audio.mvid}
            dataSource={audioList}
            locale={{ emptyText: <Empty description="暂无数据" /> }}
            rowClassName="audio-list-row"
            pagination={{
              current: audioListPageIndex,
              total: audioCount,
              pageSize: pageSize,
              showSizeChanger: false,
              onChange: (pageIndex, pageSize) => {
                console.log(
                  "onChange pageIndex=",
                  pageIndex,
                  "pageSize=",
                  pageSize,
                );
                console.log(
                  "AudioList pagination onChange setAudioListPageIndex pageIndex=",
                  pageIndex,
                );
                setAudioListPageIndex(pageIndex);
              },
              showTotal: (total) => `共 ${total} 项数据`,
            }}
          />
        </Card>
      </div>
    </>
  );
}

export default AudioList;
