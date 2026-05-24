import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Cart from './pages/Cart.jsx';
import Track from './pages/Track.jsx';
import Admin from './pages/Admin.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rute Publik (Bisa diakses siapa saja) */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rute Khusus Customer (Hanya customer yang bisa buka keranjang belanja) */}
        <Route 
          path="/cart" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Cart />
            </ProtectedRoute>
          } 
        />

        {/* Rute Khusus Admin & Apoteker */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'pharmacist']}>
              <Admin />
            </ProtectedRoute>
          } 
        />

        {/* Rute Pelacakan (Bisa diakses Kurir, Customer yang memesan, dan Admin) */}
        <Route 
          path="/track" 
          element={
            <ProtectedRoute allowedRoles={['kurir', 'customer', 'admin']}>
              <Track />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;