import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Achievement,
  ArchiveCategory,
  ArchiveMaterial,
  ChineseJournalConfig,
  IndicatorConfig,
  Project,
  TimeNode,
  Topic,
  VersionRecord,
  WarningRule,
} from '../types';
import {
  MOCK_ACHIEVEMENTS,
  MOCK_ARCHIVE_CATEGORIES,
  MOCK_ARCHIVE_MATERIALS,
  MOCK_CHINESE_JOURNAL_CONFIG,
  MOCK_INDICATORS,
  MOCK_PROJECT,
  MOCK_TIME_NODES,
  MOCK_TOPICS,
  MOCK_VERSION_RECORDS,
  MOCK_WARNING_RULES,
} from '../data/mock';

interface AppState {
  project: Project;
  topics: Topic[];
  nodes: TimeNode[];
  indicators: IndicatorConfig[];
  chineseJournalConfig: ChineseJournalConfig;
  versionRecords: VersionRecord[];
  warningRules: WarningRule[];
  achievements: Achievement[];
  archiveCategories: ArchiveCategory[];
  archiveMaterials: ArchiveMaterial[];

  // topics
  addTopic: (topic: Topic) => void;
  updateTopic: (id: string, updates: Partial<Topic>) => void;

  // nodes
  addNode: (node: TimeNode) => void;
  updateNode: (id: string, updates: Partial<TimeNode>) => void;
  removeNode: (id: string) => void;

  // indicators
  addIndicator: (indicator: IndicatorConfig) => void;
  updateIndicator: (id: string, updates: Partial<IndicatorConfig>, reason: string, operator: string) => void;
  publishIndicator: (id: string, operator: string) => void;
  adjustIndicator: (id: string, updates: Partial<IndicatorConfig>, reason: string, operator: string) => void;
  deactivateIndicator: (id: string, operator: string) => void;

  // chinese journal config
  updateChineseJournalConfig: (updates: Partial<ChineseJournalConfig>) => void;

  // warning rules
  updateWarningRule: (id: string, updates: Partial<WarningRule>) => void;

  // achievements
  addAchievement: (achievement: Achievement) => void;
  updateAchievement: (id: string, updates: Partial<Achievement>) => void;
  submitAchievement: (id: string) => void;
  approveAchievement: (id: string, payload: Partial<Achievement>, approver: string) => void;
  returnAchievement: (id: string, reason: string, approver: string) => void;

  // archive
  addArchiveCategory: (category: ArchiveCategory) => void;
  updateArchiveCategory: (id: string, updates: Partial<ArchiveCategory>) => void;
  removeArchiveCategory: (id: string) => void;
  addArchiveMaterial: (material: ArchiveMaterial) => void;
  updateArchiveMaterial: (id: string, updates: Partial<ArchiveMaterial>) => void;
  removeArchiveMaterial: (id: string) => void;

  resetToMock: () => void;
}

const buildInitialState = () => ({
  project: MOCK_PROJECT,
  topics: MOCK_TOPICS,
  nodes: MOCK_TIME_NODES,
  indicators: MOCK_INDICATORS,
  chineseJournalConfig: MOCK_CHINESE_JOURNAL_CONFIG,
  versionRecords: MOCK_VERSION_RECORDS,
  warningRules: MOCK_WARNING_RULES,
  achievements: MOCK_ACHIEVEMENTS,
  archiveCategories: MOCK_ARCHIVE_CATEGORIES,
  archiveMaterials: MOCK_ARCHIVE_MATERIALS,
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),

      addTopic: (topic) => set((state) => ({ topics: [...state.topics, topic] })),
      updateTopic: (id, updates) =>
        set((state) => ({
          topics: state.topics.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
      updateNode: (id, updates) =>
        set((state) => ({
          nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        })),
      removeNode: (id) =>
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
        })),

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
        get().updateIndicator(
          id,
          { status: '已发布', effectiveDate: new Date().toISOString().split('T')[0] },
          '发布配置',
          operator
        );
      },

      adjustIndicator: (id, updates, reason, operator) => {
        get().updateIndicator(id, { ...updates, status: '已调整' }, reason, operator);
      },

      deactivateIndicator: (id, operator) => {
        get().updateIndicator(
          id,
          { status: '已停用', enabled: false },
          '停用配置',
          operator
        );
      },

      updateChineseJournalConfig: (updates) =>
        set((state) => ({
          chineseJournalConfig: { ...state.chineseJournalConfig, ...updates },
        })),

      updateWarningRule: (id, updates) =>
        set((state) => ({
          warningRules: state.warningRules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),

      addAchievement: (achievement) =>
        set((state) => ({ achievements: [...state.achievements, achievement] })),

      updateAchievement: (id, updates) =>
        set((state) => ({
          achievements: state.achievements.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : a
          ),
        })),

      submitAchievement: (id) =>
        set((state) => ({
          achievements: state.achievements.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: '已提交',
                  submittedAt: new Date().toISOString().split('T')[0],
                  updatedAt: new Date().toISOString().split('T')[0],
                }
              : a
          ),
        })),

      approveAchievement: (id, payload, approver) => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
          achievements: state.achievements.map((a) =>
            a.id === id
              ? {
                  ...a,
                  ...payload,
                  status: '审批通过',
                  approver,
                  approvedAt: today,
                  updatedAt: today,
                }
              : a
          ),
        }));
      },

      returnAchievement: (id, reason, approver) => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
          achievements: state.achievements.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: '退回修改',
                  approvalOpinion: reason,
                  approver,
                  approvedAt: today,
                  updatedAt: today,
                  countsToIndicator: false,
                }
              : a
          ),
        }));
      },

      addArchiveCategory: (category) =>
        set((state) => ({ archiveCategories: [...state.archiveCategories, category] })),
      updateArchiveCategory: (id, updates) =>
        set((state) => ({
          archiveCategories: state.archiveCategories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      removeArchiveCategory: (id) =>
        set((state) => ({
          archiveCategories: state.archiveCategories.filter((c) => c.id !== id),
        })),

      addArchiveMaterial: (material) =>
        set((state) => ({ archiveMaterials: [...state.archiveMaterials, material] })),
      updateArchiveMaterial: (id, updates) =>
        set((state) => ({
          archiveMaterials: state.archiveMaterials.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),
      removeArchiveMaterial: (id) =>
        set((state) => ({
          archiveMaterials: state.archiveMaterials.filter((m) => m.id !== id),
        })),

      resetToMock: () => set(buildInitialState()),
    }),
    {
      name: 'research-achievement-storage-v2',
    }
  )
);
