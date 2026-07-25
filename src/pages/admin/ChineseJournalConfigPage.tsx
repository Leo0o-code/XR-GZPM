import { useEffect } from 'react';
import { Card, Form, InputNumber, Switch, Table, Button, Space, message, Typography } from 'antd';
import { useAppStore } from '../../store';
import { calculateChineseJournalRatio } from '../../utils/helpers';

const { Title, Text } = Typography;

export function ChineseJournalConfigPage() {
  const { chineseJournalConfig, updateChineseJournalConfig, achievements, topics } = useAppStore();
  const [form] = Form.useForm();

  const ratioData = calculateChineseJournalRatio(achievements, chineseJournalConfig);
  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t.name]));

  useEffect(() => {
    form.setFieldsValue({
      totalRepresentativePapers: chineseJournalConfig.totalRepresentativePapers,
      minChineseJournalCount: chineseJournalConfig.minChineseJournalCount,
      minChineseJournalRatio: chineseJournalConfig.minChineseJournalRatio,
      assessAtProjectLevel: chineseJournalConfig.assessAtProjectLevel,
      decomposeToTopics: chineseJournalConfig.decomposeToTopics,
      topicMinCounts: chineseJournalConfig.topicMinCounts,
    });
  }, [chineseJournalConfig, form]);

  const onFinish = () => {
    const values = form.getFieldsValue();
    updateChineseJournalConfig({
      totalRepresentativePapers: values.totalRepresentativePapers,
      minChineseJournalCount: values.minChineseJournalCount,
      minChineseJournalRatio: values.minChineseJournalRatio,
      assessAtProjectLevel: values.assessAtProjectLevel,
      decomposeToTopics: values.decomposeToTopics,
      topicMinCounts: values.topicMinCounts || {},
    });
    message.success('已保存');
  };

  const topicColumns = [
    { title: '课题', dataIndex: 'topicId', key: 'topic', render: (v: string) => topicMap[v] },
    {
      title: '最低数量',
      dataIndex: 'topicId',
      key: 'min',
      render: (topicId: string) => (
        <InputNumber
          min={0}
          value={form.getFieldValue(['topicMinCounts', topicId]) ?? chineseJournalConfig.topicMinCounts[topicId]}
          onChange={(val) => {
            const current = form.getFieldValue('topicMinCounts') || { ...chineseJournalConfig.topicMinCounts };
            form.setFieldValue('topicMinCounts', { ...current, [topicId]: val || 0 });
          }}
        />
      ),
    },
  ];

  return (
    <Card title="我国科技期刊论文配置">
      <Card size="small" style={{ marginBottom: 16, background: '#f6ffed' }}>
        <Title level={5}>实时测算</Title>
        <Space direction="vertical">
          <Text>已认定代表性论文总数：<Text strong>{ratioData.total}</Text> 篇</Text>
          <Text>我国科技期刊论文数：<Text strong>{ratioData.chinese}</Text> 篇</Text>
          <Text>当前实际占比：<Text strong>{ratioData.ratio}%</Text></Text>
          <Text>按现有计划预计占比：<Text strong>{ratioData.projectedRatio}%</Text></Text>
          <Text>距离最低要求尚缺：<Text strong type="danger">{ratioData.gapCount}</Text> 篇</Text>
        </Space>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          ...chineseJournalConfig,
          topicMinCounts: chineseJournalConfig.topicMinCounts,
        }}
      >
        <Form.Item label="代表性论文总数" name="totalRepresentativePapers" rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="我国科技期刊最低数量" name="minChineseJournalCount" rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="我国科技期刊最低占比（%）" name="minChineseJournalRatio" rules={[{ required: true }]}>
          <InputNumber min={0} max={100} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="按项目整体考核" name="assessAtProjectLevel" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="分解至各课题" name="decomposeToTopics" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="各课题最低数量" name="topicMinCounts">
          <Table
            rowKey="topicId"
            columns={topicColumns}
            dataSource={topics.map((t) => ({ topicId: t.id }))}
            pagination={false}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">保存配置</Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
