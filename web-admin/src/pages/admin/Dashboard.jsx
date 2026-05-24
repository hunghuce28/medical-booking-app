import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, message } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  CalendarOutlined, 
  CheckCircleOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import axiosClient from '../../utils/axiosClient';

const COLORS = ['#faad14', '#1677ff', '#f5222d', '#8c8c8c', '#52c41a', '#eb2f96'];

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalSpecialties: 0,
    todayAppointments: 0,
    completedToday: 0,
    weeklyAppointments: [],
    appointmentsByStatus: []
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
    <div style={{ padding: '0px' }}>
      <h2 style={{ marginBottom: 24, fontSize: '24px', fontWeight: 600 }}>Tổng quan hệ thống</h2>
      
      {/* Thẻ thống kê nhanh */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} loading={loading} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title="Tổng số bệnh nhân"
              value={stats.totalPatients}
              valueStyle={{ fontWeight: 700 }}
              prefix={<UserOutlined style={{ color: '#1677ff', backgroundColor: '#e6f4ff', padding: '8px', borderRadius: '8px', marginRight: '8px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} loading={loading} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title="Tổng số bác sĩ"
              value={stats.totalDoctors}
              valueStyle={{ fontWeight: 700 }}
              prefix={<TeamOutlined style={{ color: '#52c41a', backgroundColor: '#f6ffed', padding: '8px', borderRadius: '8px', marginRight: '8px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} loading={loading} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title="Lịch khám hôm nay"
              value={stats.todayAppointments}
              valueStyle={{ fontWeight: 700 }}
              prefix={<CalendarOutlined style={{ color: '#faad14', backgroundColor: '#fffbe6', padding: '8px', borderRadius: '8px', marginRight: '8px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} loading={loading} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title="Đã hoàn thành hôm nay"
              value={stats.completedToday}
              valueStyle={{ fontWeight: 700 }}
              suffix={`/ ${stats.todayAppointments}`}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a', backgroundColor: '#f6ffed', padding: '8px', borderRadius: '8px', marginRight: '8px' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Đồ thị và biểu đồ */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} xl={16}>
          <Card 
            title={<span style={{ fontWeight: 600 }}>Số ca khám bệnh (7 ngày gần nhất)</span>} 
            bordered={false} 
            loading={loading}
            style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <div style={{ width: '100%', height: 350 }}>
              {stats.weeklyAppointments && stats.weeklyAppointments.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats.weeklyAppointments}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1677ff" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#1677ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#8c8c8c' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8c8c8c' }} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Area type="monotone" dataKey="count" name="Số ca khám" stroke="#1677ff" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#8c8c8c' }}>
                  Không có dữ liệu 7 ngày gần đây
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card 
            title={<span style={{ fontWeight: 600 }}>Tỷ lệ trạng thái lịch khám</span>} 
            bordered={false} 
            loading={loading}
            style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <div style={{ width: '100%', height: 350, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              {stats.appointmentsByStatus && stats.appointmentsByStatus.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={stats.appointmentsByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.appointmentsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Chú thích tùy chỉnh để hiển thị hàng dọc đẹp mắt */}
                  <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
                    {stats.appointmentsByStatus.map((entry, index) => (
                      <div key={entry.name} style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                        <div style={{ width: '10px', height: '10px', backgroundColor: COLORS[index % COLORS.length], borderRadius: '50%', marginRight: '6px' }} />
                        <span style={{ color: '#595959', marginRight: '4px' }}>{entry.name}:</span>
                        <span style={{ fontWeight: 600, color: '#262626' }}>{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ color: '#8c8c8c' }}>Không có dữ liệu lịch khám</div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Thẻ chi tiết khác */}
      <div style={{ marginTop: 24 }}>
        <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <AppstoreOutlined style={{ fontSize: '32px', color: '#1677ff', marginRight: '16px', backgroundColor: '#e6f4ff', padding: '12px', borderRadius: '12px' }} />
                <div>
                  <div style={{ color: '#8c8c8c', fontSize: '13px' }}>Tổng chuyên khoa</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#262626' }}>{stats.totalSpecialties || 0}</div>
                </div>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TeamOutlined style={{ fontSize: '32px', color: '#52c41a', marginRight: '16px', backgroundColor: '#f6ffed', padding: '12px', borderRadius: '12px' }} />
                <div>
                  <div style={{ color: '#8c8c8c', fontSize: '13px' }}>Bác sĩ đang hoạt động</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#262626' }}>{stats.totalDoctors}</div>
                </div>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <UserOutlined style={{ fontSize: '32px', color: '#722ed1', marginRight: '16px', backgroundColor: '#f9f0ff', padding: '12px', borderRadius: '12px' }} />
                <div>
                  <div style={{ color: '#8c8c8c', fontSize: '13px' }}>Bệnh nhân đã đăng ký</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#262626' }}>{stats.totalPatients}</div>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
