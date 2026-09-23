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
- [ ] 型の整合性 (TypeScriptコンパイルでエラーが出ないこと)
- [ ] インポートパスの完全一致
- [ ] 要件充足性 (100問入力, メモ機能, ✕抽出, 複数問題集, 教科指定, Tauri v2)
- [ ] GitHub Actions CIの構文チェック
- [ ] 不合格時は各サブエージェントに具体的に突き返して修正させる
