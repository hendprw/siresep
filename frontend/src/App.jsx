import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Cart from './pages/Cart.jsx';
import Track from './pages/Track.jsx';
import Admin from './pages/Admin.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Courier from './pages/Courier.jsx'; // Tambahkan import ini
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/cart" element={
          <ProtectedRoute allowedRoles={['customer']}><Cart /></ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin', 'pharmacist']}><Admin /></ProtectedRoute>
        } />

        <Route path="/track" element={
          <ProtectedRoute allowedRoles={['customer', 'admin']}><Track /></ProtectedRoute>
        } />

        {/* Tambahkan rute khusus Kurir */}
        <Route path="/courier" element={
          <ProtectedRoute allowedRoles={['kurir']}><Courier /></ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;