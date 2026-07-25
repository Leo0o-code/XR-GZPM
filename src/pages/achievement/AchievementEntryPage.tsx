import { useState } from 'react';
import {
  Button, Card, DatePicker, Form, Input, message, Modal, Select, Space, Table, Tag, Upload, Typography,
} from 'antd';
import dayjs from 'dayjs';
import { EditOutlined, PlusOutlined, SendOutlined, UploadOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store';
import {
  ACHIEVEMENT_STATUS, ACHIEVEMENT_TYPES, ACHIEVEMENT_EVIDENCE_RULES,
  type Achievement, type AchievementMaterial,
} from '../../types';
import { mockFileService } from '../../utils/helpers';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

export function AchievementEntryPage() {
  const {
    project, topics, units, achievements,
    addAchievement, updateAchievement, submitAchievement,
  } = useAppStore();

  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [filter, setFilter] = useState({ topicId: '', unitId: '', achievementType: '', status: '' });
  // Track uploaded files per material name: { materialName: { fileName, fileUrl, fileId } }
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { fileId: string; fileName: string; fileUrl: string }>>({});

  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t]));
  const unitMap = Object.fromEntries(units.map((u) => [u.id, u.name]));

  const selectedTopicId: string | undefined = Form.useWatch('topicId', form);
  const selectedAchievementType: string | undefined = Form.useWatch('achievementType', form);

  const selectedTopic = topics.find((t) => t.id === selectedTopicId);
  const unitOptions = selectedTopic
    ? [selectedTopic.leadingUnitId, ...selectedTopic.participatingUnitIds]
    : [];

  const filtered = achievements.filter((a) => {
    return (
      (!filter.topicId || a.topicId === filter.topicId) &&
      (!filter.unitId || a.unitId === filter.unitId) &&
      (!filter.achievementType || a.achievementType === filter.achievementType) &&
      (!filter.status || a.status === filter.status)
    );
  });

  const handleSave = (values: any) => {
    const today = new Date().toISOString().split('T')[0];

    const otherContributorsArr = values.otherContributors
      ? values.otherContributors.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    const completionDateStr = values.completionDate
      ? dayjs(values.completionDate).format('YYYY-MM-DD')
      : undefined;

    const materialFields: string[] = values._materialFields || [];
    const existingMaterials: AchievementMaterial[] = editing?.materials || [];
    const newMaterials: AchievementMaterial[] = materialFields.map((name: string) => {
      const existing = existingMaterials.find((m) => m.materialType === name || m.name === name);
      const uploaded = uploadedFiles[name];
      if (uploaded) {
        return {
          id: existing?.id || `mat-${Date.now()}-${name}`,
          achievementId: editing?.id || '',
          materialType: name, name,
          fileId: uploaded.fileId,
          fileName: uploaded.fileName,
          fileUrl: uploaded.fileUrl,
          version: 1,
          status: '待审核' as const,
          uploadedAt: today,
        };
      }
      if (existing) return existing;
      return {
        id: `mat-${Date.now()}-${name}`,
        achievementId: editing?.id || '',
        materialType: name, name,
        fileId: '', fileName: '', fileUrl: '', version: 1,
        status: '未提交' as const,
      };
    });

    const newId = editing?.id || `ach-${Date.now()}`;
    const finalMaterials = newMaterials.map((m, idx) => ({
      ...m,
      id: m.id || `mat-${Date.now()}-${idx}`,
      achievementId: newId,
    }));

    const base = {
      projectId: project.id,
      topicId: values.topicId,
      unitId: values.unitId,
      achievementType: values.achievementType,
      nodeId: '',
      indicatorId: '',
      title: values.title,
      responsiblePerson: values.responsiblePerson,
      otherContributors: otherContributorsArr,
      progressStatus: '',
      plannedCompletionDate: completionDateStr,
      remarks: values.remarks || '',
      countsToIndicator: false,
      materials: finalMaterials,
    };

    if (editing) {
      updateAchievement(editing.id, { ...base, updatedAt: today } as any);
      message.success('更新成功');
    } else {
      addAchievement({ ...base, id: newId, status: '草稿', createdAt: today, updatedAt: today } as Achievement);
      message.success('保存草稿成功');
    }
    setVisible(false);
    setEditing(null);
    setUploadedFiles({});
    form.resetFields();
  };

  const openForm = (achievement?: Achievement) => {
    setEditing(achievement || null);
    setUploadedFiles({});
    if (achievement) {
      // Restore uploaded files state from existing materials
      const files: Record<string, { fileId: string; fileName: string; fileUrl: string }> = {};
      achievement.materials.forEach((m) => {
        if (m.fileId) {
          files[m.materialType || m.name] = { fileId: m.fileId, fileName: m.fileName, fileUrl: m.fileUrl };
        }
      });
      setUploadedFiles(files);
      form.setFieldsValue({
        ...achievement,
        completionDate: achievement.plannedCompletionDate ? dayjs(achievement.plannedCompletionDate) : undefined,
        otherContributors: (achievement.otherContributors || []).join(', '),
        _materialFields: achievement.materials.map((m) => m.materialType || m.name),
      });
    } else {
      form.resetFields();
    }
    setVisible(true);
  };

  const statusColor: Record<string, string> = {
    草稿: 'default', 已提交: 'processing', 审批中: 'warning', 审批通过: 'success', 审批不通过: 'error', 退回修改: 'error',
  };

  const columns = [
    { title: '成果名称', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'achievementType', key: 'achievementType' },
    { title: '课题', dataIndex: 'topicId', key: 'topicId', render: (v: string) => topicMap[v]?.name || v },
    { title: '成果完成单位', dataIndex: 'unitId', key: 'unitId', render: (v: string) => unitMap[v] || v },
    { title: '第一完成人', dataIndex: 'responsiblePerson', key: 'responsiblePerson' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={statusColor[v]}>{v}</Tag> },
    {
      title: '操作', key: 'action',
      render: (_: any, record: Achievement) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openForm(record)}>编辑</Button>
          {record.status === '草稿' && (
            <Button type="primary" icon={<SendOutlined />} size="small" onClick={() => { submitAchievement(record.id); message.success('已提交审批'); }}>提交</Button>
          )}
          {record.status === '退回修改' && (
            <Button type="primary" icon={<SendOutlined />} size="small" onClick={() => { submitAchievement(record.id); message.success('已重新提交'); }}>重新提交</Button>
          )}
        </Space>
      ),
    },
  ];

  const evidenceDef = selectedAchievementType ? ACHIEVEMENT_EVIDENCE_RULES[selectedAchievementType as keyof typeof ACHIEVEMENT_EVIDENCE_RULES] : null;
  const evidenceMaterialOptions = evidenceDef
    ? (evidenceDef.rule.type === 'SINGLE' ? evidenceDef.rule.options : evidenceDef.rule.options)
    : [];

  // Check if at least one required material is uploaded (OR rule) or all (SINGLE rule)
  const validateMaterials = () => {
    if (!evidenceDef || evidenceMaterialOptions.length === 0) return true;
    if (evidenceDef.rule.type === 'OR') {
      return evidenceMaterialOptions.some((name) => uploadedFiles[name]);
    }
    // SINGLE: all must be uploaded
    return evidenceMaterialOptions.every((name) => uploadedFiles[name]);
  };

  return (
    <Card title="成果录入" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>新增成果</Button>}>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select placeholder="选择课题" allowClear style={{ width: 200 }} onChange={(v) => setFilter({ ...filter, topicId: v, unitId: '' })}>
          {topics.map((t) => (<Option key={t.id} value={t.id}>{t.name}</Option>))}
        </Select>
        <Select placeholder="成果完成单位" allowClear style={{ width: 160 }} value={filter.unitId || undefined} onChange={(v) => setFilter({ ...filter, unitId: v })}>
          {(() => {
            const topic = topics.find((t) => t.id === filter.topicId);
            if (!topic) return null;
            return [topic.leadingUnitId, ...topic.participatingUnitIds].map((uid) => (<Option key={uid} value={uid}>{unitMap[uid] || uid}</Option>));
          })()}
        </Select>
        <Select placeholder="成果类型" allowClear style={{ width: 140 }} onChange={(v) => setFilter({ ...filter, achievementType: v })}>
          {ACHIEVEMENT_TYPES.map((t) => (<Option key={t} value={t}>{t}</Option>))}
        </Select>
        <Select placeholder="状态" allowClear style={{ width: 140 }} onChange={(v) => setFilter({ ...filter, status: v })}>
          {ACHIEVEMENT_STATUS.map((s) => (<Option key={s} value={s}>{s}</Option>))}
        </Select>
      </Space>

      <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 10 }} scroll={{ x: 1200 }} />

      <Modal title={editing ? '编辑成果' : '新增成果'} open={visible} width={900}
        onOk={() => form.submit()}
        okButtonProps={{ disabled: !!(selectedAchievementType && evidenceMaterialOptions.length > 0 && !validateMaterials()) }}
        onCancel={() => { setVisible(false); setEditing(null); setUploadedFiles({}); form.resetFields(); }}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Space style={{ width: '100%' }} direction="vertical">
            <Form.Item label="所属课题" name="topicId" rules={[{ required: true, message: '请选择课题' }]}>
              <Select placeholder="选择课题" style={{ width: '100%' }} onChange={() => form.setFieldsValue({ unitId: undefined })}>
                {topics.map((t) => (<Option key={t.id} value={t.id}>{t.name}</Option>))}
              </Select>
            </Form.Item>

            <Form.Item label="成果完成单位" name="unitId" rules={[{ required: true, message: '请选择成果完成单位' }]}>
              <Select placeholder="选择成果完成单位" style={{ width: '100%' }} disabled={!selectedTopicId}>
                {unitOptions.map((uid) => (<Option key={uid} value={uid}>{unitMap[uid] || uid}</Option>))}
              </Select>
            </Form.Item>

            <Form.Item label="成果类型" name="achievementType" rules={[{ required: true, message: '请选择成果类型' }]}>
              <Select placeholder="选择成果类型" style={{ width: '100%' }}>
                {ACHIEVEMENT_TYPES.map((t) => (<Option key={t} value={t}>{t}</Option>))}
              </Select>
            </Form.Item>

            <Form.Item label="完成时间" name="completionDate" rules={[{ required: true, message: '请选择完成时间' }]}>
              <DatePicker style={{ width: '100%' }} placeholder="选择完成时间" />
            </Form.Item>

            <Form.Item label="成果名称/题目" name="title" rules={[{ required: true, message: '请输入成果名称' }]}>
              <Input style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="第一完成人" name="responsiblePerson" rules={[{ required: true }]}>
              <Input style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="其他参与人（逗号分隔）" name="otherContributors">
              <Input style={{ width: '100%' }} placeholder="张三, 李四, 王五" />
            </Form.Item>

            <Form.Item label="备注" name="remarks">
              <TextArea rows={2} />
            </Form.Item>

            {/* 佐证材料 — 必填，未上传则不可保存 */}
            {selectedAchievementType && evidenceMaterialOptions.length > 0 && (
              <Card title="佐证材料" size="small" style={{ marginBottom: 12 }}>
                <Form.Item name="_materialFields" noStyle>
                  <Input type="hidden" />
                </Form.Item>
                {evidenceDef && (
                  <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                    {evidenceDef.displayText}
                    {evidenceDef.rule.type === 'OR' ? '（任选其一上传即可）' : '（需全部上传）'}
                  </Text>
                )}
                {evidenceMaterialOptions.map((matName) => {
                  const uploaded = uploadedFiles[matName];
                  return (
                    <div key={matName} style={{ marginBottom: 12, padding: 8, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                      <Space align="center" style={{ width: '100%' }}>
                        <Text strong>{matName}</Text>
                        {uploaded && <Tag color="success">已上传</Tag>}
                        <Upload
                          showUploadList={false}
                          beforeUpload={() => false}
                          onChange={async (info) => {
                            const file = info.file.originFileObj || info.file;
                            if (file) {
                              const result = await mockFileService.upload(file as File);
                              setUploadedFiles((prev) => ({
                                ...prev,
                                [matName]: { fileId: result.fileId, fileName: result.fileName, fileUrl: result.fileUrl },
                              }));
                              message.success(`${matName} 已上传`);
                            }
                          }}
                        >
                          <Button size="small" icon={<UploadOutlined />}>{uploaded ? '重新上传' : '上传'}</Button>
                        </Upload>
                        {uploaded && <Text type="secondary" style={{ fontSize: 12 }}>{uploaded.fileName}</Text>}
                      </Space>
                    </div>
                  );
                })}
              </Card>
            )}

            {/* Hidden validator: blocks save if materials not uploaded */}
            <Form.Item noStyle>
              <Input type="hidden" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
}
