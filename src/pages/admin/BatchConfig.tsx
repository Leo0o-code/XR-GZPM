import { useState } from 'react';
import { Button, Card, DatePicker, InputNumber, message, Select, Space, Table } from 'antd';
import dayjs from 'dayjs';
import { useAppStore } from '../../store';
import { ACHIEVEMENT_TYPES } from '../../types';

const { Option } = Select;

export function BatchConfig() {
  const { topics, indicators, updateIndicator, addIndicator, project } = useAppStore();
  const [achievementType, setAchievementType] = useState<string | undefined>();
  const [node, setNode] = useState<string | undefined>('中期');
  const [deadline, setDeadline] = useState<dayjs.Dayjs | null>(dayjs('2026-12-31'));
  const [data, setData] = useState<Record<string, number>>({});

  const handleChange = (topicId: string, value: number | null) => {
    setData((prev) => ({ ...prev, [topicId]: value || 0 }));
  };

  const handleSave = () => {
    if (!achievementType || !node || !deadline) {
      message.error('请填写完整信息');
      return;
    }
    const dateStr = deadline.format('YYYY-MM-DD');
    topics.forEach((topic) => {
      const existing = indicators.find(
        (i) =>
          i.topicId === topic.id && i.achievementType === achievementType && i.node === node
      );
      const plannedQuantity = data[topic.id] ?? 0;
      if (existing) {
        updateIndicator(
          existing.id,
          { plannedQuantity, deadline: dateStr, status: '已调整' },
          '批量配置调整',
          '当前管理员'
        );
      } else {
        addIndicator({
          id: `i-${Date.now()}-${topic.id}`,
          projectId: project.id,
          topicId: topic.id,
          achievementType: achievementType as any,
          node,
          plannedQuantity,
          deadline: dateStr,
          recognitionStatus: '',
          materialRequirements: [],
          earlyWarningDays: [90, 60, 30],
          enabled: true,
          remarks: '',
          status: '草稿',
          version: 1,
          versionId: `v${Date.now()}`,
          effectiveDate: dateStr,
        });
      }
    });
    message.success('批量配置已保存');
  };

  const columns = [
    { title: '课题', dataIndex: 'name', key: 'name' },
    { title: '责任单位', dataIndex: 'responsibleUnit', key: 'responsibleUnit' },
    { title: '负责人', dataIndex: 'leader', key: 'leader' },
    {
      title: '计划数量',
      dataIndex: 'id',
      key: 'quantity',
      render: (id: string) => (
        <InputNumber
          min={0}
          value={data[id]}
          onChange={(v) => handleChange(id, v)}
          style={{ width: '100%' }}
        />
      ),
    },
  ];

  return (
    <Card title="批量配置五个课题">
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="成果类型"
          style={{ width: 160 }}
          value={achievementType}
          onChange={(v) => setAchievementType(v)}
        >
          {ACHIEVEMENT_TYPES.map((t) => (
            <Option key={t} value={t}>{t}</Option>
          ))}
        </Select>
        <Select
          placeholder="考核节点"
          style={{ width: 160 }}
          value={node}
          onChange={(v) => setNode(v)}
        >
          {['中期', '结项'].map((n) => (
            <Option key={n} value={n}>{n}</Option>
          ))}
        </Select>
        <DatePicker
          placeholder="计划完成日期"
          value={deadline}
          onChange={(v) => setDeadline(v)}
        />
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={topics}
        pagination={false}
        style={{ marginBottom: 16 }}
      />
      <Button type="primary" onClick={handleSave}>保存批量配置</Button>
    </Card>
  );
}
