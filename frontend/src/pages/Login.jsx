import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Simpan token dan data user ke localStorage
        localStorage.setItem('siresep_token', result.token);
        localStorage.setItem('siresep_user', JSON.stringify(result.data));

        // Redirect dinamis berdasarkan role
        const role = result.data.role;
        if (role === 'admin' || role === 'pharmacist') {
          navigate('/admin');
        } else if (role === 'kurir') {
          navigate('/track');
        } else {
          navigate('/');
        }
      } else {
        setErrorMsg(result.message || 'Login gagal. Periksa kembali kredensial Anda.');
      }
    } catch (error) {
      setErrorMsg('Terjadi kesalahan saat terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F7F5] flex items-center justify-center p-4 antialiased">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,#ccfbf1_0%,transparent_40%),radial-gradient(circle_at_20%_80%,#d1fae5_0%,transparent_40%)] pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="bg-apx-dark text-apx-brand w-10 h-10 rounded-full flex items-center justify-center shadow-md">
              <i className="fa-solid fa-notes-medical text-xl"></i>
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-apx-dark">Siresep.</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-apx-dark">Selamat Datang</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Masuk untuk melanjutkan ke akun Anda</p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold mb-6 flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation"></i>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-apx-dark mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <i className="fa-regular fa-envelope text-gray-400"></i>
              </div>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-apx-dark rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand focus:ring-1 focus:ring-apx-brand transition-all font-medium" 
                placeholder="nama@email.com" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-apx-dark mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <i className="fa-solid fa-lock text-gray-400"></i>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-apx-dark rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand focus:ring-1 focus:ring-apx-brand transition-all font-medium" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-apx-dark hover:bg-gray-800 text-white py-3.5 rounded-xl font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Masuk Sistem'}
          </button>
        </form>

        <p className="text-center text-sm font-medium text-gray-500 mt-8">
          Belum punya akun? <Link to="/register" className="text-apx-brandDark font-bold hover:underline">Daftar sekarang</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;