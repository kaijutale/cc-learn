# Claude for Life Sciences

**公開日:** 2025年10月21日

**原文:** https://www.anthropic.com/news/claude-for-life-sciences

---

お知らせ

# Claude for Life Sciences

2025年10月21日・4分で読める

![](https://www-cdn.anthropic.com/images/4zrzovbb/website/74409af25137110ac04cc39e4d5ea0a2fbcea421-1000x1000.svg)

科学的進歩の速度を高めることは、Anthropicの公益使命（public benefit mission）の中核をなしています。

私たちは、研究者が新たな発見をするためのツールを構築することに注力しており、最終的にはAIモデルが自律的にこれらの発見を行えるようにすることを目指しています。

最近まで、科学者は通常、統計分析のためのコード記述や論文の要約といった個別のタスクにClaudeを使用していました。製薬会社などの産業界では、新しい研究に資金を提供するために、営業など事業の他の分野でもClaudeを利用しています。現在の私たちの目標は、初期の発見からトランスレーショナルリサーチ（橋渡し研究）、商業化に至るまでのプロセス全体をClaudeがサポートできるようにすることです。

これを実現するために、研究者、臨床コーディネーター、規制業務マネージャーなど、ライフサイエンス分野で働く人々にとってClaudeをより良いパートナーにすることを目的とした、いくつかの改善を展開しています。

## Claudeをより良い研究パートナーにする

まず、Claudeの基礎的なパフォーマンスを向上させました。私たちの最も高性能なモデルであるClaude Sonnet 4.5は、さまざまなライフサイエンスタスクにおいて、以前のモデルよりも大幅に優れています。例えば、実験プロトコルに関するモデルの理解と取り扱い能力をテストするベンチマークであるProtocol QAでは、Sonnet 4.5は0.83のスコアを獲得しています。これは、人間のベースラインである0.79、およびSonnet 4のパフォーマンスである0.74と比較して優れています。1 Sonnet 4.5は、バイオインフォマティクスタスクのパフォーマンスを測定する評価であるBixBenchにおいても、前モデルと比較して同様の改善を示しています。

Claudeを科学研究により有用なものにするために、現在、科学プラットフォームへの複数の[新しいコネクター](https://claude.com/partners/mcp)、Agent Skillsを使用する機能、そしてプロンプトライブラリと専用サポートの形でのライフサイエンス固有のサポートを追加しています。

## Claudeを科学ツールに接続する

[**コネクター**](https://claude.ai/redirect/website.v1.7ecf2fc3-1f30-46a2-b757-10786ceef9f1/settings/connectors)を使用すると、Claudeは他のプラットフォームやツールに直接アクセスできます。私たちは、科学的発見のためにClaudeをより簡単に使用できるように設計された、いくつかの新しいコネクターを追加しています：

- **Benchling** は、科学者の質問に対してソース実験、ノートブック、記録へのリンクとともに回答する機能をClaudeに提供します。
- **BioRender** は、Claudeを検証済みの科学的図表、アイコン、テンプレートの広範なライブラリに接続します。
- **PubMed** は、数百万の生物医学研究論文と臨床研究へのアクセスを提供します。
- **Wileyが開発したScholar Gateway** は、研究発見を加速するために、Claude内で権威ある査読済み科学コンテンツへのアクセスを提供します。
- **Synapse.org** を使用すると、科学者は公開または非公開のプロジェクトでデータを共有し、一緒に分析できます。
- **10x Genomics** により、研究者は自然言語で単一細胞および空間解析を実施できます。

これらのコネクターは、Google WorkspaceやMicrosoft SharePoint、OneDrive、Outlook、Teamsなどの汎用ツールを含む既存のセットに追加されます。Claudeは、大規模なバイオインフォマティクス研究のための分析を提供するDatabricksや、自然言語の質問を使用して大規模なデータセットを検索するSnowflakeとも既に直接連携できます。

## Claudeのためのスキル開発

先週、私たちは[Agent Skills](https://www.anthropic.com/news/skills)をリリースしました。これは、Claudeが特定のタスクを実行する方法を改善するために使用できる、指示、スクリプト、リソースを含むフォルダです。Skillsは科学研究に自然にフィットします。なぜなら、Claudeが特定のプロトコルや手順を一貫して予測可能に従うことができるからです。

私たちはClaude用のいくつかの科学的スキルを開発しており、まず **`single-cell-rna-qc`** から始めます。このスキルは、[scverse](https://scverse.org/)のベストプラクティスを使用して、単一細胞RNAシーケンスデータの品質管理とフィルタリングを実行します：

![Claudeが単一細胞RNA-seqデータの品質管理を実行](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F07de700e38ef4d328ccdb5c15ab9e3df5286fc08-3840x2160.png&w=3840&q=75)_Claudeが単一細胞RNA-seqデータの品質管理を実行_

私たちが作成しているスキルに加えて、科学者は独自のスキルを構築することもできます。カスタムスキルのセットアップを含む詳細情報とガイダンスについては、[こちら](https://support.claude.com/en/articles/12512180-using-skills-in-claude)をご覧ください。

## Life SciencesでClaudeを使用する

Claudeは次のようなライフサイエンスタスクに使用できます：

- **文献レビューや仮説の開発などの研究:** Claudeは生物医学文献を引用・要約し、発見したことに基づいて検証可能なアイデアを生成できます。

Claudeがデータを分析し、文献レビューを実施し、潜在的に新しい洞察を深掘りし、この分析をプレゼンテーションに変換し、BioRenderの図を使ってスライドに仕上げる方法をご覧ください。

- **プロトコルの生成**: Benchlingコネクターを使用して、Claudeは研究プロトコル、標準操作手順、同意文書の草稿を作成できます。
- **バイオインフォマティクスとデータ分析**: Claude Codeでゲノムデータを処理・分析します。Claudeは結果を[スライド、ドキュメント](https://www.anthropic.com/news/create-files)、またはコードノートブック形式で提示できます。
- **臨床および規制コンプライアンス**: Claudeは規制申請の草稿作成とレビュー、コンプライアンスデータの編集を行えます。

さらに、科学者がすぐに始められるように、上記のようなタスクで最良の結果を引き出すための[プロンプトライブラリ](https://support.claude.com/en/articles/12614768-getting-started-with-claude-for-life-sciences)を作成しています。

## パートナーシップと顧客

私たちは、Applied AIチームと顧客対応チームの専門家による実践的なサポートを提供しています。

また、組織がライフサイエンス業務のためにAIを採用するのを支援することに特化した企業とも提携しています。これには、Caylent、Deloitte、Accenture、KPMG、PwC、Quantium、Slalom、Tribe AI、Turing、およびクラウドパートナーであるAWSとGoogle Cloudが含まれます。

私たちの既存の顧客とパートナーの多くは、既に幅広い実世界の科学的タスクにClaudeを使用しています：

![Sanofi logo](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F44cb9482787368c3b6b3dc183e378abf6b5ca693-3274x1510.png&w=256&q=75)

"

> Claudeは、社内のナレッジライブラリと組み合わせることで、SanofiのAI変革に不可欠であり、ConciergeアプリでほとんどのSanofi社員が日々使用しています。バリューチェーン全体で効率性の向上が見られており、エンタープライズ展開によってチームの働き方が強化されました。Anthropicとのこのコラボレーションは、世界中の患者に人生を変える医薬品をより早く届けるために、人間の専門知識を増強します。

![Benchling logo](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2Ff8958499b7603125dd85312cb6688fe8cf7bd959-938x321.png&w=256&q=75)

"

> R&DにおけるAIはエコシステムを通じて機能します。Anthropicは、アクセス、ガバナンス、相互運用性を優先しながら、最高の技術を提供しています。Benchlingは独自の貢献をする立場にあります。10年以上にわたり、科学者は実験データとワークフローの信頼できる情報源として私たちを信頼してきました。現在、私たちはR&Dの次の章を牽引するAIを構築しています。

![Broad Institute of MIT and Harvard logo](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2Fd165bbdbd303f12d2fe5e8b6d24332b5d9ab94eb-600x154.png&w=256&q=75)

"

> Broad Instituteの科学者は、生物学と医学における最も野心的な問題に取り組み、世界中の科学者を支援するためのツールを作成しています。Terra Powered by ManifoldでManifoldと協力しています。Claude上に構築されたAIエージェントにより、科学者はまったく新しい規模と効率で作業でき、以前は不可能だった方法で科学的領域を探索できます。

![AbbVie logo](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2Ff12fff7af71cb2fdace8e1864d550864d9dafb83-1118x210.png&w=256&q=75)

"

> ClaudeはAbbVieの業務の基盤です。GAIAプラットフォームは、規制文書生成にClaudeを活用し、大規模な精度を確保しています。GenAIsysは、医療専門家とのエンゲージメントのためのAI洞察でフィールドチームを強化します。AWS上のワークフロー全体にClaudeを統合することで、効率性とインタラクションが改善され、世界中の患者に革新的な医薬品を届けるミッションが加速されます。

![10x Genomics  logo](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F2d2b4c714c164385923a67894ec0173d6290fb4f-1200x771.png&w=256&q=75)

"

> 10xの単一細胞および空間解析機能は、従来、計算の専門知識を必要としていました。現在、Claudeを使用することで、研究者はリードのアラインメント、マトリックスの生成、クラスタリング、二次解析といった分析タスクを、平易な英語の会話を通じて実行できます。これにより、新規ユーザーの障壁が下がり、高度な研究チームのニーズに対応できるようにスケールします。

![Genmab logo](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2Ffe19dca89482cda5712ddb7d40d0b0e5db73f2a6-1301x380.png&w=256&q=75)

"

> 私たちは、医薬品を市場に投入する方法を合理化するClaudeの計り知れない可能性を見ています。臨床データソースから引き出し、GxP準拠のアウトプットを作成する能力により、最高品質基準を維持しながら、患者に人生を変えるがん治療をより早く届けることができます。私たちは、Claudeが当社のいくつかの主要機能にわたってAIアプリケーションを牽引することを期待しています。

![Komodo Health logo](https://www-cdn.anthropic.com/images/4zrzovbb/website/c10350722a8953ec4a62bd473df1b80774d4df79-640x177.svg)

"

> ヘルスケア分析には、業界の複雑さと厳格さに合わせて構築されたAIが必要です。Komodo HealthとAnthropicのパートナーシップは、規制されたヘルスケア環境向けに設計された、透明で監査可能なソリューションを提供します。私たちは共に、ヘルスケアおよびライフサイエンスチームが数週間かかる分析ワークフローを数分で実行可能なインテリジェンスに変換できるようにしています。

![Novo Nordisk logo](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F5080602ba328ac22c4a32d3cd348ba234320900a-800x565.png&w=256&q=75)

"

> 私たちは、製薬開発における文書とコンテンツの自動化に関して、常に先駆者の一人でした。AnthropicとClaudeとの私たちの取り組みは新しい基準を設定しました。私たちは単にタスクを自動化しているのではなく、発見から必要とする患者への医薬品の提供方法を変革しています。

![Stanford University  logo](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2Fe7743444ed3664c6609617c16114be37d5474a7b-3840x2160.png&w=256&q=75)

"

> Claude CodeとAnthropicとのパートナーシップは、受動的な研究論文をインタラクティブなAIエージェントに変換し、仮想的な責任著者や共同科学者として機能できるようにする私たちのムーンショットであるPaper2Agentの開発に非常に価値がありました。

![PwC logo](https://www-cdn.anthropic.com/images/4zrzovbb/website/468fc2c0bb3ca80ff2b112002d4d665c1e2bff65-360x180.svg)

"

> PwCでは、責任あるAIは信頼の要件です。私たちは、深い業界洞察とClaudeのエージェント知能を組み合わせて、臨床、規制、商業チームの運営方法を再構想しています。私たちは単にプロセスを合理化するだけでなく、品質を向上させ、発見を加速し、信頼性がイノベーションと共にスケールするシステムを構築しています。

![Schrödinger logo](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2Fb463e00f9945da22059fbb8216e3af714f58fd62-1238x362.png&w=256&q=75)

"

> Claude Codeは、Schrödingerにとって強力な加速器となっています。最適なプロジェクトでは、Claude Codeにより、アイデアを数時間ではなく数分で動作するコードに変換でき、場合によっては最大10倍の速度で作業できます。Claudeとの取り組みを続ける中で、ソフトウェアの構築とカスタマイズの方法をさらに変革できることを楽しみにしています。

![Latch Bio logo](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2Fb6ec5b998f39cde140615558d3da14c58a52c1be-1025x289.png&w=256&q=75)

"

> バイオインフォマティクス分析用のAIエージェントを作成する際、3つの主要な要素に焦点を当てました：トップレベルのソフトウェア開発、ライフサイエンスとの整合性、スタートアップサポートです。半ダースのプラットフォームを評価し、Claudeが際立ったリーダーでした。このコラボレーションを継続し、最先端のAIエージェントをバイオテクノロジー研究に導入できることを楽しみにしています。

![EvolutionaryScale logo](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F98f513214f5429a2273ead0768a6f43a23e504ba-2495x491.png&w=256&q=75)

"

> EvolutionaryScaleでは、生命世界をモデル化するための次世代AIシステムを構築しています。Anthropicのフロンティアモデルは、複雑な生物学的データについて推論し、それを科学的洞察に変換する私たちの能力を加速し、ライフサイエンス発見における可能性の境界を押し広げるのに役立っています。

![Manifold logo](https://www-cdn.anthropic.com/images/4zrzovbb/website/6ba95f586841d964268b8845bbe9629a0933e714-149x36.svg)

"

> Manifoldでは、より速く、より無駄のないライフサイエンスを推進することが私たちの使命です。Claudeを使って構築することで、科学者の意味空間における質問を、専門データセットとツールの技術空間における実行に変換するAIエージェントを開発できました。私たちは共に、今後数年間のライフサイエンスR&Dの進め方を変革しています。

![FutureHouse logo](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F2309ae6041b9aae5b19483b28c1d4515c6490f28-2776x711.png&w=256&q=75)

"

> FutureHouseでは、Claudeがバイオインフォマティクスと文献分析の両方のワークフローを強化しています。Claudeは、正確な図表分析と文献を通じた非線形検索のオーケストレーションにおいて、私たちが選択するモデルです。

![Axiom Bio logo](https://www-cdn.anthropic.com/images/4zrzovbb/website/e9660fa2497a0ea2d3090a94d3e0e97ac6b2e0b4-604x178.svg)

"

> Claudeは、薬物毒性を予測するAIを構築する中で、Axiomにとって非常に貴重でした。多くのPRでClaude Codeの数十億トークンを使用してきました。MCPサーバーを備えたClaudeエージェントは、科学研究の中核であり、データベースに直接クエリを実行して、データの相関関係を解釈、変換、テストし、臨床薬物毒性を予測するための最も有用な特徴を特定するのに役立ちます。

## ライフサイエンスのサポート

上記の更新に加えて、私たちは[AI for Science](https://www.anthropic.com/news/ai-for-science-program)プログラムを通じてライフサイエンス研究をサポートしています。このプログラムは、世界中で影響力の高い科学プロジェクトに取り組む主要研究者をサポートするための無料APIクレジットを提供しています。

これらの研究室とのパートナーシップは、Claudeの新しいアプリケーションを特定するのに役立ち、科学者が最も重要な問題のいくつかに答えるのを支援します。プロジェクトアイデアの[提出](https://docs.google.com/forms/d/e/1FAIpQLSfwDGfVg2lHJ0cc0oF_ilEnjvr_r4_paYi7VLlr5cLNXASdvA/viewform)を引き続き歓迎しています。

Anthropicのライフサイエンス部門のパートナーシップとR&DをそれぞれリードするJonah CoolとEric Kauderer-Abramsが、以下でこの取り組みと他の最近の研究について議論しています。

AnthropicのJonah CoolとEric Kauderer-Abramsが、Claude for Life Sciencesで、Claudeを科学者のための頼りになるAI研究アシスタントにするためのビジョンを共有しています。

## はじめに

Claude for Life Sciencesは、Claude.comおよびAWS Marketplaceを通じて利用でき、Google Cloud Marketplaceでの提供も近日中に開始されます。

#### 脚注

1 Protocol QAスコア（多肢選択形式）、10ショットプロンプティング使用。詳細については、[Sonnet 4.5 System Card](https://assets.anthropic.com/m/12f214efcc2f457a/original/Claude-Sonnet-4-5-System-Card.pdf)のページ132-133をご覧ください。

[Twitterでシェア](https://twitter.com/intent/tweet?text=https://www.anthropic.com/news/claude-for-life-sciences)[LinkedInでシェア](https://www.linkedin.com/shareArticle?mini=true&url=https://www.anthropic.com/news/claude-for-life-sciences)

[ニュース\\
\\
**Claudeとあなたの生産性プラットフォーム**\\
\\
2025年10月16日](https://www.anthropic.com/news/productivity-platforms) [ニュース\\
\\
**Agent Skillsのご紹介**\\
\\
2025年10月16日](https://www.anthropic.com/news/skills) [ニュース\\
\\
**Claude Haiku 4.5のご紹介**\\
\\
2025年10月15日](https://www.anthropic.com/news/claude-haiku-4-5)
