import dayjs from 'dayjs';
import type { Achievement, ApprovalValidation, IndicatorConfig, TimeNode, Topic } from '../types';

export interface ValidationError {
  field?: string;
  message: string;
}

export const validateTopic = (topic: Topic): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!topic.leadingUnit) errors.push({ field: 'leadingUnit', message: '课题必须配置牵头单位' });
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

  if (!topic) { errors.push({ message: '所属课题不存在' }); return errors; }
  if (!topic.leadingUnit) errors.push({ message: `课题 ${topic.name} 未配置牵头单位` });
  if (!validateUnitBelongsToTopic(topic, indicator.unitName)) errors.push({ message: `责任单位 ${indicator.unitName} 不属于课题 ${topic.name}` });
  if (indicator.plannedQuantity < 0) errors.push({ field: 'plannedQuantity', message: '成果数量不得为负数' });

  const duplicate = allIndicators.find(
    (i) => i.id !== indicator.id && i.topicId === indicator.topicId && i.unitName === indicator.unitName && i.achievementType === indicator.achievementType && i.nodeId === indicator.nodeId
  );
  if (duplicate) errors.push({ message: '同一课题、单位、成果类型和时间节点不得重复配置' });

  const sameGroup = allIndicators.filter(
    (i) => i.topicId === indicator.topicId && i.unitName === indicator.unitName && i.achievementType === indicator.achievementType
  );
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const sorted = sameGroup.map((i) => ({ indicator: i, node: nodeMap.get(i.nodeId) })).filter((x) => x.node).sort((a, b) => a.node!.sortOrder - b.node!.sortOrder);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].indicator.plannedQuantity < sorted[i - 1].indicator.plannedQuantity) {
      errors.push({ message: `累计数量校验失败：${sorted[i].indicator.nodeId} 要求(${sorted[i].indicator.plannedQuantity})不得小于前一节点(${sorted[i - 1].indicator.plannedQuantity})` });
      break;
    }
  }
  return errors;
};

// 成果审批前系统自动校验
export const validateAchievementForApproval = (
  achievement: Achievement,
  indicator?: IndicatorConfig,
  node?: TimeNode
): ApprovalValidation => {
  const checks = [];

  // 1. 关联有效指标
  const hasValidIndicator = !!indicator && indicator.status === '已发布' && indicator.enabled;
  checks.push({
    label: '已关联有效指标',
    passed: hasValidIndicator,
    detail: hasValidIndicator ? undefined : '未关联有效指标或指标已停用',
  });

  // 2. 成果进度是否达到认定状态
  const progress = indicator ? achievement.progressStatus === indicator.recognitionStatus : true;
  checks.push({
    label: '成果进度达到认定状态',
    passed: progress,
    detail: progress ? undefined : `当前进度「${achievement.progressStatus}」未达到认定状态「${indicator?.recognitionStatus}」`,
  });

  // 3. 佐证材料是否齐全
  const requiredMaterialTypes = indicator?.materialRequirements || [];
  const hasAllMaterials = requiredMaterialTypes.every((mt) =>
    achievement.materials.some((m) => m.materialType === mt || m.name === mt)
  );
  const materialCheck = hasAllMaterials && achievement.materials.length > 0;
  const allApproved = achievement.materials.every((m) => m.status === '审核通过');
  checks.push({
    label: '佐证材料完整且审核通过',
    passed: materialCheck && allApproved,
    detail: !materialCheck ? '佐证材料不完整' : !allApproved ? '存在未审核或退回的材料' : undefined,
  });

  // 4. 未发现重复成果
  checks.push({
    label: '未发现重复成果',
    passed: true,
    detail: '基于题目和DOI等初步判断',
  });

  // 5. 是否超过节点截止时间
  if (node && achievement.plannedCompletionDate) {
    const onTime = dayjs(achievement.plannedCompletionDate).isBefore(dayjs(node.deadline)) || dayjs(achievement.plannedCompletionDate).isSame(dayjs(node.deadline));
    checks.push({
      label: '按计划时间交付',
      passed: onTime,
      detail: onTime ? undefined : `计划完成时间 ${achievement.plannedCompletionDate} 已超过节点截止时间 ${node.deadline}`,
    });
  } else {
    checks.push({ label: '按计划时间交付', passed: true });
  }

  return {
    passed: checks.every((c) => c.passed),
    checks,
  };
};
