# Questrack 開発タスク仕様書 (CL: Checklist)

## アプリ概要
「Questrack」は、100問などの問題集の正否（◯/✕）を高速入力し、メモを残し、✕（不正解）のみを抽出して効率的に復習できるTauri v2 + TypeScript製デスクトップアプリ。

---

## CL-1: コアデータ層 & 状態管理 (Data & State)
- [x] `src/types/index.ts`:
  - `Subject`: id, name, color, icon
  - `QuestionStatus`: 'correct' | 'incorrect' | 'unanswered'
  - `Question`: id, number, status, note, updatedAt
  - `Workbook`: id, title, subjectId, totalQuestions, questions, createdAt, updatedAt, description
  - フィルター・集計用型
- [x] `src/context/AppContext.tsx` (またはカスタムフック):
  - 問題集CRUD (作成, 編集, 削除, 複製)
  - 教科CRUD (デフォルト: 数学, 英語, 国語, 理科, 社会, 資格試験 + 自由追加)
  - 問題ステータス更新 (個別トグル、一括設定)
  - 問題メモ更新
  - ✕のみ抽出等のフィルターロジック
  - LocalStorage永続化 & JSONインポート/エクスポート
  - 統計情報計算 (正答率, ◯数, ✕数, 未数)
- [x] 初期シードデータ (サンプル問題集「高校数学 基礎100問」など)

---

## CL-2: UIコンポーネント & 画面実装 (UI & UX)
- [x] ナビゲーション & タブ切り替え (`src/components/Navbar.tsx`):
  - アプリヘッダー（ロゴ、バージョン）
  - **メインタブ切り替え**:
    1. **「問題追跡 (Tracker)」タブ**: 問題集の解答追跡、◯/✕入力、メモ、✕のみ抽出、復習
    2. **「マネジメント (Management)」タブ**: 問題集・教科の一括管理、新規追加、編集、削除、科目別整理
    3. **「データ移行・初期化 (Data & Migration)」タブ**: バックアップ(JSONエクスポート)、移行(JSONインポート)、サンプルデータ復元、全データ初期化
- [x] **タブ1: 問題追跡 (TrackerView / `src/components/tracker/`)**:
  - サイドバー / 問題集クイック選択 (教科バッジ、進捗率、✕件数バッジ)
  - 統計サマリー (正答率, ◯, ✕, 未解答)
  - **最重要: フィルターバー (`src/components/tracker/FilterBar.tsx`)**:
    - 「✕（不正解）のみ抽出」目立つハイライトボタン
    - 「すべて」「◯のみ」「未解答のみ」
    - 問題番号検索
  - **100問グリッドビュー (`src/components/tracker/QuestionGrid.tsx`)**:
    - 1〜100番の正否ボタン (◯=青/緑, ✕=赤, 未=グレー)
    - ワンクリック切り替え & キーボードショートカット (O:正解, X:不正解, U:未解答)
    - メモインジケーター & メモ編集トリガー
  - **メモモーダル (`src/components/tracker/NoteModal.tsx`)**:
    - 間違えた理由や解法要点、公式の入力と保存
  - **復習・間違い直しモード (`src/components/tracker/ReviewModal.tsx`)**:
    - ✕の問題だけを1問ずつカードで集中復習し、理解できたら◯に更新
- [x] **タブ2: マネジメント (ManagementView / `src/components/management/`)**:
  - 教科管理セクション: 教科の追加・編集・削除、カラーピッカー
  - 問題集管理セクション: 新規問題集作成（タイトル、教科、100問などの問題数、説明）、編集、複製、削除
  - 全体進捗統計ダッシュボード: 教科ごとの総問題数、正答率、弱点（✕の多さ）の可視化
- [x] **タブ3: データ移行・初期化 (DataView / `src/components/data/`)**:
  - **データ移行 (Export / Import)**:
    - JSONバックアップのエクスポート（ワンクリックダウンロード & クリップボードコピー）
    - JSONファイルのインポート（ファイル選択またはJSONテキスト貼り付け）
    - インポート時のモード選択（上書き vs 既存データに追加マージ）
  - **初期化・リセット (Initialization & Reset)**:
    - サンプルデータ（高校数学100問など）への復元
    - 全データ初期化（確認モーダル / 二重確認付きの安全なリセット）
    - 現在のデータ容量・統計（問題集数、登録問題総数、最終更新日時）のステータス表示

---

## CL-3: Tauri v2 & プロジェクト構成 & GitHub Actions CI (Infrastructure)
- [x] フロントエンド設定:
  - `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`
- [x] Tauri v2 設定:
  - `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `src-tauri/build.rs`, `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`, `src-tauri/capabilities/default.json`
- [x] アプリアイコン:
  - `app-icon.png` および `src-tauri/icons/`
- [x] GitHub Actions CI:
  - `.github/workflows/ci.yml`: 型検査・ビルド検証
  - `.github/workflows/build-and-release.yml`: macOS (Universal/Apple Silicon/Intel), Windows (x64), Linux の自動ビルド & Release公開 & Artifactアップロード
- [x] ドキュメント & Git:
  - `README.md` (機能概要、GitHubプッシュ手順、CIビルド利用方法)
  - `.gitignore`

---

## CL-4: メインエージェント総合レビュー & 突き返し基準
- [x] 型の整合性 (TypeScriptコンパイルでエラーが出ないこと)
- [x] インポートパスの完全一致
- [x] 要件充足性 (100問入力, メモ機能, ✕抽出, 複数問題集, 教科指定, Tauri v2)
- [x] GitHub Actions CIの構文チェック
- [x] 不合格時は各サブエージェントに具体的に突き返して修正させる

---

## CL-5: テストスイートの作成 (Unit & Logic Tests)
- [x] `package.json` にテストスクリプト `npm test` (`vitest run`) を追加
- [x] コアロジックのテスト (`src/__tests__/questrack.test.ts`):
  - [x] LocalStorageの読み書き・初期データ投入のテスト
  - [x] 問題集CRUD・100問生成・伸縮ロジックのテスト
  - [x] 正答率・進捗率の計算ロジックテスト
  - [x] 「✕（不正解）のみ抽出」フィルタリングロジックのテスト
  - [x] データ移行（マージ・上書きインポート、エクスポート）のテスト
  - [x] 問題のメモ保存・更新テスト

---

## CL-6: CI/CDの設計見直し (Test-Only vs Release-on-Tag)
- [x] `.github/workflows/ci.yml`:
  - 通常の push (main/master) や pull_request では **「テストを通すのみ」**
  - `npm install` → `npm test` (自動テスト実行) → `npm run build` (型検査 & ビルド)
  - リリースやアプリ生成は行わない
- [x] `.github/workflows/build-and-release.yml`:
  - **バージョンを変更した時（タグ `v*` プッシュ時）または手動リリース時のみ** アプリをビルド＆リリース作成
  - Intel Mac, Apple Silicon Mac, Windows 用のバイナリを生成して GitHub Releases へ公開 (Linux除外)

---

## CL-7: ユーザー向け熱血READMEの全面刷新 (User-Centric Documentation)
- [x] ビルド方法やGitクローンなどの開発者向け記述をすべて削除
- [x] **学習意欲・モチベーションを掻き立てるやる気の出る文章**:
  - 「✕（間違い）こそが、あなたの合否を分ける最高の武器だ」
  - 「100問演習で浮き彫りになった弱点を撃破し、確固たる自信を手に入れる」
- [x] **超具体的な使い方の例 (活用シナリオ)**:
  - シナリオ1: 資格試験（基本情報・簿記・TOEICなど）の過去問100本ノック
  - シナリオ2: 受験生の標準問題集（数学・英語・理科）の周回マスター法
  - 4つのステップ（登録 → ◯✕高速入力 → 「✕のみ抽出」で弱点ロックオン → 集中復習モードで完全克服）
- [x] **直感的なダウンロードリンク**:
  - Intel Mac用、Apple Silicon Mac用、Windows用のリンクを目立つ位置に配置

---

## CL-8: CIインフラ最適化 (Rust Cache根本修正 & Node.js 22 LTS化)
- [x] Node.js を非推奨となった 20 から最新推奨LTS `22` へ更新 (`ci.yml`, `build-and-release.yml`)
- [x] Rust Cache のホストOS・CPUキー衝突の解消:
  - `prefix-key: "rust-${{ matrix.arch_name }}"` および `shared-key: "questrack-${{ matrix.arch_name }}"` を導入
  - macOS Intel と Apple Silicon のキャッシュ上書き・消滅を防止
- [x] GitHub Actions Cache Scoping 対応 (タグ間キャッシュ不可の解消):
  - `ci.yml` (`main` ブランチ) に `cargo check` による Rust Cache Warmup を導入
  - `main` スコープに依存クレートキャッシュを蓄積し、任意のタグ実行時に 100% リストア可能に改善

---

## CL-9: v1.0.0 正式リリース (任意問題数対応・問題集削除バグ修正・問題追跡統一)
- [x] **「100問追跡」から「問題追跡」への表現統一**:
  - 10問、50問、100問、200問など任意の問題数に対応することを明確化
  - `src/App.tsx`, `src/components/Navbar.tsx`, `src/components/tracker/TrackerView.tsx`, `README.md` の文言を修正
- [x] **問題集削除時のやり残し残りバグ解消**:
  - `src/context/AppContext.tsx`: `workbooks` 初期化判定を `stored !== null` に修正し、全削除で空配列となった際に初期シードデータが復活するバグを根絶
  - `deleteWorkbook` 処理で残存配列の即時保存とアクティブIDの安全なリセットを徹底
  - `src/components/management/ManagementView.tsx`: 全体進捗統計に「やり残し (未解答)」カードを新設。問題集削除時に即座に再計算・ゼロ化
- [x] **単体テストスイート強化**:
  - `src/__tests__/questrack.test.ts`: 任意問題数（10問、120問）の統計テスト、問題集削除時のやり残しゼロ化検証、空ストレージ維持テストを追加
- [x] **正式リリース v1.0.0 の発行**:
  - `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `Navbar.tsx`, `README.md` を `v1.0.0` にバンプ
  - Git コミット・プッシュ・タグ `v1.0.0` 発行
  - GitHub Actions による全プラットフォーム自動ビルド & Release 完了検証

---

## CL-10: Node.js 24化・GitHub Pages自動公開・Web版データ消失注意喚起
- [x] **Node.js 24 移行**:
  - `.github/workflows/ci.yml` および `.github/workflows/build-and-release.yml` を `node-version: 24` に更新
- [x] **GitHub Pages バージョン対応 & 自動公開パイプライン構築**:
  - `vite.config.ts`: `base: "./"` を追加し、GitHub Pages サブディレクトリでもアセットパスが完全解決するよう設定
  - `.github/workflows/ci.yml`: `main` への push でテスト（CL）全件合格時に `actions/deploy-pages` で GitHub Pages（`https://tyama11.github.io/questrack/`）へ自動デプロイ
- [x] **マネジメント画面への Web 版データ消失注意喚起 UI 実装**:
  - `ManagementView.tsx`: ブラウザのキャッシュクリア・シークレットモード終了時などのデータ消失リスク警告バナーを新設
  - 定期的な JSON バックアップ（エクスポート）の推奨、およびデータが消えないデスクトップ版（Mac/Windows）の案内リンクを追加
- [x] **README.md への Web 版リンク追加**:
  - インストール不要ですぐ試せる GitHub Pages リンクを掲載


