import React, { useRef } from "react";
import { Modal, Button } from "antd";
import "./CollectQrcodeModal.less";
import avatarUrl from "../../assets/avatar_01.png";
import html2canvas from "html2canvas";
import { aliCloudLog } from "@/service/aliCloudLog";

function CollectQrcodeModal(props: any) {
  const { isCollectModalOpen, setIsCollectModalOpen, imgUrl } = props;
  const authInfo = JSON.parse(localStorage.getItem("authInfo") as string);
  const modalRef = useRef<HTMLDivElement>(null);
  const downloadQrcode = async () => {
    if (modalRef.current && imgUrl) {
      try {
        const images = Array.from(modalRef.current.querySelectorAll("img"));

        // 创建一个加载状态的 Promise 数组
        const imageLoadPromises = images.map((img) => {
          return new Promise((resolve, reject) => {
            if (img.complete) {
              resolve(true); // 图片已加载完毕
            } else {
              img.onload = () => resolve(true); // 图片加载成功
              img.onerror = () => reject(new Error("图片加载失败"));
            }
          });
        });

        // 等待所有图片加载完毕
        await Promise.all(imageLoadPromises);

        const canvas = await html2canvas(modalRef.current, {
          allowTaint: true, // 允许跨域资源渲染
          useCORS: true, // 允许加载跨域图像
          scale: 2, // 提高清晰度
          removeContainer: true, // 渲染后移除临时容器元素
          backgroundColor: "#fff",
          onclone: (document) => {
            const container = document.getElementById(
              "qrcode-container",
            ) as HTMLDivElement;

            // 用户采用黑色背景时，下载样式会乱，这里改成和展示的一致, 下面注释的不生效，猜测是插件样式高于此
            // const avatar = document.getElementById('avatar') as HTMLDivElement;
            // avatar.style.backgroundColor = '#fff !important';
            // const qrcode = document.getElementById('qrcode') as HTMLDivElement;
            // qrcode.style.backgroundColor = '#fff !important';
            const hopName = document.getElementById(
              "hospital_name",
            ) as HTMLDivElement;
            hopName.style.color = "black";

            hopName.style.cssText += "color: black !important;";
            container.style.cssText += "color: black !important;";

            const caption = document.createElement("div");
            caption.textContent = "扫描二维码进行信息采集";
            caption.style.marginTop = "16px";
            caption.style.color = "black";
            caption.style.cssText += "color: black !important;";

            container.appendChild(caption);
          },
        }); // 将弹窗内容渲染为Canvas

        // 将Canvas转换为图片
        const image = canvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = image;
        link.download = "采集信息二维码.png";
        link.click();
      } catch (error) {
        console.log("Error downloading QR code:", error);
        aliCloudLog(
          `下载二维码Error downloading: url=${imgUrl}, error=${JSON.stringify(error)}`,
        );
      }
    }
  };

  return (
    <Modal
      title={null}
      footer={null}
      open={isCollectModalOpen}
      onOk={() => setIsCollectModalOpen(false)}
      onCancel={() => setIsCollectModalOpen(false)}
      centered
      width={400}
    >
      <div className="container">
        <div className="qrcode-container" id="qrcode-container" ref={modalRef}>
          <img id="avatar" src={avatarUrl} alt="" />
          <span id="hospital_name">
            {authInfo && authInfo.hospital["name"]}
          </span>
          {imgUrl ? (
            <>
              <img id="qrcode" src={imgUrl} alt="" />
            </>
          ) : (
            <>
              <div>二维码正在生成，请稍等...</div>
            </>
          )}
        </div>
        <Button style={{ width: "90%" }} onClick={downloadQrcode}>
          下载二维码
        </Button>
      </div>
    </Modal>
  );
}

export default CollectQrcodeModal;
