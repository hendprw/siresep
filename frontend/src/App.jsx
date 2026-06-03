import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Cart from './pages/Cart.jsx';
import Track from './pages/Track.jsx';
import Admin from './pages/Admin.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Courier from './pages/Courier.jsx';
import Cashier from './pages/Cashier.jsx'; 
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

        <Route path="/courier" element={
          <ProtectedRoute allowedRoles={['kurir']}><Courier /></ProtectedRoute>
        } />

        {/* Rute khusus Kasir */}
        <Route path="/cashier" element={
          <ProtectedRoute allowedRoles={['kasir', 'admin']}><Cashier /></ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;