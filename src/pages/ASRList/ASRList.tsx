import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useContext,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Table,
  Alert,
  Card,
  message,
  Space,
  Popconfirm,
  Form,
  Input,
  Select,
  Button,
  Dropdown,
} from "antd";
import type { TableProps, MenuProps } from "antd";
import FileUploader from "@/components/FileUploader";
import {
  service_getTaskList,
  service_deleteSTTTask,
  service_generateMedicalRecord,
  service_redoSTTTask,
} from "@/service/business_service";
import { formatTime, formatDate } from "@/utils/timeUtil";
import Marquee from "react-fast-marquee";
import "./ASRList.less";
import {
  downloadRecordFile,
  downloadRecordEditedFile,
} from "@/utils/downloadUtils";
import { aliCloudLog } from "@/service/aliCloudLog";
import { AuthContext } from "@/state/auth/authContext";
import { debounce } from "lodash";
import { GenderEnToCn, MedicalMethod } from "@/common/const";

function ASRList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dataList, setDataList] = useState<DataType[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchVisitId, setSearchVisitId] = useState("");
  const [searchEditState, setSearchEditState] = useState("All");
  const [searchVisitPhone, setSearchVisitPhone] = useState("");
  const [searchVisitType, setSearchVisitType] = useState("-1");
  const searchVisitIdRef = useRef("");
  const searchEditStateRef = useRef("All");
  const searchVisitPhoneRef = useRef("");
  const searchVisitTypeRef = useRef("-1");
  // const [clickedLinks, setClickedLinks] = useState<{
  //     [key: string]: { doc: boolean; mp3: boolean };
  // }>({});
  // 获取当前 URL 的 protocol 和 hostname
  const websiteBaseUrl = `${window.location.protocol}//${window.location.hostname}`;
  const { state } = useContext(AuthContext) as any;

  const [operateData, setOperateData] = useState<any>();

  interface DataType {
    key: string;
    index: string;
    visitId: string;
    uploadTime: string;
    audioDuration: string;
    audioState: string;
    editState: string;
    audioFileName: string;
    audioFileSha256: string;
    uploadId: string;
    deleted: number;
    arsRstTextFileUrl: string;
    arsRstJsonFileUrl: string;
    sttAudioMp3FileUrl: string;
    medvisit_inquiry_info: any;
  }

  const onVisitIdChange = (e: any) => {
    const newVisitId = e.target.value;
    // console.log('onVisitIdChange:', newVisitId, searchEditState);
    setSearchVisitId(newVisitId);
    searchVisitIdRef.current = newVisitId;
    setCurrentPage(1);
    getTaskList(
      1,
      10,
      searchVisitIdRef.current,
      searchVisitPhoneRef.current,
      searchVisitTypeRef.current,
      MapEditStatusToNumber(searchEditStateRef.current),
    );
  };
  const onVisitPhoneChange = (e: any) => {
    const newVisitPhone = e.target.value;
    setSearchVisitPhone(newVisitPhone);
    searchVisitPhoneRef.current = newVisitPhone;
    setCurrentPage(1);
    getTaskList(
      1,
      10,
      searchVisitIdRef.current,
      searchVisitPhoneRef.current,
      searchVisitTypeRef.current,
      MapEditStatusToNumber(searchEditStateRef.current),
    );
  };
  const onVisitTypeChange = (value: string) => {
    setSearchVisitType(value);
    searchVisitTypeRef.current = value;
    setCurrentPage(1);
    getTaskList(
      1,
      10,
      searchVisitIdRef.current,
      searchVisitPhoneRef.current,
      searchVisitTypeRef.current,
      MapEditStatusToNumber(searchEditStateRef.current),
    );
  };

  const onEditStateChange = (value: string) => {
    // console.log('onEditStateChange:', value, searchVisitId);
    setSearchEditState(value);
    searchEditStateRef.current = value;
    setCurrentPage(1);
    getTaskList(
      1,
      10,
      searchVisitIdRef.current,
      searchVisitPhoneRef.current,
      searchVisitTypeRef.current,
      MapEditStatusToNumber(searchEditStateRef.current),
    );
  };

  const MapEditStatusToNumber = (status: string) => {
    switch (status) {
      case "All":
        return -1;
      case "NotEdited":
        return 0;
      case "BeEditing":
        return 1;
      case "Edited":
        return 4;
      default:
        return -1;
    }
  };

  const MapNumberToEditStatus = (status_number: number) => {
    switch (status_number) {
      case 0:
        return "待编辑";
      case 1:
        return "编辑中";
      case 4:
        return "已完成";
    }
  };

  const MapStringToEditStatus = (status: string) => {
    switch (status) {
      case "undo":
        return "处理中";
      case "doing":
        return "处理中";
      case "failed":
        return "转录失败";
      case "success":
        return "已完成";
      default:
        return "未知";
    }
  };

  function transformData(res: any) {
    return res?.data?.map((item: any) => {
      // 任务状态转换
      const audioState = MapStringToEditStatus(item.status);

      return {
        key: item.id,
        index: item.index_id,
        visitId: item.visit_id,
        uploadTime: formatDate(item.created),
        audioDuration: formatTime(Math.floor(item.audio_duration_ms / 1000)),
        editState: MapNumberToEditStatus(item.asr_rst_edit_status),
        audioState: audioState,
        audioFileName: item.audio_file_name,
        audioFileSha256: item.audio_file_sha256,
        uploadId: item.upload_id,
        deleted: item.deleted,
        arsRstTextFileUrl: item.stt_asr_rst_text_file_url.replace(
          "{{website}}",
          websiteBaseUrl,
        ),
        arsRstJsonFileUrl: item.stt_asr_rst_json_file_url.replace(
          "{{website}}",
          websiteBaseUrl,
        ),
        sttAudioMp3FileUrl: item.stt_audio_mp3_file_url.replace(
          "{{website}}",
          websiteBaseUrl,
        ),
        asrRstJsonEditFileUrl: item.stt_asr_rst_json_edit_file_url.replace(
          "{{website}}",
          websiteBaseUrl,
        ),
        medvisit_inquiry_info: item.medvisit_inquiry_info,
      };
    });
  }

  useEffect(() => {
    initSSE();
    return () => {
      if (eventSourceRef.current) {
        aliCloudLog("ASRList sse close" + state.accountName);
        eventSourceRef.current.close();
      }
    };
  }, []);
  const eventSourceRef = useRef<EventSource>();
  const initSSE = () => {
    eventSourceRef.current = new EventSource(
      `${import.meta.env.VITE_EVENT_SOURCE_BASE_URL}/v1/stream/msg/status`,
    );
    eventSourceRef.current.onopen = () => {
      aliCloudLog("ASRList sse onopen" + state.accountName);
      console.log("ASRList sse onopen", state.accountName);
    };
    eventSourceRef.current.onerror = (e: any) => {
      aliCloudLog("ASRList sse onerror" + state.accountName);
      console.log("ASRList sse onerror", JSON.stringify(e), state.accountName);
    };
    eventSourceRef.current.addEventListener("connecttime", (evt) => {
      aliCloudLog(
        "ASRList sse connecttime" + JSON.parse(evt.data) + state.accountName,
      );
      console.log(
        "ASRList sse connecttime",
        JSON.stringify(evt.data) + state.accountName,
      );
    });
    eventSourceRef.current.onmessage = async (evt) => {
      const value = JSON.parse(evt.data);
      console.log("ASRList sse onmessage", value, state.accountName);
      aliCloudLog("ASRList sse onmessage", value + state.accountName);
      const { stt_task_id, event, status } = value;
      if (event === "offline_stt_task" && stt_task_id && status) {
        getTaskList(getCurrentPage());
      }
    };
  };

  useEffect(() => {
    const curPage = getCurrentPage();
    setCurrentPage(curPage);
    getTaskList(curPage);
  }, [location.search]);

  const getTaskList = async (
    pageIndex = 1,
    pageSize = 10,
    searchInput = searchVisitIdRef.current,
    visitPhone = searchVisitPhoneRef.current,
    visitType = searchVisitTypeRef.current,
    editStatus = MapEditStatusToNumber(searchEditStateRef.current),
  ) => {
    console.log(
      `ASRList页面 getTaskList pageIndex: ${pageIndex}, pageSize: ${pageSize}, searchInput: ${searchInput},  visitPhone: ${visitPhone}, visitType=${visitType}, editStatus: ${editStatus}`,
    );
    try {
      const response = await service_getTaskList(
        pageIndex,
        pageSize,
        searchInput,
        visitPhone,
        visitType,
        editStatus,
      );
      console.log("List getTaskList response:", response);
      aliCloudLog(
        `ASRList页面 getTaskList 
                pageIndex=${pageIndex}, 
                pageSize=${pageSize}, 
                response.status=${response?.status},
                response.data.total=${response?.data?.total},
                response.data.data=${JSON.stringify(response?.data?.data)},` +
          state.accountName,
      );
      if (response.status === 200) {
        setTotalRecords(response.data.total);
        const transformedData = transformData(response.data);
        setDataList(transformedData);
      }
    } catch (error) {
      console.error("ASRList页面 getTaskList error:", error);
      aliCloudLog(
        `ASRList页面 getTaskList error: ${JSON.stringify(error)}` +
          state.accountName,
      );
    }
  };

  const getCurrentPage = useCallback(() => {
    const query = new URLSearchParams(location.search);
    const page = query.get("page");
    if (!page) {
      // console.warn('No page parameter found in the URL.');
      return 1;
    } else if (isNaN(Number(page))) {
      console.warn("ASRList页面 Invalid page number:", page);
    }
    return Number(page);
  }, [location.search]);

  const setCurrentPage = (page: number) => {
    const query = new URLSearchParams(location.search);
    const curPage = Number(query.get("page"));
    if (curPage === page) return;
    navigate(`?page=${page}`);
  };

  const handleDetailClick = (record: any) => {
    const idAsString = record.key.toString();
    navigate(`/application/asrEdit?id=${idAsString}&entrypoint=check`);
  };

  const handleEditClick = (record: any) => {
    const idAsString = record.key.toString();
    navigate(`/application/asrEdit?id=${idAsString}&entrypoint=edit`);
  };

  const downloadItems: MenuProps["items"] = [
    {
      key: "original",
      label: "原文档",
    },
    {
      key: "edited",
      label: "已编辑的JSON文档",
    },
  ];

  const handleOpenChange = (open: boolean, record: any) => {
    if (open) {
      setOperateData(record);
    }
  };

  const handleDownloadMenuClick: MenuProps["onClick"] = (e: any) => {
    if (e.key === "original") {
      handleDownload(operateData);
    } else {
      downloadRecordEditedFile(operateData);
    }
  };

  const columns: TableProps<DataType>["columns"] = [
    {
      title: "编号",
      dataIndex: "index",
      key: "index",
      className: "numeric",
      width: 80,
      align: "center",
    },
    {
      title: "登记号",
      dataIndex: "visitId",
      align: "center",
      key: "visitId",
      className: "numeric",
      width: 80,
      render: (text) => (
        <span
          style={{
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
            fontFamily: "monospace",
          }}
        >
          {" "}
          {text}
        </span>
      ),
    },
    {
      title: "手机号",
      dataIndex: "medvisit_inquiry_info",
      key: "medvisit_inquiry_info",
      align: "center",
      width: 80,
      render: (medvisit_inquiry_info) => (
        <span
          style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}
        >
          {medvisit_inquiry_info?.visitor_phone || "—"}
        </span>
      ),
    },
    {
      title: "性别",
      dataIndex: "medvisit_inquiry_info",
      key: "medvisit_inquiry_info",
      align: "center",
      width: 70,
      render: (medvisit_inquiry_info) => (
        <span style={{ whiteSpace: "nowrap" }}>
          {medvisit_inquiry_info?.visitor_gender
            ? GenderEnToCn[
                medvisit_inquiry_info?.visitor_gender as keyof typeof GenderEnToCn
              ]
            : "—"}
        </span>
      ),
    },
    {
      title: "年龄",
      dataIndex: "medvisit_inquiry_info",
      key: "medvisit_inquiry_info",
      align: "center",
      width: 80,
      render: (medvisit_inquiry_info) => (
        <span style={{ whiteSpace: "nowrap" }}>
          {medvisit_inquiry_info?.visitor_age ?? "—"}
        </span>
      ),
    },
    {
      title: "就诊方式",
      dataIndex: "medvisit_inquiry_info",
      key: "medvisit_inquiry_info",
      align: "center",
      width: 120,
      render: (medvisit_inquiry_info) => (
        <span>
          {MedicalMethod[parseInt(medvisit_inquiry_info?.visit_type)] ?? "—"}
        </span>
      ),
    },
    {
      title: "上传时间",
      dataIndex: "uploadTime",
      key: "uploadTime",
      className: "numeric",
      width: 160,
      align: "center",
    },
    {
      title: "音频时长（min）",
      key: "audioDuration",
      dataIndex: "audioDuration",
      className: "numeric",
      width: 150,
      align: "center",
    },
    {
      title: "解析状态",
      dataIndex: "audioState",
      key: "audioState",
      width: 100,
      align: "center",
    },
    {
      title: "编辑状态",
      align: "center",
      dataIndex: "editState",
      key: "editState",
      width: 100,
      render: (text: any, record: any) => {
        if (record.audioState !== "已完成") {
          return <div>—</div>;
        } else {
          return <div>{text}</div>;
        }
      },
    },
    {
      title: "操作",
      key: "action",
      align: "center",
      width: 240,
      fixed: "right",
      render: (_: any, record: any) => (
        <Space size="middle">
          {record.audioState === "转录失败" && (
            <>
              <a onClick={() => handleAction(record, "重新转录")}>重新转录</a>
              <Popconfirm
                title="确认删除?"
                description={`您确定要删除任务 ${record.index} 吗？`}
                okText="确认"
                cancelText="取消"
                onConfirm={() => handleDelete(record)}
              >
                <a style={{ color: "red" }}>删除</a>
              </Popconfirm>
            </>
          )}
          {record.audioState === "待处理" && (
            <>
              <Popconfirm
                title="确认删除?"
                description={`您确定要删除任务 ${record.index} 吗？`}
                okText="确认"
                cancelText="取消"
                onConfirm={() => handleDelete(record)}
              >
                <a style={{ color: "red" }}>删除</a>
              </Popconfirm>
            </>
          )}
          {record.audioState === "处理中" && <span>—</span>}
          {record.audioState === "已完成" && (
            <>
              {record.editState === "已完成" ? (
                <a onClick={() => handleAction(record, "生成病历")}>生成病历</a>
              ) : (
                <a onClick={() => handleAction(record, "编辑")}>编辑转录</a>
              )}
              <a onClick={() => handleAction(record, "查看")}>查看</a>
              <Dropdown
                menu={{
                  items: downloadItems,
                  onClick: handleDownloadMenuClick,
                }}
                onOpenChange={(open) => handleOpenChange(open, record)}
              >
                <a onClick={(e) => e.preventDefault()}>下载</a>
              </Dropdown>
              {/* <a className={clickedLinks[record.index]?.mp3 ? 'visited' : ''} onClick={() => handleAction(record, '下载mp3')}>
                                下载mp3
                            </a> */}
              <Popconfirm
                title="确认删除?"
                description={`您确定要删除任务 ${record.index} 吗？`}
                okText="确认"
                cancelText="取消"
                onConfirm={() => handleDelete(record)}
              >
                <a style={{ color: "red" }}>删除</a>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const handleDelete = async (record: DataType) => {
    try {
      const response = await service_deleteSTTTask(record.key);
      if (response.status === 200) {
        message.success(`任务${record.index} 删除成功`);
        // 检查当前页是否还有其他数据
        const currentPage = getCurrentPage();
        const currentDataLength = dataList.filter(
          (item) => item.key !== record.key,
        ).length;
        if (currentDataLength === 0 && currentPage > 1) {
          // 如果当前页没有数据且不是第一页，则跳转到前一页
          setCurrentPage(currentPage - 1);
        } else {
          // 否则，刷新当前页的数据
          getTaskList(currentPage);
        }
      } else {
        message.error(`任务${record.index} 删除失败`);
        aliCloudLog(
          `ASRList页面 任务${record.index} 删除失败 response: ${JSON.stringify(response)}` +
            state.accountName,
        );
      }
    } catch (error) {
      console.error("ASRList页面 Delete task error:", error);
      message.error("网络错误，删除失败");
      aliCloudLog(
        `ASRList页面 handleDelete error: ${JSON.stringify(error)}` +
          state.accountName,
      );
    }
  };
  const handleDownload = async (record: any) => {
    try {
      await downloadRecordFile(record);
      console.log("handleDownload:", record);
    } catch (error) {
      console.error("ASRList页面 Download record file error:", error);
      aliCloudLog(
        `ASRList页面 handleDownload error: ${JSON.stringify(error)}` +
          state.accountName,
      );
    }
  };

  // const handleDownloadMp3 = async (record: any) => {
  //     try {
  //         downloadMp3File(record);
  //         console.log('handleDownloadMp3:', record);
  //     } catch (error) {
  //         console.error('ASRList页面 Download mp3 file error:', error);
  //         aliCloudLog(`ASRList页面 handleDownloadMp3 error: ${JSON.stringify(error)}` + state.accountName);
  //     }
  // };

  const handleRedoTask = async (record: any) => {
    try {
      const response = await service_redoSTTTask(record?.key);
      console.log("List handleRedoTask response:", response);
      if (response.status === 200) {
        message.success(`任务${record.index} 重新转录开始`);
        // 请求重新转录后立即刷新列表状态
        getTaskList(getCurrentPage());
        // Check if we need to start the entire list polling
        // if (!isPolling) {
        //     const shouldPoll = dataList.some(record =>
        //         record.audioState === '处理中' || record.audioState === '未知'
        //     );
        //     if (shouldPoll) {
        //         startListPolling();
        //     }
        // }
      } else {
        message.error(`任务${record.index} 重新转录失败`);
        aliCloudLog(
          `ASRList页面 任务${record.index} 重新转录失败 response: ${JSON.stringify(response)}` +
            state.accountName,
        );
      }
    } catch (error) {
      console.error("ASRList页面 Redo task error:", error);
      message.error("重新转录失败");
      aliCloudLog(
        `ASRList页面 handleRedoTask 重新转录失败: ${JSON.stringify(error)}` +
          state.accountName,
      );
    }
  };

  const handleCreateMedicalRecord = async (record: any) => {
    const idAsString = record.key.toString();
    try {
      const res = await service_generateMedicalRecord(idAsString);
      console.log("ASRList页面 handleCreateMedicalRecord response:", res);
      if (res.status === 200) {
        const taskId = res.data.data.task_id;
        navigate(`/application/medicalRecordDetail?taskId=${taskId}`);
      }
    } catch (error) {
      console.error("ASRList页面 handleCreateMedicalRecord error:", error);
      message.error("病历生成失败");
      aliCloudLog(
        `ASRList页面 handleCreateMedicalRecord 病历生成失败: ${JSON.stringify(error)}` +
          state.accountName,
      );
    }
  };

  // 防抖函数，限制500毫秒内只能触发一次
  const debouncedHandleCreateMedicalRecord = debounce(
    handleCreateMedicalRecord,
    1000,
  );

  const handleAction = (record: DataType, action: string) => {
    console.log(`对 ${JSON.stringify(record)} 执行 ${action}`);
    aliCloudLog(
      `ASRList页面 handleAction 对编号 ${record.index} 执行 ${action}` +
        state.accountName,
    );
    // 这里添加具体的逻辑，例如调用 API 或更改数据状态等
    // if (action === '删除') {
    //     handleDelete(record);
    // }
    if (action === "编辑") {
      handleEditClick(record);
    }
    if (action === "查看") {
      handleDetailClick(record);
    }

    // if (action === '下载mp3') {
    //     setClickedLinks((prevState) => ({
    //         ...prevState,
    //         [record.index]: { ...prevState[record.index], mp3: true },
    //     }));
    //     handleDownloadMp3(record);
    // }
    if (action === "重新转录") {
      handleRedoTask(record);
    }
    if (action === "生成病历") {
      debouncedHandleCreateMedicalRecord(record);
    }
  };

  const resetSearch = () => {
    setSearchVisitId("");
    searchVisitIdRef.current = "";
    setSearchEditState("All");
    searchEditStateRef.current = "All";
    getTaskList(getCurrentPage());
  };

  return (
    <div className="asrlist-wrapper">
      <Alert
        className="alert-text"
        banner
        message={
          <Marquee pauseOnHover gradient={false}>
            转录 5 分钟音频大约需要 15 秒
          </Marquee>
        }
      />
      <Card className="card-header">
        <div className="card-header-wrapper">
          <div className="form-search">
            <Form.Item className="form-search-item numeric" label="登记号">
              <Input
                placeholder="请输入登记号"
                allowClear
                value={searchVisitId}
                onChange={onVisitIdChange}
              ></Input>
            </Form.Item>
            <Form.Item className="form-search-item numeric" label="手机号">
              <Input
                placeholder="请输入手机号"
                allowClear
                value={searchVisitPhone}
                onChange={onVisitPhoneChange}
              ></Input>
            </Form.Item>
            <Form.Item className="form-search-item" label="就诊状态">
              <Select
                defaultValue="-1"
                style={{ width: 120 }}
                value={searchVisitType}
                onChange={onVisitTypeChange}
                options={[
                  { value: "-1", label: "全部" },
                  { value: "1", label: "门诊" },
                  { value: "2", label: "住院" },
                ]}
              />
            </Form.Item>
            <Form.Item className="form-search-item" label="编辑状态">
              <Select
                defaultValue="All"
                style={{ width: 120 }}
                value={searchEditState}
                onChange={onEditStateChange}
                options={[
                  { value: "All", label: "全部" },
                  { value: "NotEdited", label: "待编辑" },
                  { value: "BeEditing", label: "编辑中" },
                  { value: "Edited", label: "已完成" },
                ]}
              />
            </Form.Item>
          </div>
          <Button onClick={resetSearch}>重置</Button>
        </div>
      </Card>
      <Card className="card-wrapper">
        <FileUploader getTaskList={getTaskList} setPage={setCurrentPage} />
        <Table
          columns={columns}
          dataSource={dataList}
          rowClassName="audio-list-row"
          scroll={{ x: "50%" }}
          pagination={{
            defaultCurrent: 1,
            current: getCurrentPage(),
            pageSize: 10,
            showSizeChanger: false,
            total: totalRecords,
            showTotal: (total) => `共 ${total} 项数据`,
            onChange: (page) => {
              setCurrentPage(page);
            },
          }}
        />
      </Card>
    </div>
  );
}

export default ASRList;
