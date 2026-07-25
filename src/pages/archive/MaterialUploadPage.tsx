import { useState } from 'react';
import { Button, Card, Form, Input, message, Select, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store';

const { Option } = Select;
const { TextArea } = Input;

export function MaterialUploadPage() {
  const { archiveCategories, achievements, addArchiveMaterial } = useAppStore();
  const [form] = Form.useForm();
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  const approvedAchievements = achievements.filter((a) => a.status === '审批通过');

  const handleFileChange = (info: any) => {
    const file = info.file.originFileObj || info.file;
    if (file) {
      setFileName(file.name);
      setFileUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = (values: any) => {
    addArchiveMaterial({
      id: `am-${Date.now()}`,
      projectId: 'p1',
      categoryId: values.categoryId,
      name: values.name,
      fileName,
      fileUrl,
      sourceAchievementId: values.sourceAchievementId,
      uploader: values.uploader || '当前用户',
      uploadedAt: new Date().toISOString().split('T')[0],
      remarks: values.remarks || '',
      versions: [],
    });
    message.success('材料上传成功');
    form.resetFields();
    setFileName('');
    setFileUrl('');
  };

  const handleAchievementChange = (achievementId: string) => {
    const achievement = approvedAchievements.find((a) => a.id === achievementId);
    if (achievement) {
      form.setFieldsValue({ name: achievement.title });
    }
  };

  return (
    <Card title="材料上传">
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item label="归档目录" name="categoryId" rules={[{ required: true }]}>
          <Select placeholder="选择归档目录">
            {archiveCategories.map((c) => (
              <Option key={c.id} value={c.id}>{c.name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="从科研成果同步" name="sourceAchievementId">
          <Select placeholder="选择已审批成果（可选）" allowClear onChange={handleAchievementChange}>
            {approvedAchievements.map((a) => (
              <Option key={a.id} value={a.id}>
                {a.title}（{a.achievementType}）
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="材料名称" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="上传文件" rules={[{ required: true, message: '请上传文件' }]}>
          <Upload beforeUpload={() => false} onChange={handleFileChange} maxCount={1}>
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
          {fileName && <div style={{ marginTop: 8 }}>已选择：{fileName}</div>}
        </Form.Item>

        <Form.Item label="上传人" name="uploader">
          <Input />
        </Form.Item>

        <Form.Item label="备注" name="remarks">
          <TextArea rows={2} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">上传</Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
