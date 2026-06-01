import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Space, Button, Select, message, Modal, Form, Input, DatePicker } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, FormOutlined, EyeOutlined } from '@ant-design/icons';
import axiosClient from '../../utils/axiosClient';

const AppointmentManage = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState(undefined);

  // Ghi kết quả khám
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [form] = Form.useForm();
  const [submittingRecord, setSubmittingRecord] = useState(false);

  // Xem kết quả khám
  const [viewRecordModalOpen, setViewRecordModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);

  const fetchAppointments = async (status = undefined) => {
    try {
      setLoading(true);
      const params = {};
      if (status) params.status = status;

      const response = await axiosClient.get('/appointments', { params });
      if (response.success) {
        const appointments = response.data.appointments.map((apt) => ({
          key: apt.id.toString(),
          patientName: apt.patient?.user?.fullName || 'N/A',
          patientPhone: apt.patient?.user?.phone || 'N/A',
          doctorName: apt.doctor?.user?.fullName || 'N/A',
          specialty: apt.doctor?.specialty?.name || 'N/A',
          date: new Date(apt.appointmentDate).toLocaleDateString('vi-VN'),
          time: apt.timeSlot ? `${apt.timeSlot.startTime} - ${apt.timeSlot.endTime}` : 'N/A',
          symptoms: apt.symptoms || 'Không ghi',
          status: apt.status,
        }));
        setDataSource(appointments);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error('Fetch appointments error:', error);
      message.error('Không thể tải danh sách lịch khám');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleFilterChange = (value) => {
    setFilterStatus(value);
    fetchAppointments(value);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    Modal.confirm({
      title: 'Xác nhận thay đổi trạng thái',
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc muốn chuyển trạng thái lịch khám này sang "${getStatusText(newStatus)}"?`,
      okText: 'Đồng ý',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const res = await axiosClient.patch(`/appointments/${id}/status`, { status: newStatus });
          if (res.success) {
            message.success('Cập nhật trạng thái thành công');
            fetchAppointments(filterStatus);
          }
        } catch (error) {
          message.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
      }
    });
  };

  const openRecordModal = (record) => {
    setCurrentAppointment(record);
    form.resetFields();
    setRecordModalOpen(true);
  };

  const handleSaveRecord = async (values) => {
    if (!currentAppointment) return;
    try {
      setSubmittingRecord(true);
      
      // 1. Lưu kết quả khám
      await axiosClient.post('/medical-records', {
        appointmentId: currentAppointment.key,
        diagnosis: values.diagnosis,
        prescription: values.prescription,
        notes: values.notes,
        followUpDate: values.followUpDate ? values.followUpDate.toISOString() : null,
      });

      // 2. Chuyển trạng thái sang COMPLETED
      await axiosClient.patch(`/appointments/${currentAppointment.key}/status`, { status: 'COMPLETED' });

      message.success('Đã lưu kết quả và hoàn thành khám!');
      setRecordModalOpen(false);
      fetchAppointments(filterStatus);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể lưu kết quả');
    } finally {
      setSubmittingRecord(false);
    }
  };

  const handleViewRecord = async (appointmentId) => {
    try {
      const res = await axiosClient.get(`/medical-records/${appointmentId}`);
      if (res.success) {
        setCurrentRecord(res.data);
        setViewRecordModalOpen(true);
      }
    } catch (error) {
      message.error('Không thể tải kết quả khám. Có thể bác sĩ chưa ghi.');
    }
  };

  const getStatusText = (status) => {
    const map = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      COMPLETED: 'Đã khám xong',
      CANCELLED: 'Đã hủy',
      REJECTED: 'Đã từ chối',
      NO_SHOW: 'Không đến',
    };
    return map[status] || status;
  };

  const getStatusColor = (status) => {
    const map = {
      PENDING: 'gold',
      CONFIRMED: 'blue',
      COMPLETED: 'green',
      CANCELLED: 'red',
      REJECTED: 'volcano',
      NO_SHOW: 'default',
    };
    return map[status] || 'default';
  };

  const columns = [
    { title: 'Bệnh nhân', dataIndex: 'patientName', key: 'patientName' },
    { title: 'SĐT', dataIndex: 'patientPhone', key: 'patientPhone' },
    { title: 'Bác sĩ', dataIndex: 'doctorName', key: 'doctorName' },
    { title: 'Chuyên khoa', dataIndex: 'specialty', key: 'specialty' },
    { title: 'Ngày khám', dataIndex: 'date', key: 'date' },
    { title: 'Giờ khám', dataIndex: 'time', key: 'time' },
    { title: 'Triệu chứng', dataIndex: 'symptoms', key: 'symptoms', ellipsis: true },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 200,
      render: (_, record) => {
        if (record.status === 'PENDING') {
          return (
            <Space size="small">
              <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => handleUpdateStatus(record.key, 'CONFIRMED')}>
                Duyệt
              </Button>
              <Button danger size="small" icon={<CloseCircleOutlined />} onClick={() => handleUpdateStatus(record.key, 'REJECTED')}>
                Từ chối
              </Button>
            </Space>
          );
        }
        if (record.status === 'CONFIRMED') {
          return (
            <Space size="small">
              <Button type="primary" size="small" style={{ background: '#52c41a', borderColor: '#52c41a' }} icon={<FormOutlined />} onClick={() => openRecordModal(record)}>
                Ghi kết quả
              </Button>
            </Space>
          );
        }
        if (record.status === 'COMPLETED') {
          return (
            <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewRecord(record.key)}>
              Xem kết quả
            </Button>
          );
        }
        return <Tag>{getStatusText(record.status)}</Tag>;
      },
    },
  ];

  return (
    <>
      <Card 
        title={`Quản lý Lịch khám (${total} lịch hẹn)`} 
        extra={
          <Select
            allowClear
            placeholder="Lọc trạng thái"
            style={{ width: 180 }}
            onChange={handleFilterChange}
            options={[
              { value: 'PENDING', label: 'Chờ xác nhận' },
              { value: 'CONFIRMED', label: 'Đã xác nhận' },
              { value: 'COMPLETED', label: 'Đã khám xong' },
              { value: 'CANCELLED', label: 'Đã hủy' },
              { value: 'REJECTED', label: 'Đã từ chối' },
            ]}
          />
        }
      >
        <Table dataSource={dataSource} columns={columns} loading={loading} scroll={{ x: 1000 }} />
      </Card>

      <Modal
        title="Ghi kết quả khám bệnh"
        open={recordModalOpen}
        onCancel={() => setRecordModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submittingRecord}
        okText="Lưu & Hoàn thành"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleSaveRecord}>
          <Form.Item name="diagnosis" label="Chẩn đoán" rules={[{ required: true, message: 'Vui lòng nhập chẩn đoán' }]}>
            <Input.TextArea rows={3} placeholder="Mô tả chẩn đoán bệnh..." />
          </Form.Item>
          <Form.Item name="prescription" label="Đơn thuốc">
            <Input.TextArea rows={3} placeholder="Ghi chú các loại thuốc (không bắt buộc)..." />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú thêm">
            <Input.TextArea rows={2} placeholder="Lời khuyên cho bệnh nhân (không bắt buộc)..." />
          </Form.Item>
          <Form.Item name="followUpDate" label="Ngày tái khám">
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Kết quả khám bệnh"
        open={viewRecordModalOpen}
        onCancel={() => setViewRecordModalOpen(false)}
        footer={[<Button key="close" onClick={() => setViewRecordModalOpen(false)}>Đóng</Button>]}
      >
        {currentRecord && (
          <div>
            <p><strong>Chẩn đoán:</strong> {currentRecord.diagnosis}</p>
            <p><strong>Đơn thuốc:</strong> {currentRecord.prescription || 'Không có'}</p>
            <p><strong>Ghi chú:</strong> {currentRecord.notes || 'Không có'}</p>
            <p><strong>Ngày tái khám:</strong> {currentRecord.followUpDate ? new Date(currentRecord.followUpDate).toLocaleDateString('vi-VN') : 'Không'}</p>
            <p style={{ marginTop: 16, fontSize: 12, color: 'gray' }}>Ngày khám: {new Date(currentRecord.createdAt).toLocaleDateString('vi-VN')}</p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AppointmentManage;
