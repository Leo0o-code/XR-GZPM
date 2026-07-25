import { useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store';
import { ACHIEVEMENT_STATUS, ACHIEVEMENT_TYPES, type Achievement } from '../../types';

const { Option } = Select;
const { TextArea } = Input;

export function AchievementApprovalPage() {
  const { topics, achievements, approveAchievement, returnAchievement } = useAppStore();
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [filter, setFilter] = useState({ topicId: '', achievementType: '', status: '' });

  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t]));

  const filtered = achievements.filter((a) => {
    const reviewable = ['已提交', '审批中', '审批不通过', '退回修改'].includes(a.status);
    return (
      reviewable &&
      (!filter.topicId || a.topicId === filter.topicId) &&
      (!filter.achievementType || a.achievementType === filter.achievementType) &&
      (!filter.status || a.status === filter.status)
    );
  });

  const openApproval = (achievement: Achievement) => {
    setEditing(achievement);
    form.setFieldsValue({
      result: 'pass',
      countsToIndicator: true,
      approvalOpinion: '',
      isRepresentative: achievement.isRepresentative,
      isChineseJournal: achievement.isChineseJournal,
      chineseJournalReason: achievement.chineseJournalReason,
    });
    setVisible(true);
  };

  const handleSubmit = (values: any) => {
    if (!editing) return;

    if (values.result === 'pass') {
      const payload: Partial<Achievement> = {
        countsToIndicator: values.countsToIndicator,
        approvalOpinion: values.approvalOpinion,
      };
      if (editing.achievementType === '学术论文') {
        payload.isRepresentative = values.isRepresentative;
        payload.isChineseJournal = values.isChineseJournal;
        payload.chineseJournalReason = values.chineseJournalReason;
      }
      approveAchievement(editing.id, payload, '当前审批人');
    } else if (values.result === 'reject') {
      returnAchievement(editing.id, values.approvalOpinion || '审批不通过', '当前审批人');
    } else if (values.result === 'return') {
      returnAchievement(editing.id, values.approvalOpinion || '退回修改', '当前审批人');
    }

    setVisible(false);
    setEditing(null);
    form.resetFields();
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
    { title: '成果名称', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'achievementType', key: 'achievementType' },
    {
      title: '课题',
      dataIndex: 'topicId',
      key: 'topicId',
      render: (v: string) => topicMap[v]?.name || v,
    },
    { title: '责任单位', dataIndex: 'unitName', key: 'unitName' },
    { title: '责任人', dataIndex: 'responsiblePerson', key: 'responsiblePerson' },
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
        <Button type="primary" icon={<CheckOutlined />} size="small" onClick={() => openApproval(record)}>
          审批
        </Button>
      ),
    },
  ];

  return (
    <Card title="成果审批">
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="选择课题"
          allowClear
          style={{ width: 200 }}
          onChange={(v) => setFilter({ ...filter, topicId: v })}
        >
          {topics.map((t) => (
            <Option key={t.id} value={t.id}>{t.name}</Option>
          ))}
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
          {ACHIEVEMENT_STATUS.filter((s) => s !== '草稿').map((s) => (
            <Option key={s} value={s}>{s}</Option>
          ))}
        </Select>
      </Space>

      <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 10 }} />

      <Modal
        title={`审批：${editing?.title}`}
        open={visible}
        width={800}
        onOk={() => form.submit()}
        onCancel={() => { setVisible(false); setEditing(null); form.resetFields(); }}
      >
        {editing && (
          <div style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="成果类型">{editing.achievementType}</Descriptions.Item>
              <Descriptions.Item label="责任单位">{editing.unitName}</Descriptions.Item>
              <Descriptions.Item label="责任人">{editing.responsiblePerson}</Descriptions.Item>
              <Descriptions.Item label="当前状态">{editing.status}</Descriptions.Item>
              {editing.achievementType === '学术论文' && (
                <>
                  <Descriptions.Item label="期刊名称">{editing.journalName || '-'}</Descriptions.Item>
                  <Descriptions.Item label="是否代表性论文">{editing.isRepresentative ? '是' : '否'}</Descriptions.Item>
                  <Descriptions.Item label="是否我国科技期刊">{editing.isChineseJournal ? '是' : '否'}</Descriptions.Item>
                </>
              )}
            </Descriptions>
          </div>
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="审批结论" name="result" initialValue="pass" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="pass">审批通过</Radio>
              <Radio value="reject">审批不通过</Radio>
              <Radio value="return">退回修改</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="是否计入指标" name="countsToIndicator" valuePropName="checked">
            <Switch />
          </Form.Item>

          {editing?.achievementType === '学术论文' && (
            <>
              <Form.Item label="是否代表性论文" name="isRepresentative" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item label="是否我国科技期刊" name="isChineseJournal" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item label="我国科技期刊判定说明" name="chineseJournalReason">
                <TextArea rows={2} />
              </Form.Item>
            </>
          )}

          <Form.Item label="审批意见" name="approvalOpinion">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
