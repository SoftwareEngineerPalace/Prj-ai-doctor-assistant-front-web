function formatTime(seconds: number) {
  // 计算分钟数
  const minutes = Math.floor(seconds / 60);
  // 计算剩余的秒数
  const remainingSeconds = seconds % 60;

  // 格式化分钟和秒数，确保它们是两位数
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  // 返回格式化的时间字符串
  return `${formattedMinutes}:${formattedSeconds}`;
}

function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp * 1000); // JavaScript的时间戳是以毫秒为单位的

  const year = date.getFullYear();
  const month = ("0" + (date.getMonth() + 1)).slice(-2); // 月份从0开始，所以要加1
  const day = ("0" + date.getDate()).slice(-2);
  const hour = ("0" + date.getHours()).slice(-2);
  const minute = ("0" + date.getMinutes()).slice(-2);
  const second = ("0" + date.getSeconds()).slice(-2);

  return (
    year +
    "-" +
    month +
    "-" +
    day +
    "" +
    " " +
    hour +
    ":" +
    minute +
    ":" +
    second
  );
}

function formatDate(input: number) {
  const date = new Date(input);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  // 如果需要将 UTC 时间转换为北京时间（UTC+8）
  // const adjustedHours = (parseInt(hours, 10) + 8) % 24;
  // const formattedAdjustedHours = String(adjustedHours).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const formatTimeInRecordDetail = (seconds: number) =>
  [seconds / 60, seconds % 60]
    .map((v) => `0${Math.floor(v)}`.slice(-2))
    .join(":");

export { formatTime, formatTimestamp, formatDate, formatTimeInRecordDetail };
