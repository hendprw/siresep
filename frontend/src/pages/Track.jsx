import React from 'react';
import { Link } from 'react-router-dom';

function Track() {
  return (
    <div className="text-apx-dark antialiased bg-[#F2F7F5] min-h-screen">
      {/* Minimal Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 py-5 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <span className="font-extrabold text-xl tracking-tight text-apx-dark">Status Pesanan</span>
          </div>
          <button className="text-apx-dark bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2">
            <i className="fa-solid fa-headset"></i> Bantuan
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        
        {/* Header Info */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-bold text-gray-400 mb-1">Order ID</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-apx-dark">#APTX-8821</h1>
          </div>
          <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-500 flex items-center justify-center text-lg">
              <i className="fa-regular fa-clock"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estimasi Tiba</p>
              <p className="font-extrabold text-apx-dark text-lg">10:45 WIB</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Timeline Tracker */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Map / Graphic Placeholder */}
            <div className="w-full h-64 bg-white rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden relative group">
              <div className="absolute inset-0 map-bg opacity-50"></div>
              {/* Mock Route Line */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                <path d="M 100,200 Q 250,150 400,100 T 700,50" fill="none" stroke="#00D084" strokeWidth="4" strokeDasharray="8 8" className="animate-[dash_20s_linear_infinite] opacity-60"></path>
              </svg>
              {/* Mock Pins */}
              <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-apx-dark text-xl z-10 border-4 border-gray-50">
                <i className="fa-solid fa-store"></i>
              </div>
              <div className="absolute top-1/4 right-1/4 w-12 h-12 bg-apx-brand rounded-full shadow-lg shadow-apx-brand/40 flex items-center justify-center text-white text-xl z-10 border-4 border-white animate-bounce">
                <i className="fa-solid fa-location-dot"></i>
              </div>
              {/* Overlay Info */}
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-bold text-apx-dark shadow-sm border border-gray-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-apx-brand animate-pulse"></span>
                Kurir dalam perjalanan
              </div>
            </div>

            {/* Timeline Widget */}
            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
              <h2 className="font-extrabold text-lg mb-8">Riwayat Pesanan</h2>
              
              <div className="relative pl-4 space-y-8 before:absolute before:inset-0 before:ml-[1.4rem] before:w-0.5 before:bg-gray-100">
                
                {/* Step 1: Done */}
                <div className="relative flex items-start gap-6 z-10">
                  <div className="w-8 h-8 rounded-full bg-apx-brand text-white flex items-center justify-center text-xs font-bold ring-4 ring-white flex-shrink-0 shadow-sm">
                    <i className="fa-solid fa-check"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-apx-dark">Pesanan Diterima</h3>
                    <p className="text-sm font-medium text-gray-400 mt-1">Sistem telah menerima pesanan Anda.</p>
                    <p className="text-xs font-bold text-gray-300 mt-2">10:05 WIB</p>
                  </div>
                </div>

                {/* Step 2: Done */}
                <div className="relative flex items-start gap-6 z-10">
                  <div className="w-8 h-8 rounded-full bg-apx-brand text-white flex items-center justify-center text-xs font-bold ring-4 ring-white flex-shrink-0 shadow-sm">
                    <i className="fa-solid fa-check"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-apx-dark">Resep Divalidasi</h3>
                    <p className="text-sm font-medium text-gray-400 mt-1">Apoteker telah memvalidasi unggahan resep Anda.</p>
                    <p className="text-xs font-bold text-gray-300 mt-2">10:12 WIB</p>
                  </div>
                </div>

                {/* Step 3: Done */}
                <div className="relative flex items-start gap-6 z-10">
                  <div className="w-8 h-8 rounded-full bg-apx-brand text-white flex items-center justify-center text-xs font-bold ring-4 ring-white flex-shrink-0 shadow-sm">
                    <i className="fa-solid fa-check"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-apx-dark">Obat Selesai Diramu</h3>
                    <p className="text-sm font-medium text-gray-400 mt-1">Obat Anda telah dikemas dengan aman dan siap dikirim.</p>
                    <p className="text-xs font-bold text-gray-300 mt-2">10:25 WIB</p>
                  </div>
                </div>

                {/* Step 4: Active */}
                <div className="relative flex items-start gap-6 z-10">
                  <div className="w-8 h-8 rounded-full bg-apx-dark text-apx-brand flex items-center justify-center text-sm font-bold ring-4 ring-white flex-shrink-0 shadow-md relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-apx-brand opacity-40"></span>
                    <i className="fa-solid fa-motorcycle"></i>
                  </div>
                  <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 w-full">
                    <h3 className="font-extrabold text-apx-dark">Kurir Menuju Lokasi</h3>
                    <p className="text-sm font-medium text-teal-700 mt-1">Kurir Siresep sedang dalam perjalanan ke alamat Anda.</p>
                  </div>
                </div>

                {/* Step 5: Pending */}
                <div className="relative flex items-start gap-6 z-10">
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-300 flex items-center justify-center text-sm font-bold ring-4 ring-white flex-shrink-0">
                    <i className="fa-solid fa-house"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-400">Pesanan Tiba</h3>
                    <p className="text-sm font-medium text-gray-300 mt-1">Menunggu kurir tiba di lokasi tujuan.</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="space-y-6">
            
            {/* Driver Bento Card */}
            <div className="bg-apx-dark rounded-[2rem] p-6 text-white shadow-xl shadow-apx-dark/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl"></div>
              <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Informasi Kurir</h3>
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <img src="https://ui-avatars.com/api/?name=Ahmad+F&background=00D084&color=021B19&bold=true" className="w-14 h-14 rounded-full border-2 border-white/20" alt="Kurir" />
                <div>
                  <p className="font-extrabold text-lg">Ahmad Fauzi</p>
                  <p className="text-sm text-apx-brand font-medium">B 1234 XYZ • Honda Beat</p>
                </div>
              </div>

              <div className="flex gap-3 relative z-10">
                <button className="flex-1 bg-white hover:bg-gray-100 text-apx-dark py-3 rounded-xl font-bold text-sm shadow-sm transition-all flex justify-center items-center gap-2">
                  <i className="fa-solid fa-comment-dots"></i> Chat
                </button>
                <button className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl flex justify-center items-center transition-all">
                  <i className="fa-solid fa-phone"></i>
                </button>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
              <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Alamat Pengiriman</h3>
              <div className="flex items-start gap-3">
                <div className="mt-1 text-apx-brand"><i className="fa-solid fa-location-dot"></i></div>
                <div>
                  <p className="font-bold text-apx-dark">Rumah</p>
                  <p className="text-sm font-medium text-gray-500 mt-1 leading-relaxed">Jalan Merdeka Raya No. 12, RT 01/RW 02, Kecamatan Mawar, Kota Surabaya.</p>
                </div>
              </div>
            </div>

            {/* Items Summary */}
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Detail Item</h3>
                <span className="text-xs font-bold bg-gray-50 px-2 py-1 rounded-md text-apx-dark">2 Produk</span>
              </div>
              
              <div className="space-y-4 mb-4">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-apx-dark">2x Paracetamol 500mg</span>
                  <span className="text-gray-500">Rp9.000</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-apx-dark">1x Masker Medis 3-Ply</span>
                  <span className="text-gray-500">Rp18.500</span>
                </div>
              </div>
              
              <hr className="border-gray-100 mb-4" />
              
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-400">Total Pembayaran</span>
                <span className="font-extrabold text-lg text-apx-dark">Rp29.500</span>
              </div>
              <div className="flex justify-end mt-1">
                <span className="text-[10px] font-bold bg-teal-50 text-teal-600 px-2 py-0.5 rounded uppercase tracking-wider border border-teal-100">Sudah Dibayar</span>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default Track;