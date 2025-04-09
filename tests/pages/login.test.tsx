import { service_login } from "../../src/service/account_service";
import { test, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import Login from "../../src/pages/Login";
import React from "react";
import { AuthProvider } from "@/state/auth/authContext.js";

// 模拟 window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // 废弃的方法
    removeListener: vi.fn(), // 废弃的方法
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock("react-router-dom", () => ({ useNavigate: vi.fn() }));

test("跑通登录接口", async () => {
  const rsp = await service_login({
    username: "zhilantest@zhilan.com",
    password: "ZHIlan@123",
  });

  // 确保 rsp 存在
  expect(rsp).toBeDefined();

  // 检查状态码是否为 200
  expect(rsp.status).toBe(200);
});

test("显示登录按钮", () => {
  const { getByText } = render(
    <AuthProvider>
      <Login />
    </AuthProvider>,
  );

  // 检查props.text是否正确渲染到按钮上
  const buttonNode = getByText("登 录");
  expect(buttonNode).not.toBeNull();
});
