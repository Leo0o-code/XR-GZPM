import { useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Upload,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { EditOutlined, PlusOutlined, SendOutlined, UploadOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store';
import {
  ACHIEVEMENT_STATUS,
  ACHIEVEMENT_TYPES,
  type Achievement,
  type AchievementMaterial,
} from '../../types';
import { getProgressOptions } from '../../utils/helpers';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

export function AchievementEntryPage() {
  const {
    project,
    topics,
    nodes,
    indicators,
    achievements,
    addAchievement,
    updateAchievement,
    submitAchievement,
  } = useAppStore();

  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [filter, setFilter] = useState({
    topicId: '',
    unitName: '',
    achievementType: '',
    status: '',
  });

  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t]));
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const indicatorMap = Object.fromEntries(indicators.map((i) => [i.id, i]));

  // Cascading option helpers
  const selectedTopicId: string | undefined = Form.useWatch('topicId', form);
  const selectedAchievementType: string | undefined = Form.useWatch('achievementType', form);
  const selectedNodeId: string | undefined = Form.useWatch('nodeId', form);
  const selectedUnitName: string | undefined = Form.useWatch('unitName', form);
  const selectedIndicatorId: string | undefined = Form.useWatch('indicatorId', form);

  const selectedTopic = topics.find((t) => t.id === selectedTopicId);
  const unitOptions = selectedTopic
    ? [selectedTopic.leadingUnit, ...selectedTopic.participatingUnits]
    : [];

  // Nodes that have published indicators for the selected topic/unit/type
  const filteredNodes = nodes.filter((n) => {
    if (!n.enabled) return false;
    return indicators.some(
      (i) =>
        i.enabled &&
        (i.status === '已发布' || i.status === '已调整') &&
        i.nodeId === n.id &&
        (!selectedTopicId || i.topicId === selectedTopicId) &&
        (!selectedUnitName || i.unitName === selectedUnitName) &&
        (!selectedAchievementType || i.achievementType === selectedAchievementType)
    );
  });

  // Published indicators matching the selected topic/unit/type/node
  const filteredIndicators = indicators.filter(
    (i) =>
      i.enabled &&
      (i.status === '已发布' || i.status === '已调整') &&
      (!selectedTopicId || i.topicId === selectedTopicId) &&
      (!selectedUnitName || i.unitName === selectedUnitName) &&
      (!selectedAchievementType || i.achievementType === selectedAchievementType) &&
      (!selectedNodeId || i.nodeId === selectedNodeId)
  );

  const selectedIndicator = indicatorMap[selectedIndicatorId || ''];

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

    const otherContributorsArr = values.otherContributors
      ? values.otherContributors.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    // Gather material upload entries from form
    const materialFields: string[] = values._materialFields || [];
    const existingMaterials: AchievementMaterial[] = editing?.materials || [];
    const newMaterials: AchievementMaterial[] = materialFields.map((name: string) => {
      const existing = existingMaterials.find(
        (m) => m.materialType === name || m.name === name
      );
      if (existing) return existing;
      return {
        id: `mat-${Date.now()}-${name}`,
        achievementId: editing?.id || '',
        materialType: name,
        name,
        fileName: '',
        fileUrl: '',
        version: 1,
        status: '未提交' as const,
      };
    });

    const plannedDateStr = values.plannedCompletionDate
      ? dayjs(values.plannedCompletionDate).format('YYYY-MM-DD')
      : undefined;

    // Fix achievementId on materials before creating
    const newId = editing?.id || `ach-${Date.now()}`;
    const finalMaterials = newMaterials.map((m, idx) => ({
      ...m,
      id: m.id || `mat-${Date.now()}-${idx}`,
      achievementId: newId,
    }));

    const base = {
      projectId: project.id,
      topicId: values.topicId,
      unitName: values.unitName,
      achievementType: values.achievementType,
      nodeId: values.nodeId,
      indicatorId: values.indicatorId,
      title: values.title,
      responsiblePerson: values.responsiblePerson,
      otherContributors: otherContributorsArr,
      progressStatus: values.progressStatus || '',
      plannedCompletionDate: plannedDateStr,
      remarks: values.remarks || '',
      countsToIndicator: false,
      materials: finalMaterials,
    };

    if (editing) {
      updateAchievement(editing.id, { ...base, updatedAt: today });
      message.success('更新成功');
    } else {
      addAchievement({
        ...base,
        id: newId,
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
      form.setFieldsValue({
        ...achievement,
        otherContributors: (achievement.otherContributors || []).join(', '),
        plannedCompletionDate: achievement.plannedCompletionDate
          ? dayjs(achievement.plannedCompletionDate)
          : undefined,
        _materialFields: achievement.materials.map((m) => m.materialType || m.name),
      });
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
    {
      title: '责任单位',
      dataIndex: 'unitName',
      key: 'unitName',
    },
    {
      title: '进度状态',
      dataIndex: 'progressStatus',
      key: 'progressStatus',
      render: (v: string) =>
        v ? <Tag color="processing">{v}</Tag> : '-',
    },
    {
      title: '指标',
      key: 'indicatorInfo',
      render: (_: any, record: Achievement) => {
        const ind = indicatorMap[record.indicatorId];
        if (!ind) return <Tag>未关联</Tag>;
        return (
          <Space size="small">
            <Tag color="blue">{ind.recognitionStatus}</Tag>
            <span style={{ fontSize: 12 }}>
              {nodeMap[ind.nodeId]?.name || ind.nodeId}
            </span>
          </Space>
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
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openForm(record)}
          >
            编辑
          </Button>
          {record.status === '草稿' && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              size="small"
              onClick={() => {
                submitAchievement(record.id);
                message.success('已提交审批');
              }}
            >
              提交
            </Button>
          )}
          {record.status === '退回修改' && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              size="small"
              onClick={() => {
                submitAchievement(record.id);
                message.success('已重新提交');
              }}
            >
              重新提交
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const progressOptions = getProgressOptions(selectedAchievementType || '');

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
            <Option key={t.id} value={t.id}>
              {t.name}
            </Option>
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
              <Option key={u} value={u}>
                {u}
              </Option>
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
            <Option key={t} value={t}>
              {t}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="状态"
          allowClear
          style={{ width: 140 }}
          onChange={(v) => setFilter({ ...filter, status: v })}
        >
          {ACHIEVEMENT_STATUS.map((s) => (
            <Option key={s} value={s}>
              {s}
            </Option>
          ))}
        </Select>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1400 }}
      />

      <Modal
        title={editing ? '编辑成果' : '新增成果'}
        open={visible}
        width={900}
        onOk={() => form.submit()}
        onCancel={() => {
          setVisible(false);
          setEditing(null);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {/* Cascading selections */}
          <Space style={{ width: '100%' }} direction="vertical">
            <Form.Item
              label="所属课题"
              name="topicId"
              rules={[{ required: true, message: '请选择课题' }]}
            >
              <Select
                placeholder="选择课题"
                style={{ width: '100%' }}
                onChange={() => {
                  form.setFieldsValue({
                    unitName: undefined,
                    nodeId: undefined,
                    indicatorId: undefined,
                  });
                }}
              >
                {topics.map((t) => (
                  <Option key={t.id} value={t.id}>
                    {t.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="责任单位"
              name="unitName"
              rules={[{ required: true, message: '请选择责任单位' }]}
            >
              <Select
                placeholder="选择责任单位"
                style={{ width: '100%' }}
                disabled={!selectedTopicId}
                onChange={() => {
                  form.setFieldsValue({ nodeId: undefined, indicatorId: undefined });
                }}
              >
                {unitOptions.map((u) => (
                  <Option key={u} value={u}>
                    {u}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="成果类型"
              name="achievementType"
              rules={[{ required: true, message: '请选择成果类型' }]}
            >
              <Select
                placeholder="选择成果类型"
                style={{ width: '100%' }}
                onChange={() => {
                  form.setFieldsValue({ nodeId: undefined, indicatorId: undefined });
                }}
              >
                {ACHIEVEMENT_TYPES.map((t) => (
                  <Option key={t} value={t}>
                    {t}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="时间节点"
              name="nodeId"
              rules={[{ required: true, message: '请选择时间节点' }]}
            >
              <Select
                placeholder="选择时间节点"
                style={{ width: '100%' }}
                disabled={
                  !selectedTopicId ||
                  !selectedUnitName ||
                  !selectedAchievementType
                }
                onChange={() => {
                  form.setFieldsValue({ indicatorId: undefined });
                }}
              >
                {filteredNodes.map((n) => (
                  <Option key={n.id} value={n.id}>
                    {n.name}（{n.deadline}）
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="对应指标"
              name="indicatorId"
              rules={[{ required: true, message: '请选择对应指标' }]}
            >
              <Select
                placeholder="选择指标"
                style={{ width: '100%' }}
                disabled={!selectedNodeId}
                onChange={(val) => {
                  const ind = indicatorMap[val];
                  if (ind) {
                    form.setFieldsValue({
                      _materialFields: ind.materialRequirements || [],
                    });
                  }
                }}
              >
                {filteredIndicators.map((ind) => (
                  <Option key={ind.id} value={ind.id}>
                    认定条件：{ind.recognitionStatus} | 累计要求：{ind.plannedQuantity}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* Indicator info display */}
            {selectedIndicator && (
              <Card size="small" style={{ marginBottom: 12, background: '#f0f5ff' }}>
                <Space direction="vertical" size={4}>
                  <Text strong>
                    认定条件：{selectedIndicator.recognitionStatus}
                  </Text>
                  <Text>累计要求数量：{selectedIndicator.plannedQuantity}</Text>
                  <Text>
                    必交材料：{selectedIndicator.materialRequirements.join('、') || '无'}
                  </Text>
                </Space>
              </Card>
            )}

            <Form.Item
              label="成果名称/题目"
              name="title"
              rules={[{ required: true, message: '请输入成果名称' }]}
            >
              <Input style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="第一完成人/责任人"
              name="responsiblePerson"
              rules={[{ required: true }]}
            >
              <Input style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="其他参与人（逗号分隔）" name="otherContributors">
              <Input style={{ width: '100%' }} placeholder="张三, 李四, 王五" />
            </Form.Item>

            <Form.Item
              label="当前进度"
              name="progressStatus"
              rules={[{ required: true, message: '请选择当前进度' }]}
            >
              <Select placeholder="选择进度" style={{ width: '100%' }}>
                {progressOptions.map((o) => (
                  <Option key={o} value={o}>
                    {o}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="计划完成日期" name="plannedCompletionDate">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="备注" name="remarks">
              <TextArea rows={2} />
            </Form.Item>

            {/* Material upload area */}
            {selectedIndicator &&
              selectedIndicator.materialRequirements.length > 0 && (
                <Card
                  title="佐证材料"
                  size="small"
                  style={{ marginBottom: 12 }}
                >
                  <Form.Item name="_materialFields" noStyle>
                    {/* Hidden field to track material names */}
                    <Input type="hidden" />
                  </Form.Item>
                  {selectedIndicator.materialRequirements.map((matName) => {
                    const existingMat = editing?.materials.find(
                      (m) => m.materialType === matName || m.name === matName
                    );
                    return (
                      <div
                        key={matName}
                        style={{
                          marginBottom: 12,
                          padding: 8,
                          border: '1px solid #f0f0f0',
                          borderRadius: 4,
                        }}
                      >
                        <Space align="center" style={{ width: '100%' }}>
                          <Text strong>{matName}</Text>
                          {existingMat && (
                            <Tag
                              color={
                                existingMat.status === '审核通过'
                                  ? 'success'
                                  : existingMat.status === '待审核'
                                  ? 'processing'
                                  : existingMat.status === '退回修改'
                                  ? 'error'
                                  : 'default'
                              }
                            >
                              {existingMat.status}
                            </Tag>
                          )}
                          <Upload
                            showUploadList={false}
                            beforeUpload={() => false}
                          >
                            <Button
                              size="small"
                              icon={<UploadOutlined />}
                            >
                              上传
                            </Button>
                          </Upload>
                          {existingMat?.fileName && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {existingMat.fileName}
                            </Text>
                          )}
                        </Space>
                      </div>
                    );
                  })}
                </Card>
              )}
          </Space>
        </Form>
      </Modal>
    </Card>
  );
}
