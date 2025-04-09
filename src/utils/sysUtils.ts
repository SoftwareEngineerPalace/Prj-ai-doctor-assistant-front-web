function getOS() {
  const userAgent = navigator.userAgent;
  if (/Windows/.test(userAgent)) {
    return "Windows";
  } else if (/Macintosh|Mac Intel|MacPPC|MacIntel/.test(userAgent)) {
    return "MacOS";
  } else if (/Linux/.test(userAgent)) {
    return "Linux";
  } else if (/Android/.test(userAgent)) {
    return "Android";
  } else if (/iOS|iPhone|iPad|iPod/.test(userAgent)) {
    return "iOS";
  } else {
    return "Unknown OS";
  }
}

export default getOS;
