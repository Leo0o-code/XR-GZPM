import type {
  Achievement,
  BatchNode,
  ChineseJournalConfig,
  IndicatorConfig,
  JournalEntry,
  Material,
  Project,
  Topic,
  VersionRecord,
  WarningRule,
} from '../types';

export const MOCK_PROJECT: Project = {
  id: 'p1',
  name: '国重项目示范',
  code: 'GZ-2025-001',
  startDate: '2025-01-01',
  endDate: '2028-12-31',
};

export const MOCK_TOPICS: Topic[] = [
  { id: 't1', projectId: 'p1', name: '课题1', code: 'K1', responsibleUnit: '清华大学', leader: '张三' },
  { id: 't2', projectId: 'p1', name: '课题2', code: 'K2', responsibleUnit: '北京大学', leader: '李四' },
  { id: 't3', projectId: 'p1', name: '课题3', code: 'K3', responsibleUnit: '中科院', leader: '王五' },
  { id: 't4', projectId: 'p1', name: '课题4', code: 'K4', responsibleUnit: '浙江大学', leader: '赵六' },
  { id: 't5', projectId: 'p1', name: '课题5', code: 'K5', responsibleUnit: '华中科技大学', leader: '孙七' },
];

const today = new Date().toISOString().split('T')[0];
const midTerm = '2026-12-31';
const finalTerm = '2028-12-31';

export const MOCK_INDICATORS: IndicatorConfig[] = [
  // 课题1
  { id: 'i1', projectId: 'p1', topicId: 't1', achievementType: '论文', node: '中期', plannedQuantity: 4, deadline: midTerm, recognitionStatus: '已录用', materialRequirements: ['录用通知', '论文全文'], earlyWarningDays: [90, 60, 30], enabled: true, remarks: '', status: '已发布', version: 1, versionId: 'v1', effectiveDate: '2025-01-01' },
  { id: 'i2', projectId: 'p1', topicId: 't1', achievementType: '论文', node: '结项', plannedQuantity: 7, deadline: finalTerm, recognitionStatus: '已发表', materialRequirements: ['发表证明', '论文全文'], earlyWarningDays: [90, 60, 30], enabled: true, remarks: '', status: '已发布', version: 1, versionId: 'v1', effectiveDate: '2025-01-01' },
  { id: 'i3', projectId: 'p1', topicId: 't1', achievementType: '专利', node: '中期', plannedQuantity: 6, deadline: midTerm, recognitionStatus: '已受理', materialRequirements: ['受理通知书'], earlyWarningDays: [90, 60, 30], enabled: true, remarks: '', status: '已发布', version: 1, versionId: 'v1', effectiveDate: '2025-01-01' },
  { id: 'i4', projectId: 'p1', topicId: 't1', achievementType: '专利', node: '结项', plannedQuantity: 10, deadline: finalTerm, recognitionStatus: '已授权', materialRequirements: ['授权证书'], earlyWarningDays: [90, 60, 30], enabled: true, remarks: '', status: '已发布', version: 1, versionId: 'v1', effectiveDate: '2025-01-01' },
  { id: 'i5', projectId: 'p1', topicId: 't1', achievementType: '软件著作权', node: '中期', plannedQuantity: 4, deadline: midTerm, recognitionStatus: '已取得证书', materialRequirements: ['登记证书'], earlyWarningDays: [90, 60, 30], enabled: true, remarks: '', status: '已发布', version: 1, versionId: 'v1', effectiveDate: '2025-01-01' },
  { id: 'i6', projectId: 'p1', topicId: 't1', achievementType: '软件著作权', node: '结项', plannedQuantity: 7, deadline: finalTerm, recognitionStatus: '已取得证书', materialRequirements: ['登记证书'], earlyWarningDays: [90, 60, 30], enabled: true, remarks: '', status: '已发布', version: 1, versionId: 'v1', effectiveDate: '2025-01-01' },
  // 课题2
  { id: 'i7', projectId: 'p1', topicId: 't2', achievementType: '论文', node: '中期', plannedQuantity: 3, deadline: midTerm, recognitionStatus: '已录用', materialRequirements: ['录用通知', '论文全文'], earlyWarningDays: [90, 60, 30], enabled: true, remarks: '', status: '已发布', version: 1, versionId: 'v1', effectiveDate: '2025-01-01' },
  { id: 'i8', projectId: 'p1', topicId: 't2', achievementType: '论文', node: '结项', plannedQuantity: 6, deadline: finalTerm, recognitionStatus: '已发表', materialRequirements: ['发表证明', '论文全文'], earlyWarningDays: [90, 60, 30], enabled: true, remarks: '', status: '已发布', version: 1, versionId: 'v1', effectiveDate: '2025-01-01' },
  // 课题3
  { id: 'i9', projectId: 'p1', topicId: 't3', achievementType: '论文', node: '中期', plannedQuantity: 5, deadline: midTerm, recognitionStatus: '已录用', materialRequirements: ['录用通知', '论文全文'], earlyWarningDays: [90, 60, 30], enabled: true, remarks: '', status: '已发布', version: 1, versionId: 'v1', effectiveDate: '2025-01-01' },
  { id: 'i10', projectId: 'p1', topicId: 't3', achievementType: '论文', node: '结项', plannedQuantity: 8, deadline: finalTerm, recognitionStatus: '已发表', materialRequirements: ['发表证明', '论文全文'], earlyWarningDays: [90, 60, 30], enabled: true, remarks: '', status: '已发布', version: 1, versionId: 'v1', effectiveDate: '2025-01-01' },
  // 课题4
  { id: 'i11', projectId: 'p1', topicId: 't4', achievementType: '论文', node: '中期', plannedQuantity: 2, deadline: midTerm, recognitionStatus: '已录用', materialRequirements: ['录用通知', '论文全文'], earlyWarningDays: [90, 60, 30], enabled: true, remarks: '', status: '已发布', version: 1, versionId: 'v1', effectiveDate: '2025-01-01' },
  { id: 'i12', projectId: 'p1', topicId: 't4', achievementType: '论文', node: '结项', plannedQuantity: 5, deadline: finalTerm, recognitionStatus: '已发表', materialRequirements: ['发表证明', '论文全文'], earlyWarningDays: [90, 60, 30], enabled: true, remarks: '', status: '已发布', version: 1, versionId: 'v1', effectiveDate: '2025-01-01' },
  // 课题5
  { id: 'i13', projectId: 'p1', topicId: 't5', achievementType: '论文', node: '中期', plannedQuantity: 3, deadline: midTerm, recognitionStatus: '已录用', materialRequirements: ['录用通知', '论文全文'], earlyWarningDays: [90, 60, 30], enabled: true, remarks: '', status: '已发布', version: 1, versionId: 'v1', effectiveDate: '2025-01-01' },
  { id: 'i14', projectId: 'p1', topicId: 't5', achievementType: '论文', node: '结项', plannedQuantity: 6, deadline: finalTerm, recognitionStatus: '已发表', materialRequirements: ['发表证明', '论文全文'], earlyWarningDays: [90, 60, 30], enabled: true, remarks: '', status: '已发布', version: 1, versionId: 'v1', effectiveDate: '2025-01-01' },
];

export const MOCK_BATCH_NODES: BatchNode[] = [
  { id: 'b1', projectId: 'p1', topicId: 't1', achievementType: '专利', name: '阶段性节点1', deadline: '2027-12-31', cumulativeQuantity: 3 },
  { id: 'b2', projectId: 'p1', topicId: 't1', achievementType: '专利', name: '中期检查', deadline: midTerm, cumulativeQuantity: 6 },
  { id: 'b3', projectId: 'p1', topicId: 't1', achievementType: '专利', name: '项目结项', deadline: finalTerm, cumulativeQuantity: 10 },
];

export const MOCK_CHINESE_JOURNAL_CONFIG: ChineseJournalConfig = {
  id: 'cj1',
  projectId: 'p1',
  totalRepresentativePapers: 32,
  minChineseJournalCount: 9,
  minChineseJournalRatio: 28,
  assessAtProjectLevel: true,
  decomposeToTopics: true,
  topicMinCounts: { t1: 1, t2: 2, t3: 2, t4: 3, t5: 1 },
  journalListVersion: '2025版',
  effectiveDate: '2025-01-01',
};

export const MOCK_JOURNALS: JournalEntry[] = [
  { id: 'j1', name: '中国科学', issn: '1674-7216', publisher: '中国科学院', category: '综合', version: '2025版', addedAt: '2025-01-01' },
  { id: 'j2', name: '科学通报', issn: '0023-074X', publisher: '中国科学院', category: '综合', version: '2025版', addedAt: '2025-01-01' },
  { id: 'j3', name: '计算机学报', issn: '0254-4164', publisher: '中国计算机学会', category: '计算机', version: '2025版', addedAt: '2025-01-01' },
  { id: 'j4', name: '软件学报', issn: '1000-9825', publisher: '中国科学院', category: '计算机', version: '2025版', addedAt: '2025-01-01' },
  { id: 'j5', name: '通信学报', issn: '1000-436X', publisher: '中国通信学会', category: '通信', version: '2025版', addedAt: '2025-01-01' },
];

export const MOCK_VERSION_RECORDS: VersionRecord[] = [
  { id: 'vr1', projectId: 'p1', version: 1, configId: 'i1', fieldName: 'plannedQuantity', beforeValue: '3', afterValue: '4', reason: '根据任务书调整', operator: '管理员A', operatedAt: '2025-02-15 10:30:00', effectiveDate: '2025-03-01' },
  { id: 'vr2', projectId: 'p1', version: 1, configId: 'i1', fieldName: 'deadline', beforeValue: '2026-06-30', afterValue: '2026-12-31', reason: '项目延期', operator: '管理员A', operatedAt: '2025-02-15 10:32:00', effectiveDate: '2025-03-01' },
  { id: 'vr3', projectId: 'p1', version: 2, configId: 'i3', fieldName: 'plannedQuantity', beforeValue: '5', afterValue: '6', reason: '补充指标', operator: '管理员B', operatedAt: '2025-06-10 14:00:00', effectiveDate: '2025-07-01' },
];

export const MOCK_WARNING_RULES: WarningRule[] = [
  { id: 'wr1', projectId: 'p1', type: 'time', name: '时间预警', yellowThreshold: 90, orangeThreshold: 60, redThreshold: 30, enabled: true },
  { id: 'wr2', projectId: 'p1', type: 'quantity_gap', name: '数量缺口预警', yellowThreshold: 30, orangeThreshold: 60, redThreshold: 90, enabled: true },
  { id: 'wr3', projectId: 'p1', type: 'progress_insufficient', name: '进度不足预警', yellowThreshold: 50, orangeThreshold: 30, redThreshold: 10, enabled: true },
  { id: 'wr4', projectId: 'p1', type: 'material', name: '佐证材料预警', yellowThreshold: 7, orangeThreshold: 14, redThreshold: 30, enabled: true },
  { id: 'wr5', projectId: 'p1', type: 'chinese_journal_ratio', name: '我国科技期刊比例预警', yellowThreshold: 5, orangeThreshold: 10, redThreshold: 20, enabled: true },
  { id: 'wr6', projectId: 'p1', type: 'undecomposed', name: '未分解指标预警', yellowThreshold: 0, orangeThreshold: 0, redThreshold: 0, enabled: true },
];

const createMaterials = (status: Material['status'][]): Material[] =>
  status.map((s, idx) => ({
    id: `m-${Math.random().toString(36).slice(2)}`,
    achievementId: '',
    name: `材料${idx + 1}`,
    status: s,
    submittedAt: s !== '未提交' ? today : undefined,
    reviewedAt: s === '审核通过' || s === '被退回' ? today : undefined,
  }));

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  // 课题1 论文
  { id: 'a1', projectId: 'p1', topicId: 't1', achievementType: '论文', title: '面向国重项目的论文一', responsiblePerson: '张三', currentStage: '已录用', stageOrder: 3, totalStages: 4, status: '已录用', materials: createMaterials(['已提交', '审核通过']), officeRecognized: true, isDuplicate: false, isChineseJournal: true, journalId: 'j1', registeredAt: '2025-03-01' },
  { id: 'a2', projectId: 'p1', topicId: 't1', achievementType: '论文', title: '面向国重项目的论文二', responsiblePerson: '张三', currentStage: '审稿中', stageOrder: 2, totalStages: 4, status: '审稿中', materials: createMaterials(['未提交', '未提交']), officeRecognized: false, isDuplicate: false, isChineseJournal: false, registeredAt: '2025-05-01' },
  { id: 'a3', projectId: 'p1', topicId: 't1', achievementType: '论文', title: '面向国重项目的论文三', responsiblePerson: '李四', currentStage: '已发表', stageOrder: 4, totalStages: 4, status: '已发表', materials: createMaterials(['已提交', '审核通过']), officeRecognized: true, isDuplicate: false, isChineseJournal: true, journalId: 'j2', registeredAt: '2025-04-01' },
  // 课题1 专利
  { id: 'a4', projectId: 'p1', topicId: 't1', achievementType: '专利', title: '发明专利一', responsiblePerson: '王五', currentStage: '交底书编制', stageOrder: 1, totalStages: 4, status: '交底书编制', materials: createMaterials(['未提交']), officeRecognized: false, isDuplicate: false, isChineseJournal: false, registeredAt: '2025-02-01' },
  { id: 'a5', projectId: 'p1', topicId: 't1', achievementType: '专利', title: '发明专利二', responsiblePerson: '王五', currentStage: '已受理', stageOrder: 2, totalStages: 4, status: '已受理', materials: createMaterials(['已提交', '审核通过']), officeRecognized: true, isDuplicate: false, isChineseJournal: false, registeredAt: '2025-03-15' },
  { id: 'a6', projectId: 'p1', topicId: 't1', achievementType: '专利', title: '发明专利三', responsiblePerson: '赵六', currentStage: '已受理', stageOrder: 2, totalStages: 4, status: '已受理', materials: createMaterials(['已提交', '审核中']), officeRecognized: false, isDuplicate: false, isChineseJournal: false, registeredAt: '2025-04-15' },
  { id: 'a7', projectId: 'p1', topicId: 't1', achievementType: '专利', title: '发明专利四', responsiblePerson: '王五', currentStage: '已授权', stageOrder: 4, totalStages: 4, status: '已授权', materials: createMaterials(['已提交', '审核通过']), officeRecognized: true, isDuplicate: false, isChineseJournal: false, registeredAt: '2025-01-15' },
  { id: 'a8', projectId: 'p1', topicId: 't1', achievementType: '专利', title: '发明专利五', responsiblePerson: '赵六', currentStage: '已受理', stageOrder: 2, totalStages: 4, status: '已受理', materials: createMaterials(['已提交', '审核通过']), officeRecognized: true, isDuplicate: false, isChineseJournal: false, registeredAt: '2025-05-15' },
  // 课题1 软著
  { id: 'a9', projectId: 'p1', topicId: 't1', achievementType: '软件著作权', title: '软件一', responsiblePerson: '孙七', currentStage: '已取得证书', stageOrder: 3, totalStages: 3, status: '已取得证书', materials: createMaterials(['已提交', '审核通过']), officeRecognized: true, isDuplicate: false, isChineseJournal: false, registeredAt: '2025-02-20' },
  { id: 'a10', projectId: 'p1', topicId: 't1', achievementType: '软件著作权', title: '软件二', responsiblePerson: '孙七', currentStage: '已取得证书', stageOrder: 3, totalStages: 3, status: '已取得证书', materials: createMaterials(['已提交', '审核通过']), officeRecognized: true, isDuplicate: false, isChineseJournal: false, registeredAt: '2025-04-20' },
  { id: 'a11', projectId: 'p1', topicId: 't1', achievementType: '软件著作权', title: '软件三', responsiblePerson: '孙七', currentStage: '已取得证书', stageOrder: 3, totalStages: 3, status: '已取得证书', materials: createMaterials(['已提交', '审核通过']), officeRecognized: true, isDuplicate: false, isChineseJournal: false, registeredAt: '2025-06-01' },
  { id: 'a12', projectId: 'p1', topicId: 't1', achievementType: '软件著作权', title: '软件四', responsiblePerson: '孙七', currentStage: '申请中', stageOrder: 2, totalStages: 3, status: '申请中', materials: createMaterials(['已提交', '审核中']), officeRecognized: false, isDuplicate: false, isChineseJournal: false, registeredAt: '2025-06-15' },
  // 课题2 论文
  { id: 'a13', projectId: 'p1', topicId: 't2', achievementType: '论文', title: '课题2论文一', responsiblePerson: '李四', currentStage: '已发表', stageOrder: 4, totalStages: 4, status: '已发表', materials: createMaterials(['已提交', '审核通过']), officeRecognized: true, isDuplicate: false, isChineseJournal: true, journalId: 'j3', registeredAt: '2025-03-10' },
  { id: 'a14', projectId: 'p1', topicId: 't2', achievementType: '论文', title: '课题2论文二', responsiblePerson: '李四', currentStage: '已录用', stageOrder: 3, totalStages: 4, status: '已录用', materials: createMaterials(['已提交', '被退回']), officeRecognized: false, isDuplicate: false, isChineseJournal: false, registeredAt: '2025-05-10' },
  // 课题3 论文
  { id: 'a15', projectId: 'p1', topicId: 't3', achievementType: '论文', title: '课题3论文一', responsiblePerson: '王五', currentStage: '已发表', stageOrder: 4, totalStages: 4, status: '已发表', materials: createMaterials(['已提交', '审核通过']), officeRecognized: true, isDuplicate: false, isChineseJournal: false, registeredAt: '2025-04-10' },
  { id: 'a16', projectId: 'p1', topicId: 't3', achievementType: '论文', title: '课题3论文二', responsiblePerson: '王五', currentStage: '已录用', stageOrder: 3, totalStages: 4, status: '已录用', materials: createMaterials(['已提交', '审核通过']), officeRecognized: true, isDuplicate: false, isChineseJournal: true, journalId: 'j4', registeredAt: '2025-05-20' },
  { id: 'a17', projectId: 'p1', topicId: 't3', achievementType: '论文', title: '课题3论文三', responsiblePerson: '王五', currentStage: '审稿中', stageOrder: 2, totalStages: 4, status: '审稿中', materials: createMaterials(['未提交', '未提交']), officeRecognized: false, isDuplicate: false, isChineseJournal: false, registeredAt: '2025-06-10' },
  // 课题4 论文
  { id: 'a18', projectId: 'p1', topicId: 't4', achievementType: '论文', title: '课题4论文一', responsiblePerson: '赵六', currentStage: '已发表', stageOrder: 4, totalStages: 4, status: '已发表', materials: createMaterials(['已提交', '审核通过']), officeRecognized: true, isDuplicate: false, isChineseJournal: true, journalId: 'j5', registeredAt: '2025-03-20' },
  // 课题5 论文
  { id: 'a19', projectId: 'p1', topicId: 't5', achievementType: '论文', title: '课题5论文一', responsiblePerson: '孙七', currentStage: '已录用', stageOrder: 3, totalStages: 4, status: '已录用', materials: createMaterials(['已提交', '审核中']), officeRecognized: false, isDuplicate: false, isChineseJournal: false, registeredAt: '2025-05-25' },
];

// 修复 achievementId 关联
MOCK_ACHIEVEMENTS.forEach((a) => {
  a.materials.forEach((m) => {
    m.achievementId = a.id;
  });
});
