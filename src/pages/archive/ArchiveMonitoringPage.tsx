import { Card, Progress, Table, Tag } from 'antd';
import { useAppStore } from '../../store';

export function ArchiveMonitoringPage() {
  const {
    archiveCategories,
    archiveMaterials,
    archiveRequirements,
    achievements,
  } = useAppStore();

  // Calculate stats per category using archiveRequirements
  const stats = archiveCategories.map((category) => {
    const reqs = archiveRequirements.filter(
      (r) => r.categoryId === category.id && r.required
    );
    // Total required items = sum of required quantities
    const requiredCount = reqs.reduce(
      (sum, r) => sum + r.requiredQuantity,
      0
    );
    // Uploaded = number of materials in this category
    const uploadedMaterials = archiveMaterials.filter(
      (m) => m.categoryId === category.id
    );
    const uploadedCount = uploadedMaterials.length;
    const missingCount = Math.max(0, requiredCount - uploadedCount);
    const completionRate =
      requiredCount > 0
        ? Math.min(100, (uploadedCount / requiredCount) * 100)
        : uploadedCount > 0
        ? 100
        : 0;

    return {
      categoryId: category.id,
      categoryName: category.name,
      requiredCount,
      uploadedCount,
      missingCount,
      completionRate,
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
      title: '必交材料项数',
      dataIndex: 'requiredCount',
      key: 'requiredCount',
      render: (v: number, record: any) => (
        <span>
          {v}
          {record.reqs.length > 0 && (
            <Tag style={{ marginLeft: 4 }} color="blue">
              {record.reqs.length} 项要求
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: '已上传',
      dataIndex: 'uploadedCount',
      key: 'uploadedCount',
    },
    {
      title: '缺失',
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
    { title: '责任单位', dataIndex: 'unitName', key: 'unitName' },
    {
      title: '责任人',
      dataIndex: 'responsiblePerson',
      key: 'responsiblePerson',
    },
  ];

  return (
    <div>
      <Card title="归档进度监控" style={{ marginBottom: 16 }}>
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
