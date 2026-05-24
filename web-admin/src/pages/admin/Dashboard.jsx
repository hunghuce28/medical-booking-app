import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, message } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  CalendarOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons';
import axiosClient from '../../utils/axiosClient';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    todayAppointments: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/appointments/dashboard');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Fetch dashboard error:', error);
      message.error('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Tổng quan hệ thống</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} loading={loading}>
            <Statistic
              title="Tổng số bệnh nhân"
              value={stats.totalPatients}
              prefix={<UserOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} loading={loading}>
            <Statistic
              title="Tổng số bác sĩ"
              value={stats.totalDoctors}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} loading={loading}>
            <Statistic
              title="Lịch khám hôm nay"
              value={stats.todayAppointments}
              prefix={<CalendarOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} loading={loading}>
            <Statistic
              title="Đã hoàn thành"
              value={stats.completedToday}
              suffix={`/ ${stats.todayAppointments}`}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 32 }}>
        <Card title="Thông tin hệ thống" bordered={false}>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Statistic title="Tổng chuyên khoa" value={stats.totalSpecialties || 0} />
            </Col>
            <Col span={8}>
              <Statistic title="Bác sĩ đang hoạt động" value={stats.totalDoctors} />
            </Col>
            <Col span={8}>
              <Statistic title="Bệnh nhân đã đăng ký" value={stats.totalPatients} />
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
