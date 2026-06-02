import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { query } from './db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'siresep_super_secret_key_2026';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static(uploadDir));

// ==========================================
// AUTO-MIGRATION
// ==========================================
(async () => {
  try {
    await query('ALTER TABLE products ADD COLUMN IF NOT EXISTS image VARCHAR(255)');
    await query('ALTER TABLE products ADD COLUMN IF NOT EXISTS requires_prescription BOOLEAN DEFAULT FALSE');
    await query('ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT \'Obat Bebas\'');
    
    await query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS prescription_image VARCHAR(255)');
    await query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_price NUMERIC');
    await query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS items TEXT');
    
    console.log('✅ Auto-Migration: Kolom kategori berhasil ditambahkan.');
  } catch (err) {
    console.log('⚠️ Auto-Migration Info:', err.message);
  }
})();

app.get('/api/health', async (req, res) => {
  try {
    const dbTest = await query('SELECT NOW()');
    res.status(200).json({ status: 'success', message: 'Backend OK', dbTime: dbTest.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'DB Error', error: error.message });
  }
});

// ==========================================
// ENDPOINT AUTENTIKASI
// ==========================================
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ status: 'error', message: 'Semua field wajib diisi' });
  }
  try {
    const userCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) return res.status(400).json({ status: 'error', message: 'Email sudah terdaftar' });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await query(
      'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
      [name, email, hashedPassword, role, phone]
    );
    res.status(201).json({ status: 'success', message: 'Registrasi berhasil', data: newUser.rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal melakukan registrasi' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ status: 'error', message: 'Email dan password wajib diisi' });
  try {
    const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(401).json({ status: 'error', message: 'Email atau password salah' });
    
    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ status: 'error', message: 'Email atau password salah' });
    
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({
      status: 'success',
      token,
      data: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal melakukan login' });
  }
});

// ==========================================
// CRUD: MANAGEMENT PRODUK (OBAT)
// ==========================================
app.get('/api/products', async (req, res) => {
  try {
    const result = await query('SELECT * FROM products ORDER BY id DESC');
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data produk' });
  }
});

app.post('/api/products', upload.single('image'), async (req, res) => {
  const { name, unit, price, badge, stock, requires_prescription, category } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  const isPrescriptionRequired = requires_prescription === 'true'; 

  if (!name || !unit || !price) return res.status(400).json({ status: 'error', message: 'Data produk tidak lengkap' });
  try {
    const result = await query(
      `INSERT INTO products (name, unit, price, badge, icon_class, stock, image, requires_prescription, category) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, unit, price, badge || null, 'fa-pills', stock || 0, imagePath, isPrescriptionRequired, category || 'Obat Bebas']
    );
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal menambahkan produk' });
  }
});

app.put('/api/products/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { name, unit, price, badge, stock, requires_prescription, category, existing_image } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : (existing_image || null);
  const isPrescriptionRequired = requires_prescription === 'true';

  try {
    const result = await query(
      `UPDATE products 
       SET name = $1, unit = $2, price = $3, badge = $4, stock = $5, image = $6, requires_prescription = $7, category = $8 
       WHERE id = $9 RETURNING *`,
      [name, unit, price, badge || null, stock, imagePath, isPrescriptionRequired, category || 'Obat Bebas', id]
    );
    if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal memperbarui data produk' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal menghapus produk' });
  }
});

// ==========================================
// CRUD: MANAGEMENT PESANAN (ORDERS)
// ==========================================
app.get('/api/orders', async (req, res) => {
  try {
    const result = await query('SELECT * FROM orders ORDER BY created_at DESC');
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data pesanan' });
  }
});

app.post('/api/orders', upload.single('prescription'), async (req, res) => {
  try {
    const { user_id, customer_name, delivery_address, delivery_type, total_price, items } = req.body;
    const prescriptionPath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!customer_name) {
      return res.status(400).json({ status: 'error', message: 'Nama pelanggan tidak valid' });
    }

    const orderId = `#APTX-${Math.floor(1000 + Math.random() * 9000)}`;
    const dbDeliveryType = (delivery_type === 'Diantar' || delivery_type === 'Delivery') ? 'Delivery' : 'Pickup';

    const result = await query(
      `INSERT INTO orders (order_id, user_id, customer_name, delivery_address, delivery_type, status, payment_status, total_amount, prescription_image, total_price, items) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        orderId, user_id || null, customer_name, delivery_address || '-', dbDeliveryType, 
        'Cek Resep', 'Belum Dibayar', total_price || 0, prescriptionPath, total_price || 0, items || '[]'
      ]
    );
    res.status(201).json({ status: 'success', message: 'Checkout berhasil', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal melakukan checkout pesanan. Pastikan struktur DB sudah diupdate.' });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    let result = await query('UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *', [status, id]);
    if (result.rows.length === 0) {
      result = await query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
      if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Pesanan tidak ditemukan' });
    }
    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal memperbarui status pesanan' });
  }
});

// ENDPOINT BARU: KURIR AMBIL TUGAS
app.put('/api/orders/:id/take-task', async (req, res) => {
  const { id } = req.params;
  const { driver_name, driver_vehicle } = req.body;
  try {
    let result = await query(
      `UPDATE orders SET status = 'Kurir Menuju Lokasi', driver_name = $1, driver_vehicle = $2 WHERE order_id = $3 RETURNING *`,
      [driver_name, driver_vehicle || 'Motor Operasional Siresep', id]
    );
    if (result.rows.length === 0) {
      result = await query(
        `UPDATE orders SET status = 'Kurir Menuju Lokasi', driver_name = $1, driver_vehicle = $2 WHERE id = $3 RETURNING *`,
        [driver_name, driver_vehicle || 'Motor Operasional Siresep', id]
      );
      if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Pesanan tidak ditemukan' });
    }
    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal mengambil tugas kurir' });
  }
});

// ENDPOINT BARU: KURIR SELESAIKAN PESANAN
app.put('/api/orders/:id/complete-task', async (req, res) => {
  const { id } = req.params;
  try {
    let result = await query(
      `UPDATE orders SET status = 'Pesanan Tiba' WHERE order_id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      result = await query(
        `UPDATE orders SET status = 'Pesanan Tiba' WHERE id = $1 RETURNING *`,
        [id]
      );
      if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Pesanan tidak ditemukan' });
    }
    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal menyelesaikan pesanan' });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let result = await query('DELETE FROM orders WHERE order_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      result = await query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Pesanan tidak ditemukan' });
    }
    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal menghapus pesanan' });
  }
});

app.listen(PORT, () => {
  console.log(`Server Siresep berjalan di http://localhost:${PORT}`);
});