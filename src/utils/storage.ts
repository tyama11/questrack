/**
 * Questrack - ストレージ・シードデータ・永続化ユーティリティ
 * LocalStorageの安全な読み書き、初期データ、インポート/エクスポート、データ移行(マージ)、完全初期化
 */

import {
  AppExportData,
  FilterStatus,
  Question,
  Subject,
  Workbook,
  WorkbookStats,
  StorageUsageSummary,
} from '../types';

// ==========================================
// ストレージキー定義
// ==========================================
export const STORAGE_KEYS = {
  WORKBOOKS: 'questrack_workbooks_v1',
  SUBJECTS: 'questrack_subjects_v1',
  ACTIVE_WORKBOOK_ID: 'questrack_active_workbook_id_v1',
} as const;

// ==========================================
// デフォルト教科データ
// ==========================================
export const DEFAULT_SUBJECTS: Subject[] = [
  {
    id: 'sub-math',
    name: '数学',
    color: '#3B82F6', // Tailwind blue-500
    icon: '📐',
    description: '高校数学・大学受験数学・統計学',
  },
  {
    id: 'sub-english',
    name: '英語',
    color: '#F59E0B', // Tailwind amber-500
    icon: '🔤',
    description: '英単語・英文法・長文読解',
  },
  {
    id: 'sub-japanese',
    name: '国語',
    color: '#F43F5E', // Tailwind rose-500
    icon: '📖',
    description: '現代文・古文・漢文',
  },
  {
    id: 'sub-science',
    name: '理科',
    color: '#10B981', // Tailwind emerald-500
    icon: '🔬',
    description: '物理・化学・生物・地学',
  },
  {
    id: 'sub-social',
    name: '社会',
    color: '#8B5CF6', // Tailwind violet-500
    icon: '🌍',
    description: '日本史・世界史・地理・公民',
  },
  {
    id: 'sub-info',
    name: '情報',
    color: '#06B6D4', // Tailwind cyan-500
    icon: '💻',
    description: '情報I・プログラミング・ITパスポート',
  },
  {
    id: 'sub-cert',
    name: '資格・その他',
    color: '#64748B', // Tailwind slate-500
    icon: '📝',
    description: '国家試験・各種検定・その他',
  },
];

// ==========================================
// 問題配列生成ヘルパー
// ==========================================
/**
 * 指定された問題数の未解答問題リストを生成する
 */
export const createEmptyQuestions = (count: number, prefix: string = 'q'): Question[] => {
  const questions: Question[] = [];
  const now = new Date().toISOString();
  for (let i = 1; i <= count; i++) {
    questions.push({
      id: `${prefix}-${i}`,
      number: i,
      status: 'unanswered',
      note: '',
      updatedAt: now,
    });
  }
  return questions;
};

// ==========================================
// 初回シードデータ (リアルなサンプル問題集)
// ==========================================
const createSampleMathQuestions = (): Question[] => {
  const questions = createEmptyQuestions(100, 'math');
  const now = new Date().toISOString();

  // 間違えた問題とリアルな復習メモの定義
  const incorrectNotes: Record<number, string> = {
    4: '相加相乗平均の不等式: a>0, b>0の前提条件と等号成立条件(a=b)の確認を忘れた。次回復習！',
    7: '2次関数の最大・最小: 軸が定義域の右外にある場合の場合分けで不等号のイコール抜け',
    15: '集合と命題: 対偶法を使うところを背理法で遠回りして計算ミス。対偶をまず疑うこと',
    21: '三角比: 余弦定理の符号ミス (cos120° = -1/2 のマイナスを落とした)',
    28: 'データの分析: 分散と標準偏差の定義。偏差の2乗の平均であることを忘れないこと',
    33: '正弦定理・外接円の半径: 公式 a/sinA = 2R の 2 で割り忘れて直径を答えてしまった',
    35: '場合の数: 円順列と数珠順列の違い。裏返して同じになる場合は ÷2 が必要',
    39: '重複組合せ: ◯と仕切り | のモデル化で立式する。nHr = (n+r-1)Cr',
    42: '確率: 反復試行の確率で確率の掛け忘れ。nCr * p^r * (1-p)^(n-r)',
    44: '条件付き確率: P_A(B) = P(A∩B) / P(A) の分母と分子を取り違えた',
    48: '整数の性質: ユークリッドの互除法からの一次不定方程式の特殊解導出ミス',
    52: '作図と図形の性質: 方べきの定理 PA・PB = PC・PD の交点位置を再確認',
  };

  // 正解した問題のメモ
  const correctNotes: Record<number, string> = {
    1: '展開の公式: スムーズに正解',
    11: '解と係数の関係: 公式通りスムーズに解けた',
    24: '三角比の相互関係: 単位円での符号判定完璧',
    30: '散布図と相関係数: 定義通り計算完了',
    40: '余事象の利用: 「少なくとも1つ」で余事象を正しく適用できた',
  };

  // 1〜55問目を回答済みに設定
  for (let i = 1; i <= 55; i++) {
    const q = questions[i - 1];
    if (incorrectNotes[i]) {
      q.status = 'incorrect';
      q.note = incorrectNotes[i];
    } else {
      q.status = 'correct';
      q.note = correctNotes[i] || '';
    }
    q.updatedAt = now;
  }

  return questions;
};

const createSampleEnglishQuestions = (): Question[] => {
  const questions = createEmptyQuestions(100, 'eng');
  const now = new Date().toISOString();

  const incorrectNotes: Record<number, string> = {
    5: 'maintain: 「維持する」だけでなく「〜と強く主張する」の語義も頻出',
    12: 'acquire: require(要求する)と混同注意。「習得する、獲得する」',
    18: 'distinguish: distinguish A from B (AとBを区別する)',
    25: 'determine: 「決定する」のほか「(人)に決心させる」の使役的意味も確認',
    32: 'hesitate: hesitate to do (〜するのをためらう)',
  };

  // 1〜35問目を回答済みに設定
  for (let i = 1; i <= 35; i++) {
    const q = questions[i - 1];
    if (incorrectNotes[i]) {
      q.status = 'incorrect';
      q.note = incorrectNotes[i];
    } else {
      q.status = 'correct';
      q.note = '';
    }
    q.updatedAt = now;
  }

  return questions;
};

export const INITIAL_SEED_WORKBOOKS: Workbook[] = [
  {
    id: 'wb-math-sample',
    title: '高校数学I+A 基本問題100選',
    subjectId: 'sub-math',
    totalQuestions: 100,
    questions: createSampleMathQuestions(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    description: '高校数学I・Aの重要典型問題100選。✕（不正解）の問題を重点的に復習して完全習得を目指します。',
  },
  {
    id: 'wb-english-sample',
    title: '共通テスト英語 必須頻出単語100',
    subjectId: 'sub-english',
    totalQuestions: 100,
    questions: createSampleEnglishQuestions(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    description: '共通テスト・私大入試で最頻出の重要単語100選。派生語や語法をメモに残して復習します。',
  },
];

// ==========================================
// 統計情報計算ユーティリティ
// ==========================================
export const calculateWorkbookStats = (workbook: Workbook): WorkbookStats => {
  const total = workbook.totalQuestions;
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  for (const q of workbook.questions) {
    if (q.status === 'correct') {
      correct++;
    } else if (q.status === 'incorrect') {
      incorrect++;
    } else {
      unanswered++;
    }
  }

  // 念のため、totalQuestionsより配列長が短い場合の補正
  if (workbook.questions.length < total) {
    unanswered += total - workbook.questions.length;
  }

  const answered = correct + incorrect;
  const accuracyRate = answered > 0 ? Math.round((correct / answered) * 1000) / 10 : 0;
  const progressRate = total > 0 ? Math.round((answered / total) * 1000) / 10 : 0;

  return {
    total,
    answered,
    correct,
    incorrect,
    unanswered,
    accuracyRate,
    progressRate,
  };
};

// ==========================================
// 安全なLocalStorageラッパー
// ==========================================
const isLocalStorageAvailable = (): boolean => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const testKey = '__questrack_storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

export const safeStorage = {
  getItem: (key: string): string | null => {
    if (!isLocalStorageAvailable()) return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.error(`[Questrack Storage] Failed to get item for key "${key}":`, e);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (!isLocalStorageAvailable()) return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error(`[Questrack Storage] Failed to set item for key "${key}":`, e);
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    if (!isLocalStorageAvailable()) return false;
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`[Questrack Storage] Failed to remove item for key "${key}":`, e);
      return false;
    }
  },
};

// ==========================================
// ロード・セーブ・完全削除関数
// ==========================================

/**
 * 保存済みの問題集リストを取得。存在しない場合はnullを返す。
 */
export const loadStoredWorkbooks = (): Workbook[] | null => {
  const raw = safeStorage.getItem(STORAGE_KEYS.WORKBOOKS);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return null;
  } catch (e) {
    console.error('[Questrack Storage] Failed to parse workbooks from storage:', e);
    return null;
  }
};

/**
 * 問題集リストをストレージへ保存する
 */
export const saveStoredWorkbooks = (workbooks: Workbook[]): boolean => {
  try {
    return safeStorage.setItem(STORAGE_KEYS.WORKBOOKS, JSON.stringify(workbooks));
  } catch (e) {
    console.error('[Questrack Storage] Failed to save workbooks to storage:', e);
    return false;
  }
};

/**
 * 保存済みの教科リストを取得。存在しない場合はnullを返す。
 */
export const loadStoredSubjects = (): Subject[] | null => {
  const raw = safeStorage.getItem(STORAGE_KEYS.SUBJECTS);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return null;
  } catch (e) {
    console.error('[Questrack Storage] Failed to parse subjects from storage:', e);
    return null;
  }
};

/**
 * 教科リストをストレージへ保存する
 */
export const saveStoredSubjects = (subjects: Subject[]): boolean => {
  try {
    return safeStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  } catch (e) {
    console.error('[Questrack Storage] Failed to save subjects to storage:', e);
    return false;
  }
};

/**
 * 選択中の問題集IDをロードする
 */
export const loadStoredActiveWorkbookId = (): string | null => {
  return safeStorage.getItem(STORAGE_KEYS.ACTIVE_WORKBOOK_ID);
};

/**
 * 選択中の問題集IDを保存する
 */
export const saveStoredActiveWorkbookId = (id: string | null): boolean => {
  if (id === null) {
    return safeStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKBOOK_ID);
  }
  return safeStorage.setItem(STORAGE_KEYS.ACTIVE_WORKBOOK_ID, id);
};

/**
 * ストレージから全Questrackデータを完全に削除する（完全初期化用）
 */
export const clearAllDataFromStorage = (): void => {
  safeStorage.removeItem(STORAGE_KEYS.WORKBOOKS);
  safeStorage.removeItem(STORAGE_KEYS.SUBJECTS);
  safeStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKBOOK_ID);
};

// ==========================================
// ストレージ使用量サマリー計算
// ==========================================
/**
 * 現在のデータ総数および推定使用バイト数を計算
 */
export const calculateStorageUsage = (
  workbooks: Workbook[],
  subjects: Subject[]
): StorageUsageSummary => {
  const workbookCount = workbooks.length;
  const questionCount = workbooks.reduce((acc, wb) => acc + (wb.questions ? wb.questions.length : 0), 0);
  const subjectCount = subjects.length;

  // LocalStorage使用容量の計算（文字列長 * 2バイト (UTF-16概算)）
  let totalChars = 0;
  try {
    const wbStr = safeStorage.getItem(STORAGE_KEYS.WORKBOOKS) || JSON.stringify(workbooks);
    const subStr = safeStorage.getItem(STORAGE_KEYS.SUBJECTS) || JSON.stringify(subjects);
    const activeStr = safeStorage.getItem(STORAGE_KEYS.ACTIVE_WORKBOOK_ID) || '';
    totalChars = wbStr.length + subStr.length + activeStr.length;
  } catch {
    totalChars = (JSON.stringify(workbooks) + JSON.stringify(subjects)).length;
  }
  const storageSizeBytes = totalChars * 2;

  // 最終更新日時の探索
  let latestUpdate = '';
  for (const wb of workbooks) {
    if (!latestUpdate || (wb.updatedAt && wb.updatedAt > latestUpdate)) {
      latestUpdate = wb.updatedAt;
    }
  }
  if (!latestUpdate) {
    latestUpdate = new Date().toISOString();
  }

  return {
    workbookCount,
    questionCount,
    subjectCount,
    storageSizeBytes,
    lastUpdated: latestUpdate,
  };
};

// ==========================================
// JSON インポート & エクスポート & マージ移行
// ==========================================

/**
 * アプリのデータをJSON文字列としてエクスポートする
 */
export const exportDataToJsonString = (workbooks: Workbook[], subjects: Subject[]): string => {
  const exportPayload: AppExportData = {
    appName: 'Questrack',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    workbooks,
    subjects,
  };
  return JSON.stringify(exportPayload, null, 2);
};

export interface ImportValidationResult {
  success: boolean;
  data?: {
    workbooks: Workbook[];
    subjects: Subject[];
  };
  error?: string;
}

/**
 * インポートされたJSON文字列をバリデーションする
 */
export const validateAndParseImportData = (jsonString: string): ImportValidationResult => {
  if (!jsonString || typeof jsonString !== 'string') {
    return { success: false, error: '入力データが空または無効な形式です。' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { success: false, error: 'JSONの解析に失敗しました。正しいJSONファイルかご確認ください。' };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { success: false, error: '無効なデータ構造です。' };
  }

  const payload = parsed as Partial<AppExportData>;

  // 教科データの検証
  if (!Array.isArray(payload.subjects)) {
    return { success: false, error: '教科データ (subjects) が正しく含まれていません。' };
  }

  for (const s of payload.subjects) {
    if (!s || typeof s.id !== 'string' || typeof s.name !== 'string' || typeof s.color !== 'string') {
      return { success: false, error: '一部の教科データに必要なフィールド (id, name, color) が欠落しています。' };
    }
  }

  // 問題集データの検証
  if (!Array.isArray(payload.workbooks)) {
    return { success: false, error: '問題集データ (workbooks) が正しく含まれていません。' };
  }

  for (const wb of payload.workbooks) {
    if (
      !wb ||
      typeof wb.id !== 'string' ||
      typeof wb.title !== 'string' ||
      typeof wb.subjectId !== 'string' ||
      typeof wb.totalQuestions !== 'number' ||
      !Array.isArray(wb.questions)
    ) {
      return { success: false, error: `問題集「${wb?.title || '不明'}」の基本情報が不正です。` };
    }

    // 問題のバリデーション
    for (const q of wb.questions) {
      if (
        !q ||
        typeof q.id !== 'string' ||
        typeof q.number !== 'number' ||
        !['correct', 'incorrect', 'unanswered'].includes(q.status)
      ) {
        return {
          success: false,
          error: `問題集「${wb.title}」の問題データ（番号: ${q?.number || '不明'}）のステータスまたは番号が不正です。`,
        };
      }
    }
  }

  return {
    success: true,
    data: {
      workbooks: payload.workbooks as Workbook[],
      subjects: payload.subjects as Subject[],
    },
  };
};

/**
 * 既存の教科・問題集データと、インポートされた教科・問題集データを安全にマージする
 * - 教科: 同名教科があれば既存のものを引き継ぎ、新規教科はID重複を回避して追加
 * - 問題集: 既存IDと衝突した場合は新しい一意なIDを発行し、紐づく問題IDも安全にリマップ
 */
export const mergeImportedData = (
  existingWorkbooks: Workbook[],
  existingSubjects: Subject[],
  importedWorkbooks: Workbook[],
  importedSubjects: Subject[]
): { workbooks: Workbook[]; subjects: Subject[] } => {
  const mergedSubjects = [...existingSubjects];
  const subjectIdMap = new Map<string, string>(); // importedSubjectId -> actualSubjectId

  // 1. 教科のマージ
  for (const impSub of importedSubjects) {
    // 既存に同名教科があるかチェック
    const existingByName = mergedSubjects.find(
      (s) => s.name.trim().toLowerCase() === impSub.name.trim().toLowerCase()
    );
    if (existingByName) {
      subjectIdMap.set(impSub.id, existingByName.id);
      continue;
    }

    // ID重複チェック
    const existingById = mergedSubjects.find((s) => s.id === impSub.id);
    if (existingById) {
      const newSubjectId = `sub-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      mergedSubjects.push({ ...impSub, id: newSubjectId });
      subjectIdMap.set(impSub.id, newSubjectId);
    } else {
      mergedSubjects.push(impSub);
      subjectIdMap.set(impSub.id, impSub.id);
    }
  }

  // 2. 問題集のマージ
  const existingWbIds = new Set(existingWorkbooks.map((w) => w.id));
  const newWorkbooksList: Workbook[] = [];

  for (const impWb of importedWorkbooks) {
    let targetWbId = impWb.id;
    // ID重複時は再採番
    if (existingWbIds.has(targetWbId)) {
      targetWbId = `wb-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    }
    existingWbIds.add(targetWbId);

    const mappedSubjectId = subjectIdMap.get(impWb.subjectId) || impWb.subjectId;

    const questions: Question[] = impWb.questions.map((q) => ({
      ...q,
      id: `${targetWbId}-${q.number}`,
    }));

    newWorkbooksList.push({
      ...impWb,
      id: targetWbId,
      subjectId: mappedSubjectId,
      questions,
    });
  }

  return {
    workbooks: [...newWorkbooksList, ...existingWorkbooks],
    subjects: mergedSubjects,
  };
};

// ==========================================
// フィルタリング・検索ユーティリティ
// ==========================================
/**
 * 問題リストを指定されたステータスおよび検索クエリ（問題番号またはメモ）で絞り込む
 * - status: 'all' | 'incorrect_only' | 'correct_only' | 'unanswered_only'
 * - searchQuery: "15", "q15", "問15", "#15" 等の問題番号、またはメモの部分一致（大文字小文字無視）
 */
export const filterQuestions = (
  questions: Question[],
  status: FilterStatus = 'all',
  searchQuery: string = ''
): Question[] => {
  return questions.filter((q) => {
    // 1. ステータスフィルター
    if (status === 'incorrect_only' && q.status !== 'incorrect') {
      return false;
    }
    if (status === 'correct_only' && q.status !== 'correct') {
      return false;
    }
    if (status === 'unanswered_only' && q.status !== 'unanswered') {
      return false;
    }

    // 2. 検索クエリフィルター (問題番号またはメモ)
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    // 問題番号マッチ (例: "15", "q15", "問15", "#15", "q 15")
    const numMatch = query.replace(/^[q問#\s]+/i, '').trim();
    if (numMatch && !isNaN(Number(numMatch)) && q.number === Number(numMatch)) {
      return true;
    }

    // メモマッチ (大文字小文字を区別せず部分一致)
    return (q.note || '').toLowerCase().includes(query);
  });
};

