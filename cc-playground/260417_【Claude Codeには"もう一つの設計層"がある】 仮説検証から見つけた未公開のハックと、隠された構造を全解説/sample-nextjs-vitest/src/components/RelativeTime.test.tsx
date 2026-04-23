import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RelativeTime } from "./RelativeTime";

describe("RelativeTime component", () => {
  describe("正常系", () => {
    it("'5 minutes ago' が text として描画される", () => {
      render(
        <RelativeTime
          date={new Date("2026-04-23T10:00:00Z")}
          now={new Date("2026-04-23T10:05:00Z")}
        />,
      );
      expect(screen.getByText("5 minutes ago")).toBeInTheDocument();
    });

    it("<time> 要素として描画される (querySelector で取得可能)", () => {
      const { container } = render(
        <RelativeTime
          date={new Date("2026-04-23T10:00:00Z")}
          now={new Date("2026-04-23T10:05:00Z")}
        />,
      );
      const timeEl = container.querySelector("time");
      expect(timeEl).not.toBeNull();
      expect(timeEl?.textContent).toBe("5 minutes ago");
    });

    it("dateTime 属性に ISO 8601 文字列が付与される (Date 入力)", () => {
      const { container } = render(
        <RelativeTime
          date={new Date("2026-04-23T10:00:00Z")}
          now={new Date("2026-04-23T10:05:00Z")}
        />,
      );
      const timeEl = container.querySelector("time");
      expect(timeEl?.getAttribute("dateTime")).toBe("2026-04-23T10:00:00.000Z");
    });

    it("1 時間後の未来は 'in 1 hour' を表示", () => {
      render(
        <RelativeTime
          date={new Date("2026-04-23T11:00:00Z")}
          now={new Date("2026-04-23T10:00:00Z")}
        />,
      );
      expect(screen.getByText("in 1 hour")).toBeInTheDocument();
    });
  });

  describe("className 付与", () => {
    it("className prop が <time> 要素に反映される", () => {
      const { container } = render(
        <RelativeTime
          date={new Date("2026-04-23T10:00:00Z")}
          now={new Date("2026-04-23T10:05:00Z")}
          className="text-sm"
        />,
      );
      const timeEl = container.querySelector("time");
      expect(timeEl?.getAttribute("class")).toBe("text-sm");
    });

    it("className 未指定時は class 属性なし or 空", () => {
      const { container } = render(
        <RelativeTime
          date={new Date("2026-04-23T10:00:00Z")}
          now={new Date("2026-04-23T10:05:00Z")}
        />,
      );
      const timeEl = container.querySelector("time");
      const cls = timeEl?.getAttribute("class");
      expect(cls == null || cls === "").toBe(true);
    });
  });

  describe("dateTime 属性 (number 入力)", () => {
    it("number (Unix ms) 入力は ISO 8601 に変換される", () => {
      // 1713859200000 = 2024-04-23T08:00:00.000Z
      const { container } = render(
        <RelativeTime
          date={1713859200000}
          now={1713859230000}
        />,
      );
      const timeEl = container.querySelector("time");
      expect(timeEl?.getAttribute("dateTime")).toBe(
        new Date(1713859200000).toISOString(),
      );
      expect(timeEl?.textContent).toBe("30 seconds ago");
    });
  });
});
