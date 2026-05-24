import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer' // Fix: Default mutlak sebagai customer
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Arahkan ke login page setelah sukses daftar
        navigate('/login');
      } else {
        setErrorMsg(result.message || 'Registrasi gagal.');
      }
    } catch (error) {
      setErrorMsg('Terjadi kesalahan saat terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F7F5] flex items-center justify-center p-4 antialiased py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,#ccfbf1_0%,transparent_40%),radial-gradient(circle_at_20%_80%,#d1fae5_0%,transparent_40%)] pointer-events-none"></div>
      
      <div className="w-full max-w-lg bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="bg-apx-dark text-apx-brand w-10 h-10 rounded-full flex items-center justify-center shadow-md">
              <i className="fa-solid fa-notes-medical text-xl"></i>
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-apx-dark">Siresep.</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-apx-dark">Buat Akun Baru</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Lengkapi data diri Anda di bawah ini</p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold mb-6 flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation"></i>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-apx-dark mb-2">Nama Lengkap</label>
            <input 
              type="text" 
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 text-apx-dark rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand focus:ring-1 focus:ring-apx-brand transition-all font-medium" 
              placeholder="M. Hendrik Purwanto" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-apx-dark mb-2">Email Address</label>
            <input 
              type="email" 
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 text-apx-dark rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand focus:ring-1 focus:ring-apx-brand transition-all font-medium" 
              placeholder="hendrik@email.com" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-apx-dark mb-2">Nomor Telepon</label>
            <input 
              type="tel" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 text-apx-dark rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand focus:ring-1 focus:ring-apx-brand transition-all font-medium" 
              placeholder="08123456789" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-apx-dark mb-2">Password</label>
            <input 
              type="password" 
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 text-apx-dark rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand focus:ring-1 focus:ring-apx-brand transition-all font-medium" 
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-apx-brand hover:bg-apx-brandDark text-apx-dark py-3.5 rounded-xl font-extrabold shadow-[0_10px_20px_-10px_rgba(0,208,132,0.5)] transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="text-center text-sm font-medium text-gray-500 mt-8">
          Sudah punya akun? <Link to="/login" className="text-apx-dark font-bold hover:underline">Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;