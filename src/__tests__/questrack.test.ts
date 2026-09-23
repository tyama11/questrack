/**
 * Questrack 中核ロジック単体テストスイート (Vitest)
 * 
 * カバーする領域:
 * 1. LocalStorage 操作: safeStorage (getItem, setItem, removeItem, 例外発生時のフォールバック)
 * 2. 問題生成と伸縮: createEmptyQuestions (100問の生成、初期ステータス、一意ID、伸縮)
 * 3. 統計計算: calculateWorkbookStats (正答率・進捗率の計算、ゼロ除算ハンドリング、配列不足補正)
 * 4. フィルタリングロジック: filterQuestions (不正解のみ、正解のみ、未解答のみ、柔軟な番号検索、メモ部分一致)
 * 5. データ移行と永続化: exportDataToJsonString, validateAndParseImportData, mergeImportedData (上書き & マージ)
 * 6. ストレージ使用量サマリー: calculateStorageUsage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  safeStorage,
  createEmptyQuestions,
  calculateWorkbookStats,
  calculateOverallStats,
  filterQuestions,
  exportDataToJsonString,
  validateAndParseImportData,
  mergeImportedData,
  calculateStorageUsage,
  loadStoredWorkbooks,
  saveStoredWorkbooks,
  loadStoredSubjects,
  saveStoredSubjects,
  loadStoredActiveWorkbookId,
  saveStoredActiveWorkbookId,
  clearAllDataFromStorage,
  DEFAULT_SUBJECTS,
  INITIAL_SEED_WORKBOOKS,
  STORAGE_KEYS,
} from '../utils/storage';
import { Question, Subject, Workbook, OverallStats } from '../types';

// =================================================================
// グローバル LocalStorage モックのセットアップ (全テストスイート共通)
// =================================================================
let mockStore: Record<string, string> = {};

const mockLocalStorage = {
  getItem: vi.fn((key: string): string | null => {
    return mockStore[key] ?? null;
  }),
  setItem: vi.fn((key: string, value: string): void => {
    mockStore[key] = value;
  }),
  removeItem: vi.fn((key: string): void => {
    delete mockStore[key];
  }),
  clear: vi.fn((): void => {
    mockStore = {};
  }),
};

const originalWindow = typeof window !== 'undefined' ? window : undefined;

beforeEach(() => {
  mockStore = {};
  vi.clearAllMocks();

  // グローバル window.localStorage をモック
  (globalThis as unknown as { window: { localStorage: Storage } }).window = {
    localStorage: mockLocalStorage as unknown as Storage,
  };
});

afterEach(() => {
  (globalThis as unknown as { window: unknown }).window = originalWindow;
  vi.restoreAllMocks();
});

// =================================================================
// 1. LocalStorage 操作 (safeStorage) のテスト
// =================================================================
describe('LocalStorage 操作 (safeStorage)', () => {

  it('setItem, getItem, removeItem が正しく読み書きできること', () => {
    expect(safeStorage.setItem('test_key', 'hello_questrack')).toBe(true);
    expect(safeStorage.getItem('test_key')).toBe('hello_questrack');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test_key', 'hello_questrack');

    expect(safeStorage.removeItem('test_key')).toBe(true);
    expect(safeStorage.getItem('test_key')).toBeNull();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_key');
  });

  it('存在しないキーに対して getItem を呼ぶと null を返すこと', () => {
    expect(safeStorage.getItem('non_existent_key')).toBeNull();
  });

  it('setItem 実行時にストレージ例外 (QuotaExceeded等) が発生しても例外を投げず false を返すこと', () => {
    mockLocalStorage.setItem.mockImplementation((key: string, value: string) => {
      if (key === 'overflow_key') {
        throw new Error('QuotaExceededError: DOM Exception 22');
      }
      mockStore[key] = value;
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = safeStorage.setItem('overflow_key', 'massive_data');

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('getItem 実行時に例外が発生しても例外を投げず null を返すこと', () => {
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'restricted_key') {
        throw new Error('SecurityError: Access is denied');
      }
      return mockStore[key] ?? null;
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = safeStorage.getItem('restricted_key');

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('removeItem 実行時に例外が発生しても例外を投げず false を返すこと', () => {
    mockLocalStorage.removeItem.mockImplementation((key: string) => {
      if (key === 'error_key') {
        throw new Error('Storage write failed');
      }
      delete mockStore[key];
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = safeStorage.removeItem('error_key');

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('window または window.localStorage が未定義の場合、安全にフォールバックすること', () => {
    delete (globalThis as unknown as { window?: unknown }).window;

    expect(safeStorage.getItem('any_key')).toBeNull();
    expect(safeStorage.setItem('any_key', 'val')).toBe(false);
    expect(safeStorage.removeItem('any_key')).toBe(false);
  });

  it('問題集、教科、アクティブIDの永続化関数群が正常に連動すること', () => {
    const testSubjects: Subject[] = [
      { id: 's1', name: '数学', color: '#123456' },
    ];
    const testWorkbooks: Workbook[] = [
      {
        id: 'wb1',
        title: 'テスト問題集',
        subjectId: 's1',
        totalQuestions: 10,
        questions: createEmptyQuestions(10, 'wb1'),
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    // 保存
    expect(saveStoredSubjects(testSubjects)).toBe(true);
    expect(saveStoredWorkbooks(testWorkbooks)).toBe(true);
    expect(saveStoredActiveWorkbookId('wb1')).toBe(true);

    // 読み込み
    expect(loadStoredSubjects()).toEqual(testSubjects);
    expect(loadStoredWorkbooks()).toEqual(testWorkbooks);
    expect(loadStoredActiveWorkbookId()).toBe('wb1');

    // 完全クリア
    clearAllDataFromStorage();
    expect(loadStoredActiveWorkbookId()).toBeNull();
    expect(loadStoredWorkbooks()).toBeNull();
    expect(loadStoredSubjects()).toBeNull();
  });
});

// =================================================================
// 2. 問題生成と伸縮 (createEmptyQuestions) のテスト
// =================================================================
describe('問題生成と伸縮 (createEmptyQuestions)', () => {
  it('100問の生成要求に対して正確に100問の配列を生成すること', () => {
    const questions = createEmptyQuestions(100, 'math');

    expect(questions).toHaveLength(100);
  });

  it('生成された全ての問題が初期ステータス unanswered かつ空メモであること', () => {
    const questions = createEmptyQuestions(50);

    for (const q of questions) {
      expect(q.status).toBe('unanswered');
      expect(q.note).toBe('');
      expect(typeof q.updatedAt).toBe('string');
      expect(q.updatedAt!.length).toBeGreaterThan(0);
    }
  });

  it('問題番号が 1 から N まで連続した整数で採番され、一意なIDを持つこと', () => {
    const count = 100;
    const prefix = 'sample-wb';
    const questions = createEmptyQuestions(count, prefix);

    const idSet = new Set<string>();

    questions.forEach((q, index) => {
      const expectedNumber = index + 1;
      expect(q.number).toBe(expectedNumber);
      expect(q.id).toBe(`${prefix}-${expectedNumber}`);
      idSet.add(q.id);
    });

    // IDの重複がないこと
    expect(idSet.size).toBe(count);
  });

  it('prefix が省略された場合はデフォルトの "q" が使われること', () => {
    const questions = createEmptyQuestions(3);
    expect(questions[0].id).toBe('q-1');
    expect(questions[1].id).toBe('q-2');
    expect(questions[2].id).toBe('q-3');
  });

  it('0問や任意の設問数の伸縮生成に対応できること', () => {
    expect(createEmptyQuestions(0)).toEqual([]);
    expect(createEmptyQuestions(5)).toHaveLength(5);
    expect(createEmptyQuestions(200)).toHaveLength(200);
  });

  it('問題のメモ保存・更新および特殊文字・複数行の取り扱いが正しく行えること', () => {
    const questions = createEmptyQuestions(5, 'wb-notes');

    // 初期状態は空メモ
    expect(questions[0].note).toBe('');

    // メモの保存・更新
    const detailedNote = `公式: a^2 + b^2 = c^2
※ 斜辺の長さに注意すること！
【重要度: ★★★】`;
    questions[0].note = detailedNote;
    questions[0].updatedAt = new Date().toISOString();

    expect(questions[0].note).toBe(detailedNote);
    expect(questions[0].note).toContain('a^2 + b^2 = c^2');
    expect(questions[0].note.split('\n')).toHaveLength(3);

    // メモのクリア
    questions[0].note = '';
    expect(questions[0].note).toBe('');
  });
});

// =================================================================
// 3. 統計計算 (calculateWorkbookStats) のテスト
// =================================================================
describe('統計計算 (calculateWorkbookStats)', () => {
  it('◯50問, ✕20問, 未解答30問 のとき、正答率 71.4%, 進捗率 70.0% が正しく算出されること', () => {
    const questions: Question[] = [];

    // ◯ 50問
    for (let i = 1; i <= 50; i++) {
      questions.push({
        id: `q-${i}`,
        number: i,
        status: 'correct',
        note: '',
      });
    }
    // ✕ 20問
    for (let i = 51; i <= 70; i++) {
      questions.push({
        id: `q-${i}`,
        number: i,
        status: 'incorrect',
        note: '間違えた理由',
      });
    }
    // 未解答 30問
    for (let i = 71; i <= 100; i++) {
      questions.push({
        id: `q-${i}`,
        number: i,
        status: 'unanswered',
        note: '',
      });
    }

    const workbook: Workbook = {
      id: 'wb-test',
      title: 'テスト問題集',
      subjectId: 'sub-math',
      totalQuestions: 100,
      questions,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    const stats = calculateWorkbookStats(workbook);

    expect(stats.total).toBe(100);
    expect(stats.answered).toBe(70);
    expect(stats.correct).toBe(50);
    expect(stats.incorrect).toBe(20);
    expect(stats.unanswered).toBe(30);

    // 正答率: 50 / (50 + 20) = 50 / 70 = 0.71428... -> 71.4%
    expect(stats.accuracyRate).toBe(71.4);

    // 進捗率: (50 + 20) / 100 = 70 / 100 = 70.0%
    expect(stats.progressRate).toBe(70.0);
  });

  it('解答数0のときのゼロ除算ハンドリング (NaNにならず0%になること)', () => {
    const questions = createEmptyQuestions(100);
    const workbook: Workbook = {
      id: 'wb-zero',
      title: '未着手問題集',
      subjectId: 'sub-math',
      totalQuestions: 100,
      questions,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    const stats = calculateWorkbookStats(workbook);

    expect(stats.answered).toBe(0);
    expect(stats.correct).toBe(0);
    expect(stats.incorrect).toBe(0);
    expect(stats.unanswered).toBe(100);
    expect(stats.accuracyRate).toBe(0);
    expect(Number.isNaN(stats.accuracyRate)).toBe(false);
    expect(stats.progressRate).toBe(0);
    expect(Number.isNaN(stats.progressRate)).toBe(false);
  });

  it('totalQuestions が 0 のときのゼロ除算ハンドリング (進捗率が0%になること)', () => {
    const workbook: Workbook = {
      id: 'wb-empty',
      title: '0問の問題集',
      subjectId: 'sub-math',
      totalQuestions: 0,
      questions: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    const stats = calculateWorkbookStats(workbook);

    expect(stats.total).toBe(0);
    expect(stats.progressRate).toBe(0);
    expect(Number.isNaN(stats.progressRate)).toBe(false);
    expect(stats.accuracyRate).toBe(0);
  });

  it('全問正解 (100%) および 全問不正解 (0%) の計算が正確であること', () => {
    const allCorrectQuestions: Question[] = [
      { id: '1', number: 1, status: 'correct', note: '' },
      { id: '2', number: 2, status: 'correct', note: '' },
    ];
    const wbCorrect: Workbook = {
      id: 'wb-c',
      title: '満点',
      subjectId: 'sub-math',
      totalQuestions: 2,
      questions: allCorrectQuestions,
      createdAt: '',
      updatedAt: '',
    };
    const statsCorrect = calculateWorkbookStats(wbCorrect);
    expect(statsCorrect.accuracyRate).toBe(100);
    expect(statsCorrect.progressRate).toBe(100);

    const allIncorrectQuestions: Question[] = [
      { id: '1', number: 1, status: 'incorrect', note: '' },
      { id: '2', number: 2, status: 'incorrect', note: '' },
    ];
    const wbIncorrect: Workbook = {
      id: 'wb-inc',
      title: '0点',
      subjectId: 'sub-math',
      totalQuestions: 2,
      questions: allIncorrectQuestions,
      createdAt: '',
      updatedAt: '',
    };
    const statsIncorrect = calculateWorkbookStats(wbIncorrect);
    expect(statsIncorrect.accuracyRate).toBe(0);
    expect(statsIncorrect.progressRate).toBe(100);
  });

  it('問題配列長が totalQuestions より短い場合、未解答数として適切に補正されること', () => {
    const incompleteQuestions: Question[] = [
      { id: '1', number: 1, status: 'correct', note: '' },
    ];
    const workbook: Workbook = {
      id: 'wb-inc',
      title: '配列不足テスト',
      subjectId: 'sub-math',
      totalQuestions: 10,
      questions: incompleteQuestions,
      createdAt: '',
      updatedAt: '',
    };

    const stats = calculateWorkbookStats(workbook);
    expect(stats.total).toBe(10);
    expect(stats.correct).toBe(1);
    expect(stats.unanswered).toBe(9); // 10 - 1 = 9
    expect(stats.progressRate).toBe(10);
  });
});

// =================================================================
// 4. フィルタリングロジック (filterQuestions) のテスト
// =================================================================
describe('フィルタリングロジック (filterQuestions)', () => {
  const sampleQuestions: Question[] = [
    { id: 'q-1', number: 1, status: 'correct', note: '因数分解の公式を利用' },
    { id: 'q-2', number: 2, status: 'incorrect', note: '2次関数の頂点の座標計算ミス' },
    { id: 'q-3', number: 3, status: 'unanswered', note: '' },
    { id: 'q-15', number: 15, status: 'incorrect', note: '確率の反復試行 公式適用忘れ' },
    { id: 'q-16', number: 16, status: 'correct', note: '条件付き確率の定義通りに計算' },
    { id: 'q-20', number: 20, status: 'incorrect', note: '三角比 sin(90-theta) の変形' },
    { id: 'q-21', number: 21, status: 'unanswered', note: 'あとで解く' },
  ];

  it('「✕（不正解）のみ抽出 (incorrect_only)」が正しく ✕ の問題のみを抽出すること', () => {
    const filtered = filterQuestions(sampleQuestions, 'incorrect_only');

    expect(filtered).toHaveLength(3);
    expect(filtered.map((q) => q.number)).toEqual([2, 15, 20]);
    expect(filtered.every((q) => q.status === 'incorrect')).toBe(true);
  });

  it('「◯のみ抽出 (correct_only)」が正しく ◯ の問題のみを抽出すること', () => {
    const filtered = filterQuestions(sampleQuestions, 'correct_only');

    expect(filtered).toHaveLength(2);
    expect(filtered.map((q) => q.number)).toEqual([1, 16]);
    expect(filtered.every((q) => q.status === 'correct')).toBe(true);
  });

  it('「未解答のみ (unanswered_only)」が正しく未解答の問題のみを抽出すること', () => {
    const filtered = filterQuestions(sampleQuestions, 'unanswered_only');

    expect(filtered).toHaveLength(2);
    expect(filtered.map((q) => q.number)).toEqual([3, 21]);
    expect(filtered.every((q) => q.status === 'unanswered')).toBe(true);
  });

  it('「すべて (all)」ですべての問題が返されること', () => {
    const filtered = filterQuestions(sampleQuestions, 'all');

    expect(filtered).toHaveLength(sampleQuestions.length);
  });

  describe('問題番号検索の柔軟なマッチング', () => {
    it('"15" で問題番号 15 が抽出されること', () => {
      const filtered = filterQuestions(sampleQuestions, 'all', '15');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].number).toBe(15);
    });

    it('"q15" や "Q15" で大文字小文字問わず問題番号 15 が抽出されること', () => {
      const resLower = filterQuestions(sampleQuestions, 'all', 'q15');
      expect(resLower).toHaveLength(1);
      expect(resLower[0].number).toBe(15);

      const resUpper = filterQuestions(sampleQuestions, 'all', 'Q15');
      expect(resUpper).toHaveLength(1);
      expect(resUpper[0].number).toBe(15);
    });

    it('"問15" で問題番号 15 が抽出されること', () => {
      const filtered = filterQuestions(sampleQuestions, 'all', '問15');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].number).toBe(15);
    });

    it('"#15" や前後に空白がある "  q 15  " でも問題番号 15 が抽出されること', () => {
      const resHash = filterQuestions(sampleQuestions, 'all', '#15');
      expect(resHash).toHaveLength(1);
      expect(resHash[0].number).toBe(15);

      const resSpace = filterQuestions(sampleQuestions, 'all', '  q 15  ');
      expect(resSpace).toHaveLength(1);
      expect(resSpace[0].number).toBe(15);
    });
  });

  describe('メモ文字列の部分一致検索 (大文字小文字無視)', () => {
    it('メモ文字列に含まれるキーワードで正しく部分一致検索できること', () => {
      const filtered = filterQuestions(sampleQuestions, 'all', '公式');

      // q-1: '因数分解の公式を利用', q-15: '確率の反復試行 公式適用忘れ'
      expect(filtered).toHaveLength(2);
      expect(filtered.map((q) => q.number)).toEqual([1, 15]);
    });

    it('大文字小文字を区別せずマッチすること', () => {
      const englishQuestions: Question[] = [
        { id: '1', number: 1, status: 'incorrect', note: 'Review Pythagorean Theorem' },
        { id: '2', number: 2, status: 'correct', note: 'Linear Algebra basics' },
      ];

      const resLower = filterQuestions(englishQuestions, 'all', 'pythagorean');
      expect(resLower).toHaveLength(1);
      expect(resLower[0].number).toBe(1);

      const resUpper = filterQuestions(englishQuestions, 'all', 'ALGEBRA');
      expect(resUpper).toHaveLength(1);
      expect(resUpper[0].number).toBe(2);
    });

    it('ステータス絞り込みとメモ検索の複合条件が正しく機能すること', () => {
      // ✕（不正解）かつ メモに「公式」を含む
      const filtered = filterQuestions(sampleQuestions, 'incorrect_only', '公式');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].number).toBe(15);
    });

    it('ヒットしない検索クエリの場合は空配列を返すこと', () => {
      const filtered = filterQuestions(sampleQuestions, 'all', '存在しないキーワードXYZ');
      expect(filtered).toHaveLength(0);
    });
  });
});

// =================================================================
// 5. データ移行と永続化 (Export / Import / Merge) のテスト
// =================================================================
describe('データ移行と永続化 (Export / Import / Merge)', () => {
  const sampleSubjects: Subject[] = [
    { id: 'sub-math', name: '数学', color: '#3B82F6', icon: '📐' },
    { id: 'sub-eng', name: '英語', color: '#F59E0B', icon: '🔤' },
  ];

  const sampleWorkbooks: Workbook[] = [
    {
      id: 'wb-test-1',
      title: '高校数学100問',
      subjectId: 'sub-math',
      totalQuestions: 100,
      questions: createEmptyQuestions(100, 'wb-test-1'),
      createdAt: '2026-09-20T10:00:00.000Z',
      updatedAt: '2026-09-21T10:00:00.000Z',
      description: '数学の重要問題',
    },
  ];

  it('exportDataToJsonString により仕様通りのJSON文字列が生成されること', () => {
    const jsonStr = exportDataToJsonString(sampleWorkbooks, sampleSubjects);

    expect(typeof jsonStr).toBe('string');
    const parsed = JSON.parse(jsonStr);

    expect(parsed.appName).toBe('Questrack');
    expect(parsed.version).toBe('1.0.0');
    expect(typeof parsed.exportedAt).toBe('string');
    expect(parsed.workbooks).toHaveLength(1);
    expect(parsed.workbooks[0].title).toBe('高校数学100問');
    expect(parsed.subjects).toHaveLength(2);
  });

  describe('validateAndParseImportData によるデータ検証', () => {
    it('正常なエクスポートJSONを正しくパースして成功結果を返すこと', () => {
      const jsonStr = exportDataToJsonString(sampleWorkbooks, sampleSubjects);
      const result = validateAndParseImportData(jsonStr);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.workbooks).toHaveLength(1);
      expect(result.data?.subjects).toHaveLength(2);
    });

    it('不正な形式のJSON文字列 (構文エラー) を拒絶すること', () => {
      const brokenJson = '{ invalid_json: ';
      const result = validateAndParseImportData(brokenJson);

      expect(result.success).toBe(false);
      expect(result.error).toContain('JSONの解析に失敗しました');
    });

    it('空文字列や null、配列などの不適切なトップレベル構造を拒絶すること', () => {
      expect(validateAndParseImportData('').success).toBe(false);
      expect(validateAndParseImportData('[]').success).toBe(false);
      expect(validateAndParseImportData('12345').success).toBe(false);
    });

    it('subjects または workbooks が欠落しているJSONを拒絶すること', () => {
      const noSubjects = JSON.stringify({ workbooks: sampleWorkbooks });
      expect(validateAndParseImportData(noSubjects).success).toBe(false);

      const noWorkbooks = JSON.stringify({ subjects: sampleSubjects });
      expect(validateAndParseImportData(noWorkbooks).success).toBe(false);
    });

    it('教科データに必要なフィールド (id, name, color) が欠けている場合に拒絶すること', () => {
      const invalidSubject = [{ id: 'sub-1', name: '理科' }]; // color 欠落
      const payload = JSON.stringify({
        subjects: invalidSubject,
        workbooks: sampleWorkbooks,
      });

      const result = validateAndParseImportData(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('一部の教科データに必要なフィールド');
    });

    it('問題データに必要なフィールドや不正なステータスがある場合に拒絶すること', () => {
      const badWorkbook = [
        {
          id: 'wb-bad',
          title: '不正な問題集',
          subjectId: 'sub-math',
          totalQuestions: 1,
          questions: [
            {
              id: 'q-1',
              number: 1,
              status: 'invalid_status_value', // 不正ステータス
              note: '',
            },
          ],
        },
      ];

      const payload = JSON.stringify({
        subjects: sampleSubjects,
        workbooks: badWorkbook,
      });

      const result = validateAndParseImportData(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('ステータスまたは番号が不正です');
    });
  });

  describe('mergeImportedData の動作検証 (追加マージ vs 上書き)', () => {
    it('追加マージモード (merge): 同名教科がある場合は既存教科IDを引き継ぎ、新規教科は追加されること', () => {
      const existingSubjects: Subject[] = [
        { id: 'sub-math-existing', name: '数学', color: '#000000' },
      ];
      const existingWorkbooks: Workbook[] = [];

      const importedSubjects: Subject[] = [
        { id: 'sub-math-imported', name: '数学', color: '#111111' }, // 同名: 数学
        { id: 'sub-science-new', name: '理科', color: '#222222' },   // 新規: 理科
      ];

      const importedWorkbooks: Workbook[] = [
        {
          id: 'wb-imp-1',
          title: '数学問題集',
          subjectId: 'sub-math-imported',
          totalQuestions: 1,
          questions: [{ id: 'q-1', number: 1, status: 'correct', note: '' }],
          createdAt: '',
          updatedAt: '',
        },
      ];

      const merged = mergeImportedData(
        existingWorkbooks,
        existingSubjects,
        importedWorkbooks,
        importedSubjects
      );

      // 教科: 数学(既存) + 理科(新規) = 2教科
      expect(merged.subjects).toHaveLength(2);
      expect(merged.subjects.find((s) => s.name === '理科')).toBeDefined();

      // インポートされた問題集の subjectId が、既存の数学のID ('sub-math-existing') にマッピングされていること
      const mathWb = merged.workbooks.find((w) => w.title === '数学問題集');
      expect(mathWb).toBeDefined();
      expect(mathWb?.subjectId).toBe('sub-math-existing');
    });

    it('追加マージモード (merge): 問題集IDが既存データと衝突した場合は新しい一意IDが発行され、問題IDもリマップされること', () => {
      const conflictId = 'wb-shared-id';
      const existingWorkbooks: Workbook[] = [
        {
          id: conflictId,
          title: '既存の問題集',
          subjectId: 'sub-math',
          totalQuestions: 1,
          questions: [{ id: `${conflictId}-1`, number: 1, status: 'correct', note: '' }],
          createdAt: '',
          updatedAt: '',
        },
      ];

      const importedWorkbooks: Workbook[] = [
        {
          id: conflictId, // 同じID
          title: 'インポートされた問題集',
          subjectId: 'sub-math',
          totalQuestions: 1,
          questions: [{ id: `${conflictId}-1`, number: 1, status: 'incorrect', note: 'メモ' }],
          createdAt: '',
          updatedAt: '',
        },
      ];

      const merged = mergeImportedData(
        existingWorkbooks,
        sampleSubjects,
        importedWorkbooks,
        sampleSubjects
      );

      expect(merged.workbooks).toHaveLength(2);

      const importedResultWb = merged.workbooks.find((w) => w.title === 'インポートされた問題集');
      expect(importedResultWb).toBeDefined();
      expect(importedResultWb?.id).not.toBe(conflictId); // 再採番されていること
      expect(importedResultWb?.questions[0].id).toBe(`${importedResultWb?.id}-1`); // 問題IDもリマップされていること
    });

    it('上書きモード (replace / overwrite): インポートデータで既存データが完全に置換されること', () => {
      const existingWorkbooks = [...sampleWorkbooks];

      const newWorkbooks: Workbook[] = [
        {
          id: 'wb-new-only',
          title: '上書き後の新問題集',
          subjectId: 'sub-new',
          totalQuestions: 10,
          questions: createEmptyQuestions(10, 'wb-new-only'),
          createdAt: '2026-09-23',
          updatedAt: '2026-09-23',
        },
      ];
      const newSubjects: Subject[] = [
        { id: 'sub-new', name: '情報', color: '#06B6D4' },
      ];

      // replace モードの動作検証（既存を破棄して新データで置き換え）
      const replaceModeResult = {
        workbooks: newWorkbooks,
        subjects: newSubjects,
      };

      expect(replaceModeResult.workbooks).toHaveLength(1);
      expect(replaceModeResult.workbooks[0].title).toBe('上書き後の新問題集');
      expect(replaceModeResult.workbooks.some((w) => w.id === existingWorkbooks[0].id)).toBe(false);
      expect(replaceModeResult.subjects).toHaveLength(1);
      expect(replaceModeResult.subjects[0].name).toBe('情報');
    });
  });
});

// =================================================================
// 6. ストレージ使用量サマリー計算 (calculateStorageUsage) のテスト
// =================================================================
describe('ストレージ使用量サマリー計算 (calculateStorageUsage)', () => {
  it('問題集数、問題総数、教科数、推定バイト数が正しく計算されること', () => {
    const subjects = DEFAULT_SUBJECTS;
    const workbooks = INITIAL_SEED_WORKBOOKS;

    const summary = calculateStorageUsage(workbooks, subjects);

    expect(summary.workbookCount).toBe(workbooks.length);
    expect(summary.subjectCount).toBe(subjects.length);

    const expectedTotalQuestions = workbooks.reduce((acc, wb) => acc + wb.questions.length, 0);
    expect(summary.questionCount).toBe(expectedTotalQuestions);
    expect(summary.storageSizeBytes).toBeGreaterThan(0);
    expect(typeof summary.lastUpdated).toBe('string');
  });
});

// =================================================================
// 7. 初期シードデータの整合性テスト
// =================================================================
describe('初期シードデータの整合性', () => {
  it('INITIAL_SEED_WORKBOOKS の各問題集が100問持ち、各問題が正しく初期化されていること', () => {
    expect(INITIAL_SEED_WORKBOOKS.length).toBeGreaterThan(0);

    for (const wb of INITIAL_SEED_WORKBOOKS) {
      expect(wb.totalQuestions).toBe(100);
      expect(wb.questions).toHaveLength(100);

      // ◯または✕または未解答のステータスを持つこと
      for (const q of wb.questions) {
        expect(['correct', 'incorrect', 'unanswered']).toContain(q.status);
      }
    }
  });

  it('DEFAULT_SUBJECTS に数学や英語などの基本科目が定義されていること', () => {
    expect(DEFAULT_SUBJECTS.length).toBeGreaterThanOrEqual(5);
    const subjectNames = DEFAULT_SUBJECTS.map((s) => s.name);
    expect(subjectNames).toContain('数学');
    expect(subjectNames).toContain('英語');
  });
});

// =================================================================
// 8. 問題集削除と全体統計（やり残し・未解答）の連動テスト
// =================================================================
describe('問題集削除と全体統計（やり残し）の連動テスト', () => {
  it('複数問題集（問題集A 50問中未解答30問、問題集B 100問中未解答80問）から問題集Bを削除した際に、残った問題集Aのみで全体統計（総問題数: 50問、やり残し: 30問）が正確に再計算されること', () => {
    // 問題集A: 50問 (◯15問, ✕5問, 未解答30問)
    const questionsA: Question[] = [
      ...Array.from({ length: 15 }, (_, i) => ({
        id: `wb-a-${i + 1}`,
        number: i + 1,
        status: 'correct' as const,
        note: '',
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `wb-a-${i + 16}`,
        number: i + 16,
        status: 'incorrect' as const,
        note: '要復習',
      })),
      ...Array.from({ length: 30 }, (_, i) => ({
        id: `wb-a-${i + 21}`,
        number: i + 21,
        status: 'unanswered' as const,
        note: '',
      })),
    ];

    const wbA: Workbook = {
      id: 'wb-a',
      title: '問題集A (50問)',
      subjectId: 'sub-math',
      totalQuestions: 50,
      questions: questionsA,
      createdAt: '2026-09-23T00:00:00.000Z',
      updatedAt: '2026-09-23T00:00:00.000Z',
    };

    // 問題集B: 100問 (◯12問, ✕8問, 未解答80問)
    const questionsB: Question[] = [
      ...Array.from({ length: 12 }, (_, i) => ({
        id: `wb-b-${i + 1}`,
        number: i + 1,
        status: 'correct' as const,
        note: '',
      })),
      ...Array.from({ length: 8 }, (_, i) => ({
        id: `wb-b-${i + 13}`,
        number: i + 13,
        status: 'incorrect' as const,
        note: 'ミス注意',
      })),
      ...Array.from({ length: 80 }, (_, i) => ({
        id: `wb-b-${i + 21}`,
        number: i + 21,
        status: 'unanswered' as const,
        note: '',
      })),
    ];

    const wbB: Workbook = {
      id: 'wb-b',
      title: '問題集B (100問)',
      subjectId: 'sub-eng',
      totalQuestions: 100,
      questions: questionsB,
      createdAt: '2026-09-23T00:00:00.000Z',
      updatedAt: '2026-09-23T00:00:00.000Z',
    };

    // 個別問題集の統計検証
    const statsA = calculateWorkbookStats(wbA);
    expect(statsA.total).toBe(50);
    expect(statsA.answered).toBe(20);
    expect(statsA.correct).toBe(15);
    expect(statsA.incorrect).toBe(5);
    expect(statsA.unanswered).toBe(30);

    const statsB = calculateWorkbookStats(wbB);
    expect(statsB.total).toBe(100);
    expect(statsB.answered).toBe(20);
    expect(statsB.correct).toBe(12);
    expect(statsB.incorrect).toBe(8);
    expect(statsB.unanswered).toBe(80);

    // 削除前の全体統計 (問題集A + 問題集B)
    let currentWorkbooks: Workbook[] = [wbA, wbB];
    let overall = calculateOverallStats(currentWorkbooks);

    expect(overall.totalQuestions).toBe(150);      // 50 + 100
    expect(overall.totalAnswered).toBe(40);        // 20 + 20
    expect(overall.totalCorrect).toBe(27);         // 15 + 12
    expect(overall.totalIncorrect).toBe(13);       // 5 + 8
    expect(overall.totalUnanswered).toBe(110);     // 30 + 80 (全体のやり残し)
    expect(overall.accuracyRate).toBe(68);         // 27 / 40 = 67.5% -> 68%
    expect(overall.progressRate).toBe(27);         // 40 / 150 = 26.66% -> 27%
    expect(overall.unansweredRate).toBe(73);       // 110 / 150 = 73.33% -> 73%

    // 【アクション】問題集Bを削除
    currentWorkbooks = currentWorkbooks.filter((wb) => wb.id !== 'wb-b');
    saveStoredWorkbooks(currentWorkbooks);

    // 【検証】残った問題集Aのみで全体統計が正確に再計算されること
    overall = calculateOverallStats(currentWorkbooks);

    expect(overall.totalQuestions).toBe(50);       // 総問題数: 50問
    expect(overall.totalUnanswered).toBe(30);      // やり残し: 30問
    expect(overall.totalAnswered).toBe(20);        // 解答済み: 20問
    expect(overall.totalCorrect).toBe(15);         // 正解: 15問
    expect(overall.totalIncorrect).toBe(5);        // 不正解: 5問
    expect(overall.accuracyRate).toBe(75);         // 15 / 20 = 75%
    expect(overall.progressRate).toBe(40);         // 20 / 50 = 40%
    expect(overall.unansweredRate).toBe(60);       // 30 / 50 = 60%
  });

  it('すべての問題集を削除した場合に、全体の総問題数、正解、不正解、やり残し（未解答）がすべて 0 になること', () => {
    const wb1: Workbook = {
      id: 'wb-del-1',
      title: '問題集1',
      subjectId: 'sub-math',
      totalQuestions: 20,
      questions: [
        ...Array.from({ length: 10 }, (_, i) => ({ id: `q1-${i + 1}`, number: i + 1, status: 'correct' as const, note: '' })),
        ...Array.from({ length: 5 }, (_, i) => ({ id: `q1-${i + 11}`, number: i + 11, status: 'incorrect' as const, note: '' })),
        ...Array.from({ length: 5 }, (_, i) => ({ id: `q1-${i + 16}`, number: i + 16, status: 'unanswered' as const, note: '' })),
      ],
      createdAt: '',
      updatedAt: '',
    };

    let workbooks: Workbook[] = [wb1];
    expect(calculateOverallStats(workbooks).totalQuestions).toBe(20);
    expect(calculateOverallStats(workbooks).totalUnanswered).toBe(5);

    // すべての問題集を削除 (0冊)
    workbooks = [];
    saveStoredWorkbooks(workbooks);

    const emptyOverall: OverallStats = calculateOverallStats(workbooks);

    expect(emptyOverall.totalQuestions).toBe(0);
    expect(emptyOverall.totalAnswered).toBe(0);
    expect(emptyOverall.totalCorrect).toBe(0);
    expect(emptyOverall.totalIncorrect).toBe(0);
    expect(emptyOverall.totalUnanswered).toBe(0);

    // ゼロ除算ハンドリング (NaNにならず0%になること)
    expect(emptyOverall.accuracyRate).toBe(0);
    expect(Number.isNaN(emptyOverall.accuracyRate)).toBe(false);
    expect(emptyOverall.progressRate).toBe(0);
    expect(Number.isNaN(emptyOverall.progressRate)).toBe(false);
    expect(emptyOverall.unansweredRate).toBe(0);
    expect(Number.isNaN(emptyOverall.unansweredRate)).toBe(false);
  });

  it('問題集削除操作とストレージ同期が連動し、再読み込み後も正確な統計が維持されること', () => {
    const wbAlpha: Workbook = {
      id: 'wb-alpha',
      title: 'アルファ',
      subjectId: 'sub-1',
      totalQuestions: 30,
      questions: createEmptyQuestions(30, 'wb-alpha'),
      createdAt: '',
      updatedAt: '',
    };
    const wbBeta: Workbook = {
      id: 'wb-beta',
      title: 'ベータ',
      subjectId: 'sub-2',
      totalQuestions: 25,
      questions: createEmptyQuestions(25, 'wb-beta'),
      createdAt: '',
      updatedAt: '',
    };

    // 初期2冊保存
    saveStoredWorkbooks([wbAlpha, wbBeta]);
    let stored = loadStoredWorkbooks();
    expect(stored).toHaveLength(2);
    expect(calculateOverallStats(stored!).totalQuestions).toBe(55);
    expect(calculateOverallStats(stored!).totalUnanswered).toBe(55);

    // wbBeta を削除して保存
    const remaining = stored!.filter((w) => w.id !== 'wb-beta');
    saveStoredWorkbooks(remaining);

    stored = loadStoredWorkbooks();
    expect(stored).toHaveLength(1);
    expect(stored![0].id).toBe('wb-alpha');
    expect(calculateOverallStats(stored!).totalQuestions).toBe(30);
    expect(calculateOverallStats(stored!).totalUnanswered).toBe(30);

    // wbAlpha も削除して保存 (空配列)
    saveStoredWorkbooks([]);
    stored = loadStoredWorkbooks();
    expect(stored).toEqual([]);
    expect(calculateOverallStats(stored!).totalQuestions).toBe(0);
    expect(calculateOverallStats(stored!).totalUnanswered).toBe(0);
  });
});

// =================================================================
// 9. ストレージの空配列維持テスト
// =================================================================
describe('ストレージの空配列維持テスト', () => {
  it('loadStoredWorkbooks() が空配列 [] を正しく読み込み、null や初期シードにならないこと', () => {
    // 明示的に空配列 [] を保存
    expect(saveStoredWorkbooks([])).toBe(true);

    const loaded = loadStoredWorkbooks();

    expect(loaded).not.toBeNull();
    expect(Array.isArray(loaded)).toBe(true);
    expect(loaded).toEqual([]);
    expect(loaded).toHaveLength(0);
  });

  it('ユーザーが全問題集を削除した空配列 [] の状態のとき、AppContext初期化ロジック (stored !== null ? stored : INITIAL_SEED_WORKBOOKS) で INITIAL_SEED_WORKBOOKS が誤って復活しないこと', () => {
    // 全問題集が削除されたストレージ状態をシミュレート
    saveStoredWorkbooks([]);

    const storedWorkbooks = loadStoredWorkbooks();

    // AppContext の初期化評価式
    const resolvedWorkbooks = storedWorkbooks !== null ? storedWorkbooks : INITIAL_SEED_WORKBOOKS;

    // 空配列が正しく維持され、シードデータが誤って復活しないこと
    expect(resolvedWorkbooks).toEqual([]);
    expect(resolvedWorkbooks).toHaveLength(0);
    expect(resolvedWorkbooks).not.toBe(INITIAL_SEED_WORKBOOKS);
    expect(resolvedWorkbooks.length).not.toBe(INITIAL_SEED_WORKBOOKS.length);
  });

  it('初回起動時など未初期化状態 (safeStorage.getItem が null を返す場合) は正常に INITIAL_SEED_WORKBOOKS にフォールバックすること', () => {
    // キーを削除して初回未設定状態にする
    safeStorage.removeItem(STORAGE_KEYS.WORKBOOKS);

    const storedWorkbooks = loadStoredWorkbooks();
    expect(storedWorkbooks).toBeNull();

    // AppContext の初期化評価式
    const resolvedWorkbooks = storedWorkbooks !== null ? storedWorkbooks : INITIAL_SEED_WORKBOOKS;

    // 初回起動時はシードデータがロードされること
    expect(resolvedWorkbooks).toEqual(INITIAL_SEED_WORKBOOKS);
    expect(resolvedWorkbooks.length).toBeGreaterThan(0);
  });

  it('ストレージに破損したJSONや配列以外のオブジェクトが格納されている場合は安全に null を返すこと', () => {
    // オブジェクト形式 (非配列)
    safeStorage.setItem(STORAGE_KEYS.WORKBOOKS, JSON.stringify({ error: 'not an array' }));
    expect(loadStoredWorkbooks()).toBeNull();

    // 数値プリミティブ
    safeStorage.setItem(STORAGE_KEYS.WORKBOOKS, '12345');
    expect(loadStoredWorkbooks()).toBeNull();

    // 構文不正JSON
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    safeStorage.setItem(STORAGE_KEYS.WORKBOOKS, '{ broken json');
    expect(loadStoredWorkbooks()).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('全問題集削除 (saveStoredWorkbooks([])) と完全初期化 (clearAllDataFromStorage()) の挙動の違いが明確に識別されること', () => {
    // パターン1: ユーザーが手動で全問題集を削除 -> ストレージには "[]" が残り、空状態を維持
    saveStoredWorkbooks([]);
    expect(safeStorage.getItem(STORAGE_KEYS.WORKBOOKS)).toBe('[]');
    expect(loadStoredWorkbooks()).toEqual([]);

    // パターン2: 完全初期化・工場出荷リセット -> キー自体が削除され null になる
    clearAllDataFromStorage();
    expect(safeStorage.getItem(STORAGE_KEYS.WORKBOOKS)).toBeNull();
    expect(loadStoredWorkbooks()).toBeNull();
  });
});

// =================================================================
// 10. 任意問題数（100問固定ではない）の柔軟性テスト
// =================================================================
describe('任意問題数（100問固定ではない）の柔軟性テスト', () => {
  it('10問、50問、120問などの任意の問題数で createEmptyQuestions が過不足なく正確に生成されること', () => {
    // 10問の生成
    const q10 = createEmptyQuestions(10, 'quiz-10');
    expect(q10).toHaveLength(10);
    expect(q10[0].number).toBe(1);
    expect(q10[0].id).toBe('quiz-10-1');
    expect(q10[9].number).toBe(10);
    expect(q10[9].id).toBe('quiz-10-10');
    expect(q10.every((q) => q.status === 'unanswered' && q.note === '')).toBe(true);

    // 50問の生成
    const q50 = createEmptyQuestions(50, 'exam-50');
    expect(q50).toHaveLength(50);
    expect(q50[0].number).toBe(1);
    expect(q50[49].number).toBe(50);
    expect(q50[49].id).toBe('exam-50-50');

    // 120問の生成 (100問超の模試)
    const q120 = createEmptyQuestions(120, 'mock-120');
    expect(q120).toHaveLength(120);
    expect(q120[0].number).toBe(1);
    expect(q120[119].number).toBe(120);
    expect(q120[119].id).toBe('mock-120-120');

    // 1問 (境界値)
    const q1 = createEmptyQuestions(1, 'single-1');
    expect(q1).toHaveLength(1);
    expect(q1[0].number).toBe(1);
  });

  it('10問の小テスト問題集で解答追跡と統計計算（正答率・進捗率・未解答数）が正常に算出されること', () => {
    // 10問: ◯6問, ✕2問, 未解答2問
    const questions: Question[] = [
      ...Array.from({ length: 6 }, (_, i) => ({ id: `q10-${i + 1}`, number: i + 1, status: 'correct' as const, note: '' })),
      ...Array.from({ length: 2 }, (_, i) => ({ id: `q10-${i + 7}`, number: i + 7, status: 'incorrect' as const, note: 'ケアレスミス' })),
      ...Array.from({ length: 2 }, (_, i) => ({ id: `q10-${i + 9}`, number: i + 9, status: 'unanswered' as const, note: '' })),
    ];

    const wb: Workbook = {
      id: 'wb-quiz-10',
      title: '英単語確認10問テスト',
      subjectId: 'sub-eng',
      totalQuestions: 10,
      questions,
      createdAt: '2026-09-23',
      updatedAt: '2026-09-23',
    };

    const stats = calculateWorkbookStats(wb);
    expect(stats.total).toBe(10);
    expect(stats.answered).toBe(8);
    expect(stats.correct).toBe(6);
    expect(stats.incorrect).toBe(2);
    expect(stats.unanswered).toBe(2);
    expect(stats.accuracyRate).toBe(75.0); // 6 / 8 = 75.0%
    expect(stats.progressRate).toBe(80.0); // 8 / 10 = 80.0%
  });

  it('50問の中規模問題集で解答追跡と統計計算が正常に算出されること', () => {
    // 50問: ◯35問, ✕5問, 未解答10問
    const questions: Question[] = [
      ...Array.from({ length: 35 }, (_, i) => ({ id: `q50-${i + 1}`, number: i + 1, status: 'correct' as const, note: '' })),
      ...Array.from({ length: 5 }, (_, i) => ({ id: `q50-${i + 36}`, number: i + 36, status: 'incorrect' as const, note: '公式復習' })),
      ...Array.from({ length: 10 }, (_, i) => ({ id: `q50-${i + 41}`, number: i + 41, status: 'unanswered' as const, note: '' })),
    ];

    const wb: Workbook = {
      id: 'wb-mid-50',
      title: '定期テスト直前50問ドリル',
      subjectId: 'sub-math',
      totalQuestions: 50,
      questions,
      createdAt: '2026-09-23',
      updatedAt: '2026-09-23',
    };

    const stats = calculateWorkbookStats(wb);
    expect(stats.total).toBe(50);
    expect(stats.answered).toBe(40);
    expect(stats.correct).toBe(35);
    expect(stats.incorrect).toBe(5);
    expect(stats.unanswered).toBe(10);
    expect(stats.accuracyRate).toBe(87.5); // 35 / 40 = 87.5%
    expect(stats.progressRate).toBe(80.0); // 40 / 50 = 80.0%
  });

  it('120問の大規模問題集（100問超の模試）で全問解答時の統計計算が正常に算出されること', () => {
    // 120問: ◯100問, ✕20問, 未解答0問 (全問完走)
    const questions: Question[] = [
      ...Array.from({ length: 100 }, (_, i) => ({ id: `q120-${i + 1}`, number: i + 1, status: 'correct' as const, note: '' })),
      ...Array.from({ length: 20 }, (_, i) => ({ id: `q120-${i + 101}`, number: i + 101, status: 'incorrect' as const, note: '要見直し' })),
    ];

    const wb: Workbook = {
      id: 'wb-mock-120',
      title: '共通テスト総合模試120問ノック',
      subjectId: 'sub-info',
      totalQuestions: 120,
      questions,
      createdAt: '2026-09-23',
      updatedAt: '2026-09-23',
    };

    const stats = calculateWorkbookStats(wb);
    expect(stats.total).toBe(120);
    expect(stats.answered).toBe(120);
    expect(stats.correct).toBe(100);
    expect(stats.incorrect).toBe(20);
    expect(stats.unanswered).toBe(0);
    expect(stats.accuracyRate).toBe(83.3); // 100 / 120 = 83.333% -> 83.3%
    expect(stats.progressRate).toBe(100.0); // 120 / 120 = 100.0%
  });

  it('100問を超える問題集（120問）でも「✕（不正解）のみ抽出」および3桁の問題番号検索（例: "115", "q120"）が正確に動作すること', () => {
    const questions: Question[] = [
      ...Array.from({ length: 100 }, (_, i) => ({
        id: `q120-${i + 1}`,
        number: i + 1,
        status: 'correct' as const,
        note: i === 41 ? '42番のメモ' : '',
      })),
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `q120-${i + 101}`,
        number: i + 101,
        status: 'incorrect' as const,
        note: i + 101 === 115 ? '115番の三角関数極限の難問' : '',
      })),
    ];

    // 不正解のみ抽出
    const incorrectOnly = filterQuestions(questions, 'incorrect_only');
    expect(incorrectOnly).toHaveLength(20);
    expect(incorrectOnly.every((q) => q.status === 'incorrect')).toBe(true);

    // 100超の番号検索: "115"
    const search115 = filterQuestions(questions, 'all', '115');
    expect(search115).toHaveLength(1);
    expect(search115[0].number).toBe(115);
    expect(search115[0].status).toBe('incorrect');

    // "q120" / "Q120" 検索
    const searchQ120 = filterQuestions(questions, 'all', 'q120');
    expect(searchQ120).toHaveLength(1);
    expect(searchQ120[0].number).toBe(120);

    // "問105" 検索
    const searchToi105 = filterQuestions(questions, 'all', '問105');
    expect(searchToi105).toHaveLength(1);
    expect(searchToi105[0].number).toBe(105);

    // メモ部分一致検索
    const searchMemo = filterQuestions(questions, 'all', '極限');
    expect(searchMemo).toHaveLength(1);
    expect(searchMemo[0].number).toBe(115);
  });

  it('任意問題数での動的伸縮（拡張: 10問→50問、縮小: 120問→50問）において既存の解答・メモが保持されること', () => {
    const now = new Date().toISOString();

    // 1. 10問の初期問題集を作成し、1番を◯、2番を✕(メモ付き)に設定
    const questions10 = createEmptyQuestions(10, 'wb-dynamic');
    questions10[0].status = 'correct';
    questions10[0].note = '第1問の解答メモ';
    questions10[1].status = 'incorrect';
    questions10[1].note = '第2問の要復習メモ';

    // 10問 -> 50問への拡張処理
    const newTotalExpanded = 50;
    const extraCount = newTotalExpanded - questions10.length;
    const extraQuestions: Question[] = [];
    for (let i = 0; i < extraCount; i++) {
      extraQuestions.push({
        id: `wb-dynamic-${questions10.length + 1 + i}`,
        number: questions10.length + 1 + i,
        status: 'unanswered',
        note: '',
        updatedAt: now,
      });
    }
    const questions50Expanded = [...questions10, ...extraQuestions];

    expect(questions50Expanded).toHaveLength(50);
    // 既存の問題のステータスとメモが維持されていること
    expect(questions50Expanded[0].status).toBe('correct');
    expect(questions50Expanded[0].note).toBe('第1問の解答メモ');
    expect(questions50Expanded[1].status).toBe('incorrect');
    expect(questions50Expanded[1].note).toBe('第2問の要復習メモ');
    // 追加された設問が未解答であること
    expect(questions50Expanded[10].number).toBe(11);
    expect(questions50Expanded[10].status).toBe('unanswered');
    expect(questions50Expanded[49].number).toBe(50);
    expect(questions50Expanded[49].status).toBe('unanswered');

    // 2. 120問 -> 50問への縮小処理
    const questions120 = createEmptyQuestions(120, 'wb-shrink');
    questions120[0].status = 'correct';
    questions120[49].status = 'incorrect';
    questions120[49].note = '50問目のメモ';
    questions120[119].status = 'incorrect'; // 120問目

    const newTotalShrunk = 50;
    const questions50Shrunk = questions120.slice(0, newTotalShrunk);

    expect(questions50Shrunk).toHaveLength(50);
    expect(questions50Shrunk[0].status).toBe('correct');
    expect(questions50Shrunk[49].number).toBe(50);
    expect(questions50Shrunk[49].status).toBe('incorrect');
    expect(questions50Shrunk[49].note).toBe('50問目のメモ');
  });

  it('任意問題数（10問、50問、120問）の問題集が JSON エクスポート / インポート / バリデーションで忠実に維持されること', () => {
    const multiSizeWorkbooks: Workbook[] = [
      {
        id: 'wb-export-10',
        title: '10問テスト',
        subjectId: 'sub-math',
        totalQuestions: 10,
        questions: createEmptyQuestions(10, 'wb-export-10'),
        createdAt: '2026-09-23',
        updatedAt: '2026-09-23',
      },
      {
        id: 'wb-export-50',
        title: '50問ドリル',
        subjectId: 'sub-eng',
        totalQuestions: 50,
        questions: createEmptyQuestions(50, 'wb-export-50'),
        createdAt: '2026-09-23',
        updatedAt: '2026-09-23',
      },
      {
        id: 'wb-export-120',
        title: '120問模試',
        subjectId: 'sub-science',
        totalQuestions: 120,
        questions: createEmptyQuestions(120, 'wb-export-120'),
        createdAt: '2026-09-23',
        updatedAt: '2026-09-23',
      },
    ];

    const jsonStr = exportDataToJsonString(multiSizeWorkbooks, DEFAULT_SUBJECTS);
    const result = validateAndParseImportData(jsonStr);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.workbooks).toHaveLength(3);

    const wb10 = result.data?.workbooks.find((w) => w.id === 'wb-export-10');
    expect(wb10?.totalQuestions).toBe(10);
    expect(wb10?.questions).toHaveLength(10);

    const wb50 = result.data?.workbooks.find((w) => w.id === 'wb-export-50');
    expect(wb50?.totalQuestions).toBe(50);
    expect(wb50?.questions).toHaveLength(50);

    const wb120 = result.data?.workbooks.find((w) => w.id === 'wb-export-120');
    expect(wb120?.totalQuestions).toBe(120);
    expect(wb120?.questions).toHaveLength(120);
  });
});

// =================================================================
// 8. OS 言語判定 & 多言語対応 (i18n) のテスト
// =================================================================
describe('OS 言語判定 & 多言語対応 (i18n)', () => {
  it('navigator.language が ja または ja-JP のとき、日本語 (ja) を判定すること', async () => {
    const { detectSystemLanguage } = await import('../context/I18nContext');

    const originalNavigator = globalThis.navigator;

    // ja-JP
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'ja-JP', languages: ['ja-JP', 'ja'] },
      configurable: true,
    });
    expect(detectSystemLanguage()).toBe('ja');

    // ja
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'ja', languages: ['ja'] },
      configurable: true,
    });
    expect(detectSystemLanguage()).toBe('ja');

    // 元に戻す
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
    });
  });

  it('navigator.language が日本語以外 (英語、中国語、フランス語等) のとき、英語 (en) を表示すること', async () => {
    const { detectSystemLanguage } = await import('../context/I18nContext');

    const originalNavigator = globalThis.navigator;

    // 英語 (en-US)
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'en-US', languages: ['en-US', 'en'] },
      configurable: true,
    });
    expect(detectSystemLanguage()).toBe('en');

    // 中国語 (zh-CN)
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'zh-CN', languages: ['zh-CN'] },
      configurable: true,
    });
    expect(detectSystemLanguage()).toBe('en');

    // フランス語 (fr-FR)
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'fr-FR', languages: ['fr-FR'] },
      configurable: true,
    });
    expect(detectSystemLanguage()).toBe('en');

    // 元に戻す
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
    });
  });

  it('翻訳辞書 (translations) の ja と en が完全に対称なキー構造を持つこと', async () => {
    const { translations } = await import('../i18n/translations');

    expect(translations.ja).toBeDefined();
    expect(translations.en).toBeDefined();

    const checkKeys = (objJa: Record<string, any>, objEn: Record<string, any>, path = '') => {
      for (const key of Object.keys(objJa)) {
        const fullPath = path ? `${path}.${key}` : key;
        expect(objEn[key], `Missing English key for: ${fullPath}`).toBeDefined();

        if (typeof objJa[key] === 'object' && objJa[key] !== null) {
          checkKeys(objJa[key], objEn[key], fullPath);
        }
      }
    };

    checkKeys(translations.ja, translations.en);
  });
});

// =================================================================
// 9. OS 連動ダークモードの判定テスト
// =================================================================
describe('OS 連動ダークモードの判定', () => {
  it('prefers-color-scheme: dark の matches に応じてダーク判定が動作すること', () => {
    const matchMediaDark = (query: string): MediaQueryList => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const isSystemDark = matchMediaDark('(prefers-color-scheme: dark)').matches;
    expect(isSystemDark).toBe(true);

    const matchMediaLight = (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const isSystemLight = matchMediaLight('(prefers-color-scheme: dark)').matches;
    expect(isSystemLight).toBe(false);
  });
});

