import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Space, Button, Input, message, Popconfirm, Modal, Descriptions } from 'antd';
import { SearchOutlined, LockOutlined, UnlockOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';
import axiosClient from '../../utils/axiosClient';

const PatientManage = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');

  // Chi tiết bệnh nhân
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchPatients = async (search = '') => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;

      const response = await axiosClient.get('/patients', { params });
      if (response.success) {
        const patients = response.data.patients.map((p) => ({
          key: p.id.toString(),
          name: p.user.fullName,
          email: p.user.email,
          phone: p.user.phone || 'Chưa cập nhật',
          gender: p.gender === 'MALE' ? 'Nam' : p.gender === 'FEMALE' ? 'Nữ' : 'Chưa cập nhật',
          appointmentCount: p._count?.appointments || 0,
          status: p.user.isActive ? 'active' : 'inactive',
          createdAt: new Date(p.user.createdAt).toLocaleDateString('vi-VN'),
        }));
        setDataSource(patients);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error('Fetch patients error:', error);
      message.error('Không thể tải danh sách bệnh nhân');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
    fetchPatients(value);
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await axiosClient.patch(`/patients/${id}/toggle-status`);
      if (res.success) {
        message.success(res.message);
        fetchPatients(searchText);
      }
    } catch (error) {
      message.error('Không thể thay đổi trạng thái!');
    }
  };

  const handleViewDetail = async (id) => {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      const res = await axiosClient.get(`/patients/${id}`);
      if (res.success) {
        setSelectedPatient(res.data);
      }
    } catch (error) {
      message.error('Không thể tải thông tin bệnh nhân');
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    { title: 'Họ và tên', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
    { title: 'Giới tính', dataIndex: 'gender', key: 'gender' },
    { title: 'Số lần khám', dataIndex: 'appointmentCount', key: 'appointmentCount', sorter: (a, b) => a.appointmentCount - b.appointmentCount },
    { title: 'Ngày đăng ký', dataIndex: 'createdAt', key: 'createdAt' },
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
        <Space size="small">
          <Button type="primary" icon={<EyeOutlined />} size="small" onClick={() => handleViewDetail(record.key)}>
            Chi tiết
          </Button>
          <Popconfirm
            title={record.status === 'active' ? 'Khóa tài khoản bệnh nhân này?' : 'Mở khóa tài khoản này?'}
            onConfirm={() => handleToggleStatus(record.key)}
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
      <Card
        title={`Quản lý Bệnh nhân (${total} bệnh nhân)`}
        extra={
          <Input.Search
            placeholder="Tìm theo tên, email, SĐT..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
        }
      >
        <Table dataSource={dataSource} columns={columns} loading={loading} scroll={{ x: 900 }} />
      </Card>

      <Modal
        title="Chi tiết bệnh nhân"
        open={detailOpen}
        onCancel={() => { setDetailOpen(false); setSelectedPatient(null); }}
        footer={null}
        width={600}
        loading={detailLoading}
      >
        {selectedPatient && (
          <>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Họ và tên">{selectedPatient.user.fullName}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedPatient.user.email}</Descriptions.Item>
              <Descriptions.Item label="SĐT">{selectedPatient.user.phone || 'Chưa cập nhật'}</Descriptions.Item>
              <Descriptions.Item label="Giới tính">
                {selectedPatient.gender === 'MALE' ? 'Nam' : selectedPatient.gender === 'FEMALE' ? 'Nữ' : 'Chưa cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">
                {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">{selectedPatient.address || 'Chưa cập nhật'}</Descriptions.Item>
              <Descriptions.Item label="Nhóm máu">{selectedPatient.bloodType || 'Chưa cập nhật'}</Descriptions.Item>
              <Descriptions.Item label="Dị ứng">{selectedPatient.allergies || 'Không có'}</Descriptions.Item>
              <Descriptions.Item label="Số BHYT">{selectedPatient.insuranceNumber || 'Chưa cập nhật'}</Descriptions.Item>
            </Descriptions>

            {selectedPatient.appointments && selectedPatient.appointments.length > 0 && (
              <Card title="Lịch sử khám gần đây" size="small">
                <Table
                  dataSource={selectedPatient.appointments.map((apt, idx) => ({
                    key: idx,
                    doctor: apt.doctor?.user?.fullName || 'N/A',
                    specialty: apt.doctor?.specialty?.name || 'N/A',
                    date: new Date(apt.appointmentDate).toLocaleDateString('vi-VN'),
                    time: apt.timeSlot ? `${apt.timeSlot.startTime} - ${apt.timeSlot.endTime}` : 'N/A',
                    status: apt.status,
                  }))}
                  columns={[
                    { title: 'Bác sĩ', dataIndex: 'doctor' },
                    { title: 'Chuyên khoa', dataIndex: 'specialty' },
                    { title: 'Ngày', dataIndex: 'date' },
                    { title: 'Trạng thái', dataIndex: 'status', render: (s) => <Tag>{s}</Tag> },
                  ]}
                  pagination={false}
                  size="small"
                />
              </Card>
            )}
          </>
        )}
      </Modal>
    </>
  );
};

export default PatientManage;
