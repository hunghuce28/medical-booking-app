import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, message, Modal, Form, Input, Popconfirm, Tag, Switch, Upload, Avatar } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import axiosClient from '../../utils/axiosClient';

const SpecialtyManage = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      // Gọi API lấy toàn bộ chuyên khoa bao gồm cả chuyên khoa ẩn (tạm ngưng hoạt động)
      const response = await axiosClient.get('/specialties?includeInactive=true');
      if (response.success) {
        const specialties = response.data.map((spec) => ({
          key: spec.id.toString(),
          name: spec.name,
          description: spec.description || 'Không có mô tả',
          icon: spec.icon,
          isActive: spec.isActive,
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
        icon: record.icon || '',
      });
      // Nếu đã có icon, hiển thị trong danh sách file preview
      if (record.icon) {
        setFileList([
          {
            uid: '-1',
            name: 'icon_cu.png',
            status: 'done',
            url: record.icon,
          },
        ]);
      } else {
        setFileList([]);
      }
    } else {
      setEditingId(null);
      form.resetFields();
      setFileList([]);
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setFileList([]);
  };

  // Xử lý tự upload file thủ công bằng axiosClient
  const handleUpload = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    try {
      const res = await axiosClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (res.success && res.data?.url) {
        message.success('Tải ảnh lên thành công!');
        form.setFieldValue('icon', res.data.url);
        setFileList([
          {
            uid: file.uid,
            name: file.name,
            status: 'done',
            url: res.data.url,
          },
        ]);
        onSuccess(res.data);
      } else {
        throw new Error('Không nhận được URL ảnh');
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error(error.message || 'Lỗi tải ảnh lên!');
      onError(error);
    } finally {
      setUploading(false);
    }
  };

  const handleFinish = async (values) => {
    try {
      const dataSubmit = {
        ...values,
        icon: form.getFieldValue('icon') || '',
      };

      if (editingId) {
        // Cập nhật
        const res = await axiosClient.put(`/specialties/${editingId}`, dataSubmit);
        if (res.success) {
          message.success('Cập nhật chuyên khoa thành công');
        }
      } else {
        // Tạo mới
        const res = await axiosClient.post('/specialties', dataSubmit);
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

  // Đổi trạng thái isActive trực tiếp bằng nút Switch trên bảng
  const handleToggleStatus = async (record) => {
    try {
      const newStatus = !record.isActive;
      const res = await axiosClient.put(`/specialties/${record.key}`, {
        isActive: newStatus,
      });
      if (res.success) {
        message.success(`Đã ${newStatus ? 'kích hoạt' : 'tạm ngưng'} chuyên khoa thành công`);
        fetchSpecialties();
      }
    } catch (error) {
      message.error('Không thể thay đổi trạng thái chuyên khoa này!');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axiosClient.delete(`/specialties/${id}`);
      if (res.success) {
        message.success('Đã ẩn chuyên khoa (chuyển sang trạng thái tạm ngưng)');
        fetchSpecialties();
      }
    } catch (error) {
      message.error('Không thể xóa chuyên khoa này!');
    }
  };

  const columns = [
    {
      title: 'Biểu tượng',
      dataIndex: 'icon',
      key: 'icon',
      width: 100,
      render: (icon) => (
        <Avatar
          src={icon}
          size={50}
          shape="square"
          style={{ 
            backgroundColor: '#f5f5f5', 
            border: '1px solid #f0f0f0',
            objectFit: 'cover'
          }}
          alt="icon"
        >
          Spec
        </Avatar>
      ),
    },
    { 
      title: 'Tên chuyên khoa', 
      dataIndex: 'name', 
      key: 'name', 
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span> 
    },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    { title: 'Số bác sĩ', dataIndex: 'doctorCount', key: 'doctorCount', align: 'center' },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 150,
      align: 'center',
      render: (isActive, record) => (
        <Space direction="vertical" size="small">
          <Tag color={isActive ? 'success' : 'error'}>
            {isActive ? 'Hoạt động' : 'Tạm ngưng'}
          </Tag>
          <Switch 
            size="small" 
            checked={isActive} 
            onChange={() => handleToggleStatus(record)} 
          />
        </Space>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 180,
      align: 'center',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => showModal(record)}>
            Sửa
          </Button>
          {record.isActive ? (
            <Popconfirm
              title="Bạn có chắc chắn muốn ngưng hoạt động chuyên khoa này?"
              onConfirm={() => handleDelete(record.key)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button danger icon={<EyeInvisibleOutlined />} size="small">Tạm ẩn</Button>
            </Popconfirm>
          ) : (
            <Button 
              type="dashed" 
              icon={<EyeOutlined />} 
              size="small" 
              onClick={() => handleToggleStatus(record)}
            >
              Mở lại
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card 
        title={<span style={{ fontSize: 18, fontWeight: 700 }}>🏥 Quản lý Chuyên khoa</span>} 
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()} style={{ borderRadius: 6 }}>
            Thêm chuyên khoa
          </Button>
        }
        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
      >
        <Table dataSource={dataSource} columns={columns} loading={loading} style={{ marginTop: 10 }} />
      </Card>

      <Modal
        title={editingId ? "✏️ Sửa chuyên khoa" : "🆕 Thêm chuyên khoa mới"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        style={{ top: 80 }}
      >
        <Form layout="vertical" form={form} onFinish={handleFinish} style={{ marginTop: 15 }}>
          <Form.Item
            name="name"
            label={<span style={{ fontWeight: 500 }}>Tên chuyên khoa</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên chuyên khoa!' }]}
          >
            <Input placeholder="VD: Tim mạch, Nhi khoa, Tai Mũi Họng..." style={{ borderRadius: 6 }} />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span style={{ fontWeight: 500 }}>Mô tả</span>}
          >
            <Input.TextArea rows={4} placeholder="Mô tả chi tiết về chuyên khoa và phạm vi điều trị..." style={{ borderRadius: 6 }} />
          </Form.Item>

          <Form.Item
            name="icon"
            label={<span style={{ fontWeight: 500 }}>Ảnh biểu tượng (Icon)</span>}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Upload
                listType="picture-card"
                maxCount={1}
                fileList={fileList}
                customRequest={handleUpload}
                onChange={({ fileList }) => setFileList(fileList)}
                onRemove={() => {
                  setFileList([]);
                  form.setFieldValue('icon', '');
                }}
              >
                {fileList.length < 1 && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                  </div>
                )}
              </Upload>
              <Input 
                placeholder="Hoặc nhập liên kết URL ảnh trực tiếp..." 
                value={form.getFieldValue('icon')}
                onChange={(e) => {
                  form.setFieldValue('icon', e.target.value);
                  if (e.target.value) {
                    setFileList([
                      {
                        uid: '-2',
                        name: 'url_image.png',
                        status: 'done',
                        url: e.target.value,
                      }
                    ]);
                  } else {
                    setFileList([]);
                  }
                }}
                style={{ borderRadius: 6 }}
              />
            </Space>
          </Form.Item>

          <Form.Item className="mb-0 text-right" style={{ marginTop: 25 }}>
            <Space>
              <Button onClick={handleCancel} style={{ borderRadius: 6 }}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={uploading} style={{ borderRadius: 6 }}>
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
