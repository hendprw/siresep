import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('siresep_token');
  const userStr = localStorage.getItem('siresep_user');

  // Jika tidak ada token atau data user, arahkan ke login
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    
    // Jika role user tidak ada di dalam daftar yang diizinkan, arahkan ke home
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }

    // Jika aman, tampilkan halaman yang direquest
    return children;
  } catch (error) {
    // Jika data di localStorage rusak/dimanipulasi, hapus dan suruh login ulang
    localStorage.removeItem('siresep_token');
    localStorage.removeItem('siresep_user');
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;