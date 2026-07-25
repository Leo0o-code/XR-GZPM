import { useState } from 'react';
import { Button, Card, Form, Input, message, Popconfirm, Space, Table } from 'antd';
import { useAppStore } from '../../store';

export function JournalList() {
  const { journals, addJournal, updateJournal, removeJournal } = useAppStore();
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = (values: any) => {
    addJournal({
      id: `j-${Date.now()}`,
      ...values,
      version: '2025版',
      addedAt: new Date().toISOString().split('T')[0],
    });
    form.resetFields();
    message.success('已添加');
  };

  const handleUpdate = (id: string, values: any) => {
    updateJournal(id, values);
    setEditingId(null);
    message.success('已更新');
  };

  const columns = [
    { title: '期刊名称', dataIndex: 'name', key: 'name' },
    { title: 'ISSN', dataIndex: 'issn', key: 'issn' },
    { title: '出版单位', dataIndex: 'publisher', key: 'publisher' },
    { title: '学科领域', dataIndex: 'category', key: 'category' },
    { title: '名录版本', dataIndex: 'version', key: 'version' },
    { title: '加入时间', dataIndex: 'addedAt', key: 'addedAt' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" onClick={() => setEditingId(record.id)}>编辑</Button>
          <Popconfirm
            title="确认删除？"
            onConfirm={() => { removeJournal(record.id); message.success('已删除'); }}
          >
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const editingJournal = journals.find((j) => j.id === editingId);

  return (
    <Card title="我国科技期刊名录管理">
      <Form
        form={form}
        layout="inline"
        onFinish={handleAdd}
        style={{ marginBottom: 16 }}
      >
        <Form.Item name="name" rules={[{ required: true }]} style={{ width: 180 }}>
          <Input placeholder="期刊名称" />
        </Form.Item>
        <Form.Item name="issn" style={{ width: 140 }}>
          <Input placeholder="ISSN" />
        </Form.Item>
        <Form.Item name="publisher" style={{ width: 160 }}>
          <Input placeholder="出版单位" />
        </Form.Item>
        <Form.Item name="category" style={{ width: 120 }}>
          <Input placeholder="学科领域" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">添加</Button>
        </Form.Item>
      </Form>

      {editingJournal && (
        <Card size="small" title="编辑期刊" style={{ marginBottom: 16 }}>
          <Form
            layout="inline"
            initialValues={editingJournal}
            onFinish={(values) => handleUpdate(editingJournal.id, values)}
          >
            <Form.Item name="name" rules={[{ required: true }]} style={{ width: 180 }}>
              <Input placeholder="期刊名称" />
            </Form.Item>
            <Form.Item name="issn" style={{ width: 140 }}>
              <Input placeholder="ISSN" />
            </Form.Item>
            <Form.Item name="publisher" style={{ width: 160 }}>
              <Input placeholder="出版单位" />
            </Form.Item>
            <Form.Item name="category" style={{ width: 120 }}>
              <Input placeholder="学科领域" />
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

      <Table rowKey="id" columns={columns} dataSource={journals} pagination={{ pageSize: 10 }} />
    </Card>
  );
}
