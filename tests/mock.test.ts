import { expect, test, vi } from "vitest";
async function fetchUser(userId: number) {
  const response = await fetch(`https://api.example.com/users/${userId}`);
  return response.json();
}

test("fetchUser should return user data", async () => {
  // 模拟 fetch 函数
  const mockUser = { id: 1, name: "John Doe" };
  global.fetch = vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(mockUser),
    }),
  );

  const user = await fetchUser(1);
  expect(user).toEqual(mockUser); // 检查返回的用户数据
  expect(fetch).toHaveBeenCalledWith("https://api.example.com/users/1"); // 检查是否调用了正确的 URL
});
