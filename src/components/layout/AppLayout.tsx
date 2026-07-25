import { Layout, Menu, Typography, Button, Space } from 'antd';
import {
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  DashboardOutlined,
  FileTextOutlined,
  FormOutlined,
  HomeOutlined,
  InboxOutlined,
  SearchOutlined,
  TableOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { RedoOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store';

const { Sider, Content, Header } = Layout;
const { Title } = Typography;

const menuItems = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: <Link to="/">首页</Link>,
  },
  {
    key: 'research',
    icon: <DashboardOutlined />,
    label: '科研成果管理',
    children: [
      { key: '/indicator', icon: <TableOutlined />, label: <Link to="/indicator">科研指标配置</Link> },
      { key: '/warning-rules', icon: <BellOutlined />, label: <Link to="/warning-rules">预警规则配置</Link> },
      { key: '/achievement-entry', icon: <FormOutlined />, label: <Link to="/achievement-entry">成果录入</Link> },
      { key: '/achievement-approval', icon: <FileTextOutlined />, label: <Link to="/achievement-approval">成果审批</Link> },
      { key: '/monitoring', icon: <BarChartOutlined />, label: <Link to="/monitoring">指标监控</Link> },
    ],
  },
  {
    key: 'archive',
    icon: <InboxOutlined />,
    label: '项目材料归档',
    children: [
      { key: '/archive/catalog', icon: <BookOutlined />, label: <Link to="/archive/catalog">归档目录</Link> },
      { key: '/archive/upload', icon: <UploadOutlined />, label: <Link to="/archive/upload">材料上传</Link> },
      { key: '/archive/query', icon: <SearchOutlined />, label: <Link to="/archive/query">材料查询</Link> },
      { key: '/archive/monitoring', icon: <BarChartOutlined />, label: <Link to="/archive/monitoring">归档监控</Link> },
    ],
  },
];

export function AppLayout() {
  const { resetToMock } = useAppStore();
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
          <Title level={5} style={{ margin: 0 }}>国家科技重大专项</Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['research', 'archive']}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>科研成果管理</Title>
          <Space>
            <Button icon={<RedoOutlined />} onClick={resetToMock}>
              重置演示数据
            </Button>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: '#f5f5f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
