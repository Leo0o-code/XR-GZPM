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
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  HistoryOutlined,
  PlusOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../store';
import {
  ACHIEVEMENT_TYPES,
  type IndicatorConfig,
  type TimeNode,
  type Topic,
} from '../../types';
import { validateIndicator } from '../../utils/validation';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

export function IndicatorConfigPage() {
  const {
    project,
    topics,
    nodes,
    indicators,
    versionRecords,
    chineseJournalConfig,
    addNode,
    updateNode,
    removeNode,
    addIndicator,
    updateIndicator,
    publishIndicator,
    deactivateIndicator,
    updateTopic,
    updateChineseJournalConfig,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('nodes');
  const [nodeFormVisible, setNodeFormVisible] = useState(false);
  const [editingNode, setEditingNode] = useState<TimeNode | null>(null);
  const [indicatorFormVisible, setIndicatorFormVisible] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<IndicatorConfig | null>(null);
  const [topicFormVisible, setTopicFormVisible] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  const [nodeForm] = Form.useForm();
  const [indicatorForm] = Form.useForm();
  const [topicForm] = Form.useForm();
  const [cjForm] = Form.useForm();

  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t]));
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const sortedNodes = [...nodes].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleSaveNode = (values: any) => {
    const payload = {
      projectId: project.id,
      name: values.name,
      deadline: values.deadline,
      description: values.description || '',
      participatesInWarning: values.participatesInWarning,
      enabled: values.enabled,
      sortOrder: values.sortOrder,
    };
    if (editingNode) {
      updateNode(editingNode.id, payload);
      message.success('更新时间节点成功');
    } else {
      addNode({ ...payload, id: `node-${Date.now()}` });
      message.success('新增时间节点成功');
    }
    setNodeFormVisible(false);
    setEditingNode(null);
    nodeForm.resetFields();
  };

  const handleSaveIndicator = (values: any) => {
    const topic = topicMap[values.topicId];
    const unitOptions = topic
      ? [topic.leadingUnit, ...topic.participatingUnits]
      : [];
    const unitName = unitOptions[values.unitIndex];

    const payload: Partial<IndicatorConfig> = {
      projectId: project.id,
      topicId: values.topicId,
      unitName,
      achievementType: values.achievementType,
      nodeId: values.nodeId,
      plannedQuantity: values.plannedQuantity,
      recognitionStatus: values.recognitionStatus,
      materialRequirements:
        values.materialRequirements?.split('\n').filter(Boolean) || [],
      enabled: values.enabled,
      remarks: values.remarks || '',
      status: values.status || '草稿',
      effectiveDate: new Date().toISOString().split('T')[0],
    };

    const candidate = { ...editingIndicator, ...payload } as IndicatorConfig;
    candidate.id = candidate.id || `ind-${Date.now()}`;
    const errors = validateIndicator(candidate, indicators, nodes, topics);
    if (errors.length > 0) {
      message.error(errors.map((e) => e.message).join('；'));
      return;
    }

    if (editingIndicator) {
      updateIndicator(
        editingIndicator.id,
        payload,
        values.changeReason || '编辑更新',
        '当前管理员'
      );
      message.success('更新指标成功');
    } else {
      addIndicator({
        ...(payload as IndicatorConfig),
        id: `ind-${Date.now()}`,
        version: 1,
        versionId: `v${Date.now()}`,
      });
      message.success('新增指标成功');
    }
    setIndicatorFormVisible(false);
    setEditingIndicator(null);
    indicatorForm.resetFields();
  };

  const openNodeForm = (node?: TimeNode) => {
    setEditingNode(node || null);
    if (node) {
      nodeForm.setFieldsValue({ ...node });
    } else {
      nodeForm.resetFields();
      nodeForm.setFieldsValue({
        participatesInWarning: true,
        enabled: true,
        sortOrder: nodes.length + 1,
      });
    }
    setNodeFormVisible(true);
  };

  const openIndicatorForm = (indicator?: IndicatorConfig) => {
    setEditingIndicator(indicator || null);
    if (indicator) {
      const topic = topicMap[indicator.topicId];
      const unitOptions = topic
        ? [topic.leadingUnit, ...topic.participatingUnits]
        : [];
      const unitIndex = unitOptions.indexOf(indicator.unitName);
      indicatorForm.setFieldsValue({
        ...indicator,
        topicId: indicator.topicId,
        unitIndex,
        materialRequirements: indicator.materialRequirements.join('\n'),
      });
    } else {
      indicatorForm.resetFields();
      indicatorForm.setFieldsValue({ enabled: true, status: '草稿' });
    }
    setIndicatorFormVisible(true);
  };

  // ---- Topic form handlers ----
  const handleSaveTopic = (values: any) => {
    const units = values.participatingUnits
      ? values.participatingUnits
          .split(/[,，\n]/)
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];
    const payload = {
      code: values.code,
      name: values.name,
      leadingUnit: values.leadingUnit,
      participatingUnits: units,
      remarks: values.remarks || '',
    };
    if (editingTopic) {
      updateTopic(editingTopic.id, payload);
      message.success('更新课题成功');
    }
    setTopicFormVisible(false);
    setEditingTopic(null);
    topicForm.resetFields();
  };

  const openTopicForm = (topic?: Topic) => {
    setEditingTopic(topic || null);
    if (topic) {
      topicForm.setFieldsValue({
        ...topic,
        participatingUnits: topic.participatingUnits.join(', '),
      });
    } else {
      topicForm.resetFields();
    }
    setTopicFormVisible(true);
  };

  // ---- Chinese journal config handler ----
  const handleSaveCJ = () => {
    const values = cjForm.getFieldsValue();
    const topicMinCounts: Record<string, number> = {};
    topics.forEach((t) => {
      const fieldKey = `topicMin_${t.id}`;
      const val = cjForm.getFieldValue(fieldKey);
      if (val !== undefined && val !== null) {
        topicMinCounts[t.id] = val;
      }
    });
    updateChineseJournalConfig({
      enabled: values.enabled,
      scope: values.scope,
      minChineseJournalRatio: values.minChineseJournalRatio,
      minChineseJournalCount: values.minChineseJournalCount,
      decomposeToTopics: values.decomposeToTopics,
      topicMinCounts,
      remarks: values.remarks || '',
      effectiveDate: new Date().toISOString().split('T')[0],
    });
    message.success('保存我国科技期刊配置成功');
  };

  // Load CJ config into form when tab is switched
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'chineseJournal') {
      cjForm.setFieldsValue({
        enabled: chineseJournalConfig.enabled,
        scope: chineseJournalConfig.scope,
        minChineseJournalRatio: chineseJournalConfig.minChineseJournalRatio,
        minChineseJournalCount: chineseJournalConfig.minChineseJournalCount,
        decomposeToTopics: chineseJournalConfig.decomposeToTopics,
        remarks: chineseJournalConfig.remarks,
      });
      // Set topic min counts
      Object.entries(chineseJournalConfig.topicMinCounts).forEach(
        ([tid, val]) => {
          cjForm.setFieldsValue({ [`topicMin_${tid}`]: val });
        }
      );
    }
  };

  const decomposeToTopics = Form.useWatch('decomposeToTopics', cjForm);

  // Column definitions
  const nodeColumns = [
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 70 },
    { title: '节点名称', dataIndex: 'name', key: 'name' },
    { title: '截止时间', dataIndex: 'deadline', key: 'deadline' },
    {
      title: '节点说明',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '参与预警',
      dataIndex: 'participatesInWarning',
      key: 'participatesInWarning',
      render: (v: boolean) =>
        v ? <Tag color="blue">是</Tag> : <Tag>否</Tag>,
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (v: boolean) =>
        v ? <Tag color="green">是</Tag> : <Tag>否</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TimeNode) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openNodeForm(record)}
          >
            编辑
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            size="small"
            onClick={() => removeNode(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const indicatorColumns = [
    {
      title: '课题',
      dataIndex: 'topicId',
      key: 'topicId',
      render: (v: string) => topicMap[v]?.name || v,
    },
    { title: '责任单位', dataIndex: 'unitName', key: 'unitName' },
    { title: '成果类型', dataIndex: 'achievementType', key: 'achievementType' },
    {
      title: '时间节点',
      dataIndex: 'nodeId',
      key: 'nodeId',
      render: (v: string) => nodeMap[v]?.name || v,
    },
    {
      title: '累计要求',
      dataIndex: 'plannedQuantity',
      key: 'plannedQuantity',
    },
    {
      title: '认定条件',
      dataIndex: 'recognitionStatus',
      key: 'recognitionStatus',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const color =
          v === '已发布'
            ? 'green'
            : v === '草稿'
            ? 'default'
            : v === '已调整'
            ? 'blue'
            : 'red';
        return <Tag color={color}>{v}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: IndicatorConfig) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openIndicatorForm(record)}
          >
            编辑
          </Button>
          {record.status === '草稿' && (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                publishIndicator(record.id, '当前管理员');
                message.success('已发布');
              }}
            >
              发布
            </Button>
          )}
          {(record.status === '已发布' || record.status === '已调整') && (
            <Button
              danger
              size="small"
              onClick={() => {
                deactivateIndicator(record.id, '当前管理员');
                message.success('已停用');
              }}
            >
              停用
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const versionColumns = [
    { title: '指标ID', dataIndex: 'configId', key: 'configId' },
    { title: '字段', dataIndex: 'fieldName', key: 'fieldName' },
    { title: '调整前', dataIndex: 'beforeValue', key: 'beforeValue' },
    { title: '调整后', dataIndex: 'afterValue', key: 'afterValue' },
    { title: '原因', dataIndex: 'reason', key: 'reason' },
    { title: '操作人', dataIndex: 'operator', key: 'operator' },
    { title: '操作时间', dataIndex: 'operatedAt', key: 'operatedAt' },
  ];

  const topicColumns = [
    { title: '课题代码', dataIndex: 'code', key: 'code', width: 120 },
    { title: '课题名称', dataIndex: 'name', key: 'name' },
    {
      title: '牵头单位',
      dataIndex: 'leadingUnit',
      key: 'leadingUnit',
      width: 180,
    },
    {
      title: '参与单位',
      dataIndex: 'participatingUnits',
      key: 'participatingUnits',
      render: (units: string[]) => (
        <Space wrap>
          {units.map((u, idx) => (
            <Tag key={idx}>{u}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: Topic) => (
        <Button
          icon={<EditOutlined />}
          size="small"
          onClick={() => openTopicForm(record)}
        >
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane
          tab={
            <span>
              <TableOutlined /> 时间节点
            </span>
          }
          key="nodes"
        >
          <Card
            title="时间节点配置"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openNodeForm()}
              >
                新增节点
              </Button>
            }
          >
            <Table
              rowKey="id"
              columns={nodeColumns}
              dataSource={sortedNodes}
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <TableOutlined /> 指标分解
            </span>
          }
          key="indicators"
        >
          <Card
            title="科研成果指标分解"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openIndicatorForm()}
              >
                新增指标
              </Button>
            }
          >
            <Table
              rowKey="id"
              columns={indicatorColumns}
              dataSource={indicators}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <TableOutlined /> 课题及单位
            </span>
          }
          key="topics"
        >
          <Card title="课题及单位配置">
            <Table
              rowKey="id"
              columns={topicColumns}
              dataSource={topics}
              pagination={false}
              scroll={{ x: 800 }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <TableOutlined /> 我国科技期刊要求
            </span>
          }
          key="chineseJournal"
        >
          <Card
            title="我国科技期刊论文配置"
            extra={
              <Button type="primary" onClick={handleSaveCJ}>
                保存配置
              </Button>
            }
          >
            <Form form={cjForm} layout="vertical">
              <Form.Item
                label="启用我国科技期刊要求"
                name="enabled"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item label="适用范围" name="scope">
                <Select style={{ width: '100%' }}>
                  <Option value="项目总体">项目总体</Option>
                  <Option value="按课题">按课题</Option>
                </Select>
              </Form.Item>
              <Form.Item
                label="最低我国科技期刊比例（%）"
                name="minChineseJournalRatio"
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                label="最低我国科技期刊数量"
                name="minChineseJournalCount"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                label="分解到各课题"
                name="decomposeToTopics"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              {decomposeToTopics && (
                <Card
                  title="各课题最低我国科技期刊数量"
                  size="small"
                  style={{ marginBottom: 16 }}
                >
                  {topics.map((t) => (
                    <Form.Item
                      key={t.id}
                      label={t.name}
                      name={`topicMin_${t.id}`}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  ))}
                </Card>
              )}

              <Form.Item label="备注" name="remarks">
                <TextArea rows={3} />
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <HistoryOutlined /> 版本记录
            </span>
          }
          key="versions"
        >
          <Card title="指标配置调整记录">
            <Table
              rowKey="id"
              columns={versionColumns}
              dataSource={[...versionRecords].sort((a, b) =>
                b.operatedAt.localeCompare(a.operatedAt)
              )}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Node Form Modal */}
      <Modal
        title={editingNode ? '编辑时间节点' : '新增时间节点'}
        open={nodeFormVisible}
        onOk={() => nodeForm.submit()}
        onCancel={() => {
          setNodeFormVisible(false);
          setEditingNode(null);
          nodeForm.resetFields();
        }}
      >
        <Form form={nodeForm} layout="vertical" onFinish={handleSaveNode}>
          <Form.Item
            label="节点名称"
            name="name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="截止时间"
            name="deadline"
            rules={[{ required: true }]}
          >
            {/* @ts-ignore */}
            <Input type="date" />
          </Form.Item>
          <Form.Item label="节点说明" name="description">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item
            label="排序"
            name="sortOrder"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="参与预警"
            name="participatesInWarning"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item label="启用" name="enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Indicator Form Modal */}
      <Modal
        title={editingIndicator ? '编辑指标配置' : '新增指标配置'}
        open={indicatorFormVisible}
        width={700}
        onOk={() => indicatorForm.submit()}
        onCancel={() => {
          setIndicatorFormVisible(false);
          setEditingIndicator(null);
          indicatorForm.resetFields();
        }}
      >
        <Form
          form={indicatorForm}
          layout="vertical"
          onFinish={handleSaveIndicator}
        >
          <Form.Item
            label="所属课题"
            name="topicId"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="选择课题"
              onChange={() =>
                indicatorForm.setFieldsValue({ unitIndex: undefined })
              }
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
            name="unitIndex"
            rules={[{ required: true, message: '请选择责任单位' }]}
          >
            <Select placeholder="选择责任单位">
              {(() => {
                const topic =
                  topicMap[indicatorForm.getFieldValue('topicId')];
                if (!topic) return null;
                return [topic.leadingUnit, ...topic.participatingUnits].map(
                  (unit, idx) => (
                    <Option key={idx} value={idx}>
                      {unit}
                    </Option>
                  )
                );
              })()}
            </Select>
          </Form.Item>

          <Form.Item
            label="成果类型"
            name="achievementType"
            rules={[{ required: true }]}
          >
            <Select placeholder="选择成果类型">
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
            rules={[{ required: true }]}
          >
            <Select placeholder="选择时间节点">
              {nodes.map((n) => (
                <Option key={n.id} value={n.id}>
                  {n.name}（{n.deadline}）
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="累计要求数量"
            name="plannedQuantity"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="成果认定条件"
            name="recognitionStatus"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="佐证材料要求" name="materialRequirements">
            <TextArea rows={3} placeholder="每行一项" />
          </Form.Item>

          <Form.Item label="状态" name="status">
            <Select>
              {['草稿', '已发布', '已调整', '已停用'].map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="启用" name="enabled" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="备注" name="remarks">
            <TextArea rows={2} />
          </Form.Item>

          {editingIndicator && (
            <Form.Item
              label="调整原因"
              name="changeReason"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Topic Edit Modal */}
      <Modal
        title="编辑课题"
        open={topicFormVisible}
        width={600}
        onOk={() => topicForm.submit()}
        onCancel={() => {
          setTopicFormVisible(false);
          setEditingTopic(null);
          topicForm.resetFields();
        }}
      >
        <Form form={topicForm} layout="vertical" onFinish={handleSaveTopic}>
          <Form.Item
            label="课题代码"
            name="code"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="课题名称"
            name="name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="牵头单位"
            name="leadingUnit"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="参与单位（逗号分隔）"
            name="participatingUnits"
          >
            <TextArea rows={3} placeholder="单位A, 单位B, 单位C" />
          </Form.Item>
          <Form.Item label="备注" name="remarks">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
