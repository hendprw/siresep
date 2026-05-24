-- 1. Hapus tabel jika sudah ada untuk menghindari konflik (Urutan penghapusan disesuaikan dengan Foreign Key)
DROP TABLE IF EXISTS order_timeline CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Pembuatan Tabel Pengguna (Apoteker dan Pelanggan)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'pharmacist', 'admin')),
    avatar_url VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Pembuatan Tabel Produk Obat & Alat Kesehatan
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL, -- Strip, Botol, Box, dll.
    price NUMERIC(12, 2) NOT NULL,
    badge VARCHAR(50), -- Bestseller, Diskon 15%, dll.
    icon_class VARCHAR(100) NOT NULL, -- FontAwesome class seperti 'fa-tablets'
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Pembuatan Tabel Induk Pesanan (Orders)
CREATE TABLE orders (
    order_id VARCHAR(50) PRIMARY KEY, -- Menggunakan format seperti #APTX-8821
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    delivery_type VARCHAR(20) NOT NULL CHECK (delivery_type IN ('Delivery', 'Pickup')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('Cek Resep', 'Sedang Diramu', 'Kurir Menuju Lokasi', 'Pesanan Tiba')),
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('Belum Dibayar', 'Sudah Dibayar')),
    total_amount NUMERIC(12, 2) NOT NULL,
    delivery_address TEXT,
    estimated_arrival VARCHAR(10), -- Format '10:45 WIB'
    driver_name VARCHAR(150),
    driver_vehicle VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Pembuatan Tabel Item Detail Pesanan (Order Items)
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price NUMERIC(12, 2) NOT NULL
);

-- 6. Pembuatan Tabel Validasi E-Resep
CREATE TABLE prescriptions (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES orders(order_id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    is_validated BOOLEAN DEFAULT FALSE,
    validated_by INT REFERENCES users(id) ON DELETE SET NULL,
    validated_at TIMESTAMP
);

-- 7. Pembuatan Tabel Riwayat Perjalanan Pesanan (Timeline)
CREATE TABLE order_timeline (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES orders(order_id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    time_label VARCHAR(10), -- Format '10:05 WIB'
    is_done BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SEED DATA (Memasukkan Data Awal Nyata Sesuai Template Tampilan Siresep)
-- =============================================================================

-- Memasukkan Data Pengguna Bawaan
INSERT INTO users (name, email, password, role, avatar_url, phone) VALUES
('Budi Santoso', 'budi@siresep.com', 'password123', 'pharmacist', 'https://ui-avatars.com/api/?name=Budi+A&background=00D084&color=021B19&bold=true', '081234567890'),
('Rahma', 'rahma@gmail.com', 'password123', 'customer', 'https://ui-avatars.com/api/?name=SA&background=orange&color=white', '089876543210'),
('Ridwan', 'ridwan@gmail.com', 'password123', 'customer', 'https://ui-avatars.com/api/?name=RD&background=sky&color=white', '085544332211');

-- Memasukkan Data Produk Farmasi
INSERT INTO products (name, unit, price, badge, icon_class, stock) VALUES
('Paracetamol 500mg - Penurun Panas', 'Strip - 10 Kaplet', 4500.00, 'Bestseller', 'fa-tablets', 120),
('Mylanta Sirup Obat Maag 50 ml', 'Botol', 16200.00, NULL, 'fa-bottle-droplet', 45),
('Blackmores Vitamin C 500mg', 'Botol - 60 Tablet', 10200.00, 'Diskon 15%', 'fa-prescription-bottle-medical', 30),
('Masker Medis Sensi 3-Ply Earloop', 'Box - 50 Pcs', 28500.00, NULL, 'fa-mask-face', 80);

-- Memasukkan Data Transaksi Antrean
INSERT INTO orders (order_id, user_id, customer_name, delivery_type, status, payment_status, total_amount, delivery_address, estimated_arrival, driver_name, driver_vehicle) VALUES
('#APTX-8821', 2, 'Rahma', 'Delivery', 'Kurir Menuju Lokasi', 'Sudah Dibayar', 29500.00, 'Jalan Merdeka Raya No. 12, RT 01/RW 02, Kecamatan Mawar, Kota Surabaya.', '10:45 WIB', 'Ahmad Fauzi', 'B 1234 XYZ • Honda Beat'),
('#APTX-8820', 3, 'Ridwan', 'Pickup', 'Sedang Diramu', 'Belum Dibayar', 16200.00, 'Ambil Mandiri', NULL, NULL, NULL);

-- Memasukkan Detail Item Belanja untuk Pesanan #APTX-8821
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
('#APTX-8821', 1, 2, 4500.00), -- 2x Paracetamol
('#APTX-8821', 4, 1, 18500.00); -- 1x Masker Medis (Modifikasi parsial harga riil item)

-- Memasukkan Detail Item Belanja untuk Pesanan #APTX-8820
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
('#APTX-8820', 2, 1, 16200.00); -- 1x Mylanta

-- Memasukkan Riwayat Timeline untuk Transaksi Pelacakan Aktif #APTX-8821
INSERT INTO order_timeline (order_id, title, description, time_label, is_done) VALUES
('#APTX-8821', 'Pesanan Diterima', 'Sistem telah menerima pesanan Anda.', '10:05 WIB', TRUE),
('#APTX-8821', 'Resep Divalidasi', 'Apoteker telah memvalidasi unggahan resep Anda.', '10:12 WIB', TRUE),
('#APTX-8821', 'Obat Selesai Diramu', 'Obat Anda telah dikemas dengan aman dan siap dikirim.', '10:25 WIB', TRUE),
('#APTX-8821', 'Kurir Menuju Lokasi', 'Kurir Siresep sedang dalam perjalanan ke alamat Anda.', NULL, FALSE),
('#APTX-8821', 'Pesanan Tiba', 'Menunggu kurir tiba di lokasi tujuan.', NULL, FALSE);