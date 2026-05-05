# Discord通知test

PR駆動更新フロー（収集→提案→**通知**→レビュー→取り込み）の「通知」フェーズが想定通り動作するかを検証する。

## 確認項目

- [ ] Discord webhook URL を発行できる
- [ ] `curl -X POST` でテストメッセージを送信できる
- [ ] スマホへのプッシュ通知が確実に届く
- [ ] PR内容（タイトル / 差分概要 / 著者）を embed 形式で読みやすく表示できる
- [ ] embed内のPRリンクから1タップでGitHubへ遷移できる
- [ ] 領域別チャンネル分離（例: `#agent-essentials`）で通知の混線が起きない

## 検証用 curl サンプル

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "embeds": [{
      "title": "[PR #42] agent-essentials.md に「ツール最小権限」原則を追加",
      "url": "https://github.com/<user>/<repo>/pull/42",
      "description": "Meta-Harness論文より新観点を抽出",
      "color": 5814783
    }]
  }' \
  "$DISCORD_WEBHOOK_URL"
```

## 終了条件

全6項目チェック完了 → PR駆動フローの「通知」フェーズ運用開始可。
