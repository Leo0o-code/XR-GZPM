import type { IndicatorConfig, TimeNode, Topic } from '../types';

export interface ValidationError {
  field?: string;
  message: string;
}

export const validateTopic = (topic: Topic): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!topic.leadingUnit) {
    errors.push({ field: 'leadingUnit', message: '课题必须配置牵头单位' });
  }
  return errors;
};

export const validateUnitBelongsToTopic = (topic: Topic, unitName: string): boolean => {
  return topic.leadingUnit === unitName || topic.participatingUnits.includes(unitName);
};

export const validateIndicator = (
  indicator: IndicatorConfig,
  allIndicators: IndicatorConfig[],
  nodes: TimeNode[],
  topics: Topic[]
): ValidationError[] => {
  const errors: ValidationError[] = [];
  const topic = topics.find((t) => t.id === indicator.topicId);

  if (!topic) {
    errors.push({ message: '所属课题不存在' });
    return errors;
  }

  if (!topic.leadingUnit) {
    errors.push({ message: `课题 ${topic.name} 未配置牵头单位` });
  }

  if (!validateUnitBelongsToTopic(topic, indicator.unitName)) {
    errors.push({ message: `责任单位 ${indicator.unitName} 不属于课题 ${topic.name}` });
  }

  if (indicator.plannedQuantity < 0) {
    errors.push({ field: 'plannedQuantity', message: '成果数量不得为负数' });
  }

  const duplicate = allIndicators.find(
    (i) =>
      i.id !== indicator.id &&
      i.topicId === indicator.topicId &&
      i.unitName === indicator.unitName &&
      i.achievementType === indicator.achievementType &&
      i.nodeId === indicator.nodeId
  );
  if (duplicate) {
    errors.push({ message: '同一课题、单位、成果类型和时间节点不得重复配置' });
  }

  // 累计数量校验：后一节点 >= 前一节点
  const sameGroup = allIndicators.filter(
    (i) =>
      i.topicId === indicator.topicId &&
      i.unitName === indicator.unitName &&
      i.achievementType === indicator.achievementType
  );

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const sorted = sameGroup
    .map((i) => ({ indicator: i, node: nodeMap.get(i.nodeId) }))
    .filter((x) => x.node)
    .sort((a, b) => a.node!.sortOrder - b.node!.sortOrder);

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].indicator;
    const curr = sorted[i].indicator;
    if (curr.plannedQuantity < prev.plannedQuantity) {
      errors.push({
        message: `累计数量校验失败：${curr.nodeId} 的累计要求（${curr.plannedQuantity}）不得小于前一节点 ${prev.nodeId}（${prev.plannedQuantity}）`,
      });
      break;
    }
  }

  return errors;
};

export const validateIndicatorSums = (
  indicators: IndicatorConfig[],
  topics: Topic[]
): { type: 'error' | 'warning'; message: string }[] => {
  const messages: { type: 'error' | 'warning'; message: string }[] = [];

  topics.forEach((topic) => {
    const topicIndicators = indicators.filter((i) => i.topicId === topic.id && i.enabled);
    const typeNodeMap = new Map<string, { planned: number; recognized?: number }>();

    topicIndicators.forEach((i) => {
      const key = `${i.achievementType}-${i.nodeId}`;
      const existing = typeNodeMap.get(key) || { planned: 0 };
      typeNodeMap.set(key, { planned: existing.planned + i.plannedQuantity });
    });
  });

  return messages;
};

export const validateChineseJournalCount = (
  minCount: number,
  totalPapers: number
): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (minCount > totalPapers) {
    errors.push({
      message: `我国科技期刊最低数量（${minCount}）不得高于论文总数量（${totalPapers}）`,
    });
  }
  return errors;
};
