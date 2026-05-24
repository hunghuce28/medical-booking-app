import { Platform } from 'react-native';

// Chỉ import SQLite nếu KHÔNG PHẢI là nền tảng web
let SQLite = null;
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}

const DB_NAME = 'medical_booking.db';

// Mở hoặc tạo database
export const openDatabase = async () => {
  if (Platform.OS === 'web') return null;
  return await SQLite.openDatabaseAsync(DB_NAME);
};

// Khởi tạo các bảng
export const initDB = async () => {
  if (Platform.OS === 'web') {
    console.log('SQLite is disabled on Web platform');
    return;
  }
  try {
    const db = await openDatabase();
    
    // Bảng Cache cho Danh sách Chuyên khoa
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS specialties (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        isActive INTEGER DEFAULT 1,
        doctorCount INTEGER DEFAULT 0,
        updatedAt TEXT
      );
    `);

    // Bảng Cache cho Thông báo (Cập nhật thường xuyên, schema phức tạp)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT,
        isRead INTEGER DEFAULT 0,
        data TEXT, 
        createdAt TEXT
      );
    `);

    console.log('SQLite DB initialized successfully');
  } catch (error) {
    console.error('Error initializing SQLite DB:', error);
  }
};

/**
 * CACHE CHUYÊN KHOA (SPECIALTIES)
 */

export const cacheSpecialties = async (specialtiesArray) => {
  try {
    const db = await openDatabase();
    // Chạy transaction để tăng hiệu suất khi insert/update nhiều dòng
    await db.withTransactionAsync(async () => {
      // Xóa cũ (nếu muốn làm mới hoàn toàn, hoặc bạn có thể dùng INSERT OR REPLACE)
      await db.execAsync('DELETE FROM specialties;');
      
      const statement = await db.prepareAsync(
        'INSERT INTO specialties (id, name, description, icon, isActive, doctorCount, updatedAt) VALUES ($id, $name, $description, $icon, $isActive, $doctorCount, $updatedAt)'
      );
      
      try {
        for (const item of specialtiesArray) {
          await statement.executeAsync({
            $id: item.id,
            $name: item.name,
            $description: item.description || '',
            $icon: item.icon || '',
            $isActive: item.isActive ? 1 : 0,
            $doctorCount: item._count?.doctors || 0,
            $updatedAt: new Date().toISOString(),
          });
        }
      } finally {
        await statement.finalizeAsync();
      }
    });
  } catch (error) {
    console.error('Error caching specialties:', error);
  }
};

export const getCachedSpecialties = async () => {
  try {
    const db = await openDatabase();
    const result = await db.getAllAsync('SELECT * FROM specialties ORDER BY id ASC;');
    // Đảo ngược format lại giống API trả về
    return result.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      icon: item.icon,
      isActive: item.isActive === 1,
      _count: { doctors: item.doctorCount },
    }));
  } catch (error) {
    console.error('Error getting cached specialties:', error);
    return [];
  }
};

export default {
  openDatabase,
  initDB,
  cacheSpecialties,
  getCachedSpecialties,
};
