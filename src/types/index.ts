// 项目
export interface Project {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
}

// 课题
export interface Topic {
  id: string;
  projectId: string;
  name: string;
  code: string;
  responsibleUnit: string;
  leader: string;
}

// 成果类型
export type AchievementType = '论文' | '专利' | '软件著作权' | '标准规范' | '人才培养';

export const ACHIEVEMENT_TYPES: AchievementType[] = [
  '论文',
  '专利',
  '软件著作权',
  '标准规范',
  '人才培养',
];

// 考核节点
export type AssessmentNode = '中期' | '结项' | string;

export const DEFAULT_NODES: AssessmentNode[] = ['中期', '结项'];

// 配置状态
export type ConfigStatus = '草稿' | '已发布' | '已调整' | '已停用';

// 预警等级
export type WarningLevel = 'yellow' | 'orange' | 'red';

// 指标配置项
export interface IndicatorConfig {
  id: string;
  projectId: string;
  topicId: string;
  achievementType: AchievementType;
  node: AssessmentNode;
  plannedQuantity: number;
  deadline: string;
  recognitionStatus: string;
  materialRequirements: string[];
  earlyWarningDays: number[];
  enabled: boolean;
  remarks: string;
  status: ConfigStatus;
  version: number;
  versionId: string;
  effectiveDate: string;
}

// 分批交付节点
export interface BatchNode {
  id: string;
  projectId: string;
  topicId: string;
  achievementType: AchievementType;
  name: string;
  deadline: string;
  cumulativeQuantity: number;
}

// 中国科技期刊论文配置
export interface ChineseJournalConfig {
  id: string;
  projectId: string;
  totalRepresentativePapers: number;
  minChineseJournalCount: number;
  minChineseJournalRatio: number;
  assessAtProjectLevel: boolean;
  decomposeToTopics: boolean;
  topicMinCounts: Record<string, number>;
  journalListVersion: string;
  effectiveDate: string;
}

// 期刊名录条目
export interface JournalEntry {
  id: string;
  name: string;
  issn: string;
  publisher: string;
  category: string;
  version: string;
  addedAt: string;
}

// 版本记录
export interface VersionRecord {
  id: string;
  projectId: string;
  version: number;
  configId: string;
  fieldName: string;
  beforeValue: any;
  afterValue: any;
  reason: string;
  operator: string;
  operatedAt: string;
  effectiveDate: string;
}

// 预警规则
export interface WarningRule {
  id: string;
  projectId: string;
  type: WarningType;
  name: string;
  yellowThreshold: number | string;
  orangeThreshold: number | string;
  redThreshold: number | string;
  enabled: boolean;
}

export type WarningType =
  | 'time'
  | 'quantity_gap'
  | 'progress_insufficient'
  | 'material'
  | 'chinese_journal_ratio'
  | 'undecomposed';

export const WARNING_TYPES: { value: WarningType; label: string }[] = [
  { value: 'time', label: '时间预警' },
  { value: 'quantity_gap', label: '数量缺口预警' },
  { value: 'progress_insufficient', label: '进度不足预警' },
  { value: 'material', label: '佐证材料预警' },
  { value: 'chinese_journal_ratio', label: '我国科技期刊比例预警' },
  { value: 'undecomposed', label: '未分解指标预警' },
];

// 成果登记
export interface Achievement {
  id: string;
  projectId: string;
  topicId: string;
  achievementType: AchievementType;
  title: string;
  responsiblePerson: string;
  currentStage: string;
  stageOrder: number;
  totalStages: number;
  status: string;
  materials: Material[];
  officeRecognized: boolean;
  isDuplicate: boolean;
  isChineseJournal: boolean;
  journalId?: string;
  registeredAt: string;
}

// 佐证材料
export interface Material {
  id: string;
  achievementId: string;
  name: string;
  status: '未提交' | '已提交' | '审核中' | '审核通过' | '被退回';
  submittedAt?: string;
  reviewedAt?: string;
}

// 完成统计
export interface CompletionStats {
  topicId: string;
  achievementType: AchievementType;
  node: AssessmentNode;
  plannedQuantity: number;
  registeredCount: number;
  progressMetCount: number;
  materialsSubmittedCount: number;
  materialsApprovedCount: number;
  recognizedCount: number;
  missingCount: number;
  completionRate: number;
}

// 预警结果
export interface WarningResult {
  id: string;
  type: WarningType;
  level: WarningLevel;
  title: string;
  message: string;
  topicId?: string;
  achievementType?: AchievementType;
  node?: AssessmentNode;
  deadline?: string;
  daysRemaining?: number;
  gap?: number;
}

// 用户角色
export type UserRole = 'admin' | 'topic';
