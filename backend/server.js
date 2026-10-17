const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

let db; // Khai báo biến toàn cục

// Khởi tạo và kết nối DB thông qua import động
async function connectDB() {
  try {
    const { connect } = await import('@tursodatabase/serverless');
    db = connect({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    console.log("✅ Đã kết nối Database!");
  } catch (error) {
    console.error("❌ Lỗi kết nối DB:", error);
    process.exit(1);
  }
}

// Khởi tạo bảng
async function initDB() {
  if (!db) return;
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_value TEXT UNIQUE NOT NULL,
        duration_hours INTEGER,
        created_at INTEGER NOT NULL,
        activated_at INTEGER,
        expires_at INTEGER,
        device_id TEXT,
        revoked INTEGER DEFAULT 0,
        note TEXT
      );
    `);
    console.log("✅ Khởi tạo bảng thành công!");
  } catch (error) {
    console.error("❌ Lỗi khởi tạo bảng:", error);
  }
}

// Hàm helper để lấy row
function getFirstRow(result) {
  return result.rows ? result.rows[0] : null;
}

// ... (Các hàm generateKey, keyStatus, adminAuth, và các API endpoint giữ nguyên như phương án 1, 
// nhưng thay `result.rows[0]` bằng `getFirstRow(result)` cho an toàn)

// Chạy khởi tạo
connectDB().then(() => initDB());

// Phần còn lại của code (app.listen, v.v...) giữ nguyên
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

let db; // Khai báo biến toàn cục

// Khởi tạo và kết nối DB thông qua import động
async function connectDB() {
  try {
    const { connect } = await import('@tursodatabase/serverless');
    db = connect({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    console.log("✅ Đã kết nối Database!");
  } catch (error) {
    console.error("❌ Lỗi kết nối DB:", error);
    process.exit(1);
  }
}

// Khởi tạo bảng
async function initDB() {
  if (!db) return;
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_value TEXT UNIQUE NOT NULL,
        duration_hours INTEGER,
        created_at INTEGER NOT NULL,
        activated_at INTEGER,
        expires_at INTEGER,
        device_id TEXT,
        revoked INTEGER DEFAULT 0,
        note TEXT
      );
    `);
    console.log("✅ Khởi tạo bảng thành công!");
  } catch (error) {
    console.error("❌ Lỗi khởi tạo bảng:", error);
  }
}

// Hàm helper để lấy row
function getFirstRow(result) {
  return result.rows ? result.rows[0] : null;
}

// ... (Các hàm generateKey, keyStatus, adminAuth, và các API endpoint giữ nguyên như phương án 1, 
// nhưng thay `result.rows[0]` bằng `getFirstRow(result)` cho an toàn)

// Chạy khởi tạo
connectDB().then(() => initDB());

// Phần còn lại của code (app.listen, v.v...) giữ nguyên
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));
