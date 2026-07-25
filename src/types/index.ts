// 项目
export interface Project {
  id: string; name: string; code: string; startDate: string; endDate: string;
}

// 项目单位
export interface ProjectUnit {
  id: string; projectId: string; name: string; shortName?: string;
}

// 课题
export interface Topic {
  id: string; projectId: string; code: string; name: string;
  leadingUnitId: string; participatingUnitIds: string[]; remarks?: string;
}

export type AchievementType = '学术论文' | '发明专利' | '软件著作权' | '标准规范' | '人才培养';
export const ACHIEVEMENT_TYPES: AchievementType[] = ['学术论文', '发明专利', '软件著作权', '标准规范', '人才培养'];

export type PaperType = 'SCI' | 'EI' | '中文核心';
export type EducationLevel = '博士' | '硕士';

export type AchievementStatus = '草稿' | '已提交' | '审批中' | '审批通过' | '审批不通过' | '退回修改';
export const ACHIEVEMENT_STATUS: AchievementStatus[] = ['草稿', '已提交', '审批中', '审批通过', '审批不通过', '退回修改'];

// 时间节点
export interface TimeNode {
  id: string; projectId: string; name: string; deadline: string;
  description?: string; participatesInWarning: boolean; sortOrder: number;
}

// 指标配置（简化版）
export interface IndicatorConfig {
  id: string; projectId: string; topicId: string; unitId: string;
  achievementType: AchievementType; nodeId: string; plannedQuantity: number;
  remarks?: string; createdAt: string; updatedAt: string;
}

// 佐证材料规则
export type EvidenceRule =
  | { type: 'SINGLE'; options: string[] }
  | { type: 'OR'; options: string[] };

export interface EvidenceRuleDef {
  rule: EvidenceRule;
  displayText: string;
}

export const ACHIEVEMENT_EVIDENCE_RULES: Record<AchievementType, EvidenceRuleDef> = {
  学术论文: { rule: { type: 'OR', options: ['正式刊出证明', '论文录用通知'] }, displayText: '正式刊出或取得录用通知' },
  发明专利: { rule: { type: 'OR', options: ['发明专利受理证明文件', '发明专利授权证明文件'] }, displayText: '发明专利受理或授权证明文件' },
  软件著作权: { rule: { type: 'SINGLE', options: ['软件著作权证书'] }, displayText: '取得软件著作权证书' },
  标准规范: { rule: { type: 'SINGLE', options: ['标准送审稿'] }, displayText: '提交标准送审稿' },
  人才培养: { rule: { type: 'SINGLE', options: ['研究生学位论文证明材料'] }, displayText: '提供研究生学位论文证明材料' },
};

// 佐证材料
export type MaterialStatus = '未提交' | '待审核' | '审核通过' | '退回修改';
export const MATERIAL_STATUS: MaterialStatus[] = ['未提交', '待审核', '审核通过', '退回修改'];

export interface AchievementMaterial {
  id: string; achievementId: string; materialType: string; name: string;
  fileId: string; fileName: string; fileUrl: string; version: number;
  status: MaterialStatus; uploadedAt?: string; reviewedAt?: string; reviewOpinion?: string;
}

// 成果
export interface Achievement {
  id: string; projectId: string; topicId: string; unitId: string;
  achievementType: AchievementType;

  indicatorId: string; nodeId: string;

  title: string; responsiblePerson: string; otherContributors?: string[];
  progressStatus: string;
  plannedCompletionDate?: string; recognizedCompletionDate?: string;

  status: AchievementStatus; countsToIndicator: boolean;
  createdAt: string; updatedAt: string; submittedAt?: string; remarks: string;

  approvalOpinion?: string; approvedAt?: string; approver?: string;

  // 论文特有
  isRepresentative?: boolean; isChineseJournal?: boolean; chineseJournalReason?: string;
  paperType?: PaperType; journalName?: string; cnNumber?: string; issn?: string;
  doi?: string; firstAuthor?: string; correspondingAuthor?: string; allAuthors?: string;
  submissionDate?: string; acceptanceDate?: string; publicationDate?: string; projectLabeling?: string;

  // 专利特有
  patentScope?: '国内' | '国际'; applicant?: string; inventors?: string;
  applicationNumber?: string; receiptNumber?: string; applicationDate?: string;
  receiptDate?: string; grantDate?: string; grantPublicationNumber?: string; legalStatus?: string;

  // 软著特有
  shortName?: string; version?: string; copyrightOwner?: string; developers?: string;
  completionDate?: string; registrationApplicationDate?: string; registrationNumber?: string; certificateDate?: string;

  // 标准特有
  standardLevel?: string; leadingUnit?: string; participatingUnits?: string;
  drafters?: string; responsibleOrganization?: string; currentStage?: string;
  draftSubmissionDate?: string; draftCommitDate?: string;

  // 人才特有
  studentName?: string; educationLevel?: EducationLevel; trainingUnit?: string;
  supervisorName?: string; thesisTitle?: string; enrollmentDate?: string;
  expectedGraduationDate?: string; actualGraduationDate?: string; trainingStatus?: string;

  materials: AchievementMaterial[];
}

// 预警
export type WarningLevel = 'yellow' | 'orange' | 'red';
export type WarningType = 'time' | 'quantity_gap' | 'progress' | 'material' | 'chinese_journal_ratio';

export const WARNING_TYPES: { value: WarningType; label: string }[] = [
  { value: 'time', label: '时间预警' }, { value: 'quantity_gap', label: '数量缺口预警' },
  { value: 'progress', label: '成果进度预警' }, { value: 'material', label: '佐证材料预警' },
  { value: 'chinese_journal_ratio', label: '国内期刊比例预警' },
];

export interface WarningLevelConfig {
  level: WarningLevel; advanceDays: number; completionRateThreshold: number;
}

export interface WarningRule {
  id: string; projectId: string; type: WarningType; name: string;
  levels: WarningLevelConfig[]; enabled: boolean;
}

export interface WarningResult {
  id: string; type: WarningType; level: WarningLevel; title: string; message: string;
  topicId?: string; unitId?: string; achievementType?: AchievementType; nodeId?: string;
  deadline?: string; daysRemaining?: number; gap?: number;
}

// 国内期刊配置
export interface DomesticJournalConfig {
  id: string; projectId: string; enabled: boolean;
  statisticsScope: '代表性论文'; assessmentLevel: '项目总体' | '项目及课题';
  minRatio: number; minCount?: number;
  topicMinCounts: Record<string, number>; remarks?: string;
}

// 操作记录
export interface OperationRecord {
  id: string; projectId: string;
  module: '课题及指标配置' | '时间节点配置' | '国内期刊指标配置';
  operationType: '新增' | '修改' | '删除' | '导入' | '批量修改';
  objectType: string; objectId?: string; objectName: string;
  beforeValue?: unknown; afterValue?: unknown; description: string;
  operator: string; operatedAt: string;
}

// 归档
export interface ArchiveCategory {
  id: string; projectId: string; name: string; description: string; parentId?: string; sortOrder: number;
}

export interface ArchiveMaterial {
  id: string; projectId: string; categoryId: string; requirementId?: string;
  name: string; fileName: string; fileUrl?: string;
  sourceAchievementId?: string; uploader: string; uploadedAt: string; remarks: string;
  versions: ArchiveMaterialVersion[];
}

export interface ArchiveMaterialVersion {
  id: string; archiveMaterialId: string; version: number;
  fileName: string; fileUrl: string; uploadedAt: string; uploader: string; versionDescription?: string;
}

export interface ArchiveRequirement {
  id: string; projectId: string; categoryId: string; name: string;
  required: boolean; requiredQuantity: number;
  applicableNodeId?: string; description?: string;
}

// 统计
export interface CompletionStats {
  viewKey: string; topicId?: string; unitId?: string;
  achievementType: AchievementType; nodeId: string; nodeName: string; deadline: string;
  plannedQuantity: number; registeredCount: number; recognizedCount: number;
  missingCount: number; completionRate: number;
}

export interface ArchiveMonitoringStats {
  categoryId: string; categoryName: string; requiredCount: number;
  uploadedCount: number; missingCount: number; completionRate: number;
}

export interface ApprovalValidation {
  passed: boolean;
  checks: { label: string; passed: boolean; detail?: string }[];
}

// 文件服务接口
export interface FileService {
  upload(file: File): Promise<{ fileId: string; fileName: string; fileUrl: string }>;
  preview(fileId: string): Promise<string>;
}
