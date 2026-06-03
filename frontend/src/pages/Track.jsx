import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function Track() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Semua');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const userStr = localStorage.getItem('siresep_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const serverBaseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

  const userId = user?.id;
  const userName = user?.name;

  const activeOrderId = location.state?.orderId;

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders`);
        const result = await response.json();
        
        if (result.status === 'success') {
          const myOrders = result.data.filter(o => o.customer_name === userName || o.user_id === userId);
          setOrdersList(myOrders);

          const targetId = selectedOrder?.order_id || selectedOrder?.id || activeOrderId;
          if (targetId) {
            const current = myOrders.find(o => o.order_id === targetId || o.id === targetId);
            if (current) setSelectedOrder(current);
          }
        }
      } catch (error) {
        console.error('Gagal memuat status pengantaran:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, [activeOrderId, userId, userName, navigate, selectedOrder?.order_id, selectedOrder?.id]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const handleBackToList = () => {
    setSelectedOrder(null);
    navigate('/track', { replace: true, state: {} }); 
  };

  const checkStepDone = (currentStatus, targetStep) => {
    const statuses = ['Pending', 'Cek Resep', 'Sedang Diramu', 'Kurir Menuju Lokasi', 'Pesanan Tiba'];
    return statuses.indexOf(currentStatus) >= statuses.indexOf(targetStep);
  };

  const filteredOrders = ordersList.filter(order => {
    if (activeTab === 'Semua') return true;
    if (activeTab === 'Diproses' && (order.status === 'Pending' || order.status === 'Cek Resep' || order.status === 'Sedang Diramu')) return true;
    if (activeTab === 'Dikirim' && order.status === 'Kurir Menuju Lokasi') return true;
    if (activeTab === 'Selesai' && order.status === 'Pesanan Tiba') return true;
    return false;
  });

  const TABS = ['Semua', 'Diproses', 'Dikirim', 'Selesai'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-apx-brand mb-2"></i>
          <p className="text-sm font-bold text-gray-500">Memuat data transaksi...</p>
        </div>
      </div>
    );
  }

  if (!selectedOrder) {
    return (
      <div className="text-apx-dark antialiased bg-[#F8FAFC] min-h-screen pb-20">
        <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 py-4 sticky top-0 z-50 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 text-apx-dark hover:text-apx-brand transition-colors font-extrabold text-xl">
              <i className="fa-solid fa-arrow-left bg-gray-50 p-2 rounded-full text-sm"></i> Daftar Transaksi
            </Link>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-6 flex overflow-x-auto hide-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[100px] text-center py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-apx-brand text-apx-dark shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-receipt text-4xl text-gray-300"></i>
              </div>
              <h2 className="text-xl font-extrabold mb-1">Belum Ada Transaksi</h2>
              <p className="text-sm font-medium text-gray-400 mb-6">Anda belum memiliki pesanan dengan status "{activeTab}".</p>
              <Link to="/" className="bg-apx-brand text-apx-dark font-bold px-6 py-2.5 rounded-full text-sm hover:bg-apx-brandDark transition-colors">Mulai Belanja</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => {
                let parsedItems = [];
                try { parsedItems = JSON.parse(order.items); } catch (e) { parsedItems = []; }
                const firstItem = parsedItems[0];
                const extraItemsCount = parsedItems.length - 1;
                
                return (
                  <div key={order.order_id} className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 hover:border-apx-brand transition-colors group cursor-pointer" onClick={() => setSelectedOrder(order)}>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                      <div className="flex items-center gap-3">
                        <i className="fa-solid fa-bag-shopping text-apx-brand text-lg"></i>
                        <div>
                          <p className="text-xs font-bold text-gray-400">{formatDate(order.created_at)}</p>
                          <p className="text-sm font-extrabold text-apx-dark">{order.order_id}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'Pesanan Tiba' ? 'bg-green-100 text-green-700' :
                        order.status === 'Kurir Menuju Lokasi' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden text-2xl text-gray-300">
                        {firstItem?.image ? <img src={`${serverBaseUrl}${firstItem.image}`} alt={firstItem?.name} className="w-full h-full object-cover" /> : <i className={`fa-solid ${firstItem?.icon_class || 'fa-pills'}`}></i>}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-apx-dark text-sm sm:text-base leading-tight mb-1">{firstItem?.name || 'Produk Apotek Siresep'}</h4>
                        <p className="text-xs text-gray-500 font-medium">{firstItem?.qty} barang x Rp{Number(firstItem?.price).toLocaleString('id-ID')}</p>
                        {extraItemsCount > 0 && <p className="text-xs text-apx-brand font-bold mt-1">+{extraItemsCount} produk lainnya</p>}
                      </div>
                      <div className="text-right border-l border-gray-100 pl-4">
                        <p className="text-xs text-gray-400 font-bold mb-1">Total Belanja</p>
                        <p className="text-lg font-extrabold text-apx-dark">Rp{Number(order.total_amount).toLocaleString('id-ID')}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold bg-gray-100 text-gray-500 px-2 py-1 rounded uppercase tracking-widest">{order.delivery_type === 'Pickup' ? 'Ambil Sendiri' : 'Diantar Kurir'}</span>
                      <button className="bg-apx-dark text-white px-5 py-2 rounded-xl text-xs font-bold group-hover:bg-black transition-colors">
                        Lihat Detail Pesanan
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  let parsedItems = [];
  try { parsedItems = typeof selectedOrder.items === 'string' ? JSON.parse(selectedOrder.items) : (selectedOrder.items || []); } catch (e) { parsedItems = []; }
  const isPickup = selectedOrder.delivery_type === 'Pickup' || selectedOrder.delivery_type === 'Ambil Sendiri';

  return (
    <div className="text-apx-dark antialiased bg-[#F2F7F5] min-h-screen pb-16">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 py-5 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleBackToList} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <span className="font-extrabold text-xl tracking-tight text-apx-dark">
              {isPickup ? 'Detail Pengambilan Mandiri' : 'Status Pelacakan Kurir'}
            </span>
          </div>
          <button className="text-apx-dark bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2">
            <i className="fa-solid fa-headset"></i> Bantuan
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-bold text-gray-400 mb-1">Order ID</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-apx-dark">{selectedOrder.order_id || `APTX-${selectedOrder.id}`}</h1>
          </div>
          <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-500 flex items-center justify-center text-lg">
              <i className="fa-regular fa-clock"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Metode Pengambilan</p>
              <p className="font-extrabold text-apx-dark text-base">
                {isPickup ? 'Ambil di Apotek' : 'Diantar Kurir Instant'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {isPickup ? (
              <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-apx-brand to-teal-400"></div>
                <div className="w-20 h-20 rounded-full bg-teal-50 text-apx-brand flex items-center justify-center text-3xl mx-auto mb-4">
                  <i className="fa-solid fa-store"></i>
                </div>
                <h2 className="text-xl font-extrabold mb-1">Tiket Digital Pengambilan</h2>
                <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
                  {selectedOrder.status === 'Kurir Menuju Lokasi' || selectedOrder.status === 'Pesanan Tiba' || selectedOrder.status === 'Cek Resep' || selectedOrder.status === 'Sedang Diramu'
                    ? '🎉 Obat Anda sudah masuk antrean / selesai diramu! Silakan datang langsung ke Apotek Siresep untuk mengambil produk.' 
                    : 'Apoteker kami sedang memproses resep/obat Anda. Mohon tunggu hingga status berubah menjadi "Siap Diambil".'}
                </p>

                <div className="bg-gray-50 border border-gray-200 border-dashed rounded-2xl p-6 inline-block mx-auto mb-4">
                  <div className="flex gap-1 items-center justify-center h-14 bg-white px-8 rounded-lg shadow-inner mb-2 overflow-hidden opacity-80">
                    {[3,1,4,2,1,4,2,3,1,2,4,1,3,2,1,4,2,1,3,2,4].map((v, i) => (
                      <div key={i} className="bg-apx-dark h-full" style={{ width: `${v}px` }}></div>
                    ))}
                  </div>
                  <span className="font-mono text-xs font-bold text-gray-500 tracking-widest">{selectedOrder.order_id || selectedOrder.id}</span>
                </div>

                <div className="text-left bg-teal-50/50 border border-teal-100 rounded-2xl p-5 mt-2">
                  <h4 className="text-xs font-bold text-teal-800 uppercase tracking-widest mb-2"><i className="fa-solid fa-circle-info"></i> Petunjuk Penjemputan</h4>
                  <ul className="text-xs text-teal-900 space-y-1.5 font-medium">
                    <li>1. Datang ke gerai Apotek Siresep pusat operasional.</li>
                    <li>2. Tunjukkan kode antrean transaksi atau barcode di atas ke petugas kasir apotek.</li>
                    <li>3. Petugas akan langsung menyerahkan obat yang sudah dikemas rapi.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="w-full h-64 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden relative group">
                <div className="absolute inset-0 map-bg opacity-50 bg-slate-100"></div>
                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                  <path d="M 100,200 Q 250,150 400,100 T 700,50" fill="none" stroke="#00D084" strokeWidth="4" strokeDasharray="8 8" className="opacity-60"></path>
                </svg>
                <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-apx-dark text-xl border-4 border-gray-50">
                  <i className="fa-solid fa-store"></i>
                </div>
                <div className="absolute top-1/4 right-1/4 w-12 h-12 bg-apx-brand rounded-full shadow-lg flex items-center justify-center text-white text-xl border-4 border-white animate-bounce">
                  <i className="fa-solid fa-motorcycle"></i>
                </div>
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-bold text-apx-dark shadow-sm border border-gray-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-apx-brand animate-pulse"></span>
                  {selectedOrder.status === 'Kurir Menuju Lokasi' ? 'Kurir melaju ke lokasi Anda' : selectedOrder.status === 'Pending' ? 'Menunggu Pembayaran' : 'Menunggu kurir berangkat'}
                </div>
              </div>
            )}

            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
              <h2 className="font-extrabold text-lg mb-8">Riwayat Perjalanan Pesanan</h2>
              <div className="relative pl-4 space-y-8 before:absolute before:inset-0 before:ml-[1.4rem] before:w-0.5 before:bg-gray-100">
                
                <div className="relative flex items-start gap-6 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white shrink-0 shadow-sm ${checkStepDone(selectedOrder.status, 'Pending') ? 'bg-apx-brand text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <i className="fa-solid fa-check"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-apx-dark">Menunggu Pembayaran</h3>
                    <p className="text-sm font-medium text-gray-400 mt-1">Invoice pesanan digital diterbitkan dan siap dibayarkan.</p>
                  </div>
                </div>

                <div className="relative flex items-start gap-6 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white shrink-0 shadow-sm ${checkStepDone(selectedOrder.status, 'Cek Resep') ? 'bg-apx-brand text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <i className="fa-solid fa-check"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-apx-dark">Pesanan Diterima (Cek Resep)</h3>
                    <p className="text-sm font-medium text-gray-400 mt-1">Sistem apotek telah memvalidasi pembayaran dan masuk antrean pengecekan resep.</p>
                  </div>
                </div>

                <div className="relative flex items-start gap-6 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white shrink-0 shadow-sm ${checkStepDone(selectedOrder.status, 'Sedang Diramu') ? 'bg-apx-brand text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <i className="fa-solid fa-check"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-apx-dark">Obat Sedang Diramu</h3>
                    <p className="text-sm font-medium text-gray-400 mt-1">Tim Apoteker profesional sedang meramu, memisahkan, dan mengecek dosis obat.</p>
                  </div>
                </div>

                <div className="relative flex items-start gap-6 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ring-4 ring-white shrink-0 shadow-sm ${checkStepDone(selectedOrder.status, 'Kurir Menuju Lokasi') ? 'bg-apx-dark text-apx-brand shadow-md' : 'bg-gray-100 text-gray-300'}`}>
                    <i className={`fa-solid ${isPickup ? 'fa-box-archive' : 'fa-motorcycle'}`}></i>
                  </div>
                  <div className={selectedOrder.status === 'Kurir Menuju Lokasi' ? "bg-teal-50 border border-teal-100 rounded-2xl p-4 w-full" : "w-full"}>
                    <h3 className="font-extrabold text-apx-dark">
                      {isPickup ? 'Siap Diambil di Gerai' : 'Kurir Sedang Menuju Rumah'}
                    </h3>
                    <p className="text-sm font-medium text-gray-400 mt-1">
                      {isPickup 
                        ? 'Racikan produk selesai dikemas rapi. Anda bisa menjemput barang sekarang.' 
                        : 'Kurir pengirim internal Siresep telah membawa kotak obat menuju lokasi pengiriman.'}
                    </p>
                  </div>
                </div>

                <div className="relative flex items-start gap-6 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ring-4 ring-white shrink-0 shadow-sm ${checkStepDone(selectedOrder.status, 'Pesanan Tiba') ? 'bg-apx-brand text-white shadow-md' : 'bg-gray-100 text-gray-300'}`}>
                    <i className="fa-solid fa-house-circle-check"></i>
                  </div>
                  <div>
                    <h3 className={`font-bold ${selectedOrder.status === 'Pesanan Tiba' ? 'text-apx-dark' : 'text-gray-400'}`}>
                      {isPickup ? 'Selesai Diambil' : 'Pesanan Tiba di Tujuan'}
                    </h3>
                    <p className="text-sm font-medium text-gray-400 mt-1">Transaksi ditutup dan barang diserahkan sepenuhnya secara sukses.</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* SISI KANAN: FIX BUG 2 INFO KURIR DINAMIS BERDASARKAN DATABASE (TIDAK HARDCODED LAGI) */}
          <div className="space-y-6">
            
            {isPickup ? (
              <div className="bg-apx-dark rounded-[2rem] p-6 text-white shadow-md relative overflow-hidden">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Lokasi Pengambilan</h3>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-apx-brand text-lg"><i className="fa-solid fa-store"></i></div>
                  <div>
                    <p className="font-extrabold text-white text-base">Apotek Siresep Pusat</p>
                    <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                      Jl. Raya Universitas Trunojoyo, Telang, Kec. Kamal, Kabupaten Bangkalan, Jawa Timur 69162.
                    </p>
                    <p className="text-[10px] text-apx-brand font-bold mt-2 uppercase tracking-wider"><i className="fa-regular fa-clock"></i> Buka: 07.00 - 22.00 WIB</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-apx-dark rounded-[2rem] p-6 text-white shadow-md relative overflow-hidden">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Informasi Kurir</h3>
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedOrder.driver_name || 'Mencari')}&background=00D084&color=021B19&bold=true`} className="w-14 h-14 rounded-full border-2 border-white/20" alt="Kurir" />
                  <div>
                    <p className="font-extrabold text-lg">{selectedOrder.driver_name || 'Mencari Kurir...'}</p>
                    <p className="text-sm text-apx-brand font-medium">{selectedOrder.driver_vehicle || 'Pesanan sedang dipersiapkan apotek'}</p>
                  </div>
                </div>
                {selectedOrder.driver_name && (
                  <div className="flex gap-3 relative z-10">
                    <button className="flex-1 bg-white hover:bg-gray-100 text-apx-dark py-3 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2">
                      <i className="fa-solid fa-comment-dots"></i> Hubungi Chat
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
              <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">
                {isPickup ? 'Alamat Invoice Penjualan' : 'Alamat Pengiriman'}
              </h3>
              <div className="flex items-start gap-3">
                <div className="mt-1 text-apx-brand"><i className="fa-solid fa-location-dot"></i></div>
                <div>
                  <p className="font-bold text-apx-dark">{selectedOrder.customer_name}</p>
                  <p className="text-xs font-medium text-gray-500 mt-1 leading-relaxed">{selectedOrder.delivery_address}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Detail Keranjang</h3>
                <span className="text-xs font-bold bg-gray-50 px-2 py-1 rounded-md text-apx-dark">{parsedItems.length} Obat</span>
              </div>
              
              <div className="space-y-4 mb-4 max-h-48 overflow-y-auto pr-1">
                {parsedItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-apx-dark truncate max-w-[180px]">{item.qty}x {item.name}</span>
                    <span className="text-gray-500 shrink-0">Rp{(item.price * item.qty).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
              
              <hr className="border-gray-100 mb-4" />
              
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-xs text-gray-400">Total Pembayaran</span>
                <span className="font-extrabold text-lg text-apx-dark">Rp{Number(selectedOrder.total_amount).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-end">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${selectedOrder.payment_status === 'Sudah Dibayar' ? 'bg-teal-50 text-teal-600 border-teal-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                  {selectedOrder.payment_status}
                </span>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default Track;