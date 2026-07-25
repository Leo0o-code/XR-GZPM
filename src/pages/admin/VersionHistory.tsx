import { Card, Table } from 'antd';
import { useAppStore } from '../../store';

export function VersionHistory() {
  const { versionRecords, topics, indicators } = useAppStore();

  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t.name]));
  const indicatorMap = Object.fromEntries(indicators.map((i) => [i.id, `${topicMap[i.topicId]} ${i.achievementType} ${i.node}`]));

  const columns = [
    { title: '版本', dataIndex: 'version', key: 'version' },
    { title: '指标', dataIndex: 'configId', key: 'config', render: (v: string) => indicatorMap[v] || v },
    { title: '字段', dataIndex: 'fieldName', key: 'fieldName' },
    { title: '调整前', dataIndex: 'beforeValue', key: 'beforeValue' },
    { title: '调整后', dataIndex: 'afterValue', key: 'afterValue' },
    { title: '原因', dataIndex: 'reason', key: 'reason' },
    { title: '操作人', dataIndex: 'operator', key: 'operator' },
    { title: '操作时间', dataIndex: 'operatedAt', key: 'operatedAt' },
    { title: '生效日期', dataIndex: 'effectiveDate', key: 'effectiveDate' },
  ];

  return (
    <Card title="配置版本记录">
      <Table
        rowKey="id"
        columns={columns}
        dataSource={[...versionRecords].sort((a, b) => b.version - a.version)}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
}
