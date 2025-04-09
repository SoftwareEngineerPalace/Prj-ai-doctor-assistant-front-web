import { formatDate } from "../src/utils/timeUtil";
import { test, expect } from "vitest";

test("格式化时间", () => {
  expect(formatDate(1742719009129)).toBe("2025-03-23 16:36:49");
});
