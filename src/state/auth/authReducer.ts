export const initialState = {
  /** 表示是否已登录 */
  isAuthenticated: false,
  token: null,
  username: null,
  hospital: null,
  doctorId: null,
  accountName: "",
  machineCode: "",
  os: "",
};

export function authReducer(state, action) {
  switch (action.type) {
    case "login":
      return {
        ...state,
        isAuthenticated: true,
        token: action.payload.token,
        username: action.payload.username,
        hospital: action.payload.hospital,
        doctorId: action.payload.doctorId,
        accountName: action.payload.accountName,
      };
    case "logout":
      return {
        ...state,
        isAuthenticated: false,
        token: null,
        username: null,
        hospital: null,
        doctorId: null,
        accountName: null,
      };
    case "saveMachineCode":
      return {
        ...state,
        machineCode: action.payload.machineCode,
      };
    case "setOS":
      return {
        ...state,
        os: action.payload.os,
      };
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}
