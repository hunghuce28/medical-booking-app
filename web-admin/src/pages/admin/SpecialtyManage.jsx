import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, message, Modal, Form, Input, Popconfirm, Tag, Switch, Upload, Avatar } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, EyeOutlined, EyeInvisibleOutlined, AppstoreOutlined } from '@ant-design/icons';
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
      const response = await axiosClient.get('/specialties?includeInactive=true');
      if (response.success) {
        const specialties = response.data.map((spec) => ({
          key: spec.id.toString(),
          name: spec.name,
          description: spec.description || 'Không có mô tả chi tiết.',
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
        description: record.description !== 'Không có mô tả chi tiết.' ? record.description : '',
        icon: record.icon || '',
      });
      if (record.icon) {
        setFileList([
          {
            uid: '-1',
            name: 'icon_specialty.png',
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
        message.success('Tải ảnh biểu tượng lên thành công!');
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
        throw new Error('Không nhận được URL ảnh từ máy chủ');
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
        const res = await axiosClient.put(`/specialties/${editingId}`, dataSubmit);
        if (res.success) {
          message.success('Cập nhật thông tin chuyên khoa thành công');
        }
      } else {
        const res = await axiosClient.post('/specialties', dataSubmit);
        if (res.success) {
          message.success('Thêm mới chuyên khoa y tế thành công');
        }
      }
      setIsModalOpen(false);
      fetchSpecialties();
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!');
    }
  };

  const handleToggleStatus = async (record) => {
    try {
      const newStatus = !record.isActive;
      const res = await axiosClient.put(`/specialties/${record.key}`, {
        isActive: newStatus,
      });
      if (res.success) {
        message.success(`Đã ${newStatus ? 'kích hoạt hoạt động' : 'tạm ngưng hoạt động'} chuyên khoa`);
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
        message.success('Đã ẩn chuyên khoa thành công');
        fetchSpecialties();
      }
    } catch (error) {
      message.error('Không thể ngưng hoạt động chuyên khoa này!');
    }
  };

  const columns = [
    {
      title: 'Biểu tượng',
      dataIndex: 'icon',
      key: 'icon',
      width: 120,
      align: 'center',
      render: (icon) => (
        <Avatar
          src={icon}
          size={56}
          shape="square"
          className="avatar-glow"
          style={{ 
            backgroundColor: '#f8fafc',
            objectFit: 'cover'
          }}
          icon={<AppstoreOutlined style={{ color: '#1677ff', fontSize: 24 }} />}
          alt="biểu tượng chuyên khoa"
        />
      ),
    },
    { 
      title: 'Tên chuyên khoa', 
      dataIndex: 'name', 
      key: 'name', 
      width: 200,
      render: (text) => (
        <span style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>
          {text}
        </span>
      )
    },
    { 
      title: 'Mô tả chi tiết', 
      dataIndex: 'description', 
      key: 'description',
      render: (text) => (
        <span style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.5 }}>
          {text}
        </span>
      )
    },
    { 
      title: 'Số bác sĩ', 
      dataIndex: 'doctorCount', 
      key: 'doctorCount', 
      align: 'center',
      width: 110,
      render: (count) => (
        <Tag color="cyan" style={{ borderRadius: '6px', fontWeight: 600, padding: '2px 8px', fontSize: '13px' }}>
          {count} bác sĩ
        </Tag>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 140,
      align: 'center',
      render: (isActive, record) => (
        <Space direction="vertical" size={6}>
          <Tag 
            color={isActive ? 'success' : 'error'} 
            style={{ 
              borderRadius: '20px', 
              fontWeight: 600, 
              padding: '2px 10px',
              border: 'none',
              boxShadow: isActive ? '0 2px 8px rgba(82,196,26,0.15)' : '0 2px 8px rgba(255,77,79,0.15)'
            }}
          >
            {isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
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
        <Space size="small">
          <Button 
            type="text"
            icon={<EditOutlined style={{ color: '#1677ff' }} />} 
            onClick={() => showModal(record)}
            style={{ 
              backgroundColor: 'rgba(22, 119, 255, 0.08)',
              borderRadius: '6px',
              fontWeight: 500,
              color: '#1677ff'
            }}
          >
            Sửa
          </Button>
          {record.isActive ? (
            <Popconfirm
              title="Bạn có chắc chắn muốn ngưng hoạt động chuyên khoa này?"
              onConfirm={() => handleDelete(record.key)}
              okText="Đồng ý"
              cancelText="Hủy"
              placement="topRight"
            >
              <Button 
                type="text" 
                danger
                icon={<EyeInvisibleOutlined />} 
                style={{ 
                  backgroundColor: 'rgba(255, 77, 79, 0.08)',
                  borderRadius: '6px',
                  fontWeight: 500
                }}
              >
                Ẩn
              </Button>
            </Popconfirm>
          ) : (
            <Button 
              type="text"
              icon={<EyeOutlined style={{ color: '#52c41a' }} />} 
              onClick={() => handleToggleStatus(record)}
              style={{ 
                backgroundColor: 'rgba(82, 196, 26, 0.08)',
                borderRadius: '6px',
                fontWeight: 500,
                color: '#52c41a'
              }}
            >
              Mở lại
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '4px' }}>
      <Card 
        className="glass-card"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>🏥</span>
            <span className="gradient-text" style={{ fontSize: '20px', letterSpacing: '-0.3px' }}>
              Danh mục Chuyên khoa
            </span>
          </div>
        } 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => showModal()} 
            className="gradient-button"
          >
            Thêm chuyên khoa mới
          </Button>
        }
      >
        <Table 
          dataSource={dataSource} 
          columns={columns} 
          loading={loading} 
          pagination={{ pageSize: 8 }}
          style={{ marginTop: 8 }} 
        />
      </Card>

      <Modal
        title={
          <div style={{ paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
              {editingId ? "✏️ Cập nhật Chuyên khoa" : "🆕 Thêm chuyên khoa mới"}
            </span>
          </div>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        style={{ top: 80 }}
        width={500}
      >
        <Form layout="vertical" form={form} onFinish={handleFinish} style={{ marginTop: 20 }}>
          <Form.Item
            name="name"
            label={<span style={{ fontWeight: 600, color: '#475569' }}>Tên chuyên khoa</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên chuyên khoa!' }]}
          >
            <Input 
              placeholder="VD: Tim mạch, Nhi khoa, Răng Hàm Mặt..." 
              className="premium-input" 
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span style={{ fontWeight: 600, color: '#475569' }}>Mô tả chi tiết</span>}
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Nhập giới thiệu chi tiết về chuyên khoa y tế này..." 
              className="premium-textarea" 
            />
          </Form.Item>

          <Form.Item
            name="icon"
            label={<span style={{ fontWeight: 600, color: '#475569' }}>Ảnh đại diện biểu tượng (Icon)</span>}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
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
                style={{ marginTop: '5px' }}
              >
                {fileList.length < 1 && (
                  <div style={{ color: '#64748b' }}>
                    <PlusOutlined style={{ fontSize: '20px', color: '#1677ff' }} />
                    <div style={{ marginTop: 8, fontWeight: 500 }}>Tải ảnh lên</div>
                  </div>
                )}
              </Upload>
              <Input 
                placeholder="Hoặc dán địa chỉ URL hình ảnh biểu tượng vào đây..." 
                value={form.getFieldValue('icon')}
                className="premium-input"
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
              />
            </Space>
          </Form.Item>

          <Form.Item className="mb-0 text-right" style={{ marginTop: 30, borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
            <Space size="middle">
              <Button 
                onClick={handleCancel} 
                style={{ 
                  borderRadius: '8px', 
                  fontWeight: 600, 
                  height: '38px',
                  color: '#64748b'
                }}
              >
                Hủy bỏ
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={uploading || loading} 
                className="gradient-button"
              >
                {editingId ? "Cập nhật" : "Tạo mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SpecialtyManage;
