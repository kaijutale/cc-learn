/**
 * reporter.ts - Markdownレポート保存モジュール（決定論的）
 *
 * AI分析結果をMarkdownファイルとして保存する。
 * 日付ごとにファイルを生成し、レポートディレクトリに蓄積していく。
 */
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, "..", "reports");

export interface AnalysisResult {
  targetName: string;
  summary: string;
  isFirstRun: boolean;
  analyzedAt: Date;
}

/**
 * 日付をファイル名に使える形式にフォーマット
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]!; // YYYY-MM-DD
}

/**
 * 時刻をフォーマット
 */
function formatTime(date: Date): string {
  return date.toISOString().split("T")[1]!.slice(0, 5); // HH:MM
}

/**
 * レポートをMarkdownファイルとして保存する
 */
export async function saveReport(
  analyses: AnalysisResult[]
): Promise<string | null> {
  if (analyses.length === 0) {
    console.log("[reporter] 分析結果がないためレポートはスキップ");
    return null;
  }

  await mkdir(REPORTS_DIR, { recursive: true });

  const now = new Date();
  const dateStr = formatDate(now);
  const timeStr = formatTime(now);
  const fileName = `${dateStr}_changelog-report.md`;
  const filePath = join(REPORTS_DIR, fileName);

  const sections = analyses.map((a) => {
    const badge = a.isFirstRun ? "[初回取得]" : "[変更検出]";
    return `## ${badge} ${a.targetName}

> 分析日時: ${formatDate(a.analyzedAt)} ${formatTime(a.analyzedAt)}

${a.summary}
`;
  });

  const markdown = `# Anthropic Changelog Report

**生成日時**: ${dateStr} ${timeStr}
**監視対象数**: ${analyses.length}

---

${sections.join("\n---\n\n")}
---

*このレポートは Anthropic Changelog Monitor (ローカルエージェント) により自動生成されました。*
`;

  await writeFile(filePath, markdown, "utf-8");
  console.log(`[reporter] レポート保存: ${filePath}`);

  return filePath;
}
