function produceObj(a: any, b: any) {
  const result: any = {};
  // 遍历对象 a 的所有属性
  Object.keys(a).forEach((key) => {
    // 如果对象 b 中也包含这个属性，则更新对象 a 的这个属性的值
    if (Object.prototype.hasOwnProperty.call(b, key)) {
      result[key] = b[key];
    }
  });
  // 返回更新后的对象 a
  return result;
}

const fixPdfUrl = (url: string) => {
  if (
    url ===
    "https://www.hks-power.com.cn/uploadfiles/2020/09/20200909200802308.pdf"
  ) {
    return null;
  }
  return url;
};

export { produceObj, fixPdfUrl };
