import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, DatePicker, Form, Input, InputNumber, message, Select, Space, Switch } from 'antd';
import dayjs from 'dayjs';
import { useAppStore } from '../../store';
import { ACHIEVEMENT_TYPES } from '../../types';
import { useMemo } from 'react';

const { Option } = Select;
const { TextArea } = Input;

export function IndicatorEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { indicators, topics, addIndicator, updateIndicator, project } = useAppStore();

  const isNew = id === 'new';
  const existing = useMemo(() => indicators.find((i) => i.id === id), [indicators, id]);

  const onFinish = (values: any) => {
    const payload = {
      projectId: project.id,
      topicId: values.topicId,
      achievementType: values.achievementType,
      node: values.node,
      plannedQuantity: values.plannedQuantity,
      deadline: values.deadline.format('YYYY-MM-DD'),
      recognitionStatus: values.recognitionStatus,
      materialRequirements: values.materialRequirements?.split('\n').filter(Boolean) || [],
      earlyWarningDays: values.earlyWarningDays || [90, 60, 30],
      enabled: values.enabled,
      remarks: values.remarks || '',
      status: values.status || '草稿',
      version: existing?.version || 1,
      versionId: existing?.versionId || `v${Date.now()}`,
      effectiveDate: new Date().toISOString().split('T')[0],
    };

    if (isNew) {
      addIndicator({ ...payload, id: `i-${Date.now()}` } as any);
      message.success('新增成功');
    } else {
      updateIndicator(id!, payload, values.changeReason || '编辑更新', '当前管理员');
      message.success('更新成功');
    }
    navigate('/admin');
  };

  return (
    <Card title={isNew ? '新增指标配置' : '编辑指标配置'}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={
          existing
            ? {
                ...existing,
                deadline: dayjs(existing.deadline),
                materialRequirements: existing.materialRequirements.join('\n'),
              }
            : {
                enabled: true,
                status: '草稿',
                earlyWarningDays: [90, 60, 30],
                materialRequirements: '',
              }
        }
      >
        <Form.Item label="课题" name="topicId" rules={[{ required: true }]}>
          <Select placeholder="选择课题">
            {topics.map((t) => (
              <Option key={t.id} value={t.id}>{t.name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="成果类型" name="achievementType" rules={[{ required: true }]}>
          <Select placeholder="选择成果类型">
            {ACHIEVEMENT_TYPES.map((t) => (
              <Option key={t} value={t}>{t}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="考核节点" name="node" rules={[{ required: true }]}>
          <Select placeholder="选择或输入节点" allowClear showSearch mode="tags">
            {['中期', '结项'].map((n) => (
              <Option key={n} value={n}>{n}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="计划数量" name="plannedQuantity" rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="计划完成日期" name="deadline" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="认定状态" name="recognitionStatus" rules={[{ required: true }]}>
          <Input placeholder="例如：已录用、已受理、已取得证书" />
        </Form.Item>

        <Form.Item
          label="佐证材料要求"
          name="materialRequirements"
          extra="每行一个材料名称"
        >
          <TextArea rows={3} placeholder="例如：录用通知&#10;论文全文" />
        </Form.Item>

        <Form.Item label="提前预警天数" name="earlyWarningDays">
          <Select mode="tags" tokenSeparators={[',']} placeholder="输入预警天数">
            {[30, 60, 90].map((d) => (
              <Option key={d} value={d}>{d}天</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="是否启用" name="enabled" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="配置状态" name="status">
          <Select>
            {['草稿', '已发布', '已调整', '已停用'].map((s) => (
              <Option key={s} value={s}>{s}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="备注" name="remarks">
          <TextArea rows={2} />
        </Form.Item>

        {!isNew && (
          <Form.Item label="调整原因" name="changeReason" rules={[{ required: !isNew }]}>
            <Input placeholder="记录本次调整原因" />
          </Form.Item>
        )}

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">保存</Button>
            <Button onClick={() => navigate('/admin')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
