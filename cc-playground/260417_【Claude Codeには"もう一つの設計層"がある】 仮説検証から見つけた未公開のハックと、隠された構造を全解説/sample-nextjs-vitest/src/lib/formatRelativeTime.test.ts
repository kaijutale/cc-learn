import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "./formatRelativeTime";

describe("formatRelativeTime", () => {
  describe("正常系 (過去)", () => {
    it("3秒差で 'just now' を返す", () => {
      expect(
        formatRelativeTime(
          new Date("2026-04-23T10:00:00Z"),
          new Date("2026-04-23T10:00:03Z"),
        ),
      ).toBe("just now");
    });

    it("30秒差で '30 seconds ago' を返す", () => {
      expect(
        formatRelativeTime(
          new Date("2026-04-23T10:00:00Z"),
          new Date("2026-04-23T10:00:30Z"),
        ),
      ).toBe("30 seconds ago");
    });

    it("1分差で '1 minute ago' (単数) を返す", () => {
      expect(
        formatRelativeTime(
          new Date("2026-04-23T10:00:00Z"),
          new Date("2026-04-23T10:01:00Z"),
        ),
      ).toBe("1 minute ago");
    });

    it("5分差で '5 minutes ago' (複数) を返す", () => {
      expect(
        formatRelativeTime(
          new Date("2026-04-23T10:00:00Z"),
          new Date("2026-04-23T10:05:00Z"),
        ),
      ).toBe("5 minutes ago");
    });

    it("1時間差で '1 hour ago' (単数) を返す", () => {
      expect(
        formatRelativeTime(
          new Date("2026-04-23T10:00:00Z"),
          new Date("2026-04-23T11:00:00Z"),
        ),
      ).toBe("1 hour ago");
    });

    it("1日差で '1 day ago' (単数) を返す", () => {
      expect(
        formatRelativeTime(
          new Date("2026-04-23T10:00:00Z"),
          new Date("2026-04-24T10:00:00Z"),
        ),
      ).toBe("1 day ago");
    });

    it("7日差で '1 week ago' (単数) を返す", () => {
      expect(
        formatRelativeTime(
          new Date("2026-04-23T10:00:00Z"),
          new Date("2026-04-30T10:00:00Z"),
        ),
      ).toBe("1 week ago");
    });

    it("30日差で '1 month ago' (単数) を返す", () => {
      expect(
        formatRelativeTime(
          new Date("2026-04-23T10:00:00Z"),
          new Date("2026-05-23T10:00:00Z"),
        ),
      ).toBe("1 month ago");
    });

    it("365日差で '1 year ago' (単数) を返す", () => {
      expect(
        formatRelativeTime(
          new Date("2026-04-23T10:00:00Z"),
          new Date("2027-04-23T10:00:00Z"),
        ),
      ).toBe("1 year ago");
    });
  });

  describe("正常系 (未来)", () => {
    it("5分後で 'in 5 minutes' を返す", () => {
      expect(
        formatRelativeTime(
          new Date("2026-04-23T10:05:00Z"),
          new Date("2026-04-23T10:00:00Z"),
        ),
      ).toBe("in 5 minutes");
    });

    it("1日後で 'in 1 day' (単数) を返す", () => {
      expect(
        formatRelativeTime(
          new Date("2026-04-24T10:00:00Z"),
          new Date("2026-04-23T10:00:00Z"),
        ),
      ).toBe("in 1 day");
    });
  });

  describe("境界値", () => {
    it("差分4秒は 'just now' (閾値未満)", () => {
      expect(
        formatRelativeTime(
          new Date("2026-04-23T10:00:00Z"),
          new Date("2026-04-23T10:00:04Z"),
        ),
      ).toBe("just now");
    });

    it("差分5秒は '5 seconds ago' (閾値)", () => {
      expect(
        formatRelativeTime(
          new Date("2026-04-23T10:00:00Z"),
          new Date("2026-04-23T10:00:05Z"),
        ),
      ).toBe("5 seconds ago");
    });

    it("差分59秒は '59 seconds ago'", () => {
      expect(
        formatRelativeTime(
          new Date("2026-04-23T10:00:00Z"),
          new Date("2026-04-23T10:00:59Z"),
        ),
      ).toBe("59 seconds ago");
    });

    it("差分60秒は '1 minute ago' (単位昇格)", () => {
      expect(
        formatRelativeTime(
          new Date("2026-04-23T10:00:00Z"),
          new Date("2026-04-23T10:01:00Z"),
        ),
      ).toBe("1 minute ago");
    });

    it("差分3599秒は '59 minutes ago'", () => {
      expect(
        formatRelativeTime(
          new Date("2026-04-23T10:00:00Z"),
          new Date("2026-04-23T10:59:59Z"),
        ),
      ).toBe("59 minutes ago");
    });

    it("差分3600秒は '1 hour ago' (単位昇格)", () => {
      expect(
        formatRelativeTime(
          new Date("2026-04-23T10:00:00Z"),
          new Date("2026-04-23T11:00:00Z"),
        ),
      ).toBe("1 hour ago");
    });

    it("差分86399秒は '23 hours ago'", () => {
      expect(
        formatRelativeTime(
          new Date("2026-04-23T10:00:00Z"),
          new Date("2026-04-24T09:59:59Z"),
        ),
      ).toBe("23 hours ago");
    });

    it("差分86400秒は '1 day ago' (単位昇格)", () => {
      expect(
        formatRelativeTime(
          new Date("2026-04-23T10:00:00Z"),
          new Date("2026-04-24T10:00:00Z"),
        ),
      ).toBe("1 day ago");
    });
  });

  describe("エッジケース", () => {
    it("number (Unix ms) 入力: 30秒差で '30 seconds ago'", () => {
      expect(formatRelativeTime(1713859200000, 1713859230000)).toBe(
        "30 seconds ago",
      );
    });

    it("Date と number 混在: Date input + number now", () => {
      const input = new Date("2026-04-23T10:00:00Z");
      const now = input.getTime() + 30_000;
      expect(formatRelativeTime(input, now)).toBe("30 seconds ago");
    });

    it("number input + Date now の組み合わせ", () => {
      const base = new Date("2026-04-23T10:00:00Z");
      expect(
        formatRelativeTime(base.getTime(), new Date(base.getTime() + 60_000)),
      ).toBe("1 minute ago");
    });

    it("now 省略時は現在時刻基準で 'just now' (3秒前)", () => {
      expect(formatRelativeTime(new Date(Date.now() - 3000))).toBe("just now");
    });
  });

  describe("エラー系", () => {
    it("null 入力で TypeError", () => {
      expect(() =>
        formatRelativeTime(null as unknown as Date),
      ).toThrow(TypeError);
    });

    it("undefined 入力で TypeError", () => {
      expect(() =>
        formatRelativeTime(undefined as unknown as Date),
      ).toThrow(TypeError);
    });

    it("string 入力で TypeError", () => {
      expect(() =>
        formatRelativeTime("2026-04-23" as unknown as Date),
      ).toThrow(TypeError);
    });

    it("object 入力で TypeError", () => {
      expect(() =>
        formatRelativeTime({} as unknown as Date),
      ).toThrow(TypeError);
    });

    it("無効な Date 入力で RangeError", () => {
      expect(() => formatRelativeTime(new Date("invalid"))).toThrow(RangeError);
    });
  });
});
