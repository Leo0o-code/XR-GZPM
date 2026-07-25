import { BrowserRouter, Route, Routes, Outlet } from 'react-router-dom';
import { ConfigProvider, Layout, theme, Button, Space, Typography } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { RedoOutlined } from '@ant-design/icons';
import { useAppStore } from './store';
import { RoleSelector } from './components/RoleSelector';
import { AdminLayout } from './pages/admin/AdminLayout';
import { IndicatorList } from './pages/admin/IndicatorList';
import { IndicatorEdit } from './pages/admin/IndicatorEdit';
import { BatchConfig } from './pages/admin/BatchConfig';
import { BatchNodes } from './pages/admin/BatchNodes';
import { VersionHistory } from './pages/admin/VersionHistory';
import { WarningRules } from './pages/admin/WarningRules';
import { JournalList } from './pages/admin/JournalList';
import { Monitoring } from './pages/admin/Monitoring';
import { ChineseJournalConfigPage } from './pages/admin/ChineseJournalConfigPage';
import { TopicDashboard } from './pages/topic/TopicDashboard';

const { Content, Header } = Layout;
const { Title } = Typography;

function RootLayout() {
  const { resetToMock } = useAppStore();
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={4} style={{ color: '#fff', margin: 0 }}>国重项目 · 科研成果管理</Title>
        <Space>
          <Button type="primary" icon={<RedoOutlined />} onClick={resetToMock}>
            重置演示数据
          </Button>
        </Space>
      </Header>
      <Content style={{ padding: 24, background: '#f0f2f5' }}>
        <RoleSelector />
        <Outlet />
      </Content>
    </Layout>
  );
}

function RoleGuard() {
  const { role } = useAppStore();
  return role === 'admin' ? <AdminLayout /> : <TopicDashboard />;
}

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{ algorithm: theme.defaultAlgorithm }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<RoleGuard />} />
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<IndicatorList />} />
              <Route path="indicator/:id" element={<IndicatorEdit />} />
              <Route path="batch" element={<BatchConfig />} />
              <Route path="batch-nodes" element={<BatchNodes />} />
              <Route path="versions" element={<VersionHistory />} />
              <Route path="warnings" element={<WarningRules />} />
              <Route path="journals" element={<JournalList />} />
              <Route path="chinese-journal" element={<ChineseJournalConfigPage />} />
              <Route path="monitoring" element={<Monitoring />} />
            </Route>
            <Route path="topic" element={<TopicDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
