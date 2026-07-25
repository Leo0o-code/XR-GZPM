import { useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Switch,
  Table,
  Space,
  Tag,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../store';
import type { ArchiveCategory, ArchiveRequirement } from '../../types';

const { TextArea } = Input;
const { Option } = Select;

export function ArchiveCatalogPage() {
  const {
    archiveCategories,
    archiveRequirements,
    nodes,
    addArchiveCategory,
    updateArchiveCategory,
    removeArchiveCategory,
    addArchiveRequirement,
    updateArchiveRequirement,
    removeArchiveRequirement,
  } = useAppStore();

  // Catalog state
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<ArchiveCategory | null>(null);
  const [form] = Form.useForm();

  // Requirement state
  const [reqVisible, setReqVisible] = useState(false);
  const [editingReq, setEditingReq] = useState<ArchiveRequirement | null>(null);
  const [reqForm] = Form.useForm();
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const categoryMap = Object.fromEntries(archiveCategories.map((c) => [c.id, c]));

  const filteredReqs = selectedCategory
    ? archiveRequirements.filter((r) => r.categoryId === selectedCategory)
    : archiveRequirements;

  // ---- Catalog handlers ----
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

  // ---- Requirement handlers ----
  const handleSaveReq = (values: any) => {
    if (editingReq) {
      updateArchiveRequirement(editingReq.id, values);
      message.success('更新必交材料成功');
    } else {
      addArchiveRequirement({
        ...values,
        id: `areq-${Date.now()}`,
        projectId: 'p1',
      });
      message.success('新增必交材料成功');
    }
    setReqVisible(false);
    setEditingReq(null);
    reqForm.resetFields();
  };

  const openReqForm = (req?: ArchiveRequirement) => {
    setEditingReq(req || null);
    if (req) {
      reqForm.setFieldsValue({
        categoryId: req.categoryId,
        name: req.name,
        required: req.required,
        requiredQuantity: req.requiredQuantity,
        applicableNodeId: req.applicableNodeId || undefined,
        description: req.description || '',
      });
    } else {
      reqForm.resetFields();
      reqForm.setFieldsValue({
        categoryId: selectedCategory || undefined,
        required: true,
        requiredQuantity: 1,
      });
    }
    setReqVisible(true);
  };

  // ---- Catalog columns ----
  const catalogColumns = [
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 80 },
    { title: '目录名称', dataIndex: 'name', key: 'name' },
    { title: '说明', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ArchiveCategory) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openForm(record)}>
            编辑
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            size="small"
            onClick={() => removeArchiveCategory(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // ---- Requirement columns ----
  const reqColumns = [
    {
      title: '所属目录',
      dataIndex: 'categoryId',
      key: 'categoryId',
      render: (v: string) => categoryMap[v]?.name || v,
    },
    { title: '材料名称', dataIndex: 'name', key: 'name' },
    {
      title: '是否必交',
      dataIndex: 'required',
      key: 'required',
      render: (v: boolean) => (v ? <Tag color="blue">必交</Tag> : <Tag>可选</Tag>),
    },
    { title: '要求数量', dataIndex: 'requiredQuantity', key: 'requiredQuantity' },
    {
      title: '适用节点',
      dataIndex: 'applicableNodeId',
      key: 'applicableNodeId',
      render: (v?: string) => {
        if (!v) return '-';
        const node = nodes.find((n) => n.id === v);
        return node?.name || v;
      },
    },
    { title: '说明', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ArchiveRequirement) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openReqForm(record)}>
            编辑
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            size="small"
            onClick={() => removeArchiveRequirement(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="归档目录"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>
            新增目录
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        <Table
          rowKey="id"
          columns={catalogColumns}
          dataSource={[...archiveCategories].sort((a, b) => a.sortOrder - b.sortOrder)}
          pagination={false}
        />

        <Modal
          title={editing ? '编辑目录' : '新增目录'}
          open={visible}
          onOk={() => form.submit()}
          onCancel={() => {
            setVisible(false);
            setEditing(null);
            form.resetFields();
          }}
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

      <Card
        title="必交材料清单"
        extra={
          <Space>
            <Select
              placeholder="按目录筛选"
              allowClear
              style={{ width: 200 }}
              value={selectedCategory || undefined}
              onChange={(v) => setSelectedCategory(v || '')}
            >
              {archiveCategories.map((c) => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openReqForm()}>
              新增必交材料
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={reqColumns}
          dataSource={filteredReqs}
          pagination={{ pageSize: 10 }}
        />

        <Modal
          title={editingReq ? '编辑必交材料' : '新增必交材料'}
          open={reqVisible}
          onOk={() => reqForm.submit()}
          onCancel={() => {
            setReqVisible(false);
            setEditingReq(null);
            reqForm.resetFields();
          }}
        >
          <Form form={reqForm} layout="vertical" onFinish={handleSaveReq}>
            <Form.Item label="所属目录" name="categoryId" rules={[{ required: true }]}>
              <Select placeholder="选择归档目录">
                {archiveCategories.map((c) => (
                  <Option key={c.id} value={c.id}>{c.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="材料名称" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="是否必交" name="required" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="要求数量" name="requiredQuantity" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="适用节点" name="applicableNodeId">
              <Select allowClear placeholder="选择适用节点（可选）">
                {nodes.map((n) => (
                  <Option key={n.id} value={n.id}>{n.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="说明" name="description">
              <TextArea rows={3} />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
}
