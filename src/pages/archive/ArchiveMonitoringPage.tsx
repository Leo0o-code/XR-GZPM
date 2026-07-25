import { Card, Progress, Table } from 'antd';
import { useAppStore } from '../../store';

export function ArchiveMonitoringPage() {
  const { archiveCategories, archiveMaterials, achievements } = useAppStore();

  const stats = archiveCategories.map((category) => {
    const uploaded = archiveMaterials.filter((m) => m.categoryId === category.id).length;
    // 科研成果目录默认至少应有审批通过成果数
    let total = 0;
    if (category.name.includes('科研成果')) {
      total = achievements.filter((a) => a.status === '审批通过').length;
    } else {
      total = Math.max(1, uploaded);
    }
    return {
      categoryId: category.id,
      categoryName: category.name,
      total,
      uploaded,
      missing: Math.max(0, total - uploaded),
      completionRate: total > 0 ? (uploaded / total) * 100 : 0,
    };
  });

  const unarchivedAchievements = achievements.filter((a) => {
    if (a.status !== '审批通过') return false;
    return !archiveMaterials.some((m) => m.sourceAchievementId === a.id);
  });

  const columns = [
    { title: '归档目录', dataIndex: 'categoryName', key: 'categoryName' },
    { title: '应收数量', dataIndex: 'total', key: 'total' },
    { title: '已上传', dataIndex: 'uploaded', key: 'uploaded' },
    { title: '缺失', dataIndex: 'missing', key: 'missing' },
    {
      title: '完成率',
      dataIndex: 'completionRate',
      key: 'completionRate',
      render: (v: number) => <Progress percent={Number(v.toFixed(1))} size="small" />,
    },
  ];

  const achievementColumns = [
    { title: '成果名称', dataIndex: 'title', key: 'title' },
    { title: '成果类型', dataIndex: 'achievementType', key: 'achievementType' },
    { title: '责任单位', dataIndex: 'unitName', key: 'unitName' },
    { title: '责任人', dataIndex: 'responsiblePerson', key: 'responsiblePerson' },
  ];

  return (
    <div>
      <Card title="归档进度监控" style={{ marginBottom: 16 }}>
        <Table rowKey="categoryId" columns={columns} dataSource={stats} pagination={false} />
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
