import { useState } from 'react';
import { Card, Progress, Select, Space, Table, Tag } from 'antd';
import { useAppStore } from '../../store';

const { Option } = Select;

export function ArchiveMonitoringPage() {
  const {
    archiveCategories,
    archiveMaterials,
    archiveRequirements,
    achievements,
    units,
    nodes,
  } = useAppStore();

  const [filterNodeId, setFilterNodeId] = useState<string>('');

  const unitMap = Object.fromEntries(units.map((u) => [u.id, u.name]));

  // Filter requirements by node if a node filter is selected
  const filteredRequirements = filterNodeId
    ? archiveRequirements.filter((r) => !r.applicableNodeId || r.applicableNodeId === filterNodeId)
    : archiveRequirements;

  // Calculate stats per category
  const stats = archiveCategories.map((category) => {
    const reqs = filteredRequirements.filter((r) => r.categoryId === category.id && r.required);
    const requiredCount = reqs.reduce((sum, r) => sum + r.requiredQuantity, 0);

    // Count satisfied requirements (not just file count!)
    // A requirement is satisfied if there are enough materials linked to it
    let satisfiedCount = 0;
    reqs.forEach((req) => {
      const materialsForReq = archiveMaterials.filter(
        (m) => m.categoryId === category.id && (!req.id || m.requirementId === req.id)
      );
      if (materialsForReq.length >= req.requiredQuantity) {
        satisfiedCount++;
      }
    });
    const totalRequiredRequirements = reqs.length;
    const completionRate = totalRequiredRequirements > 0
      ? (satisfiedCount / totalRequiredRequirements) * 100
      : 0;
    const missingCount = Math.max(0, totalRequiredRequirements - satisfiedCount);

    return {
      categoryId: category.id,
      categoryName: category.name,
      requiredCount,
      totalRequiredRequirements,
      satisfiedRequirements: satisfiedCount,
      missingCount,
      completionRate,
      uploadedCount: archiveMaterials.filter((m) => m.categoryId === category.id).length,
      reqs,
    };
  });

  // Unarchived achievements: 审批通过 but no archive material linked
  const unarchivedAchievements = achievements.filter((a) => {
    if (a.status !== '审批通过') return false;
    return !archiveMaterials.some((m) => m.sourceAchievementId === a.id);
  });

  const statsColumns = [
    {
      title: '归档目录',
      dataIndex: 'categoryName',
      key: 'categoryName',
    },
    {
      title: '必交材料要求',
      key: 'requirements',
      render: (_: any, record: any) => (
        <span>
          {record.totalRequiredRequirements} 项要求 / {record.requiredCount} 份材料
        </span>
      ),
    },
    {
      title: '已上传',
      dataIndex: 'uploadedCount',
      key: 'uploadedCount',
    },
    {
      title: '已满足',
      dataIndex: 'satisfiedRequirements',
      key: 'satisfiedRequirements',
      render: (v: number) => <Tag color="success">{v}</Tag>,
    },
    {
      title: '缺失要求',
      dataIndex: 'missingCount',
      key: 'missingCount',
      render: (v: number) => (
        <Tag color={v > 0 ? 'error' : 'success'}>{v}</Tag>
      ),
    },
    {
      title: '完成率',
      dataIndex: 'completionRate',
      key: 'completionRate',
      render: (v: number) => (
        <Progress
          percent={Number(v.toFixed(1))}
          size="small"
          status={v >= 100 ? 'success' : 'active'}
        />
      ),
    },
  ];

  const achievementColumns = [
    { title: '成果名称', dataIndex: 'title', key: 'title' },
    { title: '成果类型', dataIndex: 'achievementType', key: 'achievementType' },
    {
      title: '责任单位',
      dataIndex: 'unitId',
      key: 'unitId',
      render: (v: string) => unitMap[v] || v,
    },
    { title: '责任人', dataIndex: 'responsiblePerson', key: 'responsiblePerson' },
  ];

  return (
    <div>
      <Card title="归档进度监控" style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="按节点筛选"
            allowClear
            style={{ width: 200 }}
            value={filterNodeId || undefined}
            onChange={(v) => setFilterNodeId(v || '')}
          >
            {nodes.map((n) => (
              <Option key={n.id} value={n.id}>{n.name}</Option>
            ))}
          </Select>
        </Space>
        <Table
          rowKey="categoryId"
          columns={statsColumns}
          dataSource={stats}
          pagination={false}
        />
      </Card>

      <Card title="未归档成果">
        <Table
          rowKey="id"
          columns={achievementColumns}
          dataSource={unarchivedAchievements}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
