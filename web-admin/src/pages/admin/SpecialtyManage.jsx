import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, message, Modal, Form, Input, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axiosClient from '../../utils/axiosClient';

const SpecialtyManage = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/specialties');
      if (response.success) {
        const specialties = response.data.map((spec) => ({
          key: spec.id.toString(),
          name: spec.name,
          description: spec.description || 'Không có mô tả',
          doctorCount: spec._count?.doctors || 0,
        }));
        setDataSource(specialties);
      }
    } catch (error) {
      console.error('Fetch specialties error:', error);
      message.error('Không thể tải danh sách chuyên khoa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const showModal = (record = null) => {
    if (record) {
      setEditingId(record.key);
      form.setFieldsValue({
        name: record.name,
        description: record.description !== 'Không có mô tả' ? record.description : '',
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
        // Cập nhật
        const res = await axiosClient.put(`/specialties/${editingId}`, values);
        if (res.success) {
          message.success('Cập nhật chuyên khoa thành công');
        }
      } else {
        // Tạo mới
        const res = await axiosClient.post('/specialties', values);
        if (res.success) {
          message.success('Thêm mới chuyên khoa thành công');
        }
      }
      setIsModalOpen(false);
      fetchSpecialties();
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axiosClient.delete(`/specialties/${id}`);
      if (res.success) {
        message.success('Đã xóa chuyên khoa');
        fetchSpecialties();
      }
    } catch (error) {
      message.error('Không thể xóa chuyên khoa này!');
    }
  };

  const columns = [
    { title: 'Tên chuyên khoa', dataIndex: 'name', key: 'name' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    { title: 'Số bác sĩ', dataIndex: 'doctorCount', key: 'doctorCount' },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => showModal(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa chuyên khoa này?"
            onConfirm={() => handleDelete(record.key)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button danger icon={<DeleteOutlined />} size="small">Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card title="Quản lý Chuyên khoa" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>Thêm chuyên khoa</Button>}>
        <Table dataSource={dataSource} columns={columns} loading={loading} />
      </Card>

      <Modal
        title={editingId ? "Sửa chuyên khoa" : "Thêm chuyên khoa mới"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Form.Item
            name="name"
            label="Tên chuyên khoa"
            rules={[{ required: true, message: 'Vui lòng nhập tên chuyên khoa!' }]}
          >
            <Input placeholder="VD: Tim mạch, Nhi khoa..." />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={4} placeholder="Mô tả chi tiết về chuyên khoa" />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={handleCancel}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {editingId ? "Lưu thay đổi" : "Thêm mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SpecialtyManage;
