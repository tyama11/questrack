# Questrack (クエストラック) 🎯

> **100問などの問題集の正否（◯/✕）を高速入力・メモ記録し、✕（不正解）のみを抽出して効率的に復習できる次世代型デスクトップアプリ**

![Questrack App Icon](app-icon.png)

---

## 📖 概要

**Questrack** は、資格試験、大学受験、学校の定期試験などの「100問トレーニング」「過去問演習」を強力にサポートする問題演習追跡デスクトップアプリです。

- **超高速入力**: ワンクリックまたはキーボードショートカット（`O`: 正解, `X`: 不正解, `U`: 未解答）でテンポよく正否をトグル
- **✕（不正解）のみ抽出**: ワンタップで間違えた問題だけを瞬時にフィルタリング
- **問題メモ機能**: 「なぜ間違えたか」「解法の要点」を問題ごとにメモ保存
- **復習・間違い直しモード**: 間違えた問題だけを1問ずつ集中的に解き直し、正解に塗り替える苦手克服フロー
- **教科・問題集管理**: 数学、英語、理科、社会、国家試験など自由な教科分類と複数問題集の管理
- **ローカル完結 & 高速動作**: Tauri v2 + React 18 + Vite + TailwindCSS による超軽量・ネイティブ動作

---

## 📥 最新版ダウンロード (v0.1.0)

GitHub Actions CI によって自動ビルドされた公式インストーラーを今すぐダウンロードできます：

- 🍏 **macOS (Apple Silicon M1〜M4 対応)**:
  - **[Questrack_0.1.0_aarch64.dmg (3.9 MB)](https://github.com/tyama11/questrack/releases/download/v0.1.0/Questrack_0.1.0_aarch64.dmg)**
- 🪟 **Windows (64-bit)**:
  - **[Questrack_0.1.0_x64-setup.exe (2.5 MB - 推奨)](https://github.com/tyama11/questrack/releases/download/v0.1.0/Questrack_0.1.0_x64-setup.exe)**
  - **[Questrack_0.1.0_x64_en-US.msi (3.7 MB - MSI版)](https://github.com/tyama11/questrack/releases/download/v0.1.0/Questrack_0.1.0_x64_en-US.msi)**

---

## 🚀 GitHub Actions による自動ビルド & インストーラー入手方法

ローカルに Rust や Node.js の開発環境がなくても、**GitHub 上ですべての OS 向けインストーラーを自動ビルド**できます。

### 方法 1: GitHub Actions の画面から手動実行（ワンクリック）

1. GitHub のリポジトリページを開きます。
2. 上部メニューの **「Actions」** タブをクリックします。
3. 左側のワークフロー一覧から **「Release & Build App」** を選択します。
4. 右上の **「Run workflow」** ボタンをクリックします。
5. ビルドが完了（約 3〜6分）すると、画面下部の **Artifacts** に各 OS 用のインストーラーが出力されます：
   - 🍏 **`questrack-macOS-AppleSilicon-arm64`**: M1/M2/M3/M4 Mac 向け `.dmg`
   - 💻 **`questrack-macOS-Intel-x86_64`**: Intel Mac 向け `.dmg`
   - 🪟 **`questrack-Windows-x64`**: Windows 向けセットアップ `.exe` / `.msi`
   - 🐧 **`questrack-Linux-x64`**: Ubuntu/Debian 向け `.deb` / `.AppImage`
6. 該当の Artifact をダウンロードして展開し、インストールしてください。

### 方法 2: バージョンタグを打って GitHub Releases から配布

リポジトリでタグをプッシュすると、自動的にマルチプラットフォーム向けバイナリがコンパイルされ、GitHub Releases に公開されます。

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub の **Releases** ページにインストーラーが自動添付されます。

---

## 🛠️ GitHub リポジトリ作成からプッシュまでの完全ガイド

本プロジェクトをご自身の GitHub アカウントにアップロードする手順です。

### 1. GitHub 上で新規リポジトリを作成
1. [GitHub: New Repository](https://github.com/new) にアクセスします。
2. Repository name に `questrack` と入力します。
3. Public または Private を選択し、**「Initialize this repository with:」のチェックボックスはすべて外した状態**で「Create repository」をクリックします。

### 2. ローカルからの初回プッシュ手順

ターミナルで本プロジェクトのディレクトリに移動し、以下のコマンドを順番に実行します：

```bash
# プロジェクトディレクトリへ移動
cd /Users/tyam/.gemini/antigravity/scratch/questrack

# Git リポジトリの初期化
git init

# 全ファイルをステージング
git add .

# 初期コミットの作成
git commit -m "feat: initial commit for Questrack desktop app"

# デフォルトブランチを main に設定
git branch -M main

# リモートリポジトリの URL を設定 (YOUR_USERNAME をご自身のアカウント名に置き換えてください)
git remote add origin https://github.com/YOUR_USERNAME/questrack.git

# GitHub にプッシュ
git push -u origin main
```

> **Tips:** 最初のプッシュが完了すると、自動的に `.github/workflows/ci.yml` が動作し、コードの健全性とビルドが検証されます。

---

## 💻 ローカル開発環境での起動方法

ローカルマシンで開発・動作確認を行う場合の手順です。

### 前提条件
- **Node.js**: v18 以上 (v20 推奨)
- **Rust**: 最新 stable (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- **OS固有のツール**:
  - macOS: Xcode Command Line Tools (`xcode-select --install`)
  - Linux: `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`, `libssl-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`
  - Windows: Visual Studio C++ Build Tools

### 起動手順

```bash
# 依存関係のインストール
npm install

# フロントエンド開発サーバーの起動 (ブラウザで http://localhost:1420 を確認)
npm run dev

# Tauri デスクトップアプリとしての起動
npm run tauri dev

# プロダクションビルド
npm run tauri build
```

---

## 📂 プロジェクト構成

```
questrack/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # 型検査・フロントエンドビルド自動テスト
│       └── build-and-release.yml  # macOS/Windows/Linux向け完全ビルド＆自動リリース
├── public/
│   └── app-icon.png              # Web/ファビコン用アセット
├── src/                          # フロントエンド (React 18 + TypeScript)
│   ├── components/               # UI コンポーネント群
│   ├── context/                  # 状態管理 (AppContext)
│   └── types/                    # TypeScript 型定義
├── src-tauri/                    # Tauri v2 (Rust)
│   ├── capabilities/             # Tauri v2 権限設定 (default.json)
│   ├── icons/                    # 各OS向けアイコンアセット (.icns, .ico, 各種png)
│   ├── src/
│   │   ├── lib.rs                # Tauri 実行エントリーポイント
│   │   └── main.rs               # アプリケーション起動関数
│   ├── Cargo.toml                # Rust 依存関係・設定
│   ├── build.rs                  # ビルドスクリプト
│   └── tauri.conf.json           # Tauri ウィンドウ・バンドル設定
├── app-icon.png                  # アプリアイコン原画 (高解像度)
├── generate_icons.py             # 各種OS用アイコン自動生成スクリプト
├── index.html                    # メイン HTML
├── package.json                  # Node.js パッケージ定義
├── postcss.config.js             # PostCSS 設定
├── tailwind.config.js            # TailwindCSS デザインシステム設定
├── tsconfig.json                 # TypeScript 設定
├── tsconfig.node.json            # Vite 用 TypeScript 設定
├── vite.config.ts                # Vite バンドラー設定
└── README.md                     # 本ドキュメント
```

---

## 📜 ライセンス

MIT License
