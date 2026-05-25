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

  const allMenuItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Tổng quan', roles: ['ADMIN', 'DOCTOR'] },
    { key: '/admin/specialties', icon: <AppstoreOutlined />, label: 'Chuyên khoa', roles: ['ADMIN'] },
    { key: '/admin/doctors', icon: <TeamOutlined />, label: 'Bác sĩ', roles: ['ADMIN'] },
    { key: '/admin/patients', icon: <ContactsOutlined />, label: 'Bệnh nhân', roles: ['ADMIN'] },
    { key: '/admin/appointments', icon: <CalendarOutlined />, label: 'Lịch khám', roles: ['ADMIN', 'DOCTOR'] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(user?.role));

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
    <Layout style={{ minHeight: '100vh', background: 'var(--bg-gradient)' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        style={{
          boxShadow: '4px 0 20px rgba(0,0,0,0.03)',
          background: '#001529',
          zIndex: 10
        }}
      >
        <div style={{ 
          height: 48, 
          margin: '16px 12px', 
          background: 'rgba(255, 255, 255, 0.04)', 
          borderRadius: '10px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          transition: 'all 0.3s'
        }}>
          <span className="gradient-text" style={{ fontSize: collapsed ? '18px' : '17px', fontWeight: 850, fontFamily: 'Outfit, sans-serif', letterSpacing: '0.5px' }}>
            {collapsed ? '🏥' : '🏥 MEDBOOK'}
          </span>
        </div>
        <Menu 
          theme="dark" 
          mode="inline" 
          selectedKeys={[location.pathname]} 
          items={menuItems} 
          onClick={({ key }) => navigate(key)}
          style={{ 
            marginTop: 15,
            padding: '0 8px',
            border: 'none'
          }}
          className="sidebar-menu"
        />
      </Sider>
      <Layout style={{ background: 'transparent' }}>
        <Header style={{ 
          padding: '0 24px', 
          background: 'rgba(255, 255, 255, 0.8)', 
          backdropFilter: 'blur(10px)',
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(22, 119, 255, 0.03)',
          borderBottom: '1px solid rgba(22, 119, 255, 0.05)',
          height: '64px'
        }}>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: '8px', background: 'rgba(22, 119, 255, 0.04)', border: '1px solid rgba(22, 119, 255, 0.06)', transition: 'all 0.2s' }} className="hover-scale">
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} className="avatar-glow" />
              <span style={{ fontWeight: 600, color: '#334155', fontSize: '14px' }}>{user?.fullName || 'Quản trị viên'}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ 
          margin: '24px 20px', 
          padding: 0, 
          minHeight: 280, 
          background: 'transparent', 
          borderRadius: '16px' 
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;

