const getPageCount = (count: any, pageSize: any) => {
  if (typeof count == "number") {
    if (count > 0) {
      try {
        let _pagerCount: any =
          count % pageSize == 0 ? count / pageSize : count / pageSize + 1;
        const c = _pagerCount.toFixed(0); //小数取整
        _pagerCount = c > _pagerCount ? c - 1 : c; //过滤四舍五入
        return _pagerCount;
      } catch (error) {
        return JSON.stringify(error);
      }
    } else {
      return 0;
    }
  } else {
    return 0;
  }
};

function blobToArrayBuffer(blob: Blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

export { getPageCount, blobToArrayBuffer };
