import { afterEach, describe, expect, it, vi } from "vitest";
import { isPhoneBrowser } from "./isPhoneBrowser";

const setUA = (ua: string) => vi.spyOn(navigator, "userAgent", "get").mockReturnValue(ua);

describe("isPhoneBrowser", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ["iPhone Safari", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148", true],
    ["Android phone", "Mozilla/5.0 (Linux; Android 15; Pixel 9) Chrome/130 Mobile Safari/537.36", true],
    ["Instagram in-app", "Mozilla/5.0 (Linux; Android 15) Instagram 300.0", true],
    ["iPad", "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) Mobile/15E148", false],
    ["Android tablet", "Mozilla/5.0 (Linux; Android 15; Pixel Tablet) Chrome/130 Safari/537.36", false],
    ["desktop Chrome", "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/130 Safari/537.36", false],
  ])("%s → %s", (_name, ua, expected) => {
    setUA(ua);
    expect(isPhoneBrowser()).toBe(expected);
  });
});
