import { Layout, Menu, Typography } from 'antd';
import {
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  DashboardOutlined,
  FileTextOutlined,
  HistoryOutlined,
  NodeIndexOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation } from 'react-router-dom';

const { Sider, Content, Header } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/admin', icon: <DashboardOutlined />, label: <Link to="/admin">指标配置列表</Link> },
  { key: '/admin/batch', icon: <TableOutlined />, label: <Link to="/admin/batch">批量配置</Link> },
  { key: '/admin/batch-nodes', icon: <NodeIndexOutlined />, label: <Link to="/admin/batch-nodes">分批节点</Link> },
  { key: '/admin/chinese-journal', icon: <FileTextOutlined />, label: <Link to="/admin/chinese-journal">期刊论文配置</Link> },
  { key: '/admin/journals', icon: <BookOutlined />, label: <Link to="/admin/journals">期刊名录</Link> },
  { key: '/admin/warnings', icon: <BellOutlined />, label: <Link to="/admin/warnings">预警规则</Link> },
  { key: '/admin/versions', icon: <HistoryOutlined />, label: <Link to="/admin/versions">版本记录</Link> },
  { key: '/admin/monitoring', icon: <BarChartOutlined />, label: <Link to="/admin/monitoring">指标监控</Link> },
];

export function AdminLayout() {
  const location = useLocation();

  return (
    <Layout style={{ minHeight: 'calc(100vh - 112px)' }}>
      <Sider theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
          <Title level={5} style={{ margin: 0 }}>国重项目管理</Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={4} style={{ margin: 0, lineHeight: '64px' }}>科研成果管理后台</Title>
        </Header>
        <Content style={{ padding: 24, background: '#f5f5f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
