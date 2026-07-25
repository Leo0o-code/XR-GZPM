import { useState } from 'react';
import {
  Button,
  Card,
  Form,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import { EditOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store';
import { ACHIEVEMENT_STATUS, ACHIEVEMENT_TYPES, type Achievement } from '../../types';
import { AchievementForm } from '../../components/achievement/AchievementForm';
import { getProgressOptions } from '../../utils/helpers';

const { Option } = Select;

export function AchievementEntryPage() {
  const { project, topics, achievements, addAchievement, updateAchievement, submitAchievement } = useAppStore();
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [filter, setFilter] = useState({ topicId: '', unitName: '', achievementType: '', status: '' });

  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t]));

  const filtered = achievements.filter((a) => {
    return (
      (!filter.topicId || a.topicId === filter.topicId) &&
      (!filter.unitName || a.unitName === filter.unitName) &&
      (!filter.achievementType || a.achievementType === filter.achievementType) &&
      (!filter.status || a.status === filter.status)
    );
  });

  const handleSave = (values: any) => {
    const today = new Date().toISOString().split('T')[0];
    const base = {
      projectId: project.id,
      topicId: values.topicId,
      unitName: values.unitName,
      achievementType: values.achievementType,
      title: values.title,
      responsiblePerson: values.responsiblePerson,
      remarks: values.remarks || '',
      countsToIndicator: false,
      materials: [],
    };

    if (editing) {
      updateAchievement(editing.id, { ...values, updatedAt: today });
      message.success('更新成功');
    } else {
      addAchievement({
        ...base,
        ...values,
        id: `ach-${Date.now()}`,
        status: '草稿',
        createdAt: today,
        updatedAt: today,
      } as Achievement);
      message.success('保存草稿成功');
    }
    setVisible(false);
    setEditing(null);
    form.resetFields();
  };

  const openForm = (achievement?: Achievement) => {
    setEditing(achievement || null);
    if (achievement) {
      form.setFieldsValue({ ...achievement });
    } else {
      form.resetFields();
    }
    setVisible(true);
  };

  const statusColor: Record<string, string> = {
    草稿: 'default',
    已提交: 'processing',
    审批中: 'warning',
    审批通过: 'success',
    审批不通过: 'error',
    退回修改: 'error',
  };

  const columns = [
    {
      title: '成果名称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '类型',
      dataIndex: 'achievementType',
      key: 'achievementType',
    },
    {
      title: '课题',
      dataIndex: 'topicId',
      key: 'topicId',
      render: (v: string) => topicMap[v]?.name || v,
    },
    { title: '责任单位', dataIndex: 'unitName', key: 'unitName' },
    { title: '责任人', dataIndex: 'responsiblePerson', key: 'responsiblePerson' },
    {
      title: '当前进度',
      dataIndex: 'achievementType',
      key: 'progress',
      render: (_: any, record: Achievement) => {
        const options = getProgressOptions(record.achievementType);
        return options.length > 0 ? (
          <Select
            style={{ width: 140 }}
            value={record.currentStage || record.trainingStatus || record.legalStatus || options[0]}
            onChange={(v) => updateAchievement(record.id, { currentStage: v })}
          >
            {options.map((o) => (
              <Option key={o} value={o}>{o}</Option>
            ))}
          </Select>
        ) : (
          '-'
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <Tag color={statusColor[v]}>{v}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Achievement) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openForm(record)}>编辑</Button>
          {record.status === '草稿' && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              size="small"
              onClick={() => { submitAchievement(record.id); message.success('已提交审批'); }}
            >
              提交
            </Button>
          )}
          {record.status === '退回修改' && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              size="small"
              onClick={() => { submitAchievement(record.id); message.success('已重新提交'); }}
            >
              重新提交
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="成果录入"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>
          新增成果
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="选择课题"
          allowClear
          style={{ width: 200 }}
          onChange={(v) => setFilter({ ...filter, topicId: v, unitName: '' })}
        >
          {topics.map((t) => (
            <Option key={t.id} value={t.id}>{t.name}</Option>
          ))}
        </Select>
        <Select
          placeholder="责任单位"
          allowClear
          style={{ width: 160 }}
          value={filter.unitName || undefined}
          onChange={(v) => setFilter({ ...filter, unitName: v })}
        >
          {(() => {
            const topic = topics.find((t) => t.id === filter.topicId);
            if (!topic) return null;
            return [topic.leadingUnit, ...topic.participatingUnits].map((u) => (
              <Option key={u} value={u}>{u}</Option>
            ));
          })()}
        </Select>
        <Select
          placeholder="成果类型"
          allowClear
          style={{ width: 140 }}
          onChange={(v) => setFilter({ ...filter, achievementType: v })}
        >
          {ACHIEVEMENT_TYPES.map((t) => (
            <Option key={t} value={t}>{t}</Option>
          ))}
        </Select>
        <Select
          placeholder="状态"
          allowClear
          style={{ width: 140 }}
          onChange={(v) => setFilter({ ...filter, status: v })}
        >
          {ACHIEVEMENT_STATUS.map((s) => (
            <Option key={s} value={s}>{s}</Option>
          ))}
        </Select>
      </Space>

      <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 10 }} scroll={{ x: 1200 }} />

      <Modal
        title={editing ? '编辑成果' : '新增成果'}
        open={visible}
        width={900}
        onOk={() => form.submit()}
        onCancel={() => { setVisible(false); setEditing(null); form.resetFields(); }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <AchievementForm form={form} topics={topics} achievement={editing || undefined} />
        </Form>
      </Modal>
    </Card>
  );
}
