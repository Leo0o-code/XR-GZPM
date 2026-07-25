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
  leadingUnit: string;
  participatingUnits: string[];
  remarks: string;
}

// 成果类型
export type AchievementType = '学术论文' | '发明专利' | '软件著作权' | '标准规范' | '人才培养';

export const ACHIEVEMENT_TYPES: AchievementType[] = [
  '学术论文',
  '发明专利',
  '软件著作权',
  '标准规范',
  '人才培养',
];

// 论文类型
export type PaperType = 'SCI' | 'EI' | '中文核心';

// 人才培养层次
export type EducationLevel = '博士' | '硕士';

// 成果状态
export type AchievementStatus =
  | '草稿'
  | '已提交'
  | '审批中'
  | '审批通过'
  | '审批不通过'
  | '退回修改';

export const ACHIEVEMENT_STATUS: AchievementStatus[] = [
  '草稿',
  '已提交',
  '审批中',
  '审批通过',
  '审批不通过',
  '退回修改',
];

// 时间节点
export interface TimeNode {
  id: string;
  projectId: string;
  name: string;
  deadline: string;
  description: string;
  participatesInWarning: boolean;
  enabled: boolean;
  sortOrder: number;
}

// 指标状态
export type IndicatorStatus = '草稿' | '已发布' | '已调整' | '已停用';

// 指标配置（细化到单位/成果类型/节点）
export interface IndicatorConfig {
  id: string;
  projectId: string;
  topicId: string;
  unitName: string;
  achievementType: AchievementType;
  nodeId: string;
  plannedQuantity: number;
  recognitionStatus: string;
  materialRequirements: string[];
  enabled: boolean;
  remarks: string;
  status: IndicatorStatus;
  version: number;
  versionId: string;
  effectiveDate: string;
}

// 佐证材料
export interface AchievementMaterial {
  id: string;
  achievementId: string;
  name: string;
  status: '未提交' | '已提交' | '审核中' | '审核通过' | '被退回';
  submittedAt?: string;
  reviewedAt?: string;
}

// 成果（统一结构，按类型使用对应可选字段）
export interface Achievement {
  id: string;
  projectId: string;
  topicId: string;
  unitName: string;
  achievementType: AchievementType;

  // 通用字段
  title: string;
  responsiblePerson: string;
  status: AchievementStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  remarks: string;

  // 审批相关
  approvalOpinion?: string;
  approvedAt?: string;
  approver?: string;
  countsToIndicator: boolean;

  // 论文特有
  isRepresentative?: boolean;
  isChineseJournal?: boolean;
  chineseJournalReason?: string;
  paperType?: PaperType;
  journalName?: string;
  cnNumber?: string;
  issn?: string;
  doi?: string;
  firstAuthor?: string;
  correspondingAuthor?: string;
  allAuthors?: string;
  submissionDate?: string;
  acceptanceDate?: string;
  publicationDate?: string;
  projectLabeling?: string;

  // 发明专利特有
  patentScope?: '国内' | '国际';
  applicant?: string;
  inventors?: string;
  applicationNumber?: string;
  receiptNumber?: string;
  applicationDate?: string;
  receiptDate?: string;
  grantDate?: string;
  grantPublicationNumber?: string;
  legalStatus?: string;

  // 软件著作权特有
  shortName?: string;
  version?: string;
  copyrightOwner?: string;
  developers?: string;
  completionDate?: string;
  registrationApplicationDate?: string;
  registrationNumber?: string;
  certificateDate?: string;

  // 标准规范特有
  standardLevel?: string;
  leadingUnit?: string;
  participatingUnits?: string;
  drafters?: string;
  responsibleOrganization?: string;
  currentStage?: string;
  draftSubmissionDate?: string;
  draftCommitDate?: string;

  // 人才培养特有
  studentName?: string;
  educationLevel?: EducationLevel;
  trainingUnit?: string;
  supervisorName?: string;
  thesisTitle?: string;
  enrollmentDate?: string;
  expectedGraduationDate?: string;
  actualGraduationDate?: string;
  trainingStatus?: string;

  materials: AchievementMaterial[];
}

// 预警等级
export type WarningLevel = 'yellow' | 'orange' | 'red';

// 预警类型
export type WarningType = 'time' | 'quantity_gap' | 'chinese_journal_ratio';

export interface WarningLevelConfig {
  level: WarningLevel;
  advanceDays: number;
  completionRateThreshold: number;
}

export interface WarningRule {
  id: string;
  projectId: string;
  type: WarningType;
  name: string;
  levels: WarningLevelConfig[];
  enabled: boolean;
}

export interface WarningResult {
  id: string;
  type: WarningType;
  level: WarningLevel;
  title: string;
  message: string;
  topicId?: string;
  unitName?: string;
  achievementType?: AchievementType;
  nodeId?: string;
  deadline?: string;
  daysRemaining?: number;
  gap?: number;
}

// 中国科技期刊配置
export interface ChineseJournalConfig {
  id: string;
  projectId: string;
  minChineseJournalCount: number;
  minChineseJournalRatio: number;
  decomposeToTopics: boolean;
  topicMinCounts: Record<string, number>;
  effectiveDate: string;
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

// 归档目录
export interface ArchiveCategory {
  id: string;
  projectId: string;
  name: string;
  description: string;
  parentId?: string;
  sortOrder: number;
}

// 归档材料
export interface ArchiveMaterial {
  id: string;
  projectId: string;
  categoryId: string;
  name: string;
  fileName: string;
  fileUrl?: string;
  sourceAchievementId?: string;
  uploader: string;
  uploadedAt: string;
  remarks: string;
}

// 完成统计
export interface CompletionStats {
  viewKey: string;
  topicId?: string;
  unitName?: string;
  achievementType: AchievementType;
  nodeId: string;
  nodeName: string;
  deadline: string;
  plannedQuantity: number;
  registeredCount: number;
  recognizedCount: number;
  missingCount: number;
  completionRate: number;
}

// 归档监控统计
export interface ArchiveMonitoringStats {
  categoryId: string;
  categoryName: string;
  totalCount: number;
  uploadedCount: number;
  missingCount: number;
}
