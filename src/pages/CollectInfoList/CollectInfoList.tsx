import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Input, Space, Table, Popconfirm, message } from "antd";
import type { TableProps } from "antd";
import { formatDate } from "@/utils/timeUtil";
import "./CollectInfoList.less";
import {
  service_getCollectInfoList,
  service_deleteCollectInfo,
  service_collectInfoToMedicalRecord,
} from "@/service/business_service";
import { ListAPIParams } from "@/types/collectInfoList";
import { debounce } from "lodash";
import DialogInfoModal from "@/components/DialogInfoModal";
import { aliCloudLog } from "@/service/aliCloudLog";

interface DataType {
  index_id: number;
  mv_inquiry_id: number;
  visit_id: string;
  visit_type: number; // 1=门诊，2=住院
  visitor_name: string;
  visitor_phone: string;
  finished_time: string;
}

const CollectInfoList = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [dataSource, setDataSource] = useState<DataType[]>([]);
  const [total, setTotal] = useState(0);
  const [searchVisitId, setSearchVisitId] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [isDialogModalOpen, setIsDialogModalOpen] = useState(false);
  const [currDataId, setCurrDataId] = useState<number>();
  const pageSize = 10;

  const getCollectInfoList = async (
    index: number,
    pageSize = 10,
    visit?: string,
    phone?: string,
  ) => {
    const params: ListAPIParams = {
      page_index: index,
      page_size: pageSize,
    };
    if (visit) {
      params.search_visit_id = visit;
    }
    if (phone) {
      params.search_visitor_phone = phone;
    }
    try {
      const res = await service_getCollectInfoList(params);
      // console.log('getCollectInfoList res=', res);
      aliCloudLog(
        `CollectInfoList getCollectInfoList res=${JSON.stringify(res.data)}`,
      );
      if (res.status === 200) {
        if (res.data.code === 10000) {
          setDataSource(res.data.data);
          setTotal(res.data.total);
        } else {
          message.error(res.data.msg);
        }
      }
    } catch (error) {
      console.log("获取列表数据 error=", error);
      aliCloudLog(
        `CollectInfoList getCollectInfoList error=${JSON.stringify(error)}`,
        "error",
      );
    }
  };

  useEffect(() => {
    getCollectInfoList(currentPage, pageSize, searchVisitId, searchPhone);
  }, [currentPage, searchVisitId, searchPhone]);

  const handleDelete = async (record: any) => {
    console.log("handleDelete record=", record);
    message.destroy();
    try {
      const res = await service_deleteCollectInfo(record.mv_inquiry_id);
      console.log("deleteCollectInfo res=", res);
      aliCloudLog(
        `CollectInfoList deleteCollectInfo: mv_inquiry_id=${record.mv_inquiry_id}, res=${JSON.stringify(res.data)}`,
      );
      if (res.status === 200) {
        if (res.data.code === 10000) {
          message.success(res.data.msg);
          getCollectInfoList(currentPage, pageSize, searchVisitId, searchPhone);
          const remainingItemsOnPage =
            total - ((currentPage - 1) * pageSize + 1);
          // 如果删除后当前页没有数据且当前页不是第一页，跳转到上一页
          if (remainingItemsOnPage === 0 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
        } else {
          message.error(res.data.msg);
        }
      }
    } catch (error) {
      console.log("删除功能 error=", error);
      aliCloudLog(
        `CollectInfoList deleteCollectInfo: mv_inquiry_id=${record.mv_inquiry_id}, error=${JSON.stringify(error)}`,
        "error",
      );
    }
  };

  const createMedicalRecord = debounce(async (record: DataType) => {
    try {
      const res = await service_collectInfoToMedicalRecord(
        record.mv_inquiry_id,
      );
      console.log("CreateMedicalRecord res=", res);
      aliCloudLog(
        `CollectInfoList createMedicalRecord: mv_inquiry_id=${record.mv_inquiry_id}, res=${JSON.stringify(res.data)}`,
      );
      if (res.status === 200) {
        if (res.data.code === 10000) {
          const task_id = res.data.data.task_id;
          navigate(`/application/medicalRecordDetail?taskId=${task_id}`);
        } else {
          message.error(res.data.msg);
        }
      }
    } catch (error) {
      console.log("创建病历 error=", error);
      aliCloudLog(
        `CollectInfoList createMedicalRecord: mv_inquiry_id=${record.mv_inquiry_id}, error=${JSON.stringify(error)}`,
        "error",
      );
    }
  }, 1000);

  const openDialogModalHandle = (record: DataType) => {
    if (record) {
      setCurrDataId(record.mv_inquiry_id);
      setIsDialogModalOpen(true);
    }
  };

  const columns: TableProps<DataType>["columns"] = [
    {
      title: "编号",
      dataIndex: "index_id",
      key: "index_id",
      width: 80,
      align: "center",
      render: (text) => (
        <span
          style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}
        >
          {text || "—"}
        </span>
      ),
    },
    {
      title: "登记号",
      dataIndex: "visit_id",
      key: "visit_id",
      width: 80,
      align: "center",
      render: (text) => (
        <span
          style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}
        >
          {text || "—"}
        </span>
      ),
    },
    {
      title: "手机号",
      width: 80,
      dataIndex: "visitor_phone",
      key: "visitor_phone",
      align: "center",
      render: (text) => (
        <span
          style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}
        >
          {text || "—"}
        </span>
      ),
    },
    {
      title: "采集完成时间",
      dataIndex: "finished_time",
      key: "finished_time",
      width: 120,
      align: "center",
      render: (_, { finished_time }) => {
        return (
          <div style={{ fontVariantNumeric: "tabular-nums" }}>
            {formatDate(finished_time)}
          </div>
        );
      },
    },
    {
      title: "操作",
      key: "operate",
      width: 160,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space size="middle">
          <>
            <a
              className="btn_action_common"
              onClick={() => createMedicalRecord(record)}
            >
              生成病历
            </a>
            <a
              className="btn_action_common"
              onClick={() => openDialogModalHandle(record)}
            >
              查看
            </a>
            <Popconfirm
              title="确认删除?"
              description={`删除该采集信息后，关联的病历和录音都会删除，确认删除吗？`}
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

  const searchVisitIdChange = debounce((e: any) => {
    setSearchVisitId(e.target.value);
    setCurrentPage(1);
  }, 1000);

  const searchPhoneChange = debounce((e: any) => {
    setSearchPhone(e.target.value);
    setCurrentPage(1);
  }, 1000);

  return (
    <div className="collectInfoList-wrapper">
      <Card className="card-wrapper">
        <Form layout="inline">
          <Form.Item label="登记号">
            <Input
              placeholder="请输入登记号"
              allowClear
              onChange={searchVisitIdChange}
            ></Input>
          </Form.Item>
          <Form.Item label="手机号">
            <Input
              placeholder="请输入手机号"
              allowClear
              onChange={searchPhoneChange}
            ></Input>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        {dataSource && (
          <Table<DataType>
            columns={columns}
            rowKey={"mv_inquiry_id"}
            scroll={{ x: 400 }}
            pagination={{
              current: currentPage,
              pageSize,
              total,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 项数据`,
              onChange: (page) => setCurrentPage(page),
            }}
            dataSource={dataSource}
          />
        )}
      </Card>

      <DialogInfoModal
        id={currDataId}
        isDialogModalOpen={isDialogModalOpen}
        setIsDialogModalOpen={setIsDialogModalOpen}
      />
    </div>
  );
};

export default CollectInfoList;
