import dayjs from 'dayjs';
import type {
  Achievement,
  AchievementType,
  AssessmentNode,
  ChineseJournalConfig,
  CompletionStats,
  IndicatorConfig,
  Material,
  Topic,
  WarningLevel,
  WarningResult,
  WarningRule,
} from '../types';

export const formatDate = (date: string) => dayjs(date).format('YYYY-MM-DD');

export const daysUntil = (date: string) => dayjs(date).diff(dayjs(), 'day');

export const levelLabel = (level: WarningLevel) => {
  switch (level) {
    case 'yellow':
      return '黄色预警';
    case 'orange':
      return '橙色预警';
    case 'red':
      return '红色预警';
    default:
      return '正常';
  }
};

export const levelColor = (level: WarningLevel) => {
  switch (level) {
    case 'yellow':
      return '#faad14';
    case 'orange':
      return '#fa8c16';
    case 'red':
      return '#f5222d';
    default:
      return '#52c41a';
  }
};

// 判断成果是否达到业务进度要求（简化：当前阶段已到达或超过认定状态对应的阶段）
export const isProgressMet = (achievement: Achievement, indicator: IndicatorConfig): boolean => {
  // 认定状态为最终阶段时，stageOrder 应等于 totalStages
  // 简化规则：若 currentStage 包含 recognitionStatus 或 stageOrder 达到 totalStages 的 75% 以上
  return achievement.status === indicator.recognitionStatus || achievement.stageOrder / achievement.totalStages >= 0.75;
};

// 判断成果是否计入正式完成
export const isCompleted = (achievement: Achievement, indicator: IndicatorConfig): boolean => {
  const materialsComplete = achievement.materials.length > 0 && achievement.materials.every((m) => m.status !== '未提交');
  const materialsApproved = achievement.materials.some((m) => m.status === '审核通过');
  return (
    isProgressMet(achievement, indicator) &&
    materialsComplete &&
    materialsApproved &&
    achievement.officeRecognized &&
    !achievement.isDuplicate
  );
};

// 统计某个指标下的完成情况
export const calculateCompletionStats = (
  indicator: IndicatorConfig,
  achievements: Achievement[]
): CompletionStats => {
  const relevant = achievements.filter(
    (a) => a.topicId === indicator.topicId && a.achievementType === indicator.achievementType
  );
  const registeredCount = relevant.length;
  const progressMetCount = relevant.filter((a) => isProgressMet(a, indicator)).length;
  const materialsSubmittedCount = relevant.filter((a) =>
    a.materials.length > 0 && a.materials.every((m) => m.status !== '未提交')
  ).length;
  const materialsApprovedCount = relevant.filter((a) =>
    a.materials.some((m) => m.status === '审核通过')
  ).length;
  const recognizedCount = relevant.filter((a) => isCompleted(a, indicator)).length;
  const missingCount = Math.max(0, indicator.plannedQuantity - recognizedCount);
  const completionRate = indicator.plannedQuantity > 0 ? recognizedCount / indicator.plannedQuantity : 0;

  return {
    topicId: indicator.topicId,
    achievementType: indicator.achievementType,
    node: indicator.node,
    plannedQuantity: indicator.plannedQuantity,
    registeredCount,
    progressMetCount,
    materialsSubmittedCount,
    materialsApprovedCount,
    recognizedCount,
    missingCount,
    completionRate,
  };
};

// 计算项目级别的中国科技期刊论文占比
export const calculateChineseJournalRatio = (
  achievements: Achievement[],
  config: ChineseJournalConfig
) => {
  const representative = achievements.filter((a) => a.achievementType === '论文' && a.officeRecognized && !a.isDuplicate);
  const total = representative.length;
  const chinese = representative.filter((a) => a.isChineseJournal).length;
  const ratio = total > 0 ? (chinese / total) * 100 : 0;
  const projectedTotal = config.totalRepresentativePapers;
  const projectedChinese = chinese;
  const projectedRatio = projectedTotal > 0 ? (projectedChinese / projectedTotal) * 100 : 0;
  const minRequiredCount = config.assessAtProjectLevel
    ? config.minChineseJournalCount
    : 0;
  const gapCount = Math.max(0, minRequiredCount - chinese);
  const ratioGap = Math.max(0, config.minChineseJournalRatio - ratio);

  return {
    total,
    chinese,
    ratio: Number(ratio.toFixed(2)),
    projectedTotal,
    projectedChinese,
    projectedRatio: Number(projectedRatio.toFixed(2)),
    minRequiredCount,
    minRequiredRatio: config.minChineseJournalRatio,
    gapCount,
    ratioGap: Number(ratioGap.toFixed(2)),
  };
};

// 计算指定课题的中国科技期刊论文数量
export const calculateTopicChineseJournalCount = (
  topicId: string,
  achievements: Achievement[]
) => {
  return achievements.filter(
    (a) =>
      a.topicId === topicId &&
      a.achievementType === '论文' &&
      a.isChineseJournal &&
      a.officeRecognized &&
      !a.isDuplicate
  ).length;
};

// 查找最近节点
export const findNearestNode = (
  indicators: IndicatorConfig[],
  topicId: string,
  achievementType: AchievementType
): { node: AssessmentNode; deadline: string; daysRemaining: number } | null => {
  const relevant = indicators.filter(
    (i) => i.topicId === topicId && i.achievementType === achievementType && i.enabled
  );
  if (relevant.length === 0) return null;

  const future = relevant
    .map((i) => ({ node: i.node, deadline: i.deadline, daysRemaining: daysUntil(i.deadline) }))
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  return future[0];
};

// 生成预警
export const generateWarnings = (
  indicators: IndicatorConfig[],
  achievements: Achievement[],
  chineseConfig: ChineseJournalConfig,
  warningRules: WarningRule[],
  topics: Topic[]
): WarningResult[] => {
  const results: WarningResult[] = [];
  const timeRule = warningRules.find((r) => r.type === 'time');
  const qtyRule = warningRules.find((r) => r.type === 'quantity_gap');
  const progressRule = warningRules.find((r) => r.type === 'progress_insufficient');
  const materialRule = warningRules.find((r) => r.type === 'material');
  const cjRule = warningRules.find((r) => r.type === 'chinese_journal_ratio');
  const undecomposedRule = warningRules.find((r) => r.type === 'undecomposed');

  indicators
    .filter((i) => i.enabled && (i.status === '已发布' || i.status === '已调整'))
    .forEach((indicator) => {
      const stats = calculateCompletionStats(indicator, achievements);
      const days = daysUntil(indicator.deadline);
      const topic = topics.find((t) => t.id === indicator.topicId);

      // 时间预警
      if (timeRule?.enabled) {
        if (days < 0) {
          results.push({
            id: `w-time-red-${indicator.id}`,
            type: 'time',
            level: 'red',
            title: '时间预警',
            message: `${topic?.name} ${indicator.achievementType} ${indicator.node} 已逾期 ${Math.abs(days)} 天`,
            topicId: indicator.topicId,
            achievementType: indicator.achievementType,
            node: indicator.node,
            deadline: indicator.deadline,
            daysRemaining: days,
          });
        } else if (days <= (timeRule.redThreshold as number)) {
          results.push({
            id: `w-time-red2-${indicator.id}`,
            type: 'time',
            level: 'red',
            title: '时间预警',
            message: `${topic?.name} ${indicator.achievementType} ${indicator.node} 剩余 ${days} 天`,
            topicId: indicator.topicId,
            achievementType: indicator.achievementType,
            node: indicator.node,
            deadline: indicator.deadline,
            daysRemaining: days,
          });
        } else if (days <= (timeRule.orangeThreshold as number)) {
          results.push({
            id: `w-time-orange-${indicator.id}`,
            type: 'time',
            level: 'orange',
            title: '时间预警',
            message: `${topic?.name} ${indicator.achievementType} ${indicator.node} 剩余 ${days} 天`,
            topicId: indicator.topicId,
            achievementType: indicator.achievementType,
            node: indicator.node,
            deadline: indicator.deadline,
            daysRemaining: days,
          });
        } else if (days <= (timeRule.yellowThreshold as number)) {
          results.push({
            id: `w-time-yellow-${indicator.id}`,
            type: 'time',
            level: 'yellow',
            title: '时间预警',
            message: `${topic?.name} ${indicator.achievementType} ${indicator.node} 剩余 ${days} 天`,
            topicId: indicator.topicId,
            achievementType: indicator.achievementType,
            node: indicator.node,
            deadline: indicator.deadline,
            daysRemaining: days,
          });
        }
      }

      // 数量缺口预警
      if (qtyRule?.enabled && stats.missingCount > 0) {
        const rate = stats.completionRate * 100;
        let level: WarningLevel = 'yellow';
        if (rate <= (qtyRule.redThreshold as number)) level = 'red';
        else if (rate <= (qtyRule.orangeThreshold as number)) level = 'orange';
        results.push({
          id: `w-qty-${indicator.id}`,
          type: 'quantity_gap',
          level,
          title: '数量缺口预警',
          message: `${topic?.name} ${indicator.achievementType} ${indicator.node} 计划 ${stats.plannedQuantity} 项，已认定 ${stats.recognizedCount} 项，缺口 ${stats.missingCount} 项`,
          topicId: indicator.topicId,
          achievementType: indicator.achievementType,
          node: indicator.node,
          gap: stats.missingCount,
          daysRemaining: days,
        });
      }

      // 进度不足预警：已登记数达到计划但认定数不足
      if (
        progressRule?.enabled &&
        stats.registeredCount >= stats.plannedQuantity &&
        stats.recognizedCount < stats.plannedQuantity
      ) {
        const progressRatio = stats.plannedQuantity > 0 ? stats.recognizedCount / stats.plannedQuantity : 0;
        const rate = progressRatio * 100;
        let level: WarningLevel = 'yellow';
        if (rate <= (progressRule.redThreshold as number)) level = 'red';
        else if (rate <= (progressRule.orangeThreshold as number)) level = 'orange';
        results.push({
          id: `w-progress-${indicator.id}`,
          type: 'progress_insufficient',
          level,
          title: '进度不足预警',
          message: `${topic?.name} ${indicator.achievementType} ${indicator.node} 已登记 ${stats.registeredCount} 项，但仅 ${stats.recognizedCount} 项达到考核要求`,
          topicId: indicator.topicId,
          achievementType: indicator.achievementType,
          node: indicator.node,
        });
      }

      // 佐证材料预警
      if (materialRule?.enabled) {
        const relevant = achievements.filter(
          (a) => a.topicId === indicator.topicId && a.achievementType === indicator.achievementType
        );
        relevant.forEach((a) => {
          a.materials.forEach((m) => {
            if (m.status === '未提交' && isProgressMet(a, indicator)) {
              results.push({
                id: `w-material-missing-${a.id}-${m.id}`,
                type: 'material',
                level: 'orange',
                title: '佐证材料预警',
                message: `${topic?.name} ${a.title} 已达到认定状态但未提交 ${m.name}`,
                topicId: indicator.topicId,
                achievementType: indicator.achievementType,
              });
            } else if (m.status === '被退回') {
              results.push({
                id: `w-material-return-${a.id}-${m.id}`,
                type: 'material',
                level: 'red',
                title: '佐证材料预警',
                message: `${topic?.name} ${a.title} 的 ${m.name} 被退回`,
                topicId: indicator.topicId,
                achievementType: indicator.achievementType,
              });
            } else if (m.status === '审核中') {
              const pendingDays = m.submittedAt ? dayjs().diff(dayjs(m.submittedAt), 'day') : 0;
              if (pendingDays >= (materialRule.yellowThreshold as number)) {
                results.push({
                  id: `w-material-pending-${a.id}-${m.id}`,
                  type: 'material',
                  level: pendingDays >= (materialRule.redThreshold as number) ? 'red' : pendingDays >= (materialRule.orangeThreshold as number) ? 'orange' : 'yellow',
                  title: '佐证材料预警',
                  message: `${topic?.name} ${a.title} 的 ${m.name} 审核中已 ${pendingDays} 天`,
                  topicId: indicator.topicId,
                  achievementType: indicator.achievementType,
                });
              }
            }
          });
        });
      }
    });

  // 中国科技期刊比例预警
  if (cjRule?.enabled) {
    const ratioData = calculateChineseJournalRatio(achievements, chineseConfig);
    if (ratioData.ratio < chineseConfig.minChineseJournalRatio) {
      const gap = Number((chineseConfig.minChineseJournalRatio - ratioData.ratio).toFixed(2));
      let level: WarningLevel = 'yellow';
      if (gap >= (cjRule.redThreshold as number)) level = 'red';
      else if (gap >= (cjRule.orangeThreshold as number)) level = 'orange';
      results.push({
        id: 'w-cj-ratio',
        type: 'chinese_journal_ratio',
        level,
        title: '我国科技期刊比例预警',
        message: `当前我国科技期刊论文占比 ${ratioData.ratio}%，低于目标 ${chineseConfig.minChineseJournalRatio}%，缺口约 ${ratioData.gapCount} 篇`,
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

  // 未分解指标预警：检查是否有项目级指标未分解到课题
  if (undecomposedRule?.enabled) {
    indicators
      .filter((i) => i.enabled && i.topicId === '')
      .forEach((i) => {
        results.push({
          id: `w-undecomposed-${i.id}`,
          type: 'undecomposed',
          level: 'red',
          title: '未分解指标预警',
          message: `指标 ${i.achievementType} ${i.node} 尚未分解到课题`,
          achievementType: i.achievementType,
          node: i.node,
        });
      });
  }

  return results;
};

export const statusOptions = ['草稿', '已发布', '已调整', '已停用'];
export const stageOptions = ['交底书编制', '申请中', '审稿中', '已录用', '已受理', '已取得证书', '已发表', '已授权'];
export const materialStatusOptions: Material['status'][] = ['未提交', '已提交', '审核中', '审核通过', '被退回'];


