import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Achievement,
  BatchNode,
  ChineseJournalConfig,
  IndicatorConfig,
  JournalEntry,
  Project,
  Topic,
  UserRole,
  VersionRecord,
  WarningRule,
} from '../types';
import {
  MOCK_ACHIEVEMENTS,
  MOCK_BATCH_NODES,
  MOCK_CHINESE_JOURNAL_CONFIG,
  MOCK_INDICATORS,
  MOCK_JOURNALS,
  MOCK_PROJECT,
  MOCK_TOPICS,
  MOCK_VERSION_RECORDS,
  MOCK_WARNING_RULES,
} from '../data/mock';

interface AppState {
  role: UserRole;
  currentTopicId: string | null;
  project: Project;
  topics: Topic[];
  indicators: IndicatorConfig[];
  batchNodes: BatchNode[];
  chineseJournalConfig: ChineseJournalConfig;
  journals: JournalEntry[];
  versionRecords: VersionRecord[];
  warningRules: WarningRule[];
  achievements: Achievement[];

  setRole: (role: UserRole) => void;
  setCurrentTopicId: (id: string | null) => void;

  addIndicator: (indicator: IndicatorConfig) => void;
  updateIndicator: (id: string, updates: Partial<IndicatorConfig>, reason: string, operator: string) => void;
  publishIndicator: (id: string, operator: string) => void;
  adjustIndicator: (id: string, updates: Partial<IndicatorConfig>, reason: string, operator: string) => void;
  deactivateIndicator: (id: string, operator: string) => void;

  addBatchNode: (node: BatchNode) => void;
  updateBatchNode: (id: string, updates: Partial<BatchNode>) => void;
  removeBatchNode: (id: string) => void;

  updateChineseJournalConfig: (updates: Partial<ChineseJournalConfig>) => void;

  addJournal: (journal: JournalEntry) => void;
  updateJournal: (id: string, updates: Partial<JournalEntry>) => void;
  removeJournal: (id: string) => void;

  updateWarningRule: (id: string, updates: Partial<WarningRule>) => void;

  addAchievement: (achievement: Achievement) => void;
  updateAchievement: (id: string, updates: Partial<Achievement>) => void;

  resetToMock: () => void;
}

const buildInitialState = () => ({
  role: 'admin' as UserRole,
  currentTopicId: 't1',
  project: MOCK_PROJECT,
  topics: MOCK_TOPICS,
  indicators: MOCK_INDICATORS,
  batchNodes: MOCK_BATCH_NODES,
  chineseJournalConfig: MOCK_CHINESE_JOURNAL_CONFIG,
  journals: MOCK_JOURNALS,
  versionRecords: MOCK_VERSION_RECORDS,
  warningRules: MOCK_WARNING_RULES,
  achievements: MOCK_ACHIEVEMENTS,
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),

      setRole: (role) => set({ role }),
      setCurrentTopicId: (currentTopicId) => set({ currentTopicId }),

      addIndicator: (indicator) =>
        set((state) => ({ indicators: [...state.indicators, indicator] })),

      updateIndicator: (id, updates, reason, operator) => {
        const state = get();
        const indicator = state.indicators.find((i) => i.id === id);
        if (!indicator) return;

        const records: VersionRecord[] = [];
        Object.entries(updates).forEach(([key, value]) => {
          const field = key as keyof IndicatorConfig;
          if (indicator[field] !== value) {
            records.push({
              id: `vr-${Date.now()}-${key}`,
              projectId: indicator.projectId,
              version: indicator.version + 1,
              configId: indicator.id,
              fieldName: key,
              beforeValue: String(indicator[field]),
              afterValue: String(value),
              reason,
              operator,
              operatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
              effectiveDate: updates.effectiveDate || new Date().toISOString().split('T')[0],
            });
          }
        });

        set({
          indicators: state.indicators.map((i) =>
            i.id === id
              ? { ...i, ...updates, version: i.version + (records.length > 0 ? 1 : 0) }
              : i
          ),
          versionRecords: [...state.versionRecords, ...records],
        });
      },

      publishIndicator: (id, operator) => {
        get().updateIndicator(id, { status: '已发布', effectiveDate: new Date().toISOString().split('T')[0] }, '发布配置', operator);
      },

      adjustIndicator: (id, updates, reason, operator) => {
        get().updateIndicator(id, { ...updates, status: '已调整' }, reason, operator);
      },

      deactivateIndicator: (id, operator) => {
        get().updateIndicator(id, { status: '已停用', enabled: false }, '停用配置', operator);
      },

      addBatchNode: (node) => set((state) => ({ batchNodes: [...state.batchNodes, node] })),
      updateBatchNode: (id, updates) =>
        set((state) => ({
          batchNodes: state.batchNodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        })),
      removeBatchNode: (id) =>
        set((state) => ({
          batchNodes: state.batchNodes.filter((n) => n.id !== id),
        })),

      updateChineseJournalConfig: (updates) =>
        set((state) => ({
          chineseJournalConfig: { ...state.chineseJournalConfig, ...updates },
        })),

      addJournal: (journal) => set((state) => ({ journals: [...state.journals, journal] })),
      updateJournal: (id, updates) =>
        set((state) => ({
          journals: state.journals.map((j) => (j.id === id ? { ...j, ...updates } : j)),
        })),
      removeJournal: (id) =>
        set((state) => ({
          journals: state.journals.filter((j) => j.id !== id),
        })),

      updateWarningRule: (id, updates) =>
        set((state) => ({
          warningRules: state.warningRules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),

      addAchievement: (achievement) =>
        set((state) => ({ achievements: [...state.achievements, achievement] })),
      updateAchievement: (id, updates) =>
        set((state) => ({
          achievements: state.achievements.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),

      resetToMock: () => set(buildInitialState()),
    }),
    {
      name: 'research-achievement-storage',
    }
  )
);
