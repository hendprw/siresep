import { query } from './db.js';
import 'dotenv/config';

const seedTransactions = async () => {
  try {
    console.log('Memulai proses seeding riwayat transaksi...');

    // 1. Ambil data user (Customer)
    const customerResult = await query("SELECT id, name FROM users WHERE role = 'customer' LIMIT 1");
    if (customerResult.rows.length === 0) {
      throw new Error('Tidak ada user dengan role customer. Jalankan node seed.js terlebih dahulu.');
    }
    const customer = customerResult.rows[0];

    // Ambil data user (Kurir)
    const kurirResult = await query("SELECT name FROM users WHERE role = 'kurir' LIMIT 1");
    const driverName = kurirResult.rows.length > 0 ? kurirResult.rows[0].name : 'Ahmad Fauzi';

    // 2. Ambil atau Buat Data Produk (Agar Foreign Key valid)
    let productsResult = await query('SELECT id, price FROM products LIMIT 2');
    if (productsResult.rows.length < 2) {
      console.log('Produk tidak mencukupi, memasukkan data produk default...');
      await query(`
        INSERT INTO products (name, unit, price, badge, icon_class, stock) VALUES 
        ('Paracetamol 500mg - Penurun Panas', 'Strip - 10 Kaplet', 4500.00, 'Bestseller', 'fa-tablets', 120),
        ('Masker Medis Sensi 3-Ply Earloop', 'Box - 50 Pcs', 28500.00, 'Diskon 15%', 'fa-mask-face', 80)
      `);
      productsResult = await query('SELECT id, price FROM products LIMIT 2');
    }
    const product1 = productsResult.rows[0];
    const product2 = productsResult.rows[1];

    // 3. Buat ID Order Unik
    const order1Id = `#APTX-${Math.floor(1000 + Math.random() * 9000)}`;
    const order2Id = `#APTX-${Math.floor(1000 + Math.random() * 9000)}`;

    console.log('Memasukkan data orders (Pesanan)...');
    
    // Insert Pesanan 1 (Delivery - Sedang Berjalan)
    await query(
      `INSERT INTO orders (order_id, user_id, customer_name, delivery_type, status, payment_status, total_amount, delivery_address, estimated_arrival, driver_name, driver_vehicle) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [order1Id, customer.id, customer.name, 'Delivery', 'Kurir Menuju Lokasi', 'Sudah Dibayar', 29500.00, 'Jalan Merdeka Raya No. 12, Surabaya', '10:45 WIB', driverName, 'B 1234 XYZ • Honda Beat']
    );

    // Insert Pesanan 2 (Pickup - Sedang Diramu)
    await query(
      `INSERT INTO orders (order_id, user_id, customer_name, delivery_type, status, payment_status, total_amount, delivery_address, estimated_arrival, driver_name, driver_vehicle) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [order2Id, customer.id, customer.name, 'Pickup', 'Sedang Diramu', 'Belum Dibayar', product2.price, 'Ambil Mandiri', null, null, null]
    );

    // 4. Buat Data Order Items (Detail Belanjaan)
    console.log('Memasukkan data order items (Detail Item)...');
    
    // Items untuk Order 1
    await query(
      `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`,
      [order1Id, product1.id, 2, product1.price]
    );
    await query(
      `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`,
      [order1Id, product2.id, 1, product2.price]
    );
    
    // Items untuk Order 2
    await query(
      `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`,
      [order2Id, product2.id, 1, product2.price]
    );

    // 5. Buat Data Order Timeline (Riwayat Pelacakan) untuk Order 1
    console.log('Memasukkan data order timeline (Riwayat Pelacakan)...');
    const timelines = [
      { title: 'Pesanan Diterima', desc: 'Sistem telah menerima pesanan Anda.', time: '10:05 WIB', done: true },
      { title: 'Resep Divalidasi', desc: 'Apoteker telah memvalidasi unggahan resep Anda.', time: '10:12 WIB', done: true },
      { title: 'Obat Selesai Diramu', desc: 'Obat Anda telah dikemas dengan aman dan siap dikirim.', time: '10:25 WIB', done: true },
      { title: 'Kurir Menuju Lokasi', desc: 'Kurir Siresep sedang dalam perjalanan ke alamat Anda.', time: null, done: false },
      { title: 'Pesanan Tiba', desc: 'Menunggu kurir tiba di lokasi tujuan.', time: null, done: false }
    ];

    for (const tl of timelines) {
      await query(
        `INSERT INTO order_timeline (order_id, title, description, time_label, is_done) VALUES ($1, $2, $3, $4, $5)`,
        [order1Id, tl.title, tl.desc, tl.time, tl.done]
      );
    }

    console.log('Seeding riwayat transaksi berhasil diselesaikan tanpa masalah!');
    process.exit(0);
  } catch (error) {
    console.error('Terjadi kesalahan saat seeding transaksi:', error);
    process.exit(1);
  }
};

seedTransactions();