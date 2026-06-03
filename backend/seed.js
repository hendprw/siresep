import { query } from './db.js';
import bcrypt from 'bcrypt';

async function runSeed() {
  try {
    console.log('Memulai proses seeding database...');

    // 1. Hapus constraint role pada PostgreSQL agar role 'kasir' dan 'kurir' bisa masuk
    console.log('Menghapus batasan constraint role pada tabel users (jika ada)...');
    await query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');

    // 2. Daftar akun yang akan ditambahkan ke database
    const users = [
      {
        name: 'Admin Pusat Siresep',
        email: 'admin@siresep.com',
        password: 'password123',
        role: 'admin',
        phone: '081100000001'
      },
      {
        name: 'Kasir Shift Pagi',
        email: 'kasir2@siresep.com',
        password: 'password123',
        role: 'kasir',
        phone: '081100000002'
      },
      {
        name: 'Kurir Operasional',
        email: 'kurir@siresep.com',
        password: 'password123',
        role: 'kurir',
        phone: '081100000003'
      },
      {
        name: 'Pelanggan Setia',
        email: 'customer@siresep.com',
        password: 'password123',
        role: 'customer',
        phone: '081100000004'
      }
    ];

    // 3. Proses Hash Password dan Insert ke Database
    console.log('Menyimpan data pengguna ke database...');
    for (const user of users) {
      // Pengecekan agar tidak terjadi duplikat email
      const checkEmail = await query('SELECT email FROM users WHERE email = $1', [user.email]);
      
      if (checkEmail.rows.length === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        
        await query(
          'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5)',
          [user.name, user.email, hashedPassword, user.role, user.phone]
        );
        console.log(`✅ Akun ${user.role.toUpperCase()} (${user.email}) berhasil ditambahkan.`);
      } else {
        console.log(`⚠️ Akun ${user.role.toUpperCase()} (${user.email}) sudah ada, dilewati.`);
      }
    }

    console.log('🎉 Proses seeding selesai dengan sukses!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Terjadi kesalahan saat seeding:', error);
    process.exit(1);
  }
}

runSeed();