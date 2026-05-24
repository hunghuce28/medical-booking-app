import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Tag, message, Modal, Form, Input, Popconfirm, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import axiosClient from '../../utils/axiosClient';

const DoctorManage = () => {
  const [dataSource, setDataSource] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

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
      // Dùng PUT thay vì DELETE để có thể mở khóa (truyền isActive)
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
    </>
  );
};

export default DoctorManage;
