import { Card, InputNumber, Switch, Table } from 'antd';
import { useAppStore } from '../../store';
import { WARNING_TYPES } from '../../types';

export function WarningRules() {
  const { warningRules, updateWarningRule } = useAppStore();

  const typeMap = Object.fromEntries(WARNING_TYPES.map((t) => [t.value, t.label]));

  const columns = [
    { title: '预警类型', dataIndex: 'type', key: 'type', render: (v: string) => typeMap[v as any] || v },
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '黄色阈值',
      dataIndex: 'yellowThreshold',
      key: 'yellowThreshold',
      render: (v: number, record: any) => (
        <InputNumber
          min={0}
          value={v}
          onChange={(val) => updateWarningRule(record.id, { yellowThreshold: val || 0 })}
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: '橙色阈值',
      dataIndex: 'orangeThreshold',
      key: 'orangeThreshold',
      render: (v: number, record: any) => (
        <InputNumber
          min={0}
          value={v}
          onChange={(val) => updateWarningRule(record.id, { orangeThreshold: val || 0 })}
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: '红色阈值',
      dataIndex: 'redThreshold',
      key: 'redThreshold',
      render: (v: number, record: any) => (
        <InputNumber
          min={0}
          value={v}
          onChange={(val) => updateWarningRule(record.id, { redThreshold: val || 0 })}
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (v: boolean, record: any) => (
        <Switch
          checked={v}
          onChange={(checked) => updateWarningRule(record.id, { enabled: checked })}
        />
      ),
    },
  ];

  return (
    <Card title="预警规则配置">
      <Table rowKey="id" columns={columns} dataSource={warningRules} pagination={false} />
    </Card>
  );
}
