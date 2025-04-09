import React, { useEffect, useState } from "react";
import { Card, Space, Table, message, Modal } from "antd";
import type { TableProps } from "antd";
import { formatDate } from "@/utils/timeUtil";
import "./CollectInfoListModal.less";
import { service_getCollectInfoList } from "@/service/business_service";
import { ListAPIParams } from "@/types/collectInfoList";
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

const CollectInfoListModal = (props: any) => {
  const {
    visitid,
    isCollectInfoListModalOpen,
    setIsCollectInfoListModalOpen,
    setChecked,
    setMvInquiryId,
    setConnectCollectInfo,
  } = props;
  const [currentPage, setCurrentPage] = useState(1);
  const [dataSource, setDataSource] = useState<DataType[]>([]);
  const [total, setTotal] = useState(0);
  const pageSize = 5;

  const getCollectInfoList = async (
    index: number,
    pageSize = 5,
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
      // console.log('CollectInfoListModal getCollectInfoList res=', res);
      aliCloudLog(
        `CollectInfoListModal getCollectInfoList res=${JSON.stringify(res.data)}`,
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
      console.log("CollectInfoListModal 获取列表数据 error=", error);
      aliCloudLog(
        `CollectInfoListModal getCollectInfoList error=${JSON.stringify(error)}`,
        "error",
      );
    }
  };

  useEffect(() => {
    const _visitid = visitid;
    if (_visitid.toString().length === 8 || _visitid.toString().length === 0) {
      getCollectInfoList(currentPage, pageSize, _visitid);
    }
  }, [currentPage, visitid]);

  const columns: TableProps<DataType>["columns"] = [
    {
      title: "编号",
      dataIndex: "index_id",
      key: "index_id",
    },
    {
      title: "登记号",
      dataIndex: "visit_id",
      key: "visit_id",
    },
    {
      title: "采集完成时间",
      dataIndex: "finished_time",
      key: "finished_time",
      render: (_, { finished_time }) => {
        return <div>{formatDate(finished_time)}</div>;
      },
    },
    {
      title: "操作",
      key: "operate",
      render: (_, record) => (
        <Space size="middle">
          <>
            <a onClick={() => connectMedicalRecord(record)}>关联采集信息</a>
          </>
        </Space>
      ),
    },
  ];

  const connectMedicalRecord = (record: any) => {
    console.log("CollectInfoListModal connectMedicalRecord record:", record);
    setMvInquiryId(record.mv_inquiry_id);
    setConnectCollectInfo(record);
    setIsCollectInfoListModalOpen(false);
  };

  const onModalClose = (e: any) => {
    console.log("CollectInfoListModal onModalClose e:", e);
    setIsCollectInfoListModalOpen(false);
    setConnectCollectInfo({});
    setChecked(false);
  };

  return (
    <Modal
      open={isCollectInfoListModalOpen}
      footer={[]}
      width={800}
      title="关联采集信息"
      onCancel={onModalClose}
    >
      <div className="list-wrapper">
        {/* <Card className="card-wrapper">
                    <Form layout="inline">
                        <Form.Item label="登记号">
                            <Input placeholder="请输入登记号" allowClear onChange={searchVisitIdChange}></Input>
                        </Form.Item>
                        <Form.Item label="手机号">
                            <Input placeholder="请输入手机号" allowClear onChange={searchPhoneChange}></Input>
                        </Form.Item>
                    </Form>
                </Card> */}

        <Card>
          {dataSource ? (
            <Table<DataType>
              columns={columns}
              rowKey={"mv_inquiry_id"}
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
          ) : (
            <div className="">暂无相同登记号的采集信息 </div>
          )}
        </Card>
      </div>
    </Modal>
  );
};

export default CollectInfoListModal;
