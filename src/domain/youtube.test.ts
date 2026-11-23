import { describe, expect, it } from "vitest";
import { isVideoId, parseYouTubeId } from "./youtube";

const ID = "dQw4w9WgXcQ";

describe("parseYouTubeId", () => {
  it.each([
    [`https://www.youtube.com/watch?v=${ID}`],
    [`https://youtube.com/watch?v=${ID}&t=43s&list=PLx&si=abc`],
    [`https://m.youtube.com/watch?v=${ID}`],
    [`https://music.youtube.com/watch?v=${ID}&feature=share`],
    [`https://youtu.be/${ID}?si=xyz`],
    [`youtu.be/${ID}`],
    [`www.youtube.com/watch?v=${ID}`],
    [`https://www.youtube.com/embed/${ID}`],
    [`https://www.youtube-nocookie.com/embed/${ID}`],
    [`https://www.youtube.com/shorts/${ID}`],
    [`https://www.youtube.com/live/${ID}`],
    [`  ${ID}  `],
  ])("finds the id in %s", (input) => expect(parseYouTubeId(input)).toBe(ID));

  it.each([
    [""], ["hello"], ["https://example.com/watch?v=dQw4w9WgXcQ"], ["https://evil.com/youtu.be/dQw4w9WgXcQ"],
    ["https://www.youtube.com/playlist?list=PLabc"], ["https://www.youtube.com/watch"], ["https://www.youtube.com/watch?v=short"],
    ["https://www.youtube.com/@somechannel"], ["javascript:alert(1)"], ["ftp://youtu.be/dQw4w9WgXcQ"],
    ["https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ"], ["dQw4w9WgXc"], ["dQw4w9WgXcQQ"],
  ])("refuses %s", (input) => expect(parseYouTubeId(input)).toBeNull());

  it("a video id is exactly eleven letters, digits, dashes and underscores", () => {
    expect(isVideoId(ID)).toBe(true);
    expect(isVideoId("a_b-c1d2e3f")).toBe(true);
    expect(isVideoId("a b c d e f ")).toBe(false);
    expect(isVideoId(5)).toBe(false);
  });
});
