import React, { useState } from 'react';
import { Button, Form, Input, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';
import useAuthStore from '../../stores/authStore';

const { Title } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axiosClient.post('/auth/login', values);
      
      if (response.success) {
        const user = response.data.user;
        
        // Chặn bệnh nhân truy cập Web Admin
        if (user.role === 'PATIENT') {
          message.error('Tài khoản bệnh nhân không được phép truy cập hệ thống quản trị Web!');
          return;
        }

        message.success('Đăng nhập thành công!');
        // Lưu vào Zustand (localStorage)
        login(user, response.data.accessToken);
        
        // Điều hướng phù hợp theo vai trò
        if (user.role === 'DOCTOR') {
          navigate('/admin/appointments');
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        message.error(response.message || 'Đăng nhập thất bại!');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error.response?.data?.message || 'Kết nối đến máy chủ thất bại!';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#1677ff', margin: 0 }}>MedAdmin</Title>
          <p style={{ color: '#8c8c8c' }}>Hệ thống quản lý phòng khám</p>
        </div>
        
        <Form
          name="normal_login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Vui lòng nhập Email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email đăng nhập (admin@hospital.vn)" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu (admin123)" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
