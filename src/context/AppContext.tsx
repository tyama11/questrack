/**
 * Questrack - アプリケーション状態管理 (AppContext & useApp)
 * 問題集、教科、問題ステータス、フィルター、永続化、データ移行(マージ)、完全初期化の集中管理
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  AppContextType,
  FilterOptions,
  FilterStatus,
  ImportMode,
  ImportResult,
  Question,
  QuestionStatus,
  StorageUsageSummary,
  Subject,
  Workbook,
  WorkbookStats,
} from '../types';
import {
  calculateStorageUsage,
  calculateWorkbookStats,
  clearAllDataFromStorage,
  createEmptyQuestions,
  DEFAULT_SUBJECTS,
  exportDataToJsonString,
  INITIAL_SEED_WORKBOOKS,
  loadStoredActiveWorkbookId,
  loadStoredSubjects,
  loadStoredWorkbooks,
  mergeImportedData,
  saveStoredActiveWorkbookId,
  saveStoredSubjects,
  saveStoredWorkbooks,
  validateAndParseImportData,
} from '../utils/storage';

const AppContext = createContext<AppContextType | undefined>(undefined);

// ランダムID生成用ヘルパー
const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
};

const initialFilterOptions: FilterOptions = {
  status: 'all',
  searchQuery: '',
  subjectId: 'all',
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // ==========================================
  // 状態の初期化 (LocalStorage または シードデータ)
  // ==========================================
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const stored = loadStoredSubjects();
    return stored && stored.length > 0 ? stored : DEFAULT_SUBJECTS;
  });

  const [workbooks, setWorkbooks] = useState<Workbook[]>(() => {
    const stored = loadStoredWorkbooks();
    return stored && stored.length > 0 ? stored : INITIAL_SEED_WORKBOOKS;
  });

  const [activeWorkbookId, setActiveWorkbookIdState] = useState<string | null>(() => {
    const storedId = loadStoredActiveWorkbookId();
    if (storedId) return storedId;
    return INITIAL_SEED_WORKBOOKS.length > 0 ? INITIAL_SEED_WORKBOOKS[0].id : null;
  });

  const [filterOptions, setFilterOptions] = useState<FilterOptions>(initialFilterOptions);

  // ==========================================
  // LocalStorageへの自動永続化
  // ==========================================
  useEffect(() => {
    saveStoredWorkbooks(workbooks);
  }, [workbooks]);

  useEffect(() => {
    saveStoredSubjects(subjects);
  }, [subjects]);

  useEffect(() => {
    saveStoredActiveWorkbookId(activeWorkbookId);
  }, [activeWorkbookId]);

  // activeWorkbookIdが不正（削除された等）になった場合の自己修復
  useEffect(() => {
    if (activeWorkbookId && !workbooks.some((wb) => wb.id === activeWorkbookId)) {
      setActiveWorkbookIdState(workbooks.length > 0 ? workbooks[0].id : null);
    }
  }, [workbooks, activeWorkbookId]);

  // ==========================================
  // 選択中の問題集 (activeWorkbook)
  // ==========================================
  const activeWorkbook = useMemo(() => {
    if (!activeWorkbookId) return null;
    return workbooks.find((wb) => wb.id === activeWorkbookId) || null;
  }, [workbooks, activeWorkbookId]);

  const setActiveWorkbookId = useCallback((id: string | null) => {
    setActiveWorkbookIdState(id);
    // 問題集切り替え時に問題番号検索などのクエリをリセット
    setFilterOptions((prev) => ({
      ...prev,
      searchQuery: '',
    }));
  }, []);

  // ==========================================
  // 問題集 (Workbook) アクション
  // ==========================================
  const createWorkbook = useCallback(
    (
      title: string,
      subjectId: string,
      totalQuestions: number = 100,
      description?: string
    ): Workbook => {
      const now = new Date().toISOString();
      const newId = generateId('wb');
      const newQuestions = createEmptyQuestions(totalQuestions, newId);

      const newWorkbook: Workbook = {
        id: newId,
        title: title.trim() || '無題の問題集',
        subjectId,
        totalQuestions,
        questions: newQuestions,
        createdAt: now,
        updatedAt: now,
        description: description?.trim() || '',
      };

      setWorkbooks((prev) => [newWorkbook, ...prev]);
      setActiveWorkbookIdState(newId);
      return newWorkbook;
    },
    []
  );

  const updateWorkbook = useCallback(
    (id: string, data: Partial<Omit<Workbook, 'id' | 'createdAt'>>) => {
      const now = new Date().toISOString();
      setWorkbooks((prev) =>
        prev.map((wb) => {
          if (wb.id !== id) return wb;

          let updatedQuestions = wb.questions;
          let newTotal = data.totalQuestions ?? wb.totalQuestions;

          // 問題数が変更された場合の伸縮処理
          if (data.totalQuestions !== undefined && data.totalQuestions !== wb.totalQuestions) {
            newTotal = Math.max(1, data.totalQuestions);
            if (newTotal > wb.questions.length) {
              // 不足分を追加
              const extraCount = newTotal - wb.questions.length;
              const startNum = wb.questions.length + 1;
              const extraQuestions: Question[] = [];
              for (let i = 0; i < extraCount; i++) {
                extraQuestions.push({
                  id: `${wb.id}-${startNum + i}`,
                  number: startNum + i,
                  status: 'unanswered',
                  note: '',
                  updatedAt: now,
                });
              }
              updatedQuestions = [...wb.questions, ...extraQuestions];
            } else if (newTotal < wb.questions.length) {
              // 超過分を末尾から削除
              updatedQuestions = wb.questions.slice(0, newTotal);
            }
          }

          return {
            ...wb,
            ...data,
            totalQuestions: newTotal,
            questions: updatedQuestions,
            updatedAt: now,
          };
        })
      );
    },
    []
  );

  const deleteWorkbook = useCallback((id: string) => {
    setWorkbooks((prev) => {
      const remaining = prev.filter((wb) => wb.id !== id);
      saveStoredWorkbooks(remaining);
      return remaining;
    });

    setActiveWorkbookIdState((prevId) => {
      if (prevId === id) {
        // 次の選択先を決定
        const currentWorkbooks = loadStoredWorkbooks() || [];
        const remaining = currentWorkbooks.filter((wb) => wb.id !== id);
        const nextId = remaining.length > 0 ? remaining[0].id : null;
        saveStoredActiveWorkbookId(nextId);
        return nextId;
      }
      return prevId;
    });
  }, []);

  const duplicateWorkbook = useCallback(
    (id: string): Workbook | null => {
      const target = workbooks.find((wb) => wb.id === id);
      if (!target) return null;

      const now = new Date().toISOString();
      const newId = generateId('wb');
      const duplicated: Workbook = {
        ...target,
        id: newId,
        title: `${target.title} (コピー)`,
        createdAt: now,
        updatedAt: now,
        questions: target.questions.map((q) => ({
          ...q,
          id: `${newId}-${q.number}`,
          updatedAt: now,
        })),
      };

      setWorkbooks((prev) => [duplicated, ...prev]);
      setActiveWorkbookIdState(newId);
      return duplicated;
    },
    [workbooks]
  );

  // ==========================================
  // 教科 (Subject) アクション
  // ==========================================
  const createSubject = useCallback(
    (name: string, color: string, description?: string, icon?: string): Subject => {
      const newSubject: Subject = {
        id: generateId('sub'),
        name: name.trim() || '新規教科',
        color: color.trim() || '#3B82F6',
        icon: icon?.trim() || '📚',
        description: description?.trim() || '',
      };

      setSubjects((prev) => [...prev, newSubject]);
      return newSubject;
    },
    []
  );

  const updateSubject = useCallback(
    (id: string, name: string, color: string, description?: string, icon?: string) => {
      setSubjects((prev) =>
        prev.map((sub) => {
          if (sub.id !== id) return sub;
          return {
            ...sub,
            name: name.trim() || sub.name,
            color: color.trim() || sub.color,
            description: description !== undefined ? description.trim() : sub.description,
            icon: icon !== undefined ? icon.trim() : sub.icon,
          };
        })
      );
    },
    []
  );

  const deleteSubject = useCallback(
    (id: string) => {
      setSubjects((prev) => {
        // 教科が全削除されないよう最低1件は残す
        if (prev.length <= 1) return prev;
        const nextSubjects = prev.filter((sub) => sub.id !== id);
        const fallbackSubjectId = nextSubjects[0]?.id || 'sub-math';

        // 削除された教科を参照していた問題集の教科をフォールバック先へ移行
        setWorkbooks((currentWorkbooks) =>
          currentWorkbooks.map((wb) => (wb.subjectId === id ? { ...wb, subjectId: fallbackSubjectId } : wb))
        );

        return nextSubjects;
      });

      // フィルターで選択中だった教科が削除された場合は 'all' にリセット
      setFilterOptions((prev) => (prev.subjectId === id ? { ...prev, subjectId: 'all' } : prev));
    },
    []
  );

  // ==========================================
  // 問題 (Question) 操作アクション
  // ==========================================
  const setQuestionStatus = useCallback(
    (workbookId: string, questionNumber: number, status: QuestionStatus) => {
      const now = new Date().toISOString();
      setWorkbooks((prev) =>
        prev.map((wb) => {
          if (wb.id !== workbookId) return wb;
          return {
            ...wb,
            updatedAt: now,
            questions: wb.questions.map((q) => {
              if (q.number !== questionNumber) return q;
              return {
                ...q,
                status,
                updatedAt: now,
              };
            }),
          };
        })
      );
    },
    []
  );

  const toggleQuestionStatus = useCallback(
    (workbookId: string, questionNumber: number) => {
      const now = new Date().toISOString();
      setWorkbooks((prev) =>
        prev.map((wb) => {
          if (wb.id !== workbookId) return wb;
          return {
            ...wb,
            updatedAt: now,
            questions: wb.questions.map((q) => {
              if (q.number !== questionNumber) return q;
              // サイクル: unanswered -> correct -> incorrect -> unanswered
              let nextStatus: QuestionStatus = 'correct';
              if (q.status === 'correct') {
                nextStatus = 'incorrect';
              } else if (q.status === 'incorrect') {
                nextStatus = 'unanswered';
              } else {
                nextStatus = 'correct';
              }
              return {
                ...q,
                status: nextStatus,
                updatedAt: now,
              };
            }),
          };
        })
      );
    },
    []
  );

  const setQuestionNote = useCallback(
    (workbookId: string, questionNumber: number, note: string) => {
      const now = new Date().toISOString();
      setWorkbooks((prev) =>
        prev.map((wb) => {
          if (wb.id !== workbookId) return wb;
          return {
            ...wb,
            updatedAt: now,
            questions: wb.questions.map((q) => {
              if (q.number !== questionNumber) return q;
              return {
                ...q,
                note,
                updatedAt: now,
              };
            }),
          };
        })
      );
    },
    []
  );

  const batchSetQuestions = useCallback(
    (workbookId: string, status: QuestionStatus) => {
      const now = new Date().toISOString();
      setWorkbooks((prev) =>
        prev.map((wb) => {
          if (wb.id !== workbookId) return wb;
          return {
            ...wb,
            updatedAt: now,
            questions: wb.questions.map((q) => ({
              ...q,
              status,
              updatedAt: now,
            })),
          };
        })
      );
    },
    []
  );

  // ==========================================
  // フィルター・検索アクション
  // ==========================================
  const setStatusFilter = useCallback((status: FilterStatus) => {
    setFilterOptions((prev) => ({ ...prev, status }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setFilterOptions((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const setSubjectFilter = useCallback((subjectId: string | 'all') => {
    setFilterOptions((prev) => ({ ...prev, subjectId }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilterOptions(initialFilterOptions);
  }, []);

  // ==========================================
  // 絞り込み済み問題一覧 (filteredQuestions)
  // ==========================================
  const filteredQuestions = useMemo(() => {
    if (!activeWorkbook) return [];

    return activeWorkbook.questions.filter((q) => {
      // 1. ステータスフィルター
      if (filterOptions.status === 'incorrect_only' && q.status !== 'incorrect') {
        return false;
      }
      if (filterOptions.status === 'correct_only' && q.status !== 'correct') {
        return false;
      }
      if (filterOptions.status === 'unanswered_only' && q.status !== 'unanswered') {
        return false;
      }

      // 2. 検索クエリフィルター (問題番号またはメモ)
      const query = filterOptions.searchQuery.trim().toLowerCase();
      if (!query) return true;

      // 問題番号マッチ (例: "15", "q15", "問15")
      const numMatch = query.replace(/^[q問#\s]+/i, '');
      if (numMatch && !isNaN(Number(numMatch)) && q.number === Number(numMatch)) {
        return true;
      }

      // メモマッチ
      return q.note.toLowerCase().includes(query);
    });
  }, [activeWorkbook, filterOptions.status, filterOptions.searchQuery]);

  // ==========================================
  // 統計ヘルパー
  // ==========================================
  const getWorkbookStats = useCallback((workbook: Workbook): WorkbookStats => {
    return calculateWorkbookStats(workbook);
  }, []);

  // ==========================================
  // データバックアップ・移行(マージ)・インポート・エクスポート
  // ==========================================
  const exportData = useCallback((): string => {
    return exportDataToJsonString(workbooks, subjects);
  }, [workbooks, subjects]);

  const importData = useCallback(
    (jsonString: string, mode: ImportMode = 'replace'): ImportResult => {
      const res = validateAndParseImportData(jsonString);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'データの形式が無効です。' };
      }

      if (mode === 'replace') {
        setWorkbooks(res.data.workbooks);
        setSubjects(res.data.subjects);
        if (res.data.workbooks.length > 0) {
          setActiveWorkbookIdState(res.data.workbooks[0].id);
        } else {
          setActiveWorkbookIdState(null);
        }
        return { success: true, count: res.data.workbooks.length };
      }

      // mode === 'merge'
      const merged = mergeImportedData(workbooks, subjects, res.data.workbooks, res.data.subjects);
      setWorkbooks(merged.workbooks);
      setSubjects(merged.subjects);

      if (!activeWorkbookId && res.data.workbooks.length > 0) {
        setActiveWorkbookIdState(merged.workbooks[0]?.id || null);
      }

      return { success: true, count: res.data.workbooks.length };
    },
    [workbooks, subjects, activeWorkbookId]
  );

  const resetToSampleData = useCallback(() => {
    setWorkbooks(INITIAL_SEED_WORKBOOKS);
    setSubjects(DEFAULT_SUBJECTS);
    setActiveWorkbookIdState(INITIAL_SEED_WORKBOOKS[0]?.id || null);
    setFilterOptions(initialFilterOptions);
  }, []);

  const clearAllData = useCallback(() => {
    clearAllDataFromStorage();
    setWorkbooks([]);
    setSubjects(DEFAULT_SUBJECTS);
    setActiveWorkbookIdState(null);
    setFilterOptions(initialFilterOptions);
  }, []);

  const getStorageUsageSummary = useCallback((): StorageUsageSummary => {
    return calculateStorageUsage(workbooks, subjects);
  }, [workbooks, subjects]);

  // ==========================================
  // Context Value
  // ==========================================
  const value = useMemo<AppContextType>(
    () => ({
      // 状態
      workbooks,
      subjects,
      activeWorkbookId,
      activeWorkbook,
      filterOptions,
      filteredQuestions,
      // 問題集アクション
      createWorkbook,
      updateWorkbook,
      deleteWorkbook,
      duplicateWorkbook,
      setActiveWorkbookId,
      // 教科アクション
      createSubject,
      updateSubject,
      deleteSubject,
      // 問題操作アクション
      setQuestionStatus,
      toggleQuestionStatus,
      setQuestionNote,
      batchSetQuestions,
      // フィルター操作
      setStatusFilter,
      setSearchQuery,
      setSubjectFilter,
      resetFilters,
      // 統計
      getWorkbookStats,
      // データ管理・移行・初期化
      exportData,
      importData,
      resetToSampleData,
      clearAllData,
      getStorageUsageSummary,
    }),
    [
      workbooks,
      subjects,
      activeWorkbookId,
      activeWorkbook,
      filterOptions,
      filteredQuestions,
      createWorkbook,
      updateWorkbook,
      deleteWorkbook,
      duplicateWorkbook,
      setActiveWorkbookId,
      createSubject,
      updateSubject,
      deleteSubject,
      setQuestionStatus,
      toggleQuestionStatus,
      setQuestionNote,
      batchSetQuestions,
      setStatusFilter,
      setSearchQuery,
      setSubjectFilter,
      resetFilters,
      getWorkbookStats,
      exportData,
      importData,
      resetToSampleData,
      clearAllData,
      getStorageUsageSummary,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ==========================================
// useApp カスタムフック
// ==========================================
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
