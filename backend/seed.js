import { query } from './db.js';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const seedUsers = async () => {
  // Data akun untuk semua role
  const users = [
    {
      name: 'Admin Utama',
      email: 'admin@siresep.com',
      phone: '08111111111',
      role: 'admin'
    },
    {
      name: 'Budi Santoso',
      email: 'budi@siresep.com',
      phone: '08222222222',
      role: 'pharmacist'
    },
    {
      name: 'Ahmad Fauzi',
      email: 'kurir@siresep.com',
      phone: '08333333333',
      role: 'kurir'
    },
    {
      name: 'Rahma Customer',
      email: 'rahma@siresep.com',
      phone: '08444444444',
      role: 'customer'
    }
  ];

  try {
    console.log('Memulai proses pembuatan akun otomatis...');
    
    // Hash password default untuk semua akun
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);

    for (const user of users) {
      await query(
        `INSERT INTO users (name, email, password, role, phone) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (email) DO UPDATE 
         SET password = EXCLUDED.password, role = EXCLUDED.role, name = EXCLUDED.name`,
        [user.name, user.email, defaultPassword, user.role, user.phone]
      );
      console.log(`Berhasil membuat akun: ${user.email} | Role: ${user.role}`);
    }

    console.log('Semua akun berhasil dibuat dengan password default: password123');
    process.exit(0);
  } catch (error) {
    console.error('Terjadi kesalahan saat seeding:', error);
    process.exit(1);
  }
};

seedUsers();