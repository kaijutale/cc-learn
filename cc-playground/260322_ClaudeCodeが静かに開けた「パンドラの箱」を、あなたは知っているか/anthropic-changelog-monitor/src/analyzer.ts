/**
 * analyzer.ts - AI分析モジュール（非決定論的）
 *
 * ここがハーネスの中で唯一AIが介入するポイント。
 * Claude Agent SDKのquery関数を使って、差分内容を要約＋影響分析する。
 *
 * 設計思想:
 * - maxTurns: 1 → AIの行動回数を制限（手綱）
 * - allowedTools: [] → ツール使用禁止（テキスト生成のみ）
 * - permissionMode: "bypassPermissions" → 自動実行時の許可プロンプトを回避
 */
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { DiffResult } from "./differ.js";
import type { AnalysisResult } from "./reporter.js";

/**
 * 差分内容をAIで分析する
 *
 * 記事の設計思想に従い:
 * - 決定論的にプロンプトを構築（ここはプログラムの仕事）
 * - 非決定論的なAIに「判断」だけを任せる
 * - AIの行動範囲をmaxTurns=1で制限
 */
export async function analyzeChanges(
  diffs: DiffResult[]
): Promise<AnalysisResult[]> {
  const changedDiffs = diffs.filter((d) => d.hasChanges);

  if (changedDiffs.length === 0) {
    console.log("[analyzer] 変更がないためAI分析はスキップ（コスト0）");
    return [];
  }

  console.log(
    `[analyzer] ${changedDiffs.length}件の変更をAIで分析開始...`
  );

  const results: AnalysisResult[] = [];

  for (const diff of changedDiffs) {
    const analysisResult = await analyzeSingleDiff(diff);
    results.push(analysisResult);
  }

  return results;
}

/**
 * 単一の差分をAIで分析する
 */
async function analyzeSingleDiff(diff: DiffResult): Promise<AnalysisResult> {
  // 決定論的にプロンプトを構築
  const prompt = buildPrompt(diff);

  console.log(`[analyzer] ${diff.targetName} を分析中...`);

  try {
    let resultText = "";

    // Agent SDKのquery関数でAIを呼び出す
    // maxTurns: 1 でAIの行動を1回に制限（ハーネスの手綱）
    for await (const message of query({
      prompt,
      options: {
        maxTurns: 1,
        allowedTools: [],
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
      },
    })) {
      if (message.type === "assistant") {
        const text = message.message.content
          .filter((block: { type: string }) => block.type === "text")
          .map((block: { type: string; text?: string }) => block.text ?? "")
          .join("");
        resultText += text;
      }

      if (message.type === "result" && message.subtype === "success") {
        if (!resultText) {
          resultText = message.result;
        }
        console.log(
          `[analyzer] ${diff.targetName} 分析完了 (${message.total_cost_usd.toFixed(4)} USD)`
        );
      }
    }

    return {
      targetName: diff.targetName,
      summary: resultText || "分析結果を取得できませんでした",
      isFirstRun: diff.isFirstRun,
      analyzedAt: new Date(),
    };
  } catch (error) {
    console.error(
      `[analyzer] ${diff.targetName} 分析エラー:`,
      error instanceof Error ? error.message : error
    );

    return {
      targetName: diff.targetName,
      summary: `分析中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
      isFirstRun: diff.isFirstRun,
      analyzedAt: new Date(),
    };
  }
}

/**
 * AI用のプロンプトを決定論的に構築する
 *
 * これが「プログラム側がAIに何を判断させるか」を制御する部分。
 * プロンプトの内容は完全に決定論的（同じ入力→同じプロンプト）。
 */
function buildPrompt(diff: DiffResult): string {
  if (diff.isFirstRun) {
    return `あなたはAnthropicの技術動向を分析するアナリストです。

以下はAnthropicの公式ページ「${diff.targetName}」の現在のコンテンツです。
このコンテンツを分析し、以下の形式で日本語のレポートを作成してください。

### フォーマット:
1. **概要**: 現在の主要な内容を3-5行で要約
2. **注目ポイント**: 特に重要な項目を箇条書きで3-5個
3. **Claude Codeユーザーへの影響**: この情報がClaude Codeを使う開発者にとってどのような意味があるか

### コンテンツ:
${diff.currentContent.slice(0, 8000)}
`;
  }

  return `あなたはAnthropicの技術動向を分析するアナリストです。

以下はAnthropicの公式ページ「${diff.targetName}」の変更差分です。
前回と今回のコンテンツを比較し、以下の形式で日本語の変更レポートを作成してください。

### フォーマット:
1. **変更の要約**: 何が変わったかを3-5行で要約
2. **主要な変更点**: 具体的な変更を箇条書きで列挙
3. **影響分析**: この変更がClaude Codeユーザーにとってどのような影響があるか
4. **推奨アクション**: ユーザーが取るべきアクション（あれば）

### 前回のコンテンツ（抜粋）:
${diff.previousContent.slice(0, 4000)}

### 今回のコンテンツ（抜粋）:
${diff.currentContent.slice(0, 4000)}
`;
}
