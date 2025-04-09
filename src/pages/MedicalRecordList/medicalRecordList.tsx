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
  Card,
  message,
  Space,
  Popconfirm,
  Form,
  Input,
  Tabs,
} from "antd";
import type { TableProps } from "antd";
import { formatDate } from "@/utils/timeUtil";
import {
  service_getMedicalRecordList,
  service_deleteMedicalRecordTask,
} from "@/service/business_service";
import { aliCloudLog } from "@/service/aliCloudLog";
import { AuthContext } from "@/state/auth/authContext";
import "./medicalRecordList.less";

function MedicalRecordList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dataList, setDataList] = useState<DataType[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchVisitId, setSearchVisitId] = useState("");
  const searchVisitIdRef = useRef("");
  const pollingRef = useRef(0);
  const redoDuration = 5000;
  const [, setIsPolling] = useState(false);
  const { state } = useContext(AuthContext) as any;
  const [filterType, setFilterType] = useState<string>();

  interface DataType {
    key: string;
    index: string;
    taskId: string;
    visitId: string;
    editTime: string;
    wordCount: number;
    emrScore: string;
    isUploaded: boolean;
  }

  const onVisitIdChange = (e: any) => {
    const newVisitId = e.target.value;
    setSearchVisitId(newVisitId);
    searchVisitIdRef.current = newVisitId;
    setCurrentPage(1);
    getMedicalRecordList(1, 10, newVisitId); // 传入 searchVisitId 作为第三个参数
  };

  function transformData(res: any) {
    return res?.data?.map((item: any) => {
      return {
        key: item.task_id,
        index: item.index_id,
        taskId: item.task_id,
        visitId: item.visit_id,
        editTime: formatDate(item.created),
        wordCount: item.aig_emr_word_count,
        emrScore: item.aig_emr_score_total,
        isUploaded: item.has_control_emr ? "是" : "否",
        finishTime: formatDate(item.finished_time),
      };
    });
  }

  const getMedicalRecordList = async (
    pageIndex = 1,
    pageSize = 10,
    searchInput = searchVisitIdRef.current,
    aig_type = String(filterType)
  ) => {
    console.log(
      `MedicalRecordList getMedicalRecordList pageIndex: ${pageIndex}, pageSize: ${pageSize}, searchInput: ${searchInput}`
    );
    try {
      const response = await service_getMedicalRecordList(
        pageIndex,
        pageSize,
        searchInput,
        aig_type
      );
      console.log(
        "MedicalRecordList getMedicalRecordList:",
        { pageIndex, pageSize, searchInput },
        "response:",
        response
      );
      aliCloudLog(
        `MedicalRecordList页面 getMedicalRecordList 
                pageIndex=${pageIndex}, 
                pageSize=${pageSize}, 
                searchInput=${searchInput},
                response.status=${response?.status},
                response.data.total=${response?.data?.total},
                response.data.data=${JSON.stringify(response?.data?.data)},` +
          state.accountName
      );
      setTotalRecords(response.data.total);
      const transformedData = transformData(response.data);
      setDataList(transformedData);
      const shouldPoll = true;
      if (shouldPoll) {
        startListPolling(pageIndex, aig_type);
      } else {
        stopListPolling();
      }
    } catch (error) {
      console.error("MedicalRecordList getMedicalRecordList error:", error);
      aliCloudLog(
        `MedicalRecordList页面 getMedicalRecordList error: ${JSON.stringify(error)}` +
          state.accountName
      );
    }
  };

  const startListPolling = useCallback((curPage: number, type: string) => {
    if (!pollingRef.current) {
      setIsPolling(true);
      pollingRef.current = setInterval(() => {
        console.log(
          "MedicalRecordList页面 startListPolling currentPage:",
          curPage
        );
        getMedicalRecordList(curPage, 10, searchVisitIdRef.current, type);
      }, redoDuration);
    }
  }, []);

  const stopListPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = 0;
      setIsPolling(false);
    }
  };

  const getCurrentPage = () => {
    const query = new URLSearchParams(location.search);
    const page = query.get("page");
    if (!page) {
      // console.warn('No page parameter found in the URL.');
      return 1;
    } else if (isNaN(Number(page))) {
      console.warn("MedicalRecordList页面 Invalid page number:", page);
    }
    return Number(page);
  };

  const setCurrentPage = (page: number) => {
    const query = new URLSearchParams(location.search);
    const curPage = Number(query.get("page"));
    if (curPage === page) return;
    navigate(`?page=${page}`);
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
      key: "visitId",
      className: "numeric",
      width: 80,
      align: "center",
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
      title:
        filterType && filterType === "audio"
          ? "音频编辑完成时间"
          : "采集完成时间",
      dataIndex:
        filterType && filterType === "audio" ? "editTime" : "finishTime",
      key: filterType && filterType === "audio" ? "editTime" : "finishTime",
      className: "numeric",
      width: 180,
      align: "center",
    },
    {
      title: "模型病历字数",
      key: "wordCount",
      dataIndex: "wordCount",
      className: "numeric",
      width: 140,
      align: "center",
      render: (text) => (
        <span
          style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}
        >
          {text ?? "—"}
        </span>
      ),
    },
    {
      title: "模型病历评分",
      key: "emrScore",
      dataIndex: "emrScore",
      className: "numeric",
      width: 140,
      align: "center",
      render: (text: any) => {
        if (parseFloat(text) === 0) {
          return <div>—</div>;
        } else {
          return <div>{parseFloat(text).toFixed(1)}</div>;
        }
      },
    },
    {
      title: "是否上传对照病历",
      dataIndex: "isUploaded",
      key: "isUploaded",
      width: 180,
      align: "center",
    },
    {
      title: "操作",
      key: "action",
      width: 140,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space size="middle">
          <>
            <a onClick={() => handleAction(record, "查看")}>查看</a>
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
        </Space>
      ),
    },
  ];

  const handleDelete = async (record: DataType) => {
    try {
      const response = await service_deleteMedicalRecordTask(record.taskId);
      console.log("delete response data:", response.data);
      console.log("delete response:", response);
      if (response.status === 200) {
        message.success(`任务${record.index} 删除成功`);
        // 检查当前页是否还有其他数据
        const currentPage = getCurrentPage();
        const currentDataLength = dataList.filter(
          (item) => item.key !== record.key
        ).length;
        if (currentDataLength === 0 && currentPage > 1) {
          // 如果当前页没有数据且不是第一页，则跳转到前一页
          setCurrentPage(currentPage - 1);
        } else {
          // 否则，刷新当前页的数据
          getMedicalRecordList(currentPage);
        }
      } else {
        message.error(`任务${record.index} 删除失败`);
        aliCloudLog(
          `MedicalRecordList页面 任务${record.index} 删除失败 response: ${JSON.stringify(response)}` +
            state.accountName
        );
      }
    } catch (error) {
      console.error("MedicalRecordList页面 Delete task error:", error);
      message.error("网络错误，删除失败");
      aliCloudLog(
        `MedicalRecordList页面 handleDelete error: ${JSON.stringify(error)}` +
          state.accountName
      );
    }
  };

  const handleAction = (record: DataType, action: string) => {
    console.log(`对 ${record.index} 执行 ${action}`);
    aliCloudLog(
      `MedicalRecordList页面 handleAction 对编号 ${record.index} 执行 ${action}` +
        state.accountName
    );
    // 这里添加具体的逻辑，例如调用 API 或更改数据状态等
    if (action === "查看") {
      navigate(`/application/medicalRecordDetail?taskId=${record.taskId}`);
      localStorage.setItem("medicalType", filterType as string);
    }
  };

  useEffect(() => {
    const type = localStorage.getItem("medicalType");
    if (type) {
      setFilterType(type);
    } else {
      setFilterType("audio");
      localStorage.setItem("medicalType", "audio");
    }

    const curPage = getCurrentPage();
    if (!pollingRef.current && filterType) {
      setCurrentPage(curPage);
      getMedicalRecordList(curPage);
    }

    // 返回的函数会在组件卸载时调用
    return () => {
      stopListPolling();
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [location.search, filterType]);

  const changeFilterType = (value: string) => {
    setFilterType(value);
    localStorage.setItem("medicalType", value);
    setSearchVisitId("");
    searchVisitIdRef.current = "";
    setCurrentPage(1);
    stopListPolling();
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    getMedicalRecordList(1, 10, searchVisitIdRef.current, value);
  };

  return (
    <div className="medicalRecordList-wrapper">
      <Card className="card-header">
        <div className="card-header-wrapper">
          <div className="form-search">
            <Form.Item className="form-search-item" label="登记号">
              <Input
                placeholder="请输入登记号"
                allowClear
                value={searchVisitId}
                onChange={onVisitIdChange}
              ></Input>
            </Form.Item>
          </div>
        </div>
      </Card>
      <Card className="card-wrapper">
        <Tabs
          style={{ marginBottom: 16 }}
          activeKey={filterType}
          onChange={(key) => changeFilterType(key)}
        >
          <Tabs.TabPane tab="转录" key="audio" />
          <Tabs.TabPane tab="采集" key="dialogue" />
        </Tabs>
        <Table
          columns={columns}
          dataSource={dataList}
          scroll={{ x: 400 }}
          pagination={{
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

export default MedicalRecordList;
