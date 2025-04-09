/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { blobToText } from "../utils/txtUtil";

class RecordWebSocket {
  //定义socket连接方法类
  socketTask: any;
  msgHandle: Function;
  pcmHandle: Function;
  stateHandle: Function;
  wsUrl: string;
  // hsid: string;
  // doctorId: string;
  // visitId: string;
  // mvid: string;
  // constructor({ msgHandle, pcmHandle, stateHandle, hsid, doctorId, visitId, mvid }: any) {
  constructor({ msgHandle, pcmHandle, stateHandle }: any) {
    this.msgHandle = msgHandle;
    this.pcmHandle = pcmHandle;
    this.stateHandle = stateHandle;
    // this.wsUrl = "192.168.31.216:9666"; // Mechrev 开发机 只有一台 是 windows linux 双系统
    this.wsUrl = "127.0.0.1:9666"; // 放到友谊医院本部或顺义分部
    // this.hsid = hsid;
    // this.doctorId = doctorId;
    // this.visitId = visitId;
    // this.mvid = mvid;
  }

  /** 开始连接 */
  async wsStart() {
    console.log("websocket wsStart!");
    // 创建 WebSocket 连接
    // 添加请求头
    // const authInfo: any = localStorage.getItem('authInfo');
    // const token = authInfo ? JSON.parse(authInfo).token : null;
    // const authValue = encodeURIComponent(`Bearer ${token}`);
    // const websocketUrl = `ws://${this.wsUrl}/v1/std/hs/${this.hsid}/doctor/${this.doctorId}/visit/${this.visitId}/?mvid=${this.mvid}&authorization=${authValue}`;
    const websocketUrl = `ws://${this.wsUrl}/v1/audio/record`;

    return new Promise((resolve, reject) => {
      let timeoutId: any = {} as any;

      this.socketTask = new WebSocket(websocketUrl);

      // 连接打开事件
      this.socketTask.addEventListener("open", (event) => {
        console.log("WebSocket is connected.");
        clearTimeout(timeoutId);
        // 发送消息到服务器
        this.onOpen(event);
        // this.socketTask.send('Hello Server!');
        resolve(event);
      });

      // 监听消息事件
      this.socketTask.addEventListener("message", async (event) => {
        // console.log('Message from server ', event.data);
        if (event.data instanceof Blob) {
          const blob = event.data;
          const str: string = (await blobToText(blob)) as string;
          const isStandardmsg = str.startsWith(`10\t`);
          const isStandardpcm = str.startsWith(`002\t`);
          if (isStandardmsg) {
            const list = str.split(`\t`);
            const jsonStr = list[1];
            const json = JSON.parse(jsonStr);
            // if (json.mtype !== "asr_rst") return;
            console.log("🚀", json);
            this.msgHandle(json);
          } else if (isStandardpcm) {
            const arrayBuffer = await event.data.arrayBuffer();
            // console.log('Received ArrayBuffer (from Blob):', arrayBuffer);
            // 将 ArrayBuffer 转换为字节数组（Uint8Array）
            const uint8Array = new Uint8Array(arrayBuffer);
            // 检查前 3 个字节是否是 '02 '，即 0x30、0x32、0x20
            const header = uint8Array.slice(0, 4); // 获取前 3 个字节
            // console.log('header:', header);
            // '002\t' 对应的字节是 [0x30, 0x30, 0x32, 0x09]
            if (
              header[0] === 0x30 &&
              header[1] === 0x30 &&
              header[2] === 0x32 &&
              header[3] === 0x09
            ) {
              // 跳过前 3 个字节，提取剩下的二进制数据
              // const binaryData = uint8Array.slice(4);
              const int16Array = new Int16Array(arrayBuffer.slice(4));
              // 你可以继续处理二进制流 (binaryData) 了
              // console.log('二进制流部分:', int16Array);
              this.pcmHandle(int16Array);
            } else {
              console.log("数据格式不符合预期");
            }
          } else {
            return;
          }
        }
      });

      // 监听错误事件
      this.socketTask.addEventListener("error", (event) => {
        console.error("WebSocket error: ", event);
        clearTimeout(timeoutId);
        this.onError(event);
        reject(event);
      });

      // 监听关闭事件
      this.socketTask.addEventListener("close", (event) => {
        console.log("WebSocket is closed now.");
        clearTimeout(timeoutId);
        this.onClose(event);
        reject(event);
      });

      // 设置connect超时
      timeoutId = setTimeout(() => {
        if (this.socketTask && this.socketTask.readyState !== WebSocket.OPEN) {
          console.log("WebSocket connection timeout.");
          this.wsStop();
          reject(new Error("WebSocket connection timed out."));
        }
      }, 5000);
    });
  }

  // 定义停止与发送函数
  wsStop() {
    if (this.socketTask != undefined) {
      console.log("websocket wsStop!");
      this.socketTask.close();
    }
  }

  wsSend(data: any) {
    if (this.socketTask == undefined) return;
    console.log("websocket wsSend");
    if (this.socketTask.readyState === 1) {
      // 0:CONNECTING, 1:OPEN, 2:CLOSING, 3:CLOSED
      this.socketTask.send(data);
    }
  }

  // SOCEKT连接中的消息与状态响应
  private onOpen(e) {
    console.log("websocket onOpen", { e });
    this.stateHandle(StateEnum.open);
  }

  private onClose(e) {
    console.log("websocket onClose", { e });
    this.stateHandle(StateEnum.close, e);
  }

  private onMessage(e) {
    console.log("websocket onMessage", e);
    this.msgHandle(e);
  }

  private onError(e) {
    console.log("websocket onError", { e });
    this.stateHandle(StateEnum.error);
  }
}

enum StateEnum {
  open = "open", // 0
  close = "close", // 1
  error = "error", // 2
}

export { RecordWebSocket, StateEnum };
