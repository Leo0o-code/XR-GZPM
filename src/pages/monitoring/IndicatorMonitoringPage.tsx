import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Progress,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store';
import { ACHIEVEMENT_TYPES, WARNING_TYPES, type AchievementType, type CompletionStats } from '../../types';
import { aggregateStats, calculateDomesticJournalRatio } from '../../utils/stats';
import { generateWarnings, filterWarnings } from '../../utils/warnings';
import { exportToExcel } from '../../utils/export';
import { daysUntil, levelColor, levelLabel } from '../../utils/helpers';

const { Title } = Typography;
const { Option } = Select;

type ViewType = 'project' | 'topic' | 'unit' | 'node';

export function IndicatorMonitoringPage() {
  const {
    topics,
    units,
    nodes,
    indicators,
    achievements,
    domesticJournalConfig,
    warningRules,
  } = useAppStore();

  const [view, setView] = useState<ViewType>('project');
  const [filter, setFilter] = useState({
    topicId: '',
    achievementType: undefined as AchievementType | undefined,
    level: '',
    type: '',
  });

  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t]));
  const unitMap = Object.fromEntries(units.map((u) => [u.id, u.name]));

  const stats = useMemo(() => {
    const all = aggregateStats(indicators, achievements, nodes, view, topics);
    return all.filter((s) => {
      return (
        (!filter.topicId || s.topicId === filter.topicId) &&
        (!filter.achievementType || s.achievementType === filter.achievementType)
      );
    });
  }, [indicators, achievements, nodes, view, topics, filter]);

  const warnings = useMemo(
    () => generateWarnings(indicators, achievements, nodes, domesticJournalConfig, warningRules, topics, unitMap),
    [indicators, achievements, nodes, domesticJournalConfig, warningRules, topics, unitMap]
  );

  const ratioData = calculateDomesticJournalRatio(achievements, domesticJournalConfig);

  const filteredWarnings = useMemo(
    () =>
      filterWarnings(warnings, {
        level: filter.level,
        topicId: filter.topicId,
        achievementType: filter.achievementType,
        type: filter.type,
      }),
    [warnings, filter]
  );

  const handleExport = () => {
    const rows = stats.map((s) => ({
      视角: s.viewKey,
      课题: s.topicId ? topicMap[s.topicId]?.name : '-',
      责任单位: s.unitId ? unitMap[s.unitId] || s.unitId : '-',
      成果类型: s.achievementType,
      时间节点: s.nodeName,
      截止时间: s.deadline,
      计划数量: s.plannedQuantity,
      已录入数量: s.registeredCount,
      已认定数量: s.recognizedCount,
      当前缺口: s.missingCount,
      完成率: `${(s.completionRate * 100).toFixed(1)}%`,
      剩余天数: daysUntil(s.deadline),
    }));
    exportToExcel(rows, `指标监控_${view}_${new Date().toISOString().split('T')[0]}`);
  };

  const columns = [
    {
      title: '视角',
      dataIndex: 'viewKey',
      key: 'viewKey',
      render: (v: string, record: CompletionStats) => {
        if (view === 'topic') return topicMap[record.topicId!]?.name || record.topicId;
        if (view === 'unit') return `${topicMap[record.topicId!]?.name || record.topicId} - ${unitMap[record.unitId!] || record.unitId}`;
        return v;
      },
    },
    { title: '成果类型', dataIndex: 'achievementType', key: 'achievementType' },
    { title: '时间节点', dataIndex: 'nodeName', key: 'nodeName' },
    { title: '截止时间', dataIndex: 'deadline', key: 'deadline' },
    { title: '计划数量', dataIndex: 'plannedQuantity', key: 'plannedQuantity' },
    { title: '已录入', dataIndex: 'registeredCount', key: 'registeredCount' },
    { title: '已认定', dataIndex: 'recognizedCount', key: 'recognizedCount' },
    { title: '当前缺口', dataIndex: 'missingCount', key: 'missingCount' },
    {
      title: '完成率',
      dataIndex: 'completionRate',
      key: 'completionRate',
      render: (v: number) => (
        <Progress percent={Number((v * 100).toFixed(1))} size="small" />
      ),
    },
    {
      title: '剩余天数',
      key: 'daysRemaining',
      render: (_: any, record: CompletionStats) => {
        const days = daysUntil(record.deadline);
        return (
          <Tag color={days < 0 ? 'red' : days <= 30 ? 'orange' : 'green'}>{days}</Tag>
        );
      },
    },
  ];

  // Use unique rowKey
  const getRowKey = (record: CompletionStats) =>
    `${record.topicId || 'project'}-${record.unitId || 'all'}-${record.achievementType}-${record.nodeId}`;

  return (
    <div>
      <Card title="指标监控" style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Radio.Group value={view} onChange={(e) => setView(e.target.value)}>
            <Radio.Button value="project">项目总体</Radio.Button>
            <Radio.Button value="topic">按课题</Radio.Button>
            <Radio.Button value="unit">按单位</Radio.Button>
            <Radio.Button value="node">按节点</Radio.Button>
          </Radio.Group>

          <Select
            placeholder="选择课题"
            allowClear
            style={{ width: 200 }}
            onChange={(v) => setFilter({ ...filter, topicId: v })}
          >
            {topics.map((t) => (
              <Option key={t.id} value={t.id}>{t.name}</Option>
            ))}
          </Select>

          <Select
            placeholder="成果类型"
            allowClear
            style={{ width: 140 }}
            onChange={(v) => setFilter({ ...filter, achievementType: v || undefined })}
          >
            {ACHIEVEMENT_TYPES.map((t) => (
              <Option key={t} value={t}>{t}</Option>
            ))}
          </Select>

          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
            导出 Excel
          </Button>
        </Space>

        <Table
          rowKey={getRowKey}
          columns={columns}
          dataSource={stats}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Card title="国内期刊论文监控" style={{ marginBottom: 16 }}>
        <Space size="large">
          <div>
            <Title level={5}>当前比例</Title>
            <Tag
              color={
                ratioData.ratio !== null && ratioData.ratio >= ratioData.minRequiredRatio
                  ? 'success'
                  : 'warning'
              }
            >
              {ratioData.ratio !== null ? `${ratioData.ratio}%` : '暂无数据'}
            </Tag>
          </div>
          <div>
            <Title level={5}>预计比例</Title>
            <Tag>
              {ratioData.projectedRatio !== null ? `${ratioData.projectedRatio}%` : '暂无数据'}
            </Tag>
          </div>
          <div>
            <Title level={5}>最低要求</Title>
            <Tag>
              {ratioData.minRequiredRatio}% / {ratioData.minRequiredCount} 篇
            </Tag>
          </div>
          <div>
            <Title level={5}>尚缺</Title>
            <Tag color={ratioData.gapCount > 0 ? 'error' : 'success'}>
              {ratioData.gapCount} 篇
            </Tag>
          </div>
        </Space>
      </Card>

      <Card title="预警中心">
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="预警等级"
            allowClear
            style={{ width: 120 }}
            onChange={(v) => setFilter({ ...filter, level: v })}
          >
            <Option value="yellow">黄色预警</Option>
            <Option value="orange">橙色预警</Option>
            <Option value="red">红色预警</Option>
          </Select>

          <Select
            placeholder="预警类型"
            allowClear
            style={{ width: 180 }}
            onChange={(v) => setFilter({ ...filter, type: v })}
          >
            {WARNING_TYPES.map((wt) => (
              <Option key={wt.value} value={wt.value}>{wt.label}</Option>
            ))}
          </Select>
        </Space>

        <Space direction="vertical" style={{ width: '100%' }}>
          {filteredWarnings.length === 0 && <Tag color="success">暂无预警</Tag>}
          {filteredWarnings.map((w) => (
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
    </div>
  );
}
