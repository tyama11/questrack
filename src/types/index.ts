/**
 * Questrack - 型定義 (Types)
 * コアデータモデル、フィルター、統計、ストレージ等の型定義
 */

/**
 * 問題の解答ステータス
 * - 'correct': ◯ (正解)
 * - 'incorrect': ✕ (不正解 / 要復習)
 * - 'unanswered': 未解答 (デフォルト)
 */
export type QuestionStatus = 'correct' | 'incorrect' | 'unanswered';

/**
 * 個別の問題エンティティ
 */
export interface Question {
  id: string;
  number: number;           // 問題番号 (1, 2, ..., N)
  status: QuestionStatus;   // 正否ステータス
  note: string;             // 間違えた理由や解法要点のメモ
  updatedAt?: string;       // 最終更新日時 (ISO 8601文字列)
}

/**
 * 教科・カテゴリー情報
 */
export interface Subject {
  id: string;
  name: string;             // 教科名 (例: 数学, 英語)
  color: string;            // 表示カラー (HEX または Tailwind クラス名)
  icon?: string;            // アイコン識別子 または 絵文字 (例: '📐', 'BookOpen')
  description?: string;     // 説明 (例: 高校数学・大学受験数学)
}

/**
 * 問題集エンティティ
 */
export interface Workbook {
  id: string;
  title: string;            // 問題集のタイトル (例: 高校数学I+A 基本100選)
  subjectId: string;        // 紐づく教科ID
  totalQuestions: number;   // 収録問題数 (デフォルト100問など)
  questions: Question[];    // 各問題のリスト
  createdAt: string;        // 作成日時 (ISO 8601文字列)
  updatedAt: string;        // 最終更新日時 (ISO 8601文字列)
  description?: string;     // 概要・説明
}

/**
 * フィルター用のステータス絞り込み条件
 * - 'all': すべて表示
 * - 'incorrect_only': ✕ (不正解) のみ抽出 (最重要: 復習用)
 * - 'correct_only': ◯ (正解) のみ抽出
 * - 'unanswered_only': 未解答のみ抽出
 */
export type FilterStatus = 'all' | 'incorrect_only' | 'correct_only' | 'unanswered_only';

/**
 * フィルター・検索オプション
 */
export interface FilterOptions {
  status: FilterStatus;
  searchQuery: string;      // 問題番号またはメモ内容の部分一致検索
  subjectId: string | 'all';// 教科による絞り込み ('all' は全教科)
}

/**
 * 問題集の統計情報
 */
export interface WorkbookStats {
  total: number;            // 全問題数
  answered: number;         // 解答済み数 (correct + incorrect)
  correct: number;          // 正解数 (◯)
  incorrect: number;        // 不正解数 (✕)
  unanswered: number;       // 未解答数
  accuracyRate: number;     // 正答率 (%, 解答済みのうち正解の割合 0〜100)
  progressRate: number;     // 進捗率 (%, 全体のうち解答済みの割合 0〜100)
}

/**
 * 全問題集横断の全体統計情報
 */
export interface OverallStats {
  totalQuestions: number;   // 全登録問題数
  totalAnswered: number;    // 全解答済み数 (totalCorrect + totalIncorrect)
  totalCorrect: number;     // 全正解数 (◯)
  totalIncorrect: number;   // 全不正解数 (✕)
  totalUnanswered: number;  // 全未解答・やり残し数
  accuracyRate: number;     // 全体正答率 (%)
  progressRate: number;     // 全体進捗率 (%)
  unansweredRate: number;   // 全体未着手率 (%)
}

/**
 * バックアップ・エクスポート用のJSONデータ構造
 */
export interface AppExportData {
  appName: 'Questrack';
  version: string;
  exportedAt: string;
  workbooks: Workbook[];
  subjects: Subject[];
}

/**
 * データインポートのモード
 * - 'replace': 既存のデータをすべて破棄してインポートデータで上書き
 * - 'merge': 既存データを維持したまま新しい教科・問題集を追加結合
 */
export type ImportMode = 'replace' | 'merge';

/**
 * データインポートの結果
 */
export interface ImportResult {
  success: boolean;
  error?: string;
  count?: number;           // インポートされた問題集の件数
}

/**
 * ストレージ利用状況のサマリー情報
 */
export interface StorageUsageSummary {
  workbookCount: number;    // 問題集の総数
  questionCount: number;    // 登録された全問題数
  subjectCount: number;     // 教科数
  storageSizeBytes: number; // 使用中の推定ストレージ容量 (バイト)
  lastUpdated: string;      // データの最終更新日時 (ISO 8601文字列)
}

/**
 * AppContext が提供する状態とアクションのインターフェース
 */
export interface AppContextType {
  // 状態 (States)
  workbooks: Workbook[];
  subjects: Subject[];
  activeWorkbookId: string | null;
  activeWorkbook: Workbook | null;
  filterOptions: FilterOptions;
  filteredQuestions: Question[];

  // 問題集操作 (Workbook Actions)
  createWorkbook: (title: string, subjectId: string, totalQuestions?: number, description?: string) => Workbook;
  updateWorkbook: (id: string, data: Partial<Omit<Workbook, 'id' | 'createdAt'>>) => void;
  deleteWorkbook: (id: string) => void;
  duplicateWorkbook: (id: string) => Workbook | null;
  setActiveWorkbookId: (id: string | null) => void;

  // 教科操作 (Subject Actions)
  createSubject: (name: string, color: string, description?: string, icon?: string) => Subject;
  updateSubject: (id: string, name: string, color: string, description?: string, icon?: string) => void;
  deleteSubject: (id: string) => void;

  // 問題操作 (Question Actions)
  setQuestionStatus: (workbookId: string, questionNumber: number, status: QuestionStatus) => void;
  toggleQuestionStatus: (workbookId: string, questionNumber: number) => void;
  setQuestionNote: (workbookId: string, questionNumber: number, note: string) => void;
  batchSetQuestions: (workbookId: string, status: QuestionStatus) => void;

  // フィルター操作 (Filter Actions)
  setStatusFilter: (status: FilterStatus) => void;
  setSearchQuery: (query: string) => void;
  setSubjectFilter: (subjectId: string | 'all') => void;
  resetFilters: () => void;

  // 統計計算ヘルパー (Stats Helper)
  getWorkbookStats: (workbook: Workbook) => WorkbookStats;

  // データ管理・移行・初期化 (Data Management, Migration & Reset)
  exportData: () => string;
  importData: (jsonString: string, mode?: ImportMode) => ImportResult;
  resetToSampleData: () => void;
  clearAllData: () => void;
  getStorageUsageSummary: () => StorageUsageSummary;
}
