import dayjs from 'dayjs';
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
import { calculateChineseJournalRatio, calculateCompletionStats, calculateTopicChineseJournalCount } from './stats';

const findRule = (rules: WarningRule[], type: string) => rules.find((r) => r.type === type && r.enabled);
const getLevelByCompletionRate = (rate: number, levels: WarningRule['levels']): WarningLevel | null => {
  const sorted = [...levels].sort((a, b) => b.completionRateThreshold - a.completionRateThreshold);
  for (const lvl of sorted) {
    if (rate <= lvl.completionRateThreshold) return lvl.level;
  }
  return null;
};
const getLevelByAdvanceDays = (days: number, levels: WarningRule['levels']): WarningLevel | null => {
  const sorted = [...levels].sort((a, b) => b.advanceDays - a.advanceDays);
  for (const lvl of sorted) {
    if (days <= lvl.advanceDays) return lvl.level;
  }
  return null;
};

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

  const timeRule = findRule(warningRules, 'time');
  const qtyRule = findRule(warningRules, 'quantity_gap');
  const progressRule = findRule(warningRules, 'progress');
  const materialRule = findRule(warningRules, 'material');
  const cjRule = findRule(warningRules, 'chinese_journal_ratio');
  const iaRule = findRule(warningRules, 'indicator_unassigned');

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

      // 时间预警
      if (timeRule && hasGap && node.participatesInWarning) {
        const level = days < 0 ? 'red' : getLevelByAdvanceDays(days, timeRule.levels);
        if (level) {
          results.push({
            id: `w-time-${indicator.id}`, type: 'time', level, title: '时间预警',
            message: `${topic?.name} ${indicator.unitName} ${indicator.achievementType} ${node.name} 剩余 ${days} 天，已认定 ${stats.recognizedCount}/${indicator.plannedQuantity}`,
            topicId: indicator.topicId, unitName: indicator.unitName, achievementType: indicator.achievementType,
            nodeId: indicator.nodeId, deadline: node.deadline, daysRemaining: days, gap: stats.missingCount,
          });
        }
      }

      // 数量缺口预警
      if (qtyRule && hasGap) {
        const level = getLevelByCompletionRate(rate, qtyRule.levels);
        if (level) {
          results.push({
            id: `w-qty-${indicator.id}`, type: 'quantity_gap', level, title: '数量缺口预警',
            message: `${topic?.name} ${indicator.unitName} ${indicator.achievementType} ${node.name} 计划 ${indicator.plannedQuantity}，已认定 ${stats.recognizedCount}，缺口 ${stats.missingCount}`,
            topicId: indicator.topicId, unitName: indicator.unitName, achievementType: indicator.achievementType,
            nodeId: indicator.nodeId, deadline: node.deadline, daysRemaining: days, gap: stats.missingCount,
          });
        }
      }

      // 成果进度预警
      if (progressRule && node.participatesInWarning) {
        const relevant = achievements.filter(
          (a) => a.topicId === indicator.topicId && a.unitName === indicator.unitName && a.achievementType === indicator.achievementType && a.indicatorId === indicator.id
        );
        const registered = relevant.filter((a) => ['已提交', '审批中', '审批通过', '审批不通过', '退回修改'].includes(a.status)).length;
        const recognized = relevant.filter((a) => a.status === '审批通过' && a.countsToIndicator).length;
        if (registered >= indicator.plannedQuantity && recognized < indicator.plannedQuantity) {
          const level = getLevelByAdvanceDays(days, progressRule.levels);
          if (level) {
            results.push({
              id: `w-progress-${indicator.id}`, type: 'progress', level, title: '成果进度预警',
              message: `${topic?.name} ${indicator.unitName} ${indicator.achievementType} ${node.name} 已登记 ${registered}、已认定 ${recognized}，存在交付风险`,
              topicId: indicator.topicId, unitName: indicator.unitName, achievementType: indicator.achievementType,
              nodeId: indicator.nodeId, deadline: node.deadline, daysRemaining: days, gap: indicator.plannedQuantity - recognized,
            });
          }
        }
      }

      // 佐证材料预警
      if (materialRule) {
        const relevant = achievements.filter(
          (a) => a.topicId === indicator.topicId && a.unitName === indicator.unitName && a.achievementType === indicator.achievementType && a.indicatorId === indicator.id
        );
        relevant.forEach((a) => {
          a.materials.forEach((m) => {
            if (m.status === '未提交') {
              results.push({
                id: `w-material-missing-${a.id}-${m.id}`, type: 'material', level: 'orange', title: '佐证材料预警',
                message: `${topic?.name} ${a.title} 缺少材料 ${m.name}`,
                topicId: indicator.topicId, unitName: indicator.unitName, achievementType: indicator.achievementType,
              });
            } else if (m.status === '退回修改') {
              results.push({
                id: `w-material-ret-${a.id}-${m.id}`, type: 'material', level: 'red', title: '佐证材料预警',
                message: `${topic?.name} ${a.title} 材料 ${m.name} 被退回`,
                topicId: indicator.topicId, unitName: indicator.unitName, achievementType: indicator.achievementType,
              });
            } else if (m.status === '待审核' && m.uploadedAt) {
              const pd = dayjs().diff(dayjs(m.uploadedAt), 'day');
              const level = getLevelByAdvanceDays(pd, materialRule.levels);
              if (level) {
                results.push({
                  id: `w-material-pending-${a.id}-${m.id}`, type: 'material', level, title: '佐证材料预警',
                  message: `${topic?.name} ${a.title} 材料 ${m.name} 待审核 ${pd} 天`,
                  topicId: indicator.topicId, unitName: indicator.unitName, achievementType: indicator.achievementType,
                });
              }
            }
          });
        });
      }
    });

  // 我国科技期刊比例预警
  if (cjRule && chineseConfig.enabled) {
    const ratioData = calculateChineseJournalRatio(achievements, chineseConfig);
    const ratioGap = ratioData.ratioGap ?? 0;
    const level = getLevelByCompletionRate(ratioGap, cjRule.levels);
    const ratioText = ratioData.ratio !== null ? `${ratioData.ratio}%` : '暂无数据';
    const projectedText = ratioData.projectedRatio !== null ? `${ratioData.projectedRatio}%` : '暂无数据';
    if (level || ratioData.gapCount > 0) {
      results.push({
        id: 'w-cj-ratio', type: 'chinese_journal_ratio', level: level || 'yellow', title: '我国科技期刊比例预警',
        message: `当前比例 ${ratioText}，预计比例 ${projectedText}，最低要求 ${chineseConfig.minChineseJournalRatio}%，缺口约 ${ratioData.gapCount} 篇`,
      });
    }
    if (chineseConfig.decomposeToTopics) {
      topics.forEach((topic) => {
        const required = chineseConfig.topicMinCounts[topic.id] || 0;
        const actual = calculateTopicChineseJournalCount(topic.id, achievements);
        if (actual < required) {
          results.push({
            id: `w-cj-topic-${topic.id}`, type: 'chinese_journal_ratio', level: 'yellow', title: '我国科技期刊比例预警',
            message: `${topic.name} 我国科技期刊论文最低要求 ${required} 篇，当前 ${actual} 篇，缺口 ${required - actual} 篇`,
            topicId: topic.id, gap: required - actual,
          });
        }
      });
    }
  }

  // 指标未分解预警
  if (iaRule) {
    indicators
      .filter((i) => i.enabled && i.plannedQuantity === 0)
      .forEach((i) => {
        const node = nodeMap.get(i.nodeId);
        results.push({
          id: `w-ia-${i.id}`, type: 'indicator_unassigned', level: 'red', title: '指标未分解预警',
          message: `${topics.find((t) => t.id === i.topicId)?.name} ${i.unitName} ${i.achievementType} ${node?.name} 指标为 0，尚未分解`,
          topicId: i.topicId, unitName: i.unitName, achievementType: i.achievementType, nodeId: i.nodeId,
        });
      });
  }

  return results;
};

export const filterWarnings = (
  warnings: WarningResult[],
  filters: { level?: string; topicId?: string; unitName?: string; achievementType?: AchievementType; nodeId?: string; type?: string }
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
