import SlsTracker from "@aliyun-sls/web-track-browser";

const project_name = "ai-doctor-assistant-asr";
let user_id = "not-logined";
let tracker: SlsTracker;

const initAliCloudLog = ($user_id: string) => {
  // console.log('aliClouldLog initAliCloudLog user_id=', $user_id);
  user_id = $user_id;
  const opts = {
    host: "cn-beijing.log.aliyuncs.com", // 所在地域的服务入口。例如cn-hangzhou.log.aliyuncs.com
    project: "zhilan-frontend-log", // Project名称。
    logstore: "zhilan-frontend-log-logstore", // Logstore名称。
    time: 10, // 发送日志的时间间隔，默认是10秒。
    topic: project_name, // 自定义日志主题。
    source: user_id.toString(), // 用户 uid
  };
  tracker = new SlsTracker(opts);
};

const aliCloudLog = (
  message: string,
  level: "info" | "warn" | "error" = "info",
) => {
  if (tracker) {
    tracker.sendImmediate({
      message,
      level, // 添加日志级别字段
    });
  }
};

export { aliCloudLog, initAliCloudLog };
