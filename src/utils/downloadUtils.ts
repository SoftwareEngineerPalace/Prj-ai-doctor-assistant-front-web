import { message } from "antd";
import { aliCloudLog } from "../service/aliCloudLog";

const authInfo = localStorage.getItem("authInfo");

const downloadRecordEditedFile = async (record: any) => {
  try {
    const response = await fetch(record.asrRstJsonEditFileUrl, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    // 检查响应是否为 JSON
    const contentType = response.headers.get("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Response is not JSON");
    }
    // 读取响应体
    const jsonData = await response.json();
    const file = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json",
    });
    // 设置文件名
    const contentDisposition = response.headers.get("content-disposition");
    let downloadFileName;
    if (contentDisposition && contentDisposition.includes("filename=")) {
      const fileNameMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
      );
      downloadFileName = fileNameMatch
        ? decodeURIComponent(fileNameMatch[1].replace('"', ""))
        : null;
    } else {
      downloadFileName = `${record.index}-${record.audioFileName.split(".").slice(0, -1).join(".")}.json`;
    }
    // 创建下载链接并触发
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = downloadFileName ?? "defaultFileName.json";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    message.success(`文件 ${downloadFileName} 下载成功`);
  } catch (error) {
    message.error(`文件下载失败`);
    console.error("Error downloading JSON file:", error);
    aliCloudLog(
      `JSON 文件下载失败 ${record.asrRstJsonEditFileUrl}` + authInfo
        ? JSON.parse(authInfo || "")?.accountName
        : "",
    );
  }
};

const downloadRecordFile = async (record: any) => {
  try {
    const response = await fetch(record.arsRstTextFileUrl, {
      headers: {
        Accept: "text/plain",
      },
    });

    console.log("response:", response);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // 检查响应类型
    if (response.type !== "opaqueredirect") {
      const blob = await response.blob();
      const file = new Blob([blob], { type: "text/plain" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);

      // 获取 Content-Disposition 头部以确定文件名
      const contentDisposition = response.headers.get("content-disposition");
      let downloadFileName;
      if (contentDisposition && contentDisposition.includes("filename=")) {
        const fileNameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
        downloadFileName = fileNameMatch
          ? decodeURIComponent(fileNameMatch[1].replace('"', ""))
          : null;
      } else {
        downloadFileName = `${record.index}-${record.audioFileName.split(".").slice(0, -1).join(".")}.txt`;
      }
      link.download = downloadFileName ?? "defaultFileName.txt";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      message.success(`文件 ${downloadFileName} 下载成功`);
    } else {
      throw new Error("Response is not of type 'blob'");
    }
  } catch (error) {
    message.error(`文件下载失败`);
    console.error("Error downloading file:", error);
    aliCloudLog(
      `txt文件下载失败 ${record.arsRstTextFileUrl}` + authInfo
        ? JSON.parse(authInfo || "")?.accountName
        : "",
    );
  }
};

const downloadMp3File = async (record: any) => {
  try {
    const response = await fetch(record.sttAudioMp3FileUrl, {
      headers: {
        Accept: "audio/mpeg",
      },
    });

    console.log("response:", response);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // 检查响应类型
    if (response.type !== "opaqueredirect") {
      const blob = await response.blob();
      const file = new Blob([blob], { type: "audio/mpeg" }); // 修改 Blob 类型为 MP3

      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);

      // 获取 Content-Disposition 头部以确定文件名
      const contentDisposition = response.headers.get("content-disposition");
      let downloadFileName;
      if (contentDisposition && contentDisposition.includes("filename=")) {
        const fileNameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
        downloadFileName = fileNameMatch
          ? decodeURIComponent(fileNameMatch[1].replace(/['"]/g, ""))
          : null;
      } else {
        // 设置默认文件名
        downloadFileName = `${record.index}-${record.audioFileName.split(".").slice(0, -1).join(".")}.mp3`;
      }
      link.download = downloadFileName ?? "defaultFileName.mp3";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      message.success(`文件 ${downloadFileName} 下载成功`);
    } else {
      throw new Error("Response is not of type 'blob'");
    }
  } catch (error) {
    message.error(`文件下载失败`);
    console.error("Error downloading file:", error);
    aliCloudLog(
      `mp3文件下载失败 ${record.sttAudioMp3FileUrl}` + authInfo
        ? JSON.parse(authInfo || "")?.accountName
        : "",
    );
  }
};

export { downloadRecordFile, downloadMp3File, downloadRecordEditedFile };
