/**
 * differ.ts - 差分検出モジュール（決定論的）
 *
 * 前回のスナップショットと今回のフェッチ結果を比較し、差分を検出する。
 * スナップショットはローカルファイルに保存される。
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { FetchResult } from "./fetcher.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOTS_DIR = join(__dirname, "..", "data", "snapshots");

export interface DiffResult {
  targetName: string;
  hasChanges: boolean;
  previousContent: string;
  currentContent: string;
  isFirstRun: boolean;
  changedAt: Date;
}

/**
 * スナップショットのファイルパスを取得
 */
function getSnapshotPath(name: string): string {
  return join(SNAPSHOTS_DIR, `${name}.txt`);
}

/**
 * 前回のスナップショットを読み込む
 */
async function loadSnapshot(name: string): Promise<string | null> {
  const path = getSnapshotPath(name);
  if (!existsSync(path)) return null;

  try {
    return await readFile(path, "utf-8");
  } catch {
    return null;
  }
}

/**
 * スナップショットを保存する
 */
async function saveSnapshot(name: string, content: string): Promise<void> {
  await mkdir(SNAPSHOTS_DIR, { recursive: true });
  await writeFile(getSnapshotPath(name), content, "utf-8");
}

/**
 * フェッチ結果とスナップショットを比較して差分を検出する
 */
export async function detectChanges(
  fetchResults: FetchResult[]
): Promise<DiffResult[]> {
  const diffResults: DiffResult[] = [];

  for (const result of fetchResults) {
    if (!result.success) {
      console.log(
        `[differ] ${result.target.name}: フェッチ失敗のためスキップ - ${result.error}`
      );
      continue;
    }

    const previousContent = await loadSnapshot(result.target.name);
    const isFirstRun = previousContent === null;
    const hasChanges = isFirstRun || previousContent !== result.content;

    diffResults.push({
      targetName: result.target.name,
      hasChanges,
      previousContent: previousContent ?? "",
      currentContent: result.content,
      isFirstRun,
      changedAt: result.fetchedAt,
    });

    // 変更があった場合のみスナップショットを更新
    if (hasChanges) {
      await saveSnapshot(result.target.name, result.content);
      console.log(
        `[differ] ${result.target.name}: ${isFirstRun ? "初回スナップショット保存" : "変更を検出！"}`
      );
    } else {
      console.log(`[differ] ${result.target.name}: 変更なし`);
    }
  }

  return diffResults;
}
