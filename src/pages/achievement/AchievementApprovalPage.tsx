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
  Typography,
} from 'antd';
import {
  CheckCircleFilled,
  CheckOutlined,
  CloseCircleFilled,
} from '@ant-design/icons';
import { useAppStore } from '../../store';
import {
  ACHIEVEMENT_EVIDENCE_RULES,
  ACHIEVEMENT_STATUS,
  ACHIEVEMENT_TYPES,
  type Achievement,
} from '../../types';
import { validateAchievementForApproval } from '../../utils/validation';
import { mockFileService } from '../../utils/helpers';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

export function AchievementApprovalPage() {
  const {
    topics,
    units,
    nodes,
    indicators,
    achievements,
    approveAchievement,
    rejectAchievement,
    returnAchievement,
  } = useAppStore();

  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [validation, setValidation] = useState<any>(null);
  const [filter, setFilter] = useState({
    topicId: '',
    achievementType: '',
    status: '',
  });

  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t]));
  const indicatorMap = Object.fromEntries(indicators.map((i) => [i.id, i]));
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const unitMap = Object.fromEntries(units.map((u) => [u.id, u.name]));

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

    const indicator = indicatorMap[achievement.indicatorId];
    const node = nodeMap[achievement.nodeId];
    const val = validateAchievementForApproval(achievement, indicator, node, achievements);
    setValidation(val);

    form.setFieldsValue({
      result: 'pass',
      countsToIndicator: val.passed,
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
      rejectAchievement(editing.id, values.approvalOpinion || '审批不通过', '当前审批人');
    } else if (values.result === 'return') {
      returnAchievement(editing.id, values.approvalOpinion || '退回修改', '当前审批人');
    }

    setVisible(false);
    setEditing(null);
    setValidation(null);
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

  const materialStatusColor: Record<string, string> = {
    未提交: 'default',
    待审核: 'processing',
    审核通过: 'success',
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
    {
      title: '责任单位',
      dataIndex: 'unitId',
      key: 'unitId',
      render: (v: string) => unitMap[v] || v,
    },
    { title: '责任人', dataIndex: 'responsiblePerson', key: 'responsiblePerson' },
    {
      title: '进度',
      dataIndex: 'progressStatus',
      key: 'progressStatus',
      render: (v: string) => v || '-',
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
        onCancel={() => {
          setVisible(false);
          setEditing(null);
          setValidation(null);
          form.resetFields();
        }}
      >
        {editing && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="成果类型">{editing.achievementType}</Descriptions.Item>
                <Descriptions.Item label="责任单位">{unitMap[editing.unitId] || editing.unitId}</Descriptions.Item>
                <Descriptions.Item label="责任人">{editing.responsiblePerson}</Descriptions.Item>
                <Descriptions.Item label="当前状态">{editing.status}</Descriptions.Item>
                <Descriptions.Item label="当前进度">{editing.progressStatus || '-'}</Descriptions.Item>
                <Descriptions.Item label="佐证材料规则">
                  {ACHIEVEMENT_EVIDENCE_RULES[editing.achievementType]?.displayText || '-'}
                </Descriptions.Item>
                {editing.achievementType === '学术论文' && (
                  <>
                    <Descriptions.Item label="期刊名称">{editing.journalName || '-'}</Descriptions.Item>
                    <Descriptions.Item label="是否代表性论文">{editing.isRepresentative ? '是' : '否'}</Descriptions.Item>
                    <Descriptions.Item label="是否国内期刊">{editing.isChineseJournal ? '是' : '否'}</Descriptions.Item>
                  </>
                )}
              </Descriptions>
            </div>

            {/* Approval validation result card */}
            {validation && (
              <Card
                size="small"
                title={
                  <Space>
                    <Text strong>系统自动校验</Text>
                    <Tag color={validation.passed ? 'success' : 'error'}>
                      {validation.passed ? '全部通过' : '未通过'}
                    </Tag>
                  </Space>
                }
                style={{ marginBottom: 16 }}
              >
                {validation.checks.map(
                  (check: { label: string; passed: boolean; detail?: string }, idx: number) => (
                    <div
                      key={idx}
                      style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}
                    >
                      {check.passed ? (
                        <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
                      ) : (
                        <CloseCircleFilled style={{ color: '#f5222d', marginRight: 8 }} />
                      )}
                      <Text style={{ flex: 1 }}>{check.label}</Text>
                      {check.detail && (
                        <Text type={check.passed ? 'secondary' : 'danger'} style={{ fontSize: 12 }}>
                          {check.detail}
                        </Text>
                      )}
                    </div>
                  )
                )}
              </Card>
            )}

            {/* Materials display */}
            {editing.materials && editing.materials.length > 0 && (
              <Card size="small" title="佐证材料" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {editing.materials.map((m) => (
                    <div
                      key={m.id}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <Text>{m.materialType || m.name}</Text>
                      <Space>
                        {m.fileName && (
                          <Text type="secondary" style={{ fontSize: 12 }}>{m.fileName}</Text>
                        )}
                        {m.fileId && (
                          <Button
                            size="small"
                            type="link"
                            onClick={() => mockFileService.preview(m.fileId)}
                          >
                            预览
                          </Button>
                        )}
                        {m.fileUrl && (
                          <Button
                            size="small"
                            type="link"
                            href={m.fileUrl}
                            target="_blank"
                          >
                            下载
                          </Button>
                        )}
                        <Tag color={materialStatusColor[m.status] || 'default'}>{m.status}</Tag>
                      </Space>
                    </div>
                  ))}
                </Space>
              </Card>
            )}
          </>
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="审批结论" name="result" initialValue="pass" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="pass">审批通过</Radio>
              <Radio value="reject">审批不通过</Radio>
              <Radio value="return">退回修改</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="是否计入指标"
            name="countsToIndicator"
            valuePropName="checked"
            extra={!validation?.passed ? '系统校验未全部通过，不建议计入指标' : undefined}
          >
            <Switch disabled={!validation?.passed} />
          </Form.Item>

          {editing?.achievementType === '学术论文' && (
            <>
              <Form.Item label="是否代表性论文" name="isRepresentative" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item label="是否国内期刊" name="isChineseJournal" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item label="国内期刊判定说明" name="chineseJournalReason">
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
