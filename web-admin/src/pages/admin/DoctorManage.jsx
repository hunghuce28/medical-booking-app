import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Tag, message, Modal, Form, Input, Popconfirm, Select } from 'antd';
import { PlusOutlined, EditOutlined, LockOutlined, UnlockOutlined, CalendarOutlined } from '@ant-design/icons';
import axiosClient from '../../utils/axiosClient';

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Thứ Hai' },
  { value: 'TUESDAY', label: 'Thứ Ba' },
  { value: 'WEDNESDAY', label: 'Thứ Tư' },
  { value: 'THURSDAY', label: 'Thứ Năm' },
  { value: 'FRIDAY', label: 'Thứ Sáu' },
  { value: 'SATURDAY', label: 'Thứ Bảy' },
  { value: 'SUNDAY', label: 'Chủ Nhật' },
];

const TIME_OPTIONS = [];
for (let h = 6; h <= 22; h++) {
  const hStr = h.toString().padStart(2, '0');
  TIME_OPTIONS.push(`${hStr}:00`);
  TIME_OPTIONS.push(`${hStr}:30`);
}

const DoctorManage = () => {
  const [dataSource, setDataSource] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  // Schedule Modal states
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [currentDoctorId, setCurrentDoctorId] = useState(null);
  const [currentDoctorName, setCurrentDoctorName] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/doctors');
      if (response.success) {
        const doctors = response.data.map((doc) => ({
          key: doc.id.toString(),
          name: doc.user.fullName,
          email: doc.user.email,
          phone: doc.user.phone || 'Chưa cập nhật',
          specialtyId: doc.specialtyId,
          specialty: doc.specialty ? doc.specialty.name : 'Chưa cập nhật',
          status: doc.isActive ? 'active' : 'inactive',
        }));
        setDataSource(doctors);
      }
    } catch (error) {
      console.error('Fetch doctors error:', error);
      message.error('Không thể tải danh sách bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const response = await axiosClient.get('/specialties');
      if (response.success) {
        setSpecialties(response.data);
      }
    } catch (error) {
      console.error('Fetch specialties error:', error);
    }
  };

  useEffect(() => {
    fetchSpecialties();
    fetchDoctors();
  }, []);

  const showModal = (record = null) => {
    if (record) {
      setEditingId(record.key);
      form.setFieldsValue({
        fullName: record.name,
        email: record.email,
        phone: record.phone !== 'Chưa cập nhật' ? record.phone : '',
        specialtyId: record.specialtyId,
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleFinish = async (values) => {
    try {
      if (editingId) {
        // Cập nhật (Backend chỉ cập nhật fullName, phone, specialtyId)
        const res = await axiosClient.put(`/doctors/${editingId}`, values);
        if (res.success) {
          message.success('Cập nhật bác sĩ thành công');
        }
      } else {
        // Tạo mới
        const res = await axiosClient.post('/doctors', values);
        if (res.success) {
          message.success('Tạo tài khoản bác sĩ mới thành công');
        }
      }
      setIsModalOpen(false);
      fetchDoctors();
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      // Dùng PUT để cập nhật trường isActive
      const res = await axiosClient.put(`/doctors/${id}`, {
        isActive: currentStatus !== 'active'
      });
      if (res.success) {
        message.success(currentStatus === 'active' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
        fetchDoctors();
      }
    } catch (error) {
      message.error('Không thể thay đổi trạng thái!');
    }
  };

  // Schedule functions
  const openScheduleModal = async (record) => {
    setCurrentDoctorId(record.key);
    setCurrentDoctorName(record.name);
    setScheduleModalOpen(true);
    setScheduleLoading(true);
    try {
      const res = await axiosClient.get(`/doctors/${record.key}/schedules`);
      if (res.success) {
        const backendSchedules = res.data || [];
        const fullSchedules = DAYS_OF_WEEK.map(day => {
          const found = backendSchedules.find(s => s.dayOfWeek === day.value);
          return {
            key: day.value,
            dayOfWeek: day.value,
            dayLabel: day.label,
            isActive: found ? found.isActive : false,
            startTime: found ? found.startTime : '08:00',
            endTime: found ? found.endTime : '17:00',
            slotDurationMinutes: found ? found.slotDurationMinutes : 30,
          };
        });
        setSchedules(fullSchedules);
      }
    } catch (e) {
      message.error('Không thể tải lịch làm việc của bác sĩ');
    } finally {
      setScheduleLoading(false);
    }
  };

  const updateScheduleField = (dayOfWeek, field, value) => {
    setSchedules(prev => prev.map(s => {
      if (s.dayOfWeek === dayOfWeek) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const handleSaveSchedules = async () => {
    try {
      setSavingSchedule(true);
      const schedulesToSave = schedules.filter(s => s.isActive).map(s => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        slotDurationMinutes: parseInt(s.slotDurationMinutes),
        isActive: true
      }));

      const res = await axiosClient.put(`/doctors/${currentDoctorId}/schedules`, {
        schedules: schedulesToSave
      });

      if (res.success) {
        message.success('Cập nhật lịch làm việc thành công');
        setScheduleModalOpen(false);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSavingSchedule(false);
    }
  };

  const columns = [
    {
      title: 'Họ và tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Chuyên khoa',
      dataIndex: 'specialty',
      key: 'specialty',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Hoạt động' : 'Đã khóa'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => showModal(record)}>
            Sửa
          </Button>
          <Button 
            type="default" 
            style={{ background: '#722ed1', color: 'white', borderColor: '#722ed1' }} 
            icon={<CalendarOutlined />} 
            size="small" 
            onClick={() => openScheduleModal(record)}
          >
            Lịch khám
          </Button>
          <Popconfirm
            title={record.status === 'active' ? "Khóa tài khoản bác sĩ này?" : "Mở khóa tài khoản này?"}
            onConfirm={() => handleToggleStatus(record.key, record.status)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button 
              danger={record.status === 'active'} 
              type={record.status === 'active' ? 'default' : 'primary'}
              icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />} 
              size="small"
              style={record.status !== 'active' ? { background: '#faad14', borderColor: '#faad14' } : {}}
            >
              {record.status === 'active' ? 'Khóa' : 'Mở khóa'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card title="Quản lý Bác sĩ" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>Thêm bác sĩ mới</Button>}>
        <Table dataSource={dataSource} columns={columns} loading={loading} />
      </Card>

      <Modal
        title={editingId ? "Sửa thông tin bác sĩ" : "Thêm tài khoản bác sĩ mới"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input placeholder="VD: Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email đăng nhập"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input placeholder="VD: bacsi@hospital.vn" disabled={!!editingId} />
          </Form.Item>

          {!editingId && (
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password placeholder="Nhập mật khẩu cho tài khoản" />
            </Form.Item>
          )}

          <Form.Item
            name="phone"
            label="Số điện thoại"
          >
            <Input placeholder="VD: 0901234567" />
          </Form.Item>

          <Form.Item
            name="specialtyId"
            label="Chuyên khoa"
            rules={[{ required: true, message: 'Vui lòng chọn chuyên khoa!' }]}
          >
            <Select placeholder="-- Chọn chuyên khoa --">
              {specialties.map(spec => (
                <Select.Option key={spec.id} value={spec.id}>
                  {spec.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={handleCancel}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {editingId ? "Lưu thay đổi" : "Tạo tài khoản"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Schedule Management Modal */}
      <Modal
        title={`Quản lý Lịch làm việc - BS. ${currentDoctorName}`}
        open={scheduleModalOpen}
        onCancel={() => setScheduleModalOpen(false)}
        width={750}
        confirmLoading={savingSchedule}
        onOk={handleSaveSchedules}
        okText="Lưu lịch làm việc"
        cancelText="Hủy"
      >
        {scheduleLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Table loading={true} dataSource={[]} />
          </div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            <Table
              dataSource={schedules}
              pagination={false}
              size="middle"
              columns={[
                {
                  title: 'Ngày trong tuần',
                  dataIndex: 'dayLabel',
                  key: 'dayLabel',
                  width: 140,
                  render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
                },
                {
                  title: 'Trạng thái',
                  dataIndex: 'isActive',
                  key: 'isActive',
                  width: 120,
                  render: (isActive, record) => (
                    <Select
                      value={isActive}
                      onChange={(val) => updateScheduleField(record.dayOfWeek, 'isActive', val)}
                      style={{ width: '100%' }}
                      options={[
                        { value: true, label: 'Làm việc' },
                        { value: false, label: 'Nghỉ' }
                      ]}
                    />
                  )
                },
                {
                  title: 'Bắt đầu',
                  dataIndex: 'startTime',
                  key: 'startTime',
                  render: (startTime, record) => (
                    <Select
                      disabled={!record.isActive}
                      value={startTime}
                      onChange={(val) => updateScheduleField(record.dayOfWeek, 'startTime', val)}
                      style={{ width: '100%' }}
                      options={TIME_OPTIONS.map(t => ({ value: t, label: t }))}
                    />
                  )
                },
                {
                  title: 'Kết thúc',
                  dataIndex: 'endTime',
                  key: 'endTime',
                  render: (endTime, record) => (
                    <Select
                      disabled={!record.isActive}
                      value={endTime}
                      onChange={(val) => updateScheduleField(record.dayOfWeek, 'endTime', val)}
                      style={{ width: '100%' }}
                      options={TIME_OPTIONS.map(t => ({ value: t, label: t }))}
                    />
                  )
                },
                {
                  title: 'Thời lượng/Ca',
                  dataIndex: 'slotDurationMinutes',
                  key: 'slotDurationMinutes',
                  width: 130,
                  render: (duration, record) => (
                    <Select
                      disabled={!record.isActive}
                      value={duration}
                      onChange={(val) => updateScheduleField(record.dayOfWeek, 'slotDurationMinutes', val)}
                      style={{ width: '100%' }}
                      options={[
                        { value: 15, label: '15 phút' },
                        { value: 20, label: '20 phút' },
                        { value: 30, label: '30 phút' },
                        { value: 45, label: '45 phút' },
                        { value: 60, label: '60 phút' }
                      ]}
                    />
                  )
                }
              ]}
            />
          </div>
        )}
      </Modal>
    </>
  );
};

export default DoctorManage;
