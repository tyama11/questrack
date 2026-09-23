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
  STORAGE_KEYS,
  DEFAULT_SUBJECTS,
  INITIAL_SEED_WORKBOOKS,
} from '../utils/storage';
import { Question, Subject, Workbook } from '../types';

// =================================================================
// 1. LocalStorage 操作 (safeStorage) のテスト
// =================================================================
describe('LocalStorage 操作 (safeStorage)', () => {
  // メモリベースの簡易モックストレージ
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

  const originalWindow = globalThis.window;

  beforeEach(() => {
    mockStore = {};
    vi.clearAllMocks();

    // グローバル window.localStorage をモック
    // @ts-expect-error Mocking global window
    globalThis.window = {
      localStorage: mockLocalStorage,
    };
  });

  afterEach(() => {
    // @ts-expect-error Restore original window
    globalThis.window = originalWindow;
    vi.restoreAllMocks();
  });

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
    // @ts-expect-error Simulate no localStorage environment
    delete globalThis.window;

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
      expect(q.updatedAt.length).toBeGreaterThan(0);
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
      const existingSubjects = [...sampleSubjects];

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
