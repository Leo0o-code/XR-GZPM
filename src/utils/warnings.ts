import type {
  Achievement,
  AchievementType,
  ChineseJournalConfig,
  IndicatorConfig,
  TimeNode,
  Topic,
  WarningLevel,
  WarningResult,
  WarningRule,
} from '../types';
import { daysUntil } from './helpers';
import { calculateChineseJournalRatio, calculateCompletionStats, calculateTopicChineseJournalCount, isRecognized, isUnderReview } from './stats';

export const generateWarnings = (
  indicators: IndicatorConfig[],
  achievements: Achievement[],
  nodes: TimeNode[],
  chineseConfig: ChineseJournalConfig,
  warningRules: WarningRule[],
  topics: Topic[]
): WarningResult[] => {
  const results: WarningResult[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const timeRule = warningRules.find((r) => r.type === 'time' && r.enabled);
  const qtyRule = warningRules.find((r) => r.type === 'quantity_gap' && r.enabled);
  const cjRule = warningRules.find((r) => r.type === 'chinese_journal_ratio' && r.enabled);

  indicators
    .filter((i) => i.enabled && (i.status === '已发布' || i.status === '已调整'))
    .forEach((indicator) => {
      const node = nodeMap.get(indicator.nodeId);
      if (!node || !node.enabled) return;

      const stats = calculateCompletionStats(indicator, achievements, nodes);
      const days = daysUntil(node.deadline);
      const topic = topics.find((t) => t.id === indicator.topicId);
      const hasGap = stats.recognizedCount < indicator.plannedQuantity;
      const rate = stats.completionRate * 100;

      // 时间预警：仅当已认定数 < 计划数且进入预警时间区间
      if (timeRule?.enabled && hasGap && node.participatesInWarning) {
        let level: WarningLevel | null = null;
        if (days < 0) {
          level = 'red';
        } else if (days <= timeRule.levels.find((l) => l.level === 'red')!.advanceDays) {
          level = 'red';
        } else if (days <= timeRule.levels.find((l) => l.level === 'orange')!.advanceDays) {
          level = 'orange';
        } else if (days <= timeRule.levels.find((l) => l.level === 'yellow')!.advanceDays) {
          level = 'yellow';
        }

        if (level) {
          results.push({
            id: `w-time-${indicator.id}`,
            type: 'time',
            level,
            title: '时间预警',
            message: `${topic?.name || indicator.topicId} ${indicator.unitName} ${indicator.achievementType} ${node.name} 剩余 ${days} 天，已认定 ${stats.recognizedCount}/${indicator.plannedQuantity}`,
            topicId: indicator.topicId,
            unitName: indicator.unitName,
            achievementType: indicator.achievementType,
            nodeId: indicator.nodeId,
            deadline: node.deadline,
            daysRemaining: days,
            gap: stats.missingCount,
          });
        }
      }

      // 数量缺口预警
      if (qtyRule?.enabled && hasGap) {
        let level: WarningLevel = 'yellow';
        if (rate <= qtyRule.levels.find((l) => l.level === 'red')!.completionRateThreshold) {
          level = 'red';
        } else if (rate <= qtyRule.levels.find((l) => l.level === 'orange')!.completionRateThreshold) {
          level = 'orange';
        }
        results.push({
          id: `w-qty-${indicator.id}`,
          type: 'quantity_gap',
          level,
          title: '数量缺口预警',
          message: `${topic?.name || indicator.topicId} ${indicator.unitName} ${indicator.achievementType} ${node.name} 计划 ${indicator.plannedQuantity}，已认定 ${stats.recognizedCount}，缺口 ${stats.missingCount}`,
          topicId: indicator.topicId,
          unitName: indicator.unitName,
          achievementType: indicator.achievementType,
          nodeId: indicator.nodeId,
          deadline: node.deadline,
          daysRemaining: days,
          gap: stats.missingCount,
        });
      }
    });

  // 我国科技期刊比例预警
  if (cjRule?.enabled) {
    const ratioData = calculateChineseJournalRatio(achievements, chineseConfig);
    const currentBelow = ratioData.ratio !== null && ratioData.ratio < chineseConfig.minChineseJournalRatio;
    const projectedBelow = ratioData.projectedRatio !== null && ratioData.projectedRatio < chineseConfig.minChineseJournalRatio;

    if (currentBelow || projectedBelow || ratioData.gapCount > 0) {
      let level: WarningLevel = 'yellow';
      const gap = ratioData.ratioGap ?? ratioData.projectedRatio
        ? Math.max(0, chineseConfig.minChineseJournalRatio - (ratioData.projectedRatio || 0))
        : 0;
      if (gap >= cjRule.levels.find((l) => l.level === 'red')!.completionRateThreshold) {
        level = 'red';
      } else if (gap >= cjRule.levels.find((l) => l.level === 'orange')!.completionRateThreshold) {
        level = 'orange';
      }

      const ratioText = ratioData.ratio !== null ? `${ratioData.ratio}%` : '暂无数据';
      const projectedText = ratioData.projectedRatio !== null ? `${ratioData.projectedRatio}%` : '暂无数据';

      results.push({
        id: 'w-cj-ratio',
        type: 'chinese_journal_ratio',
        level,
        title: '我国科技期刊比例预警',
        message: `当前比例 ${ratioText}，预计比例 ${projectedText}，最低要求 ${chineseConfig.minChineseJournalRatio}%，缺口约 ${ratioData.gapCount} 篇`,
      });
    }

    if (chineseConfig.decomposeToTopics) {
      topics.forEach((topic) => {
        const required = chineseConfig.topicMinCounts[topic.id] || 0;
        const actual = calculateTopicChineseJournalCount(topic.id, achievements);
        if (actual < required) {
          results.push({
            id: `w-cj-topic-${topic.id}`,
            type: 'chinese_journal_ratio',
            level: 'yellow',
            title: '我国科技期刊比例预警',
            message: `${topic.name} 我国科技期刊论文最低要求 ${required} 篇，当前 ${actual} 篇，缺口 ${required - actual} 篇`,
            topicId: topic.id,
            gap: required - actual,
          });
        }
      });
    }
  }

  // 成果进度预警（简化规则：已登记数达到要求但已认定数未达到，且进入预警时间区间）
  indicators
    .filter((i) => i.enabled && (i.status === '已发布' || i.status === '已调整'))
    .forEach((indicator) => {
      const node = nodeMap.get(indicator.nodeId);
      if (!node || !node.enabled || !node.participatesInWarning) return;

      const registered = achievements.filter(
        (a) =>
          a.topicId === indicator.topicId &&
          a.unitName === indicator.unitName &&
          a.achievementType === indicator.achievementType &&
          isUnderReview(a)
      ).length;
      const recognized = achievements.filter(
        (a) =>
          a.topicId === indicator.topicId &&
          a.unitName === indicator.unitName &&
          a.achievementType === indicator.achievementType &&
          isRecognized(a)
      ).length;

      if (
        registered + recognized >= indicator.plannedQuantity &&
        recognized < indicator.plannedQuantity
      ) {
        const days = daysUntil(node.deadline);
        if (days <= 90) {
          const topic = topics.find((t) => t.id === indicator.topicId);
          results.push({
            id: `w-progress-${indicator.id}`,
            type: 'quantity_gap',
            level: days < 0 ? 'red' : days <= 30 ? 'orange' : 'yellow',
            title: '成果进度预警',
            message: `${topic?.name || indicator.topicId} ${indicator.unitName} ${indicator.achievementType} ${node.name} 已登记/审批中 ${registered} 项、已认定 ${recognized} 项，存在交付风险`,
            topicId: indicator.topicId,
            unitName: indicator.unitName,
            achievementType: indicator.achievementType,
            nodeId: indicator.nodeId,
            deadline: node.deadline,
            daysRemaining: days,
            gap: indicator.plannedQuantity - recognized,
          });
        }
      }
    });

  return results;
};

export const filterWarnings = (
  warnings: WarningResult[],
  filters: {
    level?: string;
    topicId?: string;
    unitName?: string;
    achievementType?: AchievementType;
    nodeId?: string;
    type?: string;
  }
) => {
  return warnings.filter((w) => {
    return (
      (!filters.level || w.level === filters.level) &&
      (!filters.topicId || w.topicId === filters.topicId) &&
      (!filters.unitName || w.unitName === filters.unitName) &&
      (!filters.achievementType || w.achievementType === filters.achievementType) &&
      (!filters.nodeId || w.nodeId === filters.nodeId) &&
      (!filters.type || w.type === filters.type)
    );
  });
};
