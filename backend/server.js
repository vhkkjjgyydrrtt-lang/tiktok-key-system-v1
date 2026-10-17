const express = require('express');
const cors = require('cors'); // Thêm thư viện CORS
const { createClient } = require('@libsql/client/web'); // Dùng bản /web để chạy trên Render
const crypto = require('crypto');

const app = express();

// Cho phép trang Admin (chạy trên GitHub Pages) gọi API sang Render
app.use(cors()); 
app.use(express.json());

// Kết nối Database Turso
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Khởi tạo bảng
async function initDB() {
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
    console.log("✅ Kết nối Database và khởi tạo bảng thành công!");
  } catch (error) {
    console.error("❌ Lỗi khởi tạo DB:", error);
  }
}
initDB();

function generateKey() {
  const raw = crypto.randomBytes(12).toString('hex').toUpperCase();
  return raw.match(/.{1,4}/g).join('-');
}

function keyStatus(row) {
  if (row.revoked) return 'revoked';
  if (!row.activated_at) return 'unused';
  if (row.expires_at && Date.now() > row.expires_at) return 'expired';
  return 'active';
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
function adminAuth(req, res, next) {
  if (req.headers['x-admin-password'] !== ADMIN_PASSWORD)
    return res.status(401).json({ ok: false, error: 'Sai mật khẩu admin' });
  next();
}

// ============ CLIENT API ============
app.post('/api/login', async (req, res) => {
  const { key, deviceId } = req.body;
  if (!key || !deviceId) return res.json({ ok: false, error: 'Thiếu thông tin' });

  try {
    const result = await db.execute({ sql: 'SELECT * FROM keys WHERE key_value = ?', args: [key.trim().toUpperCase()] });
    const row = result.rows[0];

    if (!row) return res.json({ ok: false, error: 'Bạn đã nhập sai key hoặc không có key đó' });
    if (row.revoked) return res.json({ ok: false, error: 'Key đã bị thu hồi' });

    const now = Date.now();
    if (row.expires_at && now > row.expires_at) return res.json({ ok: false, error: 'Key đã hết hạn' });
    if (row.device_id && row.device_id !== deviceId) return res.json({ ok: false, error: 'Key đã được dùng trên thiết bị khác' });

    if (!row.activated_at) {
      const expiresAt = row.duration_hours ? now + row.duration_hours * 3600 * 1000 : null;
      await db.execute({ sql: 'UPDATE keys SET device_id=?, activated_at=?, expires_at=? WHERE id=?', args: [deviceId, now, expiresAt, row.id] });
      return res.json({ ok: true, message: 'Đăng nhập thành công', expiresAt });
    }

    res.json({ ok: true, message: 'Đăng nhập thành công', expiresAt: row.expires_at });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Lỗi server' });
  }
});

app.post('/api/heartbeat', async (req, res) => {
  const { key, deviceId } = req.body;
  try {
    const result = await db.execute({ sql: 'SELECT * FROM keys WHERE key_value = ?', args: [key] });
    const row = result.rows[0];
    if (!row || row.revoked || row.device_id !== deviceId) return res.json({ ok: false });
    if (row.expires_at && Date.now() > row.expires_at) return res.json({ ok: false, reason: 'expired' });
    res.json({ ok: true, expiresAt: row.expires_at });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

// ============ ADMIN API ============
app.post('/admin/keys', adminAuth, async (req, res) => {
  const { durationHours, note } = req.body;
  const key = generateKey();
  try {
    await db.execute({ sql: 'INSERT INTO keys (key_value, duration_hours, created_at, note) VALUES (?,?,?,?)', args: [key, durationHours || null, Date.now(), note || null] });
    res.json({ ok: true, key, durationHours });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Lỗi tạo key' });
  }
});

app.get('/admin/keys', adminAuth, async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM keys ORDER BY id DESC');
    const keys = result.rows.map(r => ({ ...r, status: keyStatus(r) }));
    res.json({ ok: true, keys });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Lỗi lấy danh sách key' });
  }
});

app.post('/admin/keys/:id/revoke', adminAuth, async (req, res) => {
  try {
    await db.execute({ sql: 'UPDATE keys SET revoked=1 WHERE id=?', args: [req.params.id] });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

app.post('/admin/keys/:id/reset-device', adminAuth, async (req, res) => {
  try {
    await db.execute({ sql: 'UPDATE keys SET device_id=NULL WHERE id=?', args: [req.params.id] });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

app.delete('/admin/keys/:id', adminAuth, async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM keys WHERE id=?', args: [req.params.id] });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));
