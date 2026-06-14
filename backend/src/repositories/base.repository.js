/**
 * Base Repository Class
 * Provides standard CRUD operations for all domain repositories.
 * Isolates data access layer from business logic (Service layer).
 */

const prisma = require('../utils/prisma');

class BaseRepository {
  /**
   * @param {string} modelName - Prisma model name (e.g., 'user', 'appointment')
   */
  constructor(modelName) {
    this.model = prisma[modelName];
    this.prisma = prisma;
    this.modelName = modelName;
  }

  /**
   * Tìm một bản ghi theo ID
   */
  async findById(id, options = {}) {
    return this.model.findUnique({
      where: { id: parseInt(id) },
      ...options,
    });
  }

  /**
   * Tìm một bản ghi theo điều kiện
   */
  async findOne(where, options = {}) {
    return this.model.findFirst({
      where,
      ...options,
    });
  }

  /**
   * Tìm một bản ghi theo điều kiện unique
   */
  async findUnique(where, options = {}) {
    return this.model.findUnique({
      where,
      ...options,
    });
  }

  /**
   * Tìm nhiều bản ghi với filter, include, orderBy và pagination
   */
  async findMany(where = {}, options = {}) {
    const { include, orderBy, skip, take, select } = options;
    return this.model.findMany({
      where,
      ...(include && { include }),
      ...(orderBy && { orderBy }),
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
      ...(select && { select }),
    });
  }

  /**
   * Đếm số bản ghi theo filter
   */
  async count(where = {}) {
    return this.model.count({ where });
  }

  /**
   * Tạo một bản ghi mới
   */
  async create(data, options = {}) {
    return this.model.create({
      data,
      ...options,
    });
  }

  /**
   * Cập nhật một bản ghi theo ID
   */
  async update(id, data, options = {}) {
    return this.model.update({
      where: { id: parseInt(id) },
      data,
      ...options,
    });
  }

  /**
   * Cập nhật một bản ghi theo điều kiện unique
   */
  async updateWhere(where, data, options = {}) {
    return this.model.update({
      where,
      data,
      ...options,
    });
  }

  /**
   * Cập nhật nhiều bản ghi theo filter
   */
  async updateMany(where, data) {
    return this.model.updateMany({ where, data });
  }

  /**
   * Xóa một bản ghi theo ID
   */
  async delete(id) {
    return this.model.delete({
      where: { id: parseInt(id) },
    });
  }

  /**
   * Upsert — tạo mới nếu chưa tồn tại, cập nhật nếu đã tồn tại
   */
  async upsert(where, create, update, options = {}) {
    return this.model.upsert({
      where,
      create,
      update,
      ...options,
    });
  }

  /**
   * Aggregate — tính toán thống kê
   */
  async aggregate(options) {
    return this.model.aggregate(options);
  }

  /**
   * GroupBy — nhóm dữ liệu theo trường
   */
  async groupBy(options) {
    return this.model.groupBy(options);
  }

  /**
   * Thực thi Prisma transaction
   * @param {Function} fn - Async function nhận transaction client làm tham số
   */
  async transaction(fn) {
    return this.prisma.$transaction(fn);
  }

  /**
   * Raw query — truy vấn SQL thuần
   */
  async queryRaw(query, ...args) {
    return this.prisma.$queryRaw(query, ...args);
  }

  /**
   * Tìm nhiều bản ghi với phân trang, trả kèm tổng số
   */
  async findManyWithCount(where = {}, options = {}) {
    const { include, orderBy, page = 1, limit = 20, select } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        ...(include && { include }),
        ...(orderBy && { orderBy }),
        ...(select && { select }),
        skip,
        take,
      }),
      this.model.count({ where }),
    ]);

    return { data, total, page: parseInt(page), limit: parseInt(limit) };
  }
}

module.exports = BaseRepository;
