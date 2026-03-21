機能名: PDF資料分析・ケルベロスアーキテクチャ解説・かもね版ハーネス設計方針策定

- セッション名: cerberus-harness-study
- 日付: 2026-03-22 02:03:24
- 概要: まさお氏の汎用AIエージェントハーネス「ケルベロス」に関する2つのPDF資料（note記事 + Excalidraw図解）を精読し、全体概要と各セクション（全9セクション）の詳細解説を実施。その後、かもね版ハーネスの設計方針をAskUserQuestionによるインタビュー形式で策定し、Agent SDK最新ドキュメントを確認した上で技術選定を完了した。
- 実装内容:
  - `noname.pdf` を内容確認の上 `260131_masao_ケルベロス汎用エージェントハーネス_Excalidraw図解資料.pdf` にリネーム
  - `.claude/CLAUDE.md` のPDF参照パスを同期更新
  - 2つのPDF（note記事20ページ + Excalidraw図解7ページ）の全セクション解説を実施:
    1. AIエージェントとは何か（点 vs 線の比喩、3構成要素）
    2. ケルベロスのアーキテクチャ全体像（モノレポ構成、コンポーネント、データフロー）
    3. Agent Core - Claude SDKラッパーの実装（4機能、内部構造、コマンドライン vs SDK比較）
    4. セッション管理の設計（Slack ts紐付け、DB設計、セッション継続フロー）
    5. スキルとサブエージェント（コンテキストエンジニアリングの最適化）
    6. 自律実行とナレッジ管理（Collector/Executorパターン、観測、データモデル）
    7. 作業ディレクトリの設計（規約、ディレクトリ指定の信頼性）
    8. AIエージェント開発の実践知見（リモートアクセス、学習ステップ）
    9. まとめ（5層構成、最小構成 vs 自律実行追加）
  - AskUserQuestionで4つの質問によるインタビュー実施:
    - 本業: ソフトウェアエンジニア
    - 面倒な作業: 情報収集・リサーチ、コード関連作業、報告・ドキュメント
    - 最終目的: 自分の生産性向上 + 仕事・クライアント向け + プロダクト開発
    - 一番やりたいこと: X/note/YouTubeの指定アカウント投稿を毎日自動収集してmdファイル化
  - 技術選定をAskUserQuestionで確定:
    - 言語: TypeScript（Agent SDK）
    - Collector: 3つ同時作成（X / note / YouTube）
    - 保存先: mdファイル + Supabase DB の両方
    - 定期実行: macOS crontab
  - Claude Agent SDK最新ドキュメントをContext7 MCPで取得・確認（query, hooks, resume, subagent, cost tracking）
  - 設計書作成の実装計画（Plan Mode）を策定
- 設計意図:
  - PDF資料の精読→概念理解→自分のユースケースへの適用、という学習フローを意図的に踏んでいる
  - AskUserQuestionによるインタビュー形式で、かもね自身の業務・ニーズを構造的に引き出し、ハーネスの方向性を客観的に決定
  - 「最初の1つのCollectorと最初の1つのExecutorを何にするか」がハーネス設計で最も重要という知見に基づき、X/note/YouTube情報収集を最初のCollectorに選定
  - Agent SDKのTypeScript版を選定した理由は、ケルベロスと同じ技術スタック（TypeScript + Claude Agent SDK）で学習効果を最大化するため
- 副作用:
  - PDFファイルのリネームにより、他のセッションで旧ファイル名を参照している場合はパスが変わる（CLAUDE.mdは更新済み）
  - 設計書作成はPlan Modeで計画を策定済みだが、実際のspec作成は前回セッションで完了している
- 関連ファイル:
  - `.docs/references/260204_masao_汎用エージェントハーネス設計_思考とアーキテクチャ解説.pdf` （note記事PDF）
  - `.docs/references/260131_masao_ケルベロス汎用エージェントハーネス_Excalidraw図解資料.pdf` （リネーム済み）
  - `.claude/CLAUDE.md` （参照パス更新済み）
  - `.docs/spec/collector-info-gathering.md` （前回セッションで作成済みの設計書）
  - `_docs/templates/2026-03-21_collector-info-gathering-spec.md` （前回の実装ログ）
