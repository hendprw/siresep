import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

    try {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Simpan token dan data user ke localStorage
        localStorage.setItem('siresep_token', result.token);
        localStorage.setItem('siresep_user', JSON.stringify(result.data));

        // Redirect otomatis berdasarkan Role
        const userRole = result.data.role;
        
        if (userRole === 'admin' || userRole === 'pharmacist') {
          navigate('/admin');
        } else if (userRole === 'kasir') {
          navigate('/cashier');
        } else if (userRole === 'kurir') {
          navigate('/courier');
        } else {
          navigate('/'); // Customer default ke beranda
        }
      } else {
        setError(result.message || 'Email atau password salah.');
      }
    } catch (err) {
      setError('Terjadi kesalahan pada server. Coba lagi nanti.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center p-4 antialiased text-slate-800">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8 sm:p-10">
          <div className="flex justify-center mb-8">
            <div className="bg-apx-dark text-apx-brand w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
              <i className="fa-solid fa-pills"></i>
            </div>
          </div>
          
          <h2 className="text-2xl font-extrabold text-center text-apx-dark mb-2">Selamat Datang di Siresep</h2>
          <p className="text-sm text-gray-500 text-center font-medium mb-8">
            Silakan masuk untuk melanjutkan ke akun Anda
          </p>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold mb-6 flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:bg-white focus:border-apx-brand font-medium transition-colors"
                  placeholder="admin@siresep.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:bg-white focus:border-apx-brand font-medium transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-apx-brand hover:bg-opacity-90 text-apx-dark font-extrabold py-3.5 rounded-xl transition-all shadow-md mt-4 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i> Memproses...
                </>
              ) : (
                <>
                  Masuk Sekarang <i className="fa-solid fa-arrow-right ml-1"></i>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-gray-500 mt-8">
            Belum punya akun?{' '}
            <Link to="/register" className="text-apx-dark font-extrabold hover:text-apx-brand transition-colors">
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;