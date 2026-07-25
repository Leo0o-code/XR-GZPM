import { useState } from 'react';
import { Button, Card, DatePicker, Form, Input, InputNumber, message, Popconfirm, Select, Space, Table } from 'antd';
import dayjs from 'dayjs';
import { useAppStore } from '../../store';
import { ACHIEVEMENT_TYPES } from '../../types';

const { Option } = Select;

export function BatchNodes() {
  const { batchNodes, topics, addBatchNode, updateBatchNode, removeBatchNode, project } = useAppStore();
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<string | null>(null);

  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t.name]));

  const handleAdd = (values: any) => {
    addBatchNode({
      id: `b-${Date.now()}`,
      projectId: project.id,
      topicId: values.topicId,
      achievementType: values.achievementType,
      name: values.name,
      deadline: values.deadline.format('YYYY-MM-DD'),
      cumulativeQuantity: values.cumulativeQuantity,
    });
    form.resetFields();
    message.success('已添加');
  };

  const handleUpdate = (id: string, values: any) => {
    updateBatchNode(id, {
      ...values,
      deadline: values.deadline?.format('YYYY-MM-DD'),
    });
    setEditingId(null);
    message.success('已更新');
  };

  const editingNode = batchNodes.find((n) => n.id === editingId);

  const columns = [
    { title: '课题', dataIndex: 'topicId', key: 'topic', render: (v: string) => topicMap[v] },
    { title: '成果类型', dataIndex: 'achievementType', key: 'type' },
    { title: '节点名称', dataIndex: 'name', key: 'name' },
    { title: '截止日期', dataIndex: 'deadline', key: 'deadline' },
    { title: '累计要求', dataIndex: 'cumulativeQuantity', key: 'qty' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" onClick={() => setEditingId(record.id)}>编辑</Button>
          <Popconfirm
            title="确认删除？"
            onConfirm={() => { removeBatchNode(record.id); message.success('已删除'); }}
          >
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="分批交付节点配置">
      <Form
        form={form}
        layout="inline"
        onFinish={handleAdd}
        style={{ marginBottom: 16 }}
      >
        <Form.Item name="topicId" rules={[{ required: true }]} style={{ width: 120 }}>
          <Select placeholder="课题">
            {topics.map((t) => (
              <Option key={t.id} value={t.id}>{t.name}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="achievementType" rules={[{ required: true }]} style={{ width: 140 }}>
          <Select placeholder="成果类型">
            {ACHIEVEMENT_TYPES.map((t) => (
              <Option key={t} value={t}>{t}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="name" rules={[{ required: true }]} style={{ width: 140 }}>
          <Input placeholder="节点名称" />
        </Form.Item>
        <Form.Item name="deadline" rules={[{ required: true }]} style={{ width: 150 }}>
          <DatePicker placeholder="截止日期" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="cumulativeQuantity" rules={[{ required: true }]} style={{ width: 120 }}>
          <InputNumber min={0} placeholder="累计要求" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">添加</Button>
        </Form.Item>
      </Form>

      {editingNode && (
        <Card size="small" title="编辑节点" style={{ marginBottom: 16 }}>
          <Form
            layout="inline"
            initialValues={{
              ...editingNode,
              deadline: dayjs(editingNode.deadline),
            }}
            onFinish={(values) => handleUpdate(editingNode.id, values)}
          >
            <Form.Item name="topicId" rules={[{ required: true }]} style={{ width: 120 }}>
              <Select placeholder="课题">
                {topics.map((t) => (
                  <Option key={t.id} value={t.id}>{t.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="achievementType" rules={[{ required: true }]} style={{ width: 140 }}>
              <Select placeholder="成果类型">
                {ACHIEVEMENT_TYPES.map((t) => (
                  <Option key={t} value={t}>{t}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="name" rules={[{ required: true }]} style={{ width: 140 }}>
              <Input placeholder="节点名称" />
            </Form.Item>
            <Form.Item name="deadline" rules={[{ required: true }]} style={{ width: 150 }}>
              <DatePicker placeholder="截止日期" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="cumulativeQuantity" rules={[{ required: true }]} style={{ width: 120 }}>
              <InputNumber min={0} placeholder="累计要求" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">保存</Button>
                <Button onClick={() => setEditingId(null)}>取消</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      <Table rowKey="id" columns={columns} dataSource={batchNodes} pagination={{ pageSize: 10 }} />
    </Card>
  );
}
