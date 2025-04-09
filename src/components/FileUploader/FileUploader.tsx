import React, { useEffect, useState, useCallback, useContext } from "react";
import { Button, Upload, message, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import {
  service_uploadFile,
  service_createSTTTask,
} from "@/service/business_service";
import { calculateSHA256 } from "@/utils/fileUtil";
import "./FileUploader.less";
import { aliCloudLog } from "@/service/aliCloudLog";
import { AuthContext } from "@/state/auth/authContext";

const FileUploader = (props: any) => {
  const [fileUploadList, setFileUploadList] = useState([]);
  const [spinVisible, setSpinVisible] = useState(false);
  const { state } = useContext(AuthContext);

  useEffect(() => {
    console.log("fileUploadList:", fileUploadList);
  }, [fileUploadList]);

  const isValidFileName = (filename: string) => {
    const regex = /^.+_\d+_48000_16_2\.pcm$/i;
    return regex.test(filename);
  };

  const beforeUpload = async (file: { name: string }) => {
    // console.log('fileList:', fileList)
    // console.log('fileType:', file.type)
    // 验证文件列表长度
    // if (fileList.length > 10) {
    //     message.error('一次最多只能选择 10 个文件');
    //     return Upload.LIST_IGNORE;
    // }

    // 验证文件类型
    if (!isValidFileName(file.name)) {
      message.error("请上传符合要求的pcm音频文件 (.+_d+_48000_16_2.pcm)");
      return Upload.LIST_IGNORE;
    }
    return true;
  };
  const handleChange = ({ fileList }: any) => {
    setFileUploadList(fileList);
  };

  /**
   * 上传文件并创建任务
   * @param file 文件
   */
  const uploadFileAndCreateTask = async (file: File): Promise<void> => {
    try {
      setSpinVisible(true);
      const sha256Hash: string = await calculateSHA256(file.name);
      console.log("SHA-256 hash of the file:", sha256Hash);
      const uploadResponse = await service_uploadFile(file, sha256Hash);
      // console.log(`${file.name} 上传成功!`)
      const {
        visit_id,
        audio_file_name,
        audio_file_sha256,
        audio_duration_ms,
        upload_id,
      } = uploadResponse.data.data;

      const res = await service_createSTTTask(
        visit_id,
        audio_file_name,
        audio_file_sha256,
        audio_duration_ms,
        upload_id,
      );
      setSpinVisible(false);
      console.log(`任务${res?.data?.data?.index_id} 创建成功!`);
      message.success(`任务${res?.data?.data?.index_id} 创建成功!`);
      props.setPage(1);
      props.getTaskList();
    } catch (error) {
      setSpinVisible(false);
      message.error(`${file.name} 创建任务失败!`);
      console.error("FileUploader uploadFileAndCreateTask 任务错误:", error);
      aliCloudLog(
        `List页面 FileUploader组件 uploadFileAndCreateTask error: ${error}` +
          state.accountName,
      );
      throw error;
    }
  };

  const customRequest = useCallback(({ file }) => {
    uploadFileAndCreateTask(file);
  }, []);

  return (
    <div className="file-uploader">
      {spinVisible && (
        <Spin
          fullscreen
          indicator={<LoadingOutlined style={{ fontSize: 120 }} spin />}
          tip={
            <div
              style={{
                color: "#2d7a3a",
                fontSize: "24px",
                marginTop: "24px",
                fontWeight: "bold",
              }}
            >
              文件上传中，请耐心等待
            </div>
          }
        />
      )}
      <Upload
        name="file"
        multiple
        showUploadList={false}
        action={undefined} // 禁用默认上传行为
        beforeUpload={beforeUpload}
        fileList={fileUploadList}
        onChange={handleChange}
        customRequest={customRequest}
      >
        <Button className="upload-button" type="primary">
          上传音频
        </Button>
      </Upload>
    </div>
  );
};

export default FileUploader;
