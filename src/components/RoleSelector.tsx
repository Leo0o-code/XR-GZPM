import { Button, Card, Space, Typography } from 'antd';
import { useAppStore } from '../store';

const { Title } = Typography;

export function RoleSelector() {
  const { role, setRole, topics, currentTopicId, setCurrentTopicId } = useAppStore();

  return (
    <Card style={{ marginBottom: 16 }}>
      <Space size="large" align="center">
        <Title level={5} style={{ margin: 0 }}>当前身份</Title>
        <Space>
          <Button type={role === 'admin' ? 'primary' : 'default'} onClick={() => setRole('admin')}>
            管理员
          </Button>
          <Button type={role === 'topic' ? 'primary' : 'default'} onClick={() => setRole('topic')}>
            课题端
          </Button>
        </Space>
        {role === 'topic' && (
          <Space>
            <span>选择课题：</span>
            <select
              value={currentTopicId || ''}
              onChange={(e) => setCurrentTopicId(e.target.value || null)}
              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d9d9d9' }}
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} - {t.leader}
                </option>
              ))}
            </select>
          </Space>
        )}
      </Space>
    </Card>
  );
}
