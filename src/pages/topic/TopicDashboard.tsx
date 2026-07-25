import { useState } from 'react';
import { Card, Table, Tag, Button, Modal, Descriptions, List, Space } from 'antd';
import { useAppStore } from '../../store';
import { ACHIEVEMENT_TYPES } from '../../types';
import type { AchievementType } from '../../types';
import {
  calculateCompletionStats,
  findNearestNode,
  generateWarnings,
  levelColor,
  levelLabel,
} from '../../utils/helpers';

export function TopicDashboard() {
  const { currentTopicId, topics, indicators, achievements, chineseJournalConfig, warningRules } = useAppStore();
  const [selectedType, setSelectedType] = useState<AchievementType | null>(null);

  const topic = topics.find((t) => t.id === currentTopicId);
  const topicName = topic?.name || '未选择课题';

  const publishedIndicators = indicators.filter(
    (i) => i.topicId === currentTopicId && (i.status === '已发布' || i.status === '已调整') && i.enabled
  );

  const topicWarnings = generateWarnings(
    indicators,
    achievements,
    chineseJournalConfig,
    warningRules,
    topics
  ).filter((w) => !w.topicId || w.topicId === currentTopicId);

  const data = ACHIEVEMENT_TYPES.map((type) => {
    const mid = publishedIndicators.find((i) => i.achievementType === type && i.node === '中期');
    const final = publishedIndicators.find((i) => i.achievementType === type && i.node === '结项');
    const midStats = mid ? calculateCompletionStats(mid, achievements) : null;
    const finalStats = final ? calculateCompletionStats(final, achievements) : null;
    const nearest = findNearestNode(publishedIndicators, currentTopicId!, type);

    const relevantWarnings = topicWarnings.filter(
      (w) => w.achievementType === type
    );
    const worstLevel = relevantWarnings.some((w) => w.level === 'red')
      ? 'red'
      : relevantWarnings.some((w) => w.level === 'orange')
      ? 'orange'
      : relevantWarnings.some((w) => w.level === 'yellow')
      ? 'yellow'
      : null;

    return {
      type,
      midRequired: mid?.plannedQuantity ?? 0,
      finalRequired: final?.plannedQuantity ?? 0,
      completed: midStats?.recognizedCount ?? 0,
      currentGap: `${midStats?.missingCount ?? 0}/${finalStats?.missingCount ?? 0}`,
      nearestNode: nearest?.node || '-',
      deadline: nearest?.deadline || '-',
      level: worstLevel,
    };
  });

  const columns = [
    { title: '成果类型', dataIndex: 'type', key: 'type' },
    { title: '中期要求', dataIndex: 'midRequired', key: 'midRequired' },
    { title: '结项要求', dataIndex: 'finalRequired', key: 'finalRequired' },
    { title: '已完成', dataIndex: 'completed', key: 'completed' },
    { title: '当前缺口（中/结）', dataIndex: 'currentGap', key: 'currentGap' },
    { title: '最近节点', dataIndex: 'nearestNode', key: 'nearestNode' },
    { title: '截止日期', dataIndex: 'deadline', key: 'deadline' },
    {
      title: '状态',
      dataIndex: 'level',
      key: 'level',
      render: (v: string | null) =>
        v ? (
          <Tag color={levelColor(v as any)}>{levelLabel(v as any)}</Tag>
        ) : (
          <Tag color="success">正常</Tag>
        ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button size="small" onClick={() => setSelectedType(record.type)}>下钻</Button>
      ),
    },
  ];

  const detailAchievements = achievements.filter(
    (a) => a.topicId === currentTopicId && (!selectedType || a.achievementType === selectedType)
  );

  return (
    <div>
      <Card title={`${topicName} 交付要求看板`} style={{ marginBottom: 16 }}>
        <Table rowKey="type" columns={columns} dataSource={data} pagination={false} />
      </Card>

      <Card title={`${topicName} 预警`} style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {topicWarnings.length === 0 && <Tag color="success">暂无预警</Tag>}
          {topicWarnings.map((w) => (
            <Card
              key={w.id}
              size="small"
              style={{ borderLeft: `4px solid ${levelColor(w.level)}` }}
            >
              <Space>
                <Tag color={levelColor(w.level)}>{levelLabel(w.level)}</Tag>
                <strong>{w.title}</strong>
                <span>{w.message}</span>
              </Space>
            </Card>
          ))}
        </Space>
      </Card>

      <Modal
        title={`${topicName} ${selectedType} 明细`}
        open={!!selectedType}
        onCancel={() => setSelectedType(null)}
        footer={null}
        width={900}
      >
        <List
          dataSource={detailAchievements}
          renderItem={(a) => (
            <List.Item>
              <Card size="small" style={{ width: '100%' }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="成果名称">{a.title}</Descriptions.Item>
                  <Descriptions.Item label="责任人">{a.responsiblePerson}</Descriptions.Item>
                  <Descriptions.Item label="当前阶段">{a.currentStage}</Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={a.officeRecognized ? 'success' : 'default'}>
                      {a.officeRecognized ? '已认定' : '未认定'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="是否中国科技期刊" span={2}>
                    {a.isChineseJournal ? '是' : '否'}
                  </Descriptions.Item>
                  <Descriptions.Item label="佐证材料" span={2}>
                    <Space>
                      {a.materials.map((m) => (
                        <Tag
                          key={m.id}
                          color={
                            m.status === '审核通过'
                              ? 'success'
                              : m.status === '被退回'
                              ? 'error'
                              : m.status === '审核中'
                              ? 'processing'
                              : m.status === '已提交'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {m.name}: {m.status}
                        </Tag>
                      ))}
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}




