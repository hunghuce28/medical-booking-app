/**
 * Test Setup — chạy trước mỗi test suite
 */

// Load env cho test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-unit-tests';
