/**
 * fetcher.ts - Webページ取得モジュール（決定論的）
 *
 * 監視対象のWebページをフェッチし、テキストコンテンツを抽出する。
 * AIは一切使わず、純粋なHTTPリクエスト＋HTML解析のみ。
 */
import * as cheerio from "cheerio";

export interface FetchTarget {
  name: string;
  url: string;
  selector: string; // メインコンテンツのCSSセレクタ
}

export interface FetchResult {
  target: FetchTarget;
  content: string;
  fetchedAt: Date;
  success: boolean;
  error?: string;
}

// 監視対象の定義
export const TARGETS: FetchTarget[] = [
  {
    name: "claude-code-changelog",
    url: "https://docs.anthropic.com/en/docs/claude-code/changelog",
    selector: "main, article, .content, body",
  },
  {
    name: "anthropic-news",
    url: "https://www.anthropic.com/news",
    selector: "main, article, .content, body",
  },
];

/**
 * 単一のWebページをフェッチしてテキストを抽出する
 */
async function fetchPage(target: FetchTarget): Promise<FetchResult> {
  try {
    const response = await fetch(target.url, {
      headers: {
        "User-Agent":
          "AnthropicChangelogMonitor/1.0 (Local Agent; Educational Purpose)",
      },
    });

    if (!response.ok) {
      return {
        target,
        content: "",
        fetchedAt: new Date(),
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // スクリプト・スタイル・ナビゲーション要素を除去
    $("script, style, nav, header, footer, .sidebar, .navigation").remove();

    // セレクタの優先順位に従ってコンテンツを取得
    const selectors = target.selector.split(",").map((s) => s.trim());
    let content = "";

    for (const sel of selectors) {
      const el = $(sel);
      if (el.length > 0) {
        content = el.text().replace(/\s+/g, " ").trim();
        break;
      }
    }

    if (!content) {
      content = $("body").text().replace(/\s+/g, " ").trim();
    }

    return {
      target,
      content,
      fetchedAt: new Date(),
      success: true,
    };
  } catch (error) {
    return {
      target,
      content: "",
      fetchedAt: new Date(),
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * すべての監視対象をフェッチする
 */
export async function fetchAll(
  targets: FetchTarget[] = TARGETS
): Promise<FetchResult[]> {
  const results = await Promise.all(targets.map(fetchPage));
  return results;
}
