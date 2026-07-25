import { useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Table,
  Space,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store';
import type { ArchiveCategory } from '../../types';

const { TextArea } = Input;

export function ArchiveCatalogPage() {
  const { archiveCategories, addArchiveCategory, updateArchiveCategory, removeArchiveCategory } = useAppStore();
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<ArchiveCategory | null>(null);
  const [form] = Form.useForm();

  const handleSave = (values: any) => {
    if (editing) {
      updateArchiveCategory(editing.id, values);
      message.success('更新成功');
    } else {
      addArchiveCategory({
        ...values,
        id: `ac-${Date.now()}`,
        projectId: 'p1',
        sortOrder: archiveCategories.length + 1,
      });
      message.success('新增成功');
    }
    setVisible(false);
    setEditing(null);
    form.resetFields();
  };

  const openForm = (category?: ArchiveCategory) => {
    setEditing(category || null);
    if (category) {
      form.setFieldsValue({ ...category });
    } else {
      form.resetFields();
    }
    setVisible(true);
  };

  const columns = [
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 80 },
    { title: '目录名称', dataIndex: 'name', key: 'name' },
    { title: '说明', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ArchiveCategory) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openForm(record)}>编辑</Button>
          <Button icon={<DeleteOutlined />} danger size="small" onClick={() => removeArchiveCategory(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="归档目录"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>
          新增目录
        </Button>
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={[...archiveCategories].sort((a, b) => a.sortOrder - b.sortOrder)}
        pagination={false}
      />

      <Modal
        title={editing ? '编辑目录' : '新增目录'}
        open={visible}
        onOk={() => form.submit()}
        onCancel={() => { setVisible(false); setEditing(null); form.resetFields(); }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item label="目录名称" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="说明" name="description">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item label="排序" name="sortOrder" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
