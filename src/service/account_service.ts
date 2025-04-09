import { AxiosPromise } from "axios";
import account_request from "./account_request";

function getToken(): string {
  return localStorage.getItem("access_token") || "";
}

function service_login({
  username,
  password,
}: {
  username: string;
  password: string;
}): AxiosPromise {
  return account_request({
    url: `v1/account/v2/authorization`,
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: {
      username,
      password,
    },
  });
}

function service_getUserInfo(): AxiosPromise {
  return account_request({
    url: `v1/account/token`,
    method: "get",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
}

export { service_login, service_getUserInfo };
