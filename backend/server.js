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

// KONFIGURASI PAYMENT GATEWAY PAKASIR
const PAKASIR_SLUG = process.env.PAKASIR_SLUG || 'digicloud';
const PAKASIR_API_KEY = process.env.PAKASIR_API_KEY || 'Tj2xOP1tsX0TXH5GCjmj3CHgHCM8uciM';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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
    await query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT \'COD\'');

    await query('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check');
    await query(`ALTER TABLE orders ADD CONSTRAINT orders_status_check 
                 CHECK (status IN ('Pending', 'Cek Resep', 'Sedang Diramu', 'Kurir Menuju Lokasi', 'Pesanan Tiba'))`);

    await query('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_delivery_type_check');
    await query(`ALTER TABLE orders ADD CONSTRAINT orders_delivery_type_check 
                 CHECK (delivery_type IN ('Delivery', 'Pickup', 'Offline'))`);

    await query('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check');
    await query(`ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
                 CHECK (payment_status IN ('Belum Dibayar', 'Sudah Dibayar'))`);

    console.log('✅ Auto-Migration selesai dengan pembaruan aturan status.');
  } catch (err) {
    console.log('⚠️ Auto-Migration Info:', err.message);
  }
})();

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/api/health', async (req, res) => {
  try {
    const dbTest = await query('SELECT NOW()');
    res.status(200).json({ status: 'success', message: 'Backend OK', dbTime: dbTest.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'DB Error', error: error.message });
  }
});

// ==========================================
// AUTENTIKASI
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
// CRUD: PRODUK
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
  const { id } = params;
  try {
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal menghapus produk' });
  }
});

// ==========================================
// CRUD: PESANAN (ORDERS)
// ==========================================
app.get('/api/orders', async (req, res) => {
  const { date } = req.query;
  try {
    let result;
    if (date) {
      result = await query('SELECT * FROM orders WHERE DATE(created_at) = $1 ORDER BY created_at DESC', [date]);
    } else {
      result = await query('SELECT * FROM orders ORDER BY created_at DESC');
    }
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data pesanan' });
  }
});

app.get('/api/orders/check-status/:order_id', async (req, res) => {
  const { order_id } = req.params;
  try {
    const result = await query('SELECT payment_status, status, total_amount, payment_method FROM orders WHERE order_id = $1', [order_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Pesanan tidak ditemukan' });
    }
    
    let order = result.rows[0];

    if (order.payment_status === 'Belum Dibayar' && order.payment_method === 'Cashless') {
      const amountInt = Math.round(order.total_amount);
      const detailUrl = `https://app.pakasir.com/api/transactiondetail?project=${PAKASIR_SLUG}&amount=${amountInt}&order_id=${encodeURIComponent(order_id)}&api_key=${PAKASIR_API_KEY}`;
      
      const pResponse = await fetch(detailUrl);
      if (pResponse.ok) {
        const pData = await pResponse.json();
        if (pData.transaction && pData.transaction.status === 'completed') {
          await query(
            `UPDATE orders 
             SET payment_status = 'Sudah Dibayar', status = 'Cek Resep' 
             WHERE order_id = $1`, 
            [order_id]
          );
          order.payment_status = 'Sudah Dibayar';
          order.status = 'Cek Resep';
          console.log(`🔄 [Auto-Sync] Pesanan ${order_id} berhasil disinkronkan lunas.`);
        }
      }
    }

    res.status(200).json({ 
      status: 'success', 
      data: { 
        payment_status: order.payment_status, 
        status: order.status 
      } 
    });
  } catch (error) {
    console.error('Polling error:', error.message);
    res.status(500).json({ status: 'error', message: 'Gagal mengecek status pembayaran' });
  }
});

app.post('/api/orders', upload.single('prescription'), async (req, res) => {
  try {
    const { user_id, customer_name, delivery_address, delivery_type, total_price, items, payment_method } = req.body;
    const prescriptionPath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!customer_name) {
      return res.status(400).json({ status: 'error', message: 'Nama pelanggan tidak valid' });
    }

    const orderId = `APTX-${Math.floor(1000 + Math.random() * 9000)}`;
    const dbDeliveryType = (delivery_type === 'Diantar' || delivery_type === 'Delivery') ? 'Delivery' : 'Pickup';
    const finalPaymentMethod = payment_method === 'Cashless' ? 'Cashless' : 'COD';
    
    const initialStatus = finalPaymentMethod === 'Cashless' ? 'Pending' : 'Cek Resep';

    const result = await query(
      `INSERT INTO orders (order_id, user_id, customer_name, delivery_address, delivery_type, status, payment_status, total_amount, prescription_image, total_price, items, payment_method) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        orderId, user_id || null, customer_name, delivery_address || '-', dbDeliveryType,
        initialStatus, 'Belum Dibayar', total_price || 0, prescriptionPath, total_price || 0, items || '[]', finalPaymentMethod
      ]
    );

    // FIX BUG 1: LOGIKA PENGURANGAN STOK UTK PEMBELIAN ONLINE PELANGGAN
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    for (const item of parsedItems) {
      const qtyToReduce = item.qty || item.quantity || 1;
      await query('UPDATE products SET stock = stock - $1 WHERE id = $2', [qtyToReduce, item.id]);
    }

    let paymentUrl = null;
    if (finalPaymentMethod === 'Cashless') {
      const redirectUrl = encodeURIComponent(`${FRONTEND_URL}/track`);
      const amountInt = Math.round(total_price);
      paymentUrl = `https://app.pakasir.com/pay/${PAKASIR_SLUG}/${amountInt}?order_id=${encodeURIComponent(orderId)}&redirect=${redirectUrl}`;
    }

    res.status(201).json({ 
      status: 'success', 
      message: 'Checkout berhasil', 
      data: { ...result.rows[0], payment_url: paymentUrl } 
    });
  } catch (error) {
    console.error('Order error:', error.message);
    res.status(500).json({ status: 'error', message: 'Gagal melakukan checkout: ' + error.message });
  }
});

// WEBHOOK PAKASIR
app.post('/api/webhook/pakasir', async (req, res) => {
  try {
    const { amount, order_id, project, status } = req.body;
    console.log('🔔 Webhook Pakasir diterima:', req.body);

    if (status === 'completed' && project === PAKASIR_SLUG) {
      const detailUrl = `https://app.pakasir.com/api/transactiondetail?project=${PAKASIR_SLUG}&amount=${amount}&order_id=${encodeURIComponent(order_id)}&api_key=${PAKASIR_API_KEY}`;
      const response = await fetch(detailUrl);
      const data = await response.json();

      if (data.transaction && data.transaction.status === 'completed') {
        await query(
          `UPDATE orders 
           SET payment_status = 'Sudah Dibayar', status = 'Cek Resep' 
           WHERE order_id = $1`, 
          [order_id]
        );
        console.log(`✅ Pembayaran Pesanan ${order_id} Lunas via Webhook.`);
      }
    }
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).json({ status: 'error', message: 'Webhook Failure' });
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

app.put('/api/orders/:id/verify-prescription', async (req, res) => {
  const { id } = req.params;
  try {
    let result = await query(`UPDATE orders SET status = 'Sedang Diramu' WHERE order_id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) {
      result = await query(`UPDATE orders SET status = 'Sedang Diramu' WHERE id = $1 RETURNING *`, [id]);
      if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Pesanan tidak ditemukan' });
    }
    res.status(200).json({ status: 'success', message: 'Resep dokter berhasil diverifikasi', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal memverifikasi resep' });
  }
});

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

app.put('/api/orders/:id/complete-task', async (req, res) => {
  const { id } = req.params;
  try {
    let result = await query(`UPDATE orders SET status = 'Pesanan Tiba' WHERE order_id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) {
      result = await query(`UPDATE orders SET status = 'Pesanan Tiba' WHERE id = $1 RETURNING *`, [id]);
      if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Pesanan tidak ditemukan' });
    }
    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal menyelesaikan pesanan' });
  }
});

app.put('/api/orders/:id/pay', async (req, res) => {
  const { id } = req.params;
  const { paid_by } = req.body;
  try {
    let result = await query(
      `UPDATE orders SET payment_status = 'Sudah Dibayar' WHERE order_id = $1 AND payment_status = 'Belum Dibayar' RETURNING *`, [id]
    );
    if (result.rows.length === 0) {
      result = await query(
        `UPDATE orders SET payment_status = 'Sudah Dibayar' WHERE id = $1 AND payment_status = 'Belum Dibayar' RETURNING *`, [id]
      );
    }
    if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Pesanan tidak ditemukan atau sudah lunas' });
    res.status(200).json({ status: 'success', message: `Pembayaran COD dikonfirmasi oleh ${paid_by || 'sistem'}`, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal mengkonfirmasi pembayaran: ' + error.message });
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

// ==========================================
// KASIR: POS SYSTEM
// ==========================================
app.post('/api/cashier/orders', async (req, res) => {
  const { cashier_id, customer_name, payment_method, total_price, items } = req.body;
  try {
    const orderId = `POS-${Math.floor(1000 + Math.random() * 9000)}`;
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

    const result = await query(
      `INSERT INTO orders (order_id, user_id, customer_name, delivery_address, delivery_type, status, payment_status, total_amount, total_price, items, payment_method) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        orderId, cashier_id || null, customer_name || 'Pelanggan Offline', payment_method, 'Offline',
        'Pesanan Tiba', 'Sudah Dibayar', total_price, total_price, JSON.stringify(parsedItems), payment_method
      ]
    );

    for (const item of parsedItems) {
      await query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.id]);
    }
    res.status(201).json({ status: 'success', message: 'Transaksi offline berhasil diproses', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal memproses transaksi kasir: ' + error.message });
  }
});

app.get('/api/cashier/shift-orders', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM orders WHERE order_id LIKE 'POS-%' AND created_at >= CURRENT_DATE ORDER BY CURRENT_DATE DESC`);
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal memuat riwayat transaksi shift' });
  }
});

app.get('/api/cashier/cod-pending', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM orders WHERE payment_status = 'Belum Dibayar' AND delivery_type IN ('Delivery', 'Pickup') AND order_id NOT LIKE 'POS-%' ORDER BY created_at DESC`
    );
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal memuat tagihan COD pending' });
  }
});

app.get('/api/admin/reports', async (req, res) => {
  try {
    const summaryRes = await query(`
      SELECT COALESCE(SUM(total_amount), 0)::NUMERIC as total_revenue, COUNT(*)::INT as total_orders
      FROM orders WHERE payment_status = 'Sudah Dibayar'
    `);
    const dailyRes = await query(`
      SELECT DATE(created_at)::TEXT as date, COALESCE(SUM(total_amount), 0)::NUMERIC as revenue, COUNT(*)::INT as count
      FROM orders WHERE payment_status = 'Sudah Dibayar' GROUP BY DATE(created_at) ORDER BY DATE(created_at) DESC LIMIT 7
    `);
    res.status(200).json({ status: 'success', data: { summary: summaryRes.rows[0], daily: dailyRes.rows } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal memuat laporan penjualan: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server Siresep berjalan di http://localhost:${PORT}`);
});