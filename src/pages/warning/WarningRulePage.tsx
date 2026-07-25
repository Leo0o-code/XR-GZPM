import { Card, InputNumber, Space, Switch, Table, Typography } from 'antd';
import { useAppStore } from '../../store';
import { levelColor, levelLabel } from '../../utils/helpers';

const { Text } = Typography;

export function WarningRulePage() {
  const { warningRules, updateWarningRule } = useAppStore();

  const columns = [
    { title: '预警类型', dataIndex: 'name', key: 'name', width: 180 },
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean, record: any) => (
        <Switch
          checked={enabled}
          onChange={(v) => updateWarningRule(record.id, { enabled: v })}
        />
      ),
    },
    {
      title: '三级阈值配置',
      key: 'levels',
      render: (_: any, record: any) => (
        <Space direction="vertical" style={{ width: '100%' }}>
          {record.levels.map((level: any) => (
            <Space key={level.level} style={{ width: '100%' }}>
              <Text style={{ color: levelColor(level.level), width: 70 }}>{levelLabel(level.level)}</Text>
              <Text>提前天数：</Text>
              <InputNumber
                min={0}
                value={level.advanceDays}
                onChange={(v) => {
                  const levels = record.levels.map((l: any) =>
                    l.level === level.level ? { ...l, advanceDays: v } : l
                  );
                  updateWarningRule(record.id, { levels });
                }}
              />
              <Text>完成率阈值（%）：</Text>
              <InputNumber
                min={0}
                max={100}
                value={level.completionRateThreshold}
                onChange={(v) => {
                  const levels = record.levels.map((l: any) =>
                    l.level === level.level ? { ...l, completionRateThreshold: v } : l
                  );
                  updateWarningRule(record.id, { levels });
                }}
              />
            </Space>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <Card title="预警规则配置">
      <Table
        rowKey="id"
        columns={columns}
        dataSource={warningRules}
        pagination={false}
      />
    </Card>
  );
}
