import { expect, it } from "vitest";
import { toUpperCase } from "../src/utils/txtUtil";
it("toUpperCase", () => {
  const result = toUpperCase("foobar");
  expect(result).toMatchSnapshot();
});
