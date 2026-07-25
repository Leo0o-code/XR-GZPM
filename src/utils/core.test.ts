import { describe, expect, it } from 'vitest';
import { calculateCompletionStats, calculateDomesticJournalRatio, isRecognized } from './stats';
import { generateWarnings } from './warnings';
import { validateEvidenceMaterials, checkDuplicateAchievement } from './validation';
import { isProgressMet } from './helpers';
import type { Achievement, AchievementMaterial, DomesticJournalConfig, IndicatorConfig, TimeNode, WarningRule } from '../types';

const makeNode = (id: string, deadline: string): TimeNode =>
  ({ id, projectId: 'p1', name: id, deadline, description: '', participatesInWarning: true, sortOrder: 1 } as TimeNode);

const makeIndicator = (id: string, planned: number, nodeId: string, unitId: string, topicId: string, type: Achievement['achievementType']): IndicatorConfig =>
  ({ id, projectId: 'p1', topicId, unitId, achievementType: type, nodeId, plannedQuantity: planned, createdAt: '2025-01-01', updatedAt: '2025-01-01' });

const makeAchievement = (overrides: Partial<Achievement>): Achievement => ({
  id: 'a1', projectId: 'p1', topicId: 't1', unitId: 'u1', achievementType: '发明专利',
  indicatorId: 'i1', nodeId: 'n1',
  title: '测试', responsiblePerson: '张三', progressStatus: '已受理',
  plannedCompletionDate: '2027-03-01', recognizedCompletionDate: '2027-03-01',
  status: '审批通过', countsToIndicator: true,
  createdAt: '2025-01-01', updatedAt: '2025-01-01', remarks: '', materials: [],
  ...overrides,
});

const makeMaterial = (overrides: Partial<AchievementMaterial>): AchievementMaterial => ({
  id: 'm1', achievementId: 'a1', materialType: '发明专利授权证明文件', name: '授权证明',
  fileId: 'f1', fileName: 'test.pdf', fileUrl: 'mock://test.pdf', version: 1,
  status: '审核通过',
  ...overrides,
});

const makeWarningRules = (): WarningRule[] => [
  { id: 'wr-time', projectId: 'p1', type: 'time', name: '时间预警', enabled: true, levels: [{ level: 'yellow', advanceDays: 90, completionRateThreshold: 80 }, { level: 'orange', advanceDays: 30, completionRateThreshold: 60 }, { level: 'red', advanceDays: 0, completionRateThreshold: 40 }] },
  { id: 'wr-qty', projectId: 'p1', type: 'quantity_gap', name: '数量缺口预警', enabled: true, levels: [{ level: 'yellow', advanceDays: 0, completionRateThreshold: 80 }, { level: 'orange', advanceDays: 0, completionRateThreshold: 60 }, { level: 'red', advanceDays: 0, completionRateThreshold: 40 }] },
  { id: 'wr-progress', projectId: 'p1', type: 'progress', name: '成果进度预警', enabled: true, levels: [{ level: 'yellow', advanceDays: 90, completionRateThreshold: 80 }, { level: 'orange', advanceDays: 60, completionRateThreshold: 60 }, { level: 'red', advanceDays: 30, completionRateThreshold: 40 }] },
  { id: 'wr-material', projectId: 'p1', type: 'material', name: '佐证材料预警', enabled: true, levels: [{ level: 'yellow', advanceDays: 14, completionRateThreshold: 0 }, { level: 'orange', advanceDays: 7, completionRateThreshold: 0 }, { level: 'red', advanceDays: 3, completionRateThreshold: 0 }] },
  { id: 'wr-cj', projectId: 'p1', type: 'chinese_journal_ratio', name: '国内期刊比例预警', enabled: true, levels: [{ level: 'yellow', advanceDays: 0, completionRateThreshold: 5 }, { level: 'orange', advanceDays: 0, completionRateThreshold: 10 }, { level: 'red', advanceDays: 0, completionRateThreshold: 20 }] },
];

describe('累计节点统计', () => {
  it('中期成果自动计入结项累计节点', () => {
    const mNode = makeNode('n-mid', '2027-06-30');
    const fNode = makeNode('n-final', '2028-12-31');
    const achievs = [makeAchievement({ id: 'a-mid', indicatorId: 'ind-mid', topicId: 't1', unitId: 'u1', achievementType: '发明专利', recognizedCompletionDate: '2027-03-01' })];
    const midInd = makeIndicator('ind-mid', 2, 'n-mid', 'u1', 't1', '发明专利');
    const finalInd = makeIndicator('ind-final', 5, 'n-final', 'u1', 't1', '发明专利');

    const midStats = calculateCompletionStats(midInd, achievs, [mNode, fNode]);
    const finalStats = calculateCompletionStats(finalInd, achievs, [mNode, fNode]);

    expect(midStats.recognizedCount).toBe(1);
    expect(finalStats.recognizedCount).toBe(1);
  });

  it('逾期成果不计入历史节点', () => {
    const mNode = makeNode('n-mid', '2027-06-30');
    const fNode = makeNode('n-final', '2028-12-31');
    const achievs = [makeAchievement({ id: 'a-late', indicatorId: 'ind-mid', topicId: 't1', unitId: 'u1', achievementType: '发明专利', recognizedCompletionDate: '2027-08-01' })];
    const midInd = makeIndicator('ind-mid', 2, 'n-mid', 'u1', 't1', '发明专利');
    const finalInd = makeIndicator('ind-final', 5, 'n-final', 'u1', 't1', '发明专利');

    const midStats = calculateCompletionStats(midInd, achievs, [mNode, fNode]);
    const finalStats = calculateCompletionStats(finalInd, achievs, [mNode, fNode]);

    expect(midStats.recognizedCount).toBe(0);
    expect(finalStats.recognizedCount).toBe(1);
  });

  it('缺少 recognizedCompletionDate 的成果不计入', () => {
    const achievs = makeAchievement({ recognizedCompletionDate: undefined });
    expect(isRecognized(achievs, '2027-12-31')).toBe(false);
  });
});

describe('进度等级判定', () => {
  it('已刊出 >= 已录用', () => {
    expect(isProgressMet('学术论文', '已刊出', '已录用')).toBe(true);
  });

  it('审稿中 < 已录用', () => {
    expect(isProgressMet('学术论文', '审稿中', '已录用')).toBe(false);
  });

  it('已授权 >= 已受理', () => {
    expect(isProgressMet('发明专利', '已授权', '已受理')).toBe(true);
  });
});

describe('佐证材料 OR 规则', () => {
  it('论文有录用通知即满足（OR规则）', () => {
    const ach = makeAchievement({ achievementType: '学术论文', materials: [makeMaterial({ materialType: '论文录用通知', status: '审核通过' })] });
    expect(validateEvidenceMaterials(ach).passed).toBe(true);
  });

  it('论文无任何材料不满足', () => {
    const ach = makeAchievement({ achievementType: '学术论文', materials: [] });
    expect(validateEvidenceMaterials(ach).passed).toBe(false);
  });

  it('专利有授权证明即满足（OR规则）', () => {
    const ach = makeAchievement({ achievementType: '发明专利', materials: [makeMaterial({ materialType: '发明专利授权证明文件', status: '审核通过' })] });
    expect(validateEvidenceMaterials(ach).passed).toBe(true);
  });

  it('材料未审核通过不满足', () => {
    const ach = makeAchievement({ achievementType: '学术论文', materials: [makeMaterial({ materialType: '论文录用通知', status: '待审核' })] });
    expect(validateEvidenceMaterials(ach).passed).toBe(false);
  });
});

describe('重复成果检测', () => {
  it('DOI 重复', () => {
    const existing = [makeAchievement({ id: 'a-dup', achievementType: '学术论文', doi: '10.1234/test', title: 'Test Paper' })];
    const current = makeAchievement({ id: 'a-new', achievementType: '学术论文', doi: '10.1234/test', title: 'New' });
    expect(checkDuplicateAchievement(current, existing).isDuplicate).toBe(true);
  });

  it('申请号重复', () => {
    const existing = [makeAchievement({ id: 'a-dup', achievementType: '发明专利', applicationNumber: 'CN123' })];
    const current = makeAchievement({ id: 'a-new', achievementType: '发明专利', applicationNumber: 'CN123' });
    expect(checkDuplicateAchievement(current, existing).isDuplicate).toBe(true);
  });
});

describe('国内期刊比例', () => {
  it('20篇代表性论文中2篇国内期刊，最低20%应缺2篇', () => {
    const config: DomesticJournalConfig = { id: 'cj', projectId: 'p1', enabled: true, statisticsScope: '代表性论文', assessmentLevel: '项目总体', minRatio: 20, minCount: 4, topicMinCounts: {} };
    const achievements = Array.from({ length: 20 }, (_, i) =>
      makeAchievement({ id: `a-${i}`, achievementType: '学术论文', isRepresentative: true, isChineseJournal: i < 2, doi: `10.${i}` })
    );
    const result = calculateDomesticJournalRatio(achievements, config);
    expect(result.total).toBe(20);
    expect(result.chinese).toBe(2);
    expect(result.gapCount).toBe(2);
    expect(result.ratio).toBe(10);
  });

  it('无代表性论文时比率为null', () => {
    const config: DomesticJournalConfig = { id: 'cj', projectId: 'p1', enabled: true, statisticsScope: '代表性论文', assessmentLevel: '项目总体', minRatio: 20, topicMinCounts: {} };
    const result = calculateDomesticJournalRatio([], config);
    expect(result.ratio).toBeNull();
  });
});

describe('预警生成', () => {
  it('generateWarnings 不崩溃', () => {
    const config: DomesticJournalConfig = { id: 'cj', projectId: 'p1', enabled: true, statisticsScope: '代表性论文', assessmentLevel: '项目总体', minRatio: 20, topicMinCounts: {} };
    const warnings = generateWarnings(
      [], [], [], config, makeWarningRules(), [], {}
    );
    expect(Array.isArray(warnings)).toBe(true);
  });
});
