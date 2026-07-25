import type {
  Achievement,
  AchievementType,
  ChineseJournalConfig,
  CompletionStats,
  IndicatorConfig,
  TimeNode,
  Topic,
} from '../types';
import { daysUntil } from './helpers';

export const isRecognized = (a: Achievement) => a.status === '审批通过' && a.countsToIndicator;

export const isUnderReview = (a: Achievement) => a.status === '已提交' || a.status === '审批中';

export const isRegistered = (a: Achievement) => ['已提交', '审批中', '审批通过', '审批不通过', '退回修改'].includes(a.status);

export const calculateCompletionStats = (
  indicator: IndicatorConfig,
  achievements: Achievement[],
  nodes: TimeNode[]
): CompletionStats => {
  const relevant = achievements.filter(
    (a) =>
      a.topicId === indicator.topicId &&
      a.unitName === indicator.unitName &&
      a.achievementType === indicator.achievementType
  );

  const registeredCount = relevant.filter((a) => isRegistered(a)).length;
  const recognizedCount = relevant.filter((a) => isRecognized(a)).length;
  const missingCount = Math.max(0, indicator.plannedQuantity - recognizedCount);
  const completionRate = indicator.plannedQuantity > 0 ? recognizedCount / indicator.plannedQuantity : 0;

  const node = nodes.find((n) => n.id === indicator.nodeId);

  return {
    viewKey: `${indicator.topicId}-${indicator.unitName}-${indicator.achievementType}-${indicator.nodeId}`,
    topicId: indicator.topicId,
    unitName: indicator.unitName,
    achievementType: indicator.achievementType,
    nodeId: indicator.nodeId,
    nodeName: node?.name || indicator.nodeId,
    deadline: node?.deadline || '',
    plannedQuantity: indicator.plannedQuantity,
    registeredCount,
    recognizedCount,
    missingCount,
    completionRate,
  };
};

export interface ChineseJournalRatioResult {
  total: number;
  chinese: number;
  ratio: number | null;
  projectedTotal: number;
  projectedChinese: number;
  projectedRatio: number | null;
  minRequiredCount: number;
  minRequiredRatio: number;
  gapCount: number;
  ratioGap: number | null;
}

export const calculateChineseJournalRatio = (
  achievements: Achievement[],
  config: ChineseJournalConfig
): ChineseJournalRatioResult => {
  const representative = achievements.filter(
    (a) => a.achievementType === '学术论文' && a.isRepresentative && isRecognized(a) && !isDuplicate(a)
  );
  const total = representative.length;
  const chinese = representative.filter((a) => a.isChineseJournal).length;
  const ratio = total > 0 ? (chinese / total) * 100 : null;

  const projectedRepresentative = achievements.filter(
    (a) =>
      a.achievementType === '学术论文' &&
      a.isRepresentative &&
      (isRecognized(a) || isUnderReview(a)) &&
      !isDuplicate(a)
  );
  const projectedTotal = projectedRepresentative.length;
  const projectedChinese = projectedRepresentative.filter((a) => a.isChineseJournal).length;
  const projectedRatio = projectedTotal > 0 ? (projectedChinese / projectedTotal) * 100 : null;

  const minRequiredCount = config.minChineseJournalCount;
  const gapCount = ratio !== null ? Math.max(0, minRequiredCount - chinese) : Math.max(0, minRequiredCount);
  const ratioGap = ratio !== null ? Math.max(0, config.minChineseJournalRatio - ratio) : null;

  return {
    total,
    chinese,
    ratio: ratio !== null ? Number(ratio.toFixed(2)) : null,
    projectedTotal,
    projectedChinese,
    projectedRatio: projectedRatio !== null ? Number(projectedRatio.toFixed(2)) : null,
    minRequiredCount,
    minRequiredRatio: config.minChineseJournalRatio,
    gapCount,
    ratioGap: ratioGap !== null ? Number(ratioGap.toFixed(2)) : null,
  };
};

export const calculateTopicChineseJournalCount = (
  topicId: string,
  achievements: Achievement[]
) => {
  return achievements.filter(
    (a) =>
      a.topicId === topicId &&
      a.achievementType === '学术论文' &&
      a.isRepresentative &&
      a.isChineseJournal &&
      isRecognized(a) &&
      !isDuplicate(a)
  ).length;
};

export const isDuplicate = (_a: Achievement) => {
  // Mock data does not include explicit duplicate flag in V2; use false by default.
  return false;
};

export const aggregateStats = (
  indicators: IndicatorConfig[],
  achievements: Achievement[],
  nodes: TimeNode[],
  groupBy: 'project' | 'topic' | 'unit' | 'node',
  topics: Topic[]
) => {
  const stats = indicators
    .filter((i) => i.enabled && (i.status === '已发布' || i.status === '已调整'))
    .map((i) => calculateCompletionStats(i, achievements, nodes));

  const grouped = new Map<string, CompletionStats>();

  stats.forEach((s) => {
    const topic = topics.find((t) => t.id === s.topicId);
    let key = '';
    let viewKey = '';
    switch (groupBy) {
      case 'project':
        key = `${s.achievementType}-${s.nodeId}`;
        viewKey = 'project';
        break;
      case 'topic':
        key = `${s.topicId}-${s.achievementType}-${s.nodeId}`;
        viewKey = `${topic?.name || s.topicId}`;
        break;
      case 'unit':
        key = `${s.topicId}-${s.unitName}-${s.achievementType}-${s.nodeId}`;
        viewKey = `${topic?.name || s.topicId} - ${s.unitName}`;
        break;
      case 'node':
        key = `${s.nodeId}-${s.achievementType}`;
        viewKey = s.nodeName;
        break;
    }

    if (!grouped.has(key)) {
      grouped.set(key, {
        viewKey,
        topicId: groupBy === 'topic' || groupBy === 'unit' ? s.topicId : undefined,
        unitName: groupBy === 'unit' ? s.unitName : undefined,
        achievementType: s.achievementType,
        nodeId: s.nodeId,
        nodeName: s.nodeName,
        deadline: s.deadline,
        plannedQuantity: 0,
        registeredCount: 0,
        recognizedCount: 0,
        missingCount: 0,
        completionRate: 0,
      });
    }

    const existing = grouped.get(key)!;
    existing.plannedQuantity += s.plannedQuantity;
    existing.registeredCount += s.registeredCount;
    existing.recognizedCount += s.recognizedCount;
    existing.missingCount += s.missingCount;
  });

  const result = Array.from(grouped.values());
  result.forEach((r) => {
    r.completionRate = r.plannedQuantity > 0 ? r.recognizedCount / r.plannedQuantity : 0;
  });

  return result;
};

export const findNearestNode = (
  indicators: IndicatorConfig[],
  achievements: Achievement[],
  nodes: TimeNode[],
  topicId?: string,
  unitName?: string,
  achievementType?: AchievementType
): { nodeId: string; nodeName: string; deadline: string; daysRemaining: number } | null => {
  const relevant = indicators.filter(
    (i) =>
      i.enabled &&
      (i.status === '已发布' || i.status === '已调整') &&
      (!topicId || i.topicId === topicId) &&
      (!unitName || i.unitName === unitName) &&
      (!achievementType || i.achievementType === achievementType)
  );

  if (relevant.length === 0) return null;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const future = relevant
    .map((i) => {
      const node = nodeMap.get(i.nodeId);
      if (!node) return null;
      const recognized = achievements.filter(
        (a) =>
          a.topicId === i.topicId &&
          a.unitName === i.unitName &&
          a.achievementType === i.achievementType &&
          isRecognized(a)
      ).length;
      return {
        nodeId: i.nodeId,
        nodeName: node.name,
        deadline: node.deadline,
        daysRemaining: daysUntil(node.deadline),
        hasGap: recognized < i.plannedQuantity,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.daysRemaining - b!.daysRemaining);

  return future[0] || null;
};
