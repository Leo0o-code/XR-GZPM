import { Card, Progress, Select, Space, Table, Tag } from 'antd';
import { useState } from 'react';
import { useAppStore } from '../../store';
import { calculateCompletionStats, generateWarnings, levelColor, levelLabel } from '../../utils/helpers';

const { Option } = Select;

export function Monitoring() {
  const { indicators, achievements, topics, chineseJournalConfig, warningRules } = useAppStore();
  const [filterTopic, setFilterTopic] = useState<string>('');

  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t.name]));
  const publishedIndicators = indicators.filter(
    (i) => (i.status === '已发布' || i.status === '已调整') && i.enabled && (!filterTopic || i.topicId === filterTopic)
  );

  const stats = publishedIndicators.map((i) => ({
    ...calculateCompletionStats(i, achievements),
    topicName: topicMap[i.topicId],
  }));

  const warnings = generateWarnings(
    indicators,
    achievements,
    chineseJournalConfig,
    warningRules,
    topics
  );

  const columns = [
    { title: '课题', dataIndex: 'topicName', key: 'topic' },
    { title: '成果类型', dataIndex: 'achievementType', key: 'type' },
    { title: '节点', dataIndex: 'node', key: 'node' },
    { title: '计划数量', dataIndex: 'plannedQuantity', key: 'planned' },
    { title: '已登记', dataIndex: 'registeredCount', key: 'registered' },
    { title: '进度达标', dataIndex: 'progressMetCount', key: 'progress' },
    { title: '材料已提交', dataIndex: 'materialsSubmittedCount', key: 'materials' },
    { title: '材料通过', dataIndex: 'materialsApprovedCount', key: 'approved' },
    { title: '已认定', dataIndex: 'recognizedCount', key: 'recognized' },
    { title: '尚缺', dataIndex: 'missingCount', key: 'missing' },
    {
      title: '完成率',
      dataIndex: 'completionRate',
      key: 'rate',
      render: (v: number) => <Progress percent={Math.round(v * 100)} size="small" />,
    },
  ];

  return (
    <div>
      <Card title="指标完成监控" style={{ marginBottom: 16 }}>
        <Select
          placeholder="筛选课题"
          allowClear
          style={{ width: 180, marginBottom: 16 }}
          value={filterTopic || undefined}
          onChange={(v) => setFilterTopic(v || '')}
        >
          {topics.map((t) => (
            <Option key={t.id} value={t.id}>{t.name}</Option>
          ))}
        </Select>
        <Table rowKey={(r) => `${r.topicId}-${r.achievementType}-${r.node}`} columns={columns} dataSource={stats} pagination={{ pageSize: 10 }} />
      </Card>

      <Card title={`预警中心 (${warnings.length})`}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {warnings.length === 0 && <Tag color="success">暂无预警</Tag>}
          {warnings.map((w) => (
            <Card
              key={w.id}
              size="small"
              style={{ borderLeft: `4px solid ${levelColor(w.level)}` }}
            >
              <Space>
                <Tag color={levelColor(w.level)}>{levelLabel(w.level)}</Tag>
                <strong>{w.title}</strong>
                <span>{w.message}</span>
                {w.deadline && <span>截止：{w.deadline}</span>}
                {w.daysRemaining !== undefined && (
                  <span>{w.daysRemaining < 0 ? `逾期 ${-w.daysRemaining} 天` : `剩余 ${w.daysRemaining} 天`}</span>
                )}
              </Space>
            </Card>
          ))}
        </Space>
      </Card>
    </div>
  );
}




