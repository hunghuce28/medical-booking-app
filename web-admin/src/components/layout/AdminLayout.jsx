import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, Dropdown, Space, Avatar, notification } from 'antd';
import { 
  DashboardOutlined, 
  UserOutlined, 
  TeamOutlined, 
  CalendarOutlined,
  AppstoreOutlined,
  LogoutOutlined,
  ContactsOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { connectSocket, disconnectSocket } from '../../utils/socket';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Lấy user & token từ store
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    let socket = null;
    if (token) {
      // Thiết lập kết nối socket
      socket = connectSocket(token);

      // Lắng nghe sự kiện thông báo mới
      socket.on('notification', (data) => {
        notification.open({
          message: <span style={{ fontWeight: 600, color: '#1f1f1f' }}>{data.title || 'Thông báo mới'}</span>,
          description: <span style={{ color: '#595959' }}>{data.message}</span>,
          placement: 'bottomRight',
          duration: 6,
          style: {
            borderRadius: '12px',
            borderLeft: '5px solid #1677ff',
            boxShadow: '0 6px 16px -8px rgba(0,0,0,0.08), 0 9px 28px 0 rgba(0,0,0,0.05), 0 12px 48px 16px rgba(0,0,0,0.03)',
            backgroundColor: '#ffffff',
          }
        });
      });
    }

    return () => {
      if (socket) {
        socket.off('notification');
      }
      disconnectSocket();
    };
  }, [token]);

  const menuItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Tổng quan' },
    { key: '/admin/specialties', icon: <AppstoreOutlined />, label: 'Chuyên khoa' },
    { key: '/admin/doctors', icon: <TeamOutlined />, label: 'Bác sĩ' },
    { key: '/admin/patients', icon: <ContactsOutlined />, label: 'Bệnh nhân' },
    { key: '/admin/appointments', icon: <CalendarOutlined />, label: 'Lịch khám' },
  ];

  const handleLogout = () => {
    disconnectSocket(); // Ngắt kết nối socket khi logout
    logout(); // Xóa token + user khỏi store và localStorage
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ cá nhân' },
    { type: 'divider' },
    { 
      key: 'logout', 
      icon: <LogoutOutlined />, 
      label: 'Đăng xuất',
      danger: true,
      onClick: handleLogout
    },
  ];


  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
          {collapsed ? 'Med' : 'MedAdmin'}
        </div>
        <Menu 
          theme="dark" 
          mode="inline" 
          selectedKeys={[location.pathname]} 
          items={menuItems} 
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
              <span>{user?.fullName || 'Admin'}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: colorBgContainer, borderRadius: borderRadiusLG }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
