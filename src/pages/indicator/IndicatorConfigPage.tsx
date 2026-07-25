import { useState, useMemo } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import {
  DeleteOutlined,
  EditOutlined,
  HistoryOutlined,
  PlusOutlined,
  TableOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../store';
import {
  ACHIEVEMENT_EVIDENCE_RULES,
  ACHIEVEMENT_TYPES,
  type AchievementType,
  type IndicatorConfig,
  type TimeNode,
  type Topic,
} from '../../types';
import { exportToExcel } from '../../utils/export';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

export function IndicatorConfigPage() {
  const {
    project,
    topics,
    units,
    nodes,
    indicators,
    domesticJournalConfig,
    operationRecords,
    addNode,
    updateNode,
    removeNode,
    addIndicator,
    removeIndicator,
    batchUpdateIndicators,
    updateTopic,
    updateDomesticJournalConfig,
    addOperationRecord,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('topics-indicators');
  const [nodeFormVisible, setNodeFormVisible] = useState(false);
  const [editingNode, setEditingNode] = useState<TimeNode | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');

  const [nodeForm] = Form.useForm();
  const [cjForm] = Form.useForm();
  const [topicForm] = Form.useForm();

  // Topic edit modal
  const [topicEditVisible, setTopicEditVisible] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  // Operation record filters
  const [opFilter, setOpFilter] = useState({
    module: '',
    operationType: '',
    keyword: '',
  });

  // Maps
  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t]));
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const unitMap = Object.fromEntries(units.map((u) => [u.id, u.name]));

  const sortedNodes = [...nodes].sort((a, b) => a.sortOrder - b.sortOrder);

  // ---- TimeNode handlers ----
  const handleSaveNode = (values: any) => {
    const payload = {
      projectId: project.id,
      name: values.name,
      deadline: values.deadline ? dayjs(values.deadline).format('YYYY-MM-DD') : '',
      description: values.description || '',
      participatesInWarning: values.participatesInWarning,
      sortOrder: values.sortOrder,
    };
    if (editingNode) {
      updateNode(editingNode.id, payload);
      addOperationRecord({
        id: `or-${Date.now()}`,
        projectId: project.id,
        module: '时间节点配置',
        operationType: '修改',
        objectType: '时间节点',
        objectId: editingNode.id,
        objectName: payload.name,
        description: `修改时间节点：${payload.name}`,
        operator: '当前用户',
        operatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      });
      message.success('更新时间节点成功');
    } else {
      const id = `node-${Date.now()}`;
      addNode({ ...payload, id });
      addOperationRecord({
        id: `or-${Date.now()}`,
        projectId: project.id,
        module: '时间节点配置',
        operationType: '新增',
        objectType: '时间节点',
        objectId: id,
        objectName: payload.name,
        description: `新增时间节点：${payload.name}`,
        operator: '当前用户',
        operatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      });
      message.success('新增时间节点成功');
    }
    setNodeFormVisible(false);
    setEditingNode(null);
    nodeForm.resetFields();
  };

  const openNodeForm = (node?: TimeNode) => {
    setEditingNode(node || null);
    if (node) {
      nodeForm.setFieldsValue({
        ...node,
        deadline: node.deadline ? dayjs(node.deadline) : undefined,
      });
    } else {
      nodeForm.resetFields();
      nodeForm.setFieldsValue({
        participatesInWarning: true,
        sortOrder: nodes.length + 1,
      });
    }
    setNodeFormVisible(true);
  };

  // ---- Topic detail / indicator matrix ----
  const selectedTopic = selectedTopicId ? topicMap[selectedTopicId] : null;
  const selectedNode = selectedNodeId ? nodeMap[selectedNodeId] : null;

  // Units for the selected topic
  const topicUnitIds = selectedTopic
    ? [selectedTopic.leadingUnitId, ...selectedTopic.participatingUnitIds]
    : [];

  // Indicators for the selected topic
  const topicIndicators = selectedTopicId
    ? indicators.filter((i) => i.topicId === selectedTopicId)
    : [];

  // Build matrix: rows = units, columns = achievement types
  const matrixData = useMemo(() => {
    if (!selectedTopic || !selectedNodeId) return { rows: [], totals: {} as Record<string, number>, topicRequired: {} as Record<string, number> };

    const rows = topicUnitIds.map((unitId) => {
      const cells: Record<string, IndicatorConfig | undefined> = {};
      ACHIEVEMENT_TYPES.forEach((type) => {
        cells[type] = topicIndicators.find(
          (i) => i.unitId === unitId && i.achievementType === type && i.nodeId === selectedNodeId
        );
      });
      return { unitId, unitName: unitMap[unitId] || unitId, cells };
    });

    // Calculate totals and topic requirements
    const totals: Record<string, number> = {};
    const topicRequired: Record<string, number> = {};
    ACHIEVEMENT_TYPES.forEach((type) => {
      totals[type] = rows.reduce((sum, row) => sum + (row.cells[type]?.plannedQuantity || 0), 0);
      // Find all indicators for this topic+type+node across all units to get total
      const allForType = topicIndicators.filter(
        (i) => i.achievementType === type && i.nodeId === selectedNodeId
      );
      // topic required = sum of all unit contributions
      topicRequired[type] = allForType.reduce((sum, i) => sum + i.plannedQuantity, 0);
    });

    return { rows, totals, topicRequired };
  }, [selectedTopic, selectedNodeId, topicIndicators, topicUnitIds, unitMap]);

  // Handle batch save for matrix edits
  // Use :: as separator to avoid conflicts with hyphens in unitIds
  const SEP = '::';
  const [matrixEdits, setMatrixEdits] = useState<Record<string, number>>({});

  const makeKey = (unitId: string, type: string) => `${unitId}${SEP}${type}`;
  const parseKey = (key: string) => {
    const idx = key.indexOf(SEP);
    return { unitId: key.substring(0, idx), type: key.substring(idx + SEP.length) };
  };

  const handleMatrixCellChange = (unitId: string, type: string, value: number | null) => {
    setMatrixEdits((prev) => ({ ...prev, [makeKey(unitId, type)]: value ?? 0 }));
  };

  const handleBatchSave = () => {
    if (!selectedTopicId || !selectedNodeId) return;

    const updates: { id: string; plannedQuantity: number }[] = [];
    const newIndicators: IndicatorConfig[] = [];
    const today = new Date().toISOString().split('T')[0];

    Object.entries(matrixEdits).forEach(([key, qty]) => {
      const { unitId, type } = parseKey(key);

      const existing = topicIndicators.find(
        (i) => i.unitId === unitId && i.achievementType === type && i.nodeId === selectedNodeId
      );

      if (existing) {
        updates.push({ id: existing.id, plannedQuantity: qty });
      } else if (qty > 0) {
        newIndicators.push({
          id: `ind-${Date.now()}-${unitId}-${type}`,
          projectId: project.id,
          topicId: selectedTopicId,
          unitId,
          achievementType: type as AchievementType,
          nodeId: selectedNodeId,
          plannedQuantity: qty,
          createdAt: today,
          updatedAt: today,
        });
      }
    });

    // Handle zero indicators - remove them
    const zeroEntries = Object.entries(matrixEdits).filter(([, qty]) => qty === 0);
    zeroEntries.forEach(([key]) => {
      const { unitId, type } = parseKey(key);
      const existing = topicIndicators.find(
        (i) => i.unitId === unitId && i.achievementType === type && i.nodeId === selectedNodeId
      );
      if (existing) {
        removeIndicator(existing.id);
      }
    });

    if (updates.length > 0) {
      batchUpdateIndicators(updates);
    }
    newIndicators.forEach((ind) => {
      addIndicator(ind);
    });

    addOperationRecord({
      id: `or-${Date.now()}`,
      projectId: project.id,
      module: '课题及指标配置',
      operationType: '批量修改',
      objectType: '科研指标',
      objectName: `${selectedTopic?.name} ${selectedNode?.name}`,
      description: `批量更新指标：${selectedTopic?.name} / ${selectedNode?.name}`,
      operator: '当前用户',
      operatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });

    setMatrixEdits({});
    message.success('批量保存成功');
  };

  // ---- Topic edit handlers ----
  const openTopicEdit = (topic: Topic) => {
    setEditingTopic(topic);
    topicForm.setFieldsValue({
      code: topic.code,
      name: topic.name,
      leadingUnitId: topic.leadingUnitId,
      participatingUnitIds: topic.participatingUnitIds.join(', '),
      remarks: topic.remarks || '',
    });
    setTopicEditVisible(true);
  };

  const handleSaveTopic = (values: any) => {
    if (!editingTopic) return;
    const unitIds: string[] = values.participatingUnitIds
      ? values.participatingUnitIds.split(/[,，\n]/).map((s: string) => s.trim()).filter(Boolean)
      : [];
    updateTopic(editingTopic.id, {
      code: values.code,
      name: values.name,
      leadingUnitId: values.leadingUnitId,
      participatingUnitIds: unitIds,
      remarks: values.remarks || '',
    });
    addOperationRecord({
      id: `or-${Date.now()}`,
      projectId: project.id,
      module: '课题及指标配置',
      operationType: '修改',
      objectType: '课题',
      objectId: editingTopic.id,
      objectName: values.name,
      description: `修改课题信息：${values.name}`,
      operator: '当前用户',
      operatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });
    setTopicEditVisible(false);
    setEditingTopic(null);
    topicForm.resetFields();
    message.success('课题信息更新成功');
  };

  // ---- DomesticJournalConfig handlers ----
  const handleSaveCJ = () => {
    const values = cjForm.getFieldsValue();
    const topicMinCounts: Record<string, number> = {};
    if (values.decomposeToTopics) {
      topics.forEach((t) => {
        const fieldKey = `topicMin_${t.id}`;
        const val = cjForm.getFieldValue(fieldKey);
        if (val !== undefined && val !== null) {
          topicMinCounts[t.id] = val;
        }
      });
    }
    updateDomesticJournalConfig({
      enabled: values.enabled,
      statisticsScope: values.statisticsScope || '代表性论文',
      assessmentLevel: values.assessmentLevel || '项目总体',
      minRatio: values.minRatio ?? 20,
      minCount: values.minCount ?? 0,
      topicMinCounts,
      remarks: values.remarks || '',
    });
    addOperationRecord({
      id: `or-${Date.now()}`,
      projectId: project.id,
      module: '国内期刊指标配置',
      operationType: '修改',
      objectType: '国内期刊配置',
      objectName: '国内期刊指标配置',
      description: '修改国内期刊指标配置',
      operator: '当前用户',
      operatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });
    message.success('保存国内期刊配置成功');
  };

  // Load CJ config into form
  const initCJForm = () => {
    cjForm.setFieldsValue({
      enabled: domesticJournalConfig.enabled,
      statisticsScope: domesticJournalConfig.statisticsScope,
      assessmentLevel: domesticJournalConfig.assessmentLevel,
      minRatio: domesticJournalConfig.minRatio,
      minCount: domesticJournalConfig.minCount ?? 0,
      decomposeToTopics: domesticJournalConfig.assessmentLevel === '项目及课题',
      remarks: domesticJournalConfig.remarks,
    });
    Object.entries(domesticJournalConfig.topicMinCounts).forEach(([tid, val]) => {
      cjForm.setFieldsValue({ [`topicMin_${tid}`]: val });
    });
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'domesticJournal') {
      initCJForm();
    }
  };

  const decomposeToTopics = Form.useWatch('decomposeToTopics', cjForm);

  // ---- Node table columns ----
  const nodeColumns = [
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 70 },
    { title: '节点名称', dataIndex: 'name', key: 'name' },
    { title: '截止时间', dataIndex: 'deadline', key: 'deadline' },
    { title: '节点说明', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '参与预警',
      dataIndex: 'participatesInWarning',
      key: 'participatesInWarning',
      render: (v: boolean) => (v ? <Tag color="blue">是</Tag> : <Tag>否</Tag>),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TimeNode) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openNodeForm(record)}>
            编辑
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            size="small"
            onClick={() => {
              removeNode(record.id);
              message.success('已删除');
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // ---- OperationRecord table columns ----
  const filteredOps = operationRecords.filter((r) => {
    return (
      (!opFilter.module || r.module === opFilter.module) &&
      (!opFilter.operationType || r.operationType === opFilter.operationType) &&
      (!opFilter.keyword || r.objectName.includes(opFilter.keyword) || r.description.includes(opFilter.keyword))
    );
  });

  const opColumns = [
    { title: '模块', dataIndex: 'module', key: 'module' },
    { title: '操作类型', dataIndex: 'operationType', key: 'operationType' },
    { title: '对象', dataIndex: 'objectName', key: 'objectName' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '操作人', dataIndex: 'operator', key: 'operator' },
    { title: '操作时间', dataIndex: 'operatedAt', key: 'operatedAt' },
  ];

  // ---- Topic card render helpers ----
  const getTopicSummary = (topicId: string, nodeId: string) => {
    const topicInds = indicators.filter((i) => i.topicId === topicId && i.nodeId === nodeId);
    if (topicInds.length === 0) return '未配置';
    const total = topicInds.reduce((sum, i) => sum + i.plannedQuantity, 0);
    const types = [...new Set(topicInds.map((i) => i.achievementType))];
    return `${types.length} 类 / ${total} 项`;
  };

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        {/* Tab 1: 课题及指标配置 */}
        <TabPane
          tab={<span><TableOutlined /> 课题及指标配置</span>}
          key="topics-indicators"
        >
          {!selectedTopicId ? (
            <Card title="课题列表">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {topics.map((topic) => (
                  <Card
                    key={topic.id}
                    size="small"
                    hoverable
                    onClick={() => {
                      setSelectedTopicId(topic.id);
                      if (sortedNodes.length > 0) {
                        setSelectedNodeId(sortedNodes[0].id);
                      }
                    }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <Tag color="blue">{topic.code}</Tag>
                        <Text strong>{topic.name}</Text>
                      </Space>
                      <Space size="large">
                        <Text type="secondary">
                          牵头单位：{unitMap[topic.leadingUnitId] || topic.leadingUnitId || '-'}
                        </Text>
                        <Text type="secondary">
                          参与单位：{topic.participatingUnitIds.length} 个
                        </Text>
                        <Text type="secondary">
                          中期：{getTopicSummary(topic.id, sortedNodes.find((n) => n.name.includes('中期'))?.id || sortedNodes[2]?.id || '')}
                        </Text>
                        <Text type="secondary">
                          结项：{getTopicSummary(topic.id, sortedNodes[sortedNodes.length - 1]?.id || '')}
                        </Text>
                        <Button type="link" size="small">进入配置</Button>
                      </Space>
                    </Space>
                  </Card>
                ))}
              </Space>
            </Card>
          ) : (
            <div>
              {/* Back button + topic info */}
              <Card size="small" style={{ marginBottom: 16 }}>
                <Space>
                  <Button onClick={() => { setSelectedTopicId(''); setSelectedNodeId(''); }}>
                    返回课题列表
                  </Button>
                  <Text strong style={{ fontSize: 16 }}>{selectedTopic?.code} {selectedTopic?.name}</Text>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    size="small"
                    onClick={() => selectedTopic && openTopicEdit(selectedTopic)}
                  >
                    编辑课题
                  </Button>
                  <Text type="secondary">
                    牵头单位：{unitMap[selectedTopic?.leadingUnitId || ''] || selectedTopic?.leadingUnitId || '-'} |
                    参与单位：{(selectedTopic?.participatingUnitIds || []).map((uid) => unitMap[uid] || uid).join('、')}
                  </Text>
                </Space>
              </Card>

              {/* Node selector */}
              <Card size="small" style={{ marginBottom: 16 }}>
                <Space>
                  <Text strong>时间节点：</Text>
                  <Radio.Group
                    value={selectedNodeId}
                    onChange={(e) => setSelectedNodeId(e.target.value)}
                  >
                    {sortedNodes.map((n) => (
                      <Radio.Button key={n.id} value={n.id}>
                        {n.name}（{n.deadline}）
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                </Space>
              </Card>

              {/* Indicator matrix */}
              {selectedNodeId && (
                <Card
                  title="指标分解矩阵"
                  extra={
                    <Space>
                      <Button icon={<DownloadOutlined />} onClick={() => {
                        const rows = matrixData.rows.map((row) => {
                          const r: any = { 单位: row.unitName };
                          ACHIEVEMENT_TYPES.forEach((type) => {
                            r[type] = row.cells[type]?.plannedQuantity ?? matrixEdits[makeKey(row.unitId, type)] ?? 0;
                          });
                          return r;
                        });
                        exportToExcel(rows, `指标矩阵_${selectedTopic?.code}_${selectedNode?.name}`);
                      }}>导出 Excel</Button>
                      <Button type="primary" onClick={handleBatchSave}>批量保存</Button>
                    </Space>
                  }
                >
                  <Table
                    rowKey="unitId"
                    pagination={false}
                    scroll={{ x: 800 }}
                    dataSource={matrixData.rows}
                    columns={[
                      {
                        title: '单位',
                        dataIndex: 'unitName',
                        key: 'unitName',
                        width: 150,
                        fixed: 'left' as const,
                      },
                      ...ACHIEVEMENT_TYPES.map((type) => ({
                        title: type,
                        key: type,
                        width: 120,
                        render: (_: any, row: any) => {
                          const existing = row.cells[type];
                          const editKey = makeKey(row.unitId, type);
                          const val = editKey in matrixEdits ? matrixEdits[editKey] : (existing?.plannedQuantity ?? 0);
                          return (
                            <InputNumber
                              min={0}
                              value={val}
                              size="small"
                              style={{ width: '100%' }}
                              onChange={(v) => handleMatrixCellChange(row.unitId, type, v)}
                            />
                          );
                        },
                      })),
                    ]}
                    summary={() => (
                      <Table.Summary>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0}>
                            <Text strong>各单位合计</Text>
                          </Table.Summary.Cell>
                          {ACHIEVEMENT_TYPES.map((type) => (
                            <Table.Summary.Cell key={type} index={ACHIEVEMENT_TYPES.indexOf(type) + 1}>
                              <Text strong>{matrixData.totals[type] || 0}</Text>
                            </Table.Summary.Cell>
                          ))}
                        </Table.Summary.Row>
                      </Table.Summary>
                    )}
                  />
                </Card>
              )}

              {/* Evidence rules reference */}
              {selectedNodeId && (
                <Card size="small" title="佐证材料认定规则" style={{ marginTop: 16 }}>
                  <Space direction="vertical">
                    {ACHIEVEMENT_TYPES.map((type) => {
                      const def = ACHIEVEMENT_EVIDENCE_RULES[type];
                      return (
                        <Space key={type}>
                          <Tag>{type}</Tag>
                          <Text type="secondary">{def?.displayText || '-'}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            ({def?.rule.type === 'OR' ? '任一即可' : '全部必须'})
                          </Text>
                        </Space>
                      );
                    })}
                  </Space>
                </Card>
              )}
            </div>
          )}
        </TabPane>

        {/* Tab 2: 时间节点配置 */}
        <TabPane
          tab={<span><TableOutlined /> 时间节点配置</span>}
          key="nodes"
        >
          <Card
            title="时间节点配置"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openNodeForm()}>
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

        {/* Tab 3: 国内期刊指标配置 */}
        <TabPane
          tab={<span><TableOutlined /> 国内期刊指标配置</span>}
          key="domesticJournal"
        >
          <Card
            title="国内期刊论文配置"
            extra={
              <Button type="primary" onClick={handleSaveCJ}>保存配置</Button>
            }
          >
            <Form form={cjForm} layout="vertical">
              <Form.Item label="启用国内期刊要求" name="enabled" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item label="统计范围" name="statisticsScope">
                <Select style={{ width: '100%' }}>
                  <Option value="代表性论文">代表性论文</Option>
                </Select>
              </Form.Item>
              <Form.Item label="考核层级" name="assessmentLevel">
                <Select style={{ width: '100%' }}>
                  <Option value="项目总体">项目总体</Option>
                  <Option value="项目及课题">项目及课题</Option>
                </Select>
              </Form.Item>
              <Form.Item label="最低国内期刊比例（%）" name="minRatio">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="最低国内期刊数量" name="minCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="分解到各课题" name="decomposeToTopics" valuePropName="checked">
                <Switch />
              </Form.Item>

              {decomposeToTopics && (
                <Card title="各课题最低国内期刊数量" size="small" style={{ marginBottom: 16 }}>
                  {topics.map((t) => (
                    <Form.Item key={t.id} label={t.name} name={`topicMin_${t.id}`}>
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

        {/* Tab 4: 操作记录 */}
        <TabPane
          tab={<span><HistoryOutlined /> 操作记录</span>}
          key="operationRecords"
        >
          <Card title="操作记录">
            <Space style={{ marginBottom: 16 }} wrap>
              <Select
                placeholder="模块"
                allowClear
                style={{ width: 180 }}
                onChange={(v) => setOpFilter({ ...opFilter, module: v || '' })}
              >
                <Option value="课题及指标配置">课题及指标配置</Option>
                <Option value="时间节点配置">时间节点配置</Option>
                <Option value="国内期刊指标配置">国内期刊指标配置</Option>
              </Select>
              <Select
                placeholder="操作类型"
                allowClear
                style={{ width: 140 }}
                onChange={(v) => setOpFilter({ ...opFilter, operationType: v || '' })}
              >
                <Option value="新增">新增</Option>
                <Option value="修改">修改</Option>
                <Option value="删除">删除</Option>
                <Option value="导入">导入</Option>
                <Option value="批量修改">批量修改</Option>
              </Select>
              <Input
                placeholder="关键词搜索"
                style={{ width: 200 }}
                value={opFilter.keyword}
                onChange={(e) => setOpFilter({ ...opFilter, keyword: e.target.value })}
              />
            </Space>
            <Table
              rowKey="id"
              columns={opColumns}
              dataSource={[...filteredOps].sort((a, b) => b.operatedAt.localeCompare(a.operatedAt))}
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
          <Form.Item label="节点名称" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="截止时间" name="deadline" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="节点说明" name="description">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item label="排序" name="sortOrder" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="参与预警" name="participatesInWarning" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 课题编辑弹窗 */}
      <Modal
        title="编辑课题信息"
        open={topicEditVisible}
        onOk={() => topicForm.submit()}
        onCancel={() => {
          setTopicEditVisible(false);
          setEditingTopic(null);
          topicForm.resetFields();
        }}
        width={600}
      >
        <Form form={topicForm} layout="vertical" onFinish={handleSaveTopic}>
          <Form.Item label="课题编号" name="code" rules={[{ required: true, message: '请输入课题编号' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="课题名称" name="name" rules={[{ required: true, message: '请输入课题名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="课题牵头单位" name="leadingUnitId" rules={[{ required: true, message: '请输入牵头单位' }]}>
            <Input placeholder="请输入牵头单位名称" />
          </Form.Item>
          <Form.Item label="课题参与单位" name="participatingUnitIds" help="多个单位用逗号分隔">
            <TextArea rows={3} placeholder="输入参与单位名称，多个用逗号分隔" />
          </Form.Item>
          <Form.Item label="备注" name="remarks">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
