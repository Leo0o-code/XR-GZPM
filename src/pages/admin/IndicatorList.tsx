import { useState } from 'react';
import { Button, Card, Space, Table, Tag, Select, message } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store';
import { ACHIEVEMENT_TYPES } from '../../types';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

export function IndicatorList() {
  const { indicators, topics, publishIndicator, deactivateIndicator } = useAppStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState({ topic: '', type: '', node: '', status: '' });

  const data = indicators.filter((i) => {
    return (
      (!filter.topic || i.topicId === filter.topic) &&
      (!filter.type || i.achievementType === filter.type) &&
      (!filter.node || i.node === filter.node) &&
      (!filter.status || i.status === filter.status)
    );
  });

  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t.name]));

  const columns = [
    { title: '课题', dataIndex: 'topicId', key: 'topic', render: (v: string) => topicMap[v] || v },
    { title: '成果类型', dataIndex: 'achievementType', key: 'type' },
    { title: '考核节点', dataIndex: 'node', key: 'node' },
    { title: '计划数量', dataIndex: 'plannedQuantity', key: 'plannedQuantity' },
    { title: '计划完成日期', dataIndex: 'deadline', key: 'deadline' },
    { title: '认定状态', dataIndex: 'recognitionStatus', key: 'recognitionStatus' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const color = v === '已发布' ? 'green' : v === '草稿' ? 'default' : v === '已调整' ? 'blue' : 'red';
        return <Tag color={color}>{v}</Tag>;
      },
    },
    { title: '版本', dataIndex: 'version', key: 'version' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => navigate(`/admin/indicator/${record.id}`)}>编辑</Button>
          {record.status === '草稿' && (
            <Button type="primary" onClick={() => { publishIndicator(record.id, '当前管理员'); message.success('已发布'); }}>发布</Button>
          )}
          {(record.status === '已发布' || record.status === '已调整') && (
            <Button danger onClick={() => { deactivateIndicator(record.id, '当前管理员'); message.success('已停用'); }}>停用</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="指标配置列表"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/indicator/new')}>
          新增指标
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="选择课题"
          allowClear
          style={{ width: 140 }}
          onChange={(v) => setFilter({ ...filter, topic: v })}
        >
          {topics.map((t) => (
            <Option key={t.id} value={t.id}>{t.name}</Option>
          ))}
        </Select>
        <Select
          placeholder="成果类型"
          allowClear
          style={{ width: 140 }}
          onChange={(v) => setFilter({ ...filter, type: v })}
        >
          {ACHIEVEMENT_TYPES.map((t) => (
            <Option key={t} value={t}>{t}</Option>
          ))}
        </Select>
        <Select
          placeholder="考核节点"
          allowClear
          style={{ width: 140 }}
          onChange={(v) => setFilter({ ...filter, node: v })}
        >
          {['中期', '结项'].map((n) => (
            <Option key={n} value={n}>{n}</Option>
          ))}
        </Select>
        <Select
          placeholder="配置状态"
          allowClear
          style={{ width: 140 }}
          onChange={(v) => setFilter({ ...filter, status: v })}
        >
          {['草稿', '已发布', '已调整', '已停用'].map((s) => (
            <Option key={s} value={s}>{s}</Option>
          ))}
        </Select>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
    </Card>
  );
}
