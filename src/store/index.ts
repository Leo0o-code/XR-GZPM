import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Achievement, ArchiveCategory, ArchiveMaterial, ArchiveRequirement,
  DomesticJournalConfig, IndicatorConfig, OperationRecord, Project,
  ProjectUnit, TimeNode, Topic, WarningRule,
} from '../types';
import {
  MOCK_ACHIEVEMENTS, MOCK_ARCHIVE_CATEGORIES, MOCK_ARCHIVE_MATERIALS, MOCK_ARCHIVE_REQUIREMENTS,
  MOCK_CHINESE_JOURNAL_CONFIG, MOCK_INDICATORS, MOCK_OPERATION_RECORDS,
  MOCK_PROJECT, MOCK_TIME_NODES, MOCK_TOPICS, MOCK_UNITS, MOCK_WARNING_RULES,
} from '../data/mock';

interface AppState {
  project: Project;
  units: ProjectUnit[];
  topics: Topic[];
  nodes: TimeNode[];
  indicators: IndicatorConfig[];
  domesticJournalConfig: DomesticJournalConfig;
  warningRules: WarningRule[];
  achievements: Achievement[];
  archiveCategories: ArchiveCategory[];
  archiveMaterials: ArchiveMaterial[];
  archiveRequirements: ArchiveRequirement[];
  operationRecords: OperationRecord[];

  addUnit: (unit: ProjectUnit) => void;
  updateUnit: (id: string, updates: Partial<ProjectUnit>) => void;
  removeUnit: (id: string) => void;

  addTopic: (topic: Topic) => void;
  updateTopic: (id: string, updates: Partial<Topic>) => void;
  removeTopic: (id: string) => void;

  addNode: (node: TimeNode) => void;
  updateNode: (id: string, updates: Partial<TimeNode>) => void;
  removeNode: (id: string) => void;

  addIndicator: (indicator: IndicatorConfig) => void;
  updateIndicator: (id: string, updates: Partial<IndicatorConfig>) => void;
  removeIndicator: (id: string) => void;
  batchUpdateIndicators: (updates: { id: string; plannedQuantity: number }[]) => void;

  updateDomesticJournalConfig: (updates: Partial<DomesticJournalConfig>) => void;

  updateWarningRule: (id: string, updates: Partial<WarningRule>) => void;

  addAchievement: (achievement: Achievement) => void;
  updateAchievement: (id: string, updates: Partial<Achievement>) => void;
  submitAchievement: (id: string) => void;
  approveAchievement: (id: string, payload: Partial<Achievement>, approver: string) => void;
  rejectAchievement: (id: string, reason: string, approver: string) => void;
  returnAchievement: (id: string, reason: string, approver: string) => void;

  addArchiveCategory: (category: ArchiveCategory) => void;
  updateArchiveCategory: (id: string, updates: Partial<ArchiveCategory>) => void;
  removeArchiveCategory: (id: string) => void;
  addArchiveMaterial: (material: ArchiveMaterial) => void;
  updateArchiveMaterial: (id: string, updates: Partial<ArchiveMaterial>) => void;
  removeArchiveMaterial: (id: string) => void;
  addArchiveRequirement: (req: ArchiveRequirement) => void;
  updateArchiveRequirement: (id: string, updates: Partial<ArchiveRequirement>) => void;
  removeArchiveRequirement: (id: string) => void;

  addOperationRecord: (record: OperationRecord) => void;

  resetToMock: () => void;
}

const buildInitialState = () => ({
  project: MOCK_PROJECT,
  units: MOCK_UNITS,
  topics: MOCK_TOPICS,
  nodes: MOCK_TIME_NODES,
  indicators: MOCK_INDICATORS,
  domesticJournalConfig: MOCK_CHINESE_JOURNAL_CONFIG,
  warningRules: MOCK_WARNING_RULES,
  achievements: MOCK_ACHIEVEMENTS,
  archiveCategories: MOCK_ARCHIVE_CATEGORIES,
  archiveMaterials: MOCK_ARCHIVE_MATERIALS,
  archiveRequirements: MOCK_ARCHIVE_REQUIREMENTS,
  operationRecords: MOCK_OPERATION_RECORDS,
});

export const useAppStore = create<AppState>()(
  persist(
    (set, _get) => ({
      ...buildInitialState(),

      addUnit: (unit) => set((s) => ({ units: [...s.units, unit] })),
      updateUnit: (id, updates) => set((s) => ({ units: s.units.map((u) => (u.id === id ? { ...u, ...updates } : u)) })),
      removeUnit: (id) => set((s) => ({ units: s.units.filter((u) => u.id !== id) })),

      addTopic: (topic) => set((s) => ({ topics: [...s.topics, topic] })),
      updateTopic: (id, updates) => set((s) => ({ topics: s.topics.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
      removeTopic: (id) => set((s) => ({ topics: s.topics.filter((t) => t.id !== id) })),

      addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),
      updateNode: (id, updates) => set((s) => ({ nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)) })),
      removeNode: (id) => set((s) => ({ nodes: s.nodes.filter((n) => n.id !== id) })),

      addIndicator: (indicator) => set((s) => ({ indicators: [...s.indicators, indicator] })),
      updateIndicator: (id, updates) => set((s) => ({
        indicators: s.indicators.map((i) => (i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : i)),
      })),
      removeIndicator: (id) => set((s) => ({ indicators: s.indicators.filter((i) => i.id !== id) })),
      batchUpdateIndicators: (updates) => set((s) => {
        const map = new Map(updates.map((u) => [u.id, u.plannedQuantity]));
        const today = new Date().toISOString().split('T')[0];
        return { indicators: s.indicators.map((i) => map.has(i.id) ? { ...i, plannedQuantity: map.get(i.id)!, updatedAt: today } : i) };
      }),

      updateDomesticJournalConfig: (updates) => set((s) => ({ domesticJournalConfig: { ...s.domesticJournalConfig, ...updates } })),

      updateWarningRule: (id, updates) => set((s) => ({ warningRules: s.warningRules.map((r) => (r.id === id ? { ...r, ...updates } : r)) })),

      addAchievement: (achievement) => set((s) => ({ achievements: [...s.achievements, achievement] })),
      updateAchievement: (id, updates) => set((s) => ({ achievements: s.achievements.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : a)) })),
      submitAchievement: (id) => set((s) => ({ achievements: s.achievements.map((a) => (a.id === id ? { ...a, status: '已提交' as const, submittedAt: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0] } : a)) })),
      approveAchievement: (id, payload, approver) => { const today = new Date().toISOString().split('T')[0]; set((s) => ({ achievements: s.achievements.map((a) => (a.id === id ? { ...a, ...payload, status: '审批通过' as const, approver, approvedAt: today, updatedAt: today } : a)) })); },
      rejectAchievement: (id, reason, approver) => { const today = new Date().toISOString().split('T')[0]; set((s) => ({ achievements: s.achievements.map((a) => (a.id === id ? { ...a, status: '审批不通过' as const, approvalOpinion: reason, approver, approvedAt: today, updatedAt: today, countsToIndicator: false } : a)) })); },
      returnAchievement: (id, reason, approver) => { const today = new Date().toISOString().split('T')[0]; set((s) => ({ achievements: s.achievements.map((a) => (a.id === id ? { ...a, status: '退回修改' as const, approvalOpinion: reason, approver, approvedAt: today, updatedAt: today, countsToIndicator: false } : a)) })); },

      addArchiveCategory: (c) => set((s) => ({ archiveCategories: [...s.archiveCategories, c] })),
      updateArchiveCategory: (id, u) => set((s) => ({ archiveCategories: s.archiveCategories.map((c) => (c.id === id ? { ...c, ...u } : c)) })),
      removeArchiveCategory: (id) => set((s) => ({ archiveCategories: s.archiveCategories.filter((c) => c.id !== id) })),
      addArchiveMaterial: (m) => set((s) => ({ archiveMaterials: [...s.archiveMaterials, m] })),
      updateArchiveMaterial: (id, u) => set((s) => ({ archiveMaterials: s.archiveMaterials.map((m) => (m.id === id ? { ...m, ...u } : m)) })),
      removeArchiveMaterial: (id) => set((s) => ({ archiveMaterials: s.archiveMaterials.filter((m) => m.id !== id) })),
      addArchiveRequirement: (r) => set((s) => ({ archiveRequirements: [...s.archiveRequirements, r] })),
      updateArchiveRequirement: (id, u) => set((s) => ({ archiveRequirements: s.archiveRequirements.map((r) => (r.id === id ? { ...r, ...u } : r)) })),
      removeArchiveRequirement: (id) => set((s) => ({ archiveRequirements: s.archiveRequirements.filter((r) => r.id !== id) })),

      addOperationRecord: (record) => set((s) => ({ operationRecords: [...s.operationRecords, record] })),

      resetToMock: () => set(buildInitialState()),
    }),
    { name: 'research-achievement-storage-v4' }
  )
);
