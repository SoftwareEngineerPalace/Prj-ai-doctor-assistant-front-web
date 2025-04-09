function blobToText(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      resolve(event.target.result);
    };
    reader.onerror = function (event) {
      reject(event.target.error);
    };
    reader.readAsText(blob);
  });
}

const toUpperCase = (str) => {
  return str.toUpperCase();
};

export { blobToText, toUpperCase };
