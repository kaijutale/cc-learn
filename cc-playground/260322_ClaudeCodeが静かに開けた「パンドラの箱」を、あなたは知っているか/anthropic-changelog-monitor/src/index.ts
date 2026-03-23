/**
 * index.ts - メインエントリポイント
 *
 * ハーネスの全体フロー:
 *
 *   [決定論的] cron起動
 *        ↓
 *   [決定論的] Webフェッチ (fetcher)
 *        ↓
 *   [決定論的] 差分検出 (differ)
 *        ↓ 差分あり？
 *   [非決定論的] AI分析 (analyzer) ← ここだけAI
 *        ↓
 *   [決定論的] MDレポート保存 (reporter)
 *
 * 「暴れん坊のケルベロスを手綱で制御するハーネス」の実装
 */
import cron from "node-cron";
import { fetchAll, TARGETS } from "./fetcher.js";
import { detectChanges } from "./differ.js";
import { analyzeChanges } from "./analyzer.js";
import { saveReport } from "./reporter.js";

/**
 * メイン処理: 1回の監視サイクルを実行する
 */
async function runMonitorCycle(): Promise<void> {
  const startTime = Date.now();
  console.log("\n========================================");
  console.log(`[monitor] 監視サイクル開始: ${new Date().toLocaleString("ja-JP")}`);
  console.log("========================================\n");

  // Step 1: Webフェッチ（決定論的）
  console.log("[Step 1/4] Webページをフェッチ中...");
  const fetchResults = await fetchAll(TARGETS);

  const successCount = fetchResults.filter((r) => r.success).length;
  console.log(
    `[Step 1/4] ${successCount}/${fetchResults.length} ページのフェッチ完了\n`
  );

  // Step 2: 差分検出（決定論的）
  console.log("[Step 2/4] 差分を検出中...");
  const diffs = await detectChanges(fetchResults);

  const changesCount = diffs.filter((d) => d.hasChanges).length;
  console.log(`[Step 2/4] ${changesCount}件の変更を検出\n`);

  // Step 3: AI分析（非決定論的 - ここだけAIの出番）
  console.log("[Step 3/4] AI分析中（変更がある場合のみ）...");
  const analyses = await analyzeChanges(diffs);
  console.log(`[Step 3/4] ${analyses.length}件の分析完了\n`);

  // Step 4: レポート保存（決定論的）
  console.log("[Step 4/4] レポートを保存中...");
  const reportPath = await saveReport(analyses);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n========================================");
  console.log(`[monitor] 監視サイクル完了 (${elapsed}秒)`);
  if (reportPath) {
    console.log(`[monitor] レポート: ${reportPath}`);
  } else {
    console.log("[monitor] 変更なし、レポートは生成されませんでした");
  }
  console.log("========================================\n");
}

/**
 * cronスケジューラを起動する
 */
function startScheduler(): void {
  // 毎朝7時に実行 (分 時 日 月 曜日)
  const schedule = "0 7 * * *";

  console.log("╔════════════════════════════════════════════╗");
  console.log("║  Anthropic Changelog Monitor               ║");
  console.log("║  ローカルエージェント - ハーネス構成         ║");
  console.log("╠════════════════════════════════════════════╣");
  console.log("║                                            ║");
  console.log("║  監視対象:                                  ║");
  TARGETS.forEach((t) => {
    console.log(`║   - ${t.name.padEnd(37)}║`);
  });
  console.log("║                                            ║");
  console.log(`║  スケジュール: ${schedule.padEnd(27)}║`);
  console.log("║  出力先: reports/                           ║");
  console.log("║                                            ║");
  console.log("╚════════════════════════════════════════════╝");
  console.log("");
  console.log("[scheduler] cronジョブを登録しました。待機中...");
  console.log("[scheduler] 手動実行: --once オプションで即時実行\n");

  cron.schedule(schedule, () => {
    runMonitorCycle().catch(console.error);
  });
}

// エントリポイント
const isOnce = process.argv.includes("--once");

if (isOnce) {
  // --once: 即座に1回実行して終了
  console.log("[mode] 手動実行モード（1回実行して終了）\n");
  runMonitorCycle()
    .then(() => {
      console.log("[done] 処理完了。終了します。");
      process.exit(0);
    })
    .catch((error) => {
      console.error("[error] エラーが発生しました:", error);
      process.exit(1);
    });
} else {
  // デフォルト: cronスケジューラを起動
  startScheduler();
}
