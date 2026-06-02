import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Courier() {
  const [activeTab, setActiveTab] = useState('tersedia');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const userStr = localStorage.getItem('siresep_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/orders`);
      const result = await response.json();
      if (result.status === 'success') {
        setOrders(result.data);
      }
    } catch (error) {
      console.error('Gagal memuat pesanan:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'kurir') {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  const handleTakeTask = async (orderId) => {
    try {
      const response = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}/take-task`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          driver_name: user.name, 
          driver_vehicle: 'Motor Operasional Siresep' 
        })
      });
      if (response.ok) {
        alert('Tugas berhasil diambil!');
        fetchOrders();
        setActiveTab('saya');
      }
    } catch (error) {
      alert('Terjadi kesalahan saat mengambil tugas.');
    }
  };

  const handleCompleteTask = async (orderId) => {
    if (!window.confirm('Pastikan obat sudah diterima pelanggan. Selesaikan tugas ini?')) return;
    try {
      const response = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}/complete-task`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        alert('Pesanan selesai. Terima kasih!');
        fetchOrders();
        setActiveTab('riwayat');
      }
    } catch (error) {
      alert('Terjadi kesalahan saat menyelesaikan tugas.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('siresep_token');
    localStorage.removeItem('siresep_user');
    navigate('/login');
  };

  const extractAddressInfo = (addressString) => {
    const coordsMatch = addressString.match(/\[Maps:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/);
    const cleanAddress = addressString.replace(/\[.*?\]\s*/g, '').trim();
    return {
      lat: coordsMatch ? parseFloat(coordsMatch[1]) : null,
      lon: coordsMatch ? parseFloat(coordsMatch[2]) : null,
      text: cleanAddress
    };
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'tersedia') {
      return order.delivery_type === 'Delivery' && order.status === 'Sedang Diramu';
    } else if (activeTab === 'saya') {
      return order.status === 'Kurir Menuju Lokasi' && order.driver_name === user?.name;
    } else if (activeTab === 'riwayat') {
      return order.status === 'Pesanan Tiba' && order.driver_name === user?.name;
    }
    return false;
  });

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-apx-brand mb-2"></i>
          <p className="text-sm font-bold text-gray-500">Memuat dashboard kurir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-apx-dark antialiased bg-[#F8FAFC] min-h-screen pb-20">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-apx-brand text-apx-dark w-10 h-10 rounded-full flex items-center justify-center shadow-md text-lg">
              <i className="fa-solid fa-motorcycle"></i>
            </div>
            <div>
              <h1 className="font-extrabold text-lg leading-tight">Halo, {user?.name.split(' ')[0]}!</h1>
              <p className="text-xs font-bold text-gray-400">Driver Siresep</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2">
            <i className="fa-solid fa-arrow-right-from-bracket"></i> <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-6 flex overflow-x-auto hide-scrollbar gap-2">
          <button onClick={() => setActiveTab('tersedia')} className={`flex-1 min-w-[120px] text-center py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'tersedia' ? 'bg-apx-dark text-apx-brand shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <i className="fa-solid fa-list-check"></i> Tugas Tersedia
          </button>
          <button onClick={() => setActiveTab('saya')} className={`flex-1 min-w-[120px] text-center py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'saya' ? 'bg-apx-brand text-apx-dark shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <i className="fa-solid fa-route"></i> Tugas Saya
          </button>
          <button onClick={() => setActiveTab('riwayat')} className={`flex-1 min-w-[120px] text-center py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'riwayat' ? 'bg-white border-2 border-gray-100 text-apx-dark shadow-sm' : 'text-gray-500 hover:bg-gray-50 border-2 border-transparent'}`}>
            <i className="fa-solid fa-clock-rotate-left"></i> Riwayat
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 mt-8">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className={`fa-solid ${activeTab === 'tersedia' ? 'fa-box-open' : activeTab === 'saya' ? 'fa-motorcycle' : 'fa-clipboard-check'} text-4xl text-gray-300`}></i>
            </div>
            <h2 className="text-xl font-extrabold mb-1">
              {activeTab === 'tersedia' ? 'Belum Ada Tugas' : activeTab === 'saya' ? 'Tidak Ada Pengiriman Aktif' : 'Belum Ada Riwayat'}
            </h2>
            <p className="text-sm font-medium text-gray-400 mb-6">
              {activeTab === 'tersedia' ? 'Saat ini apoteker sedang menyiapkan pesanan atau tidak ada antrean masuk.' : activeTab === 'saya' ? 'Ambil tugas di tab Tugas Tersedia untuk mulai mengirim.' : 'Anda belum menyelesaikan tugas pengiriman apapun hari ini.'}
            </p>
            <button onClick={fetchOrders} className="bg-gray-50 hover:bg-gray-100 text-apx-dark font-bold px-6 py-2.5 rounded-full text-sm transition-colors border border-gray-200 shadow-sm inline-flex items-center gap-2">
              <i className="fa-solid fa-rotate-right"></i> Refresh
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOrders.map(order => {
              const addressInfo = extractAddressInfo(order.delivery_address || '');
              return (
                <div key={order.order_id} className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 flex flex-col h-full hover:border-apx-brand transition-colors">
                  <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                    <div>
                      <span className="text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-widest">{order.order_id}</span>
                      <h3 className="font-extrabold text-apx-dark text-lg mt-1">{order.customer_name}</h3>
                    </div>
                    <span className="font-extrabold text-apx-brand">Rp{Number(order.total_amount).toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex-1 space-y-3 mb-5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 mt-0.5"><i className="fa-solid fa-store"></i></div>
                      <div>
                        <p className="text-xs font-bold text-gray-400">Titik Jemput (Pickup)</p>
                        <p className="text-sm font-semibold text-apx-dark">Apotek Siresep Pusat</p>
                      </div>
                    </div>
                    
                    <div className="ml-4 border-l-2 border-dashed border-gray-200 h-4 my-1"></div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-apx-brand/20 text-apx-brand flex items-center justify-center shrink-0 mt-0.5"><i className="fa-solid fa-location-dot"></i></div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-400">Titik Antar (Dropoff)</p>
                        <p className="text-sm font-semibold text-apx-dark leading-snug line-clamp-2">{addressInfo.text || '-'}</p>
                        {addressInfo.lat && addressInfo.lon && (
                          <a href={`https://www.google.com/maps?q=${addressInfo.lat},${addressInfo.lon}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded mt-2 uppercase">
                            <i className="fa-solid fa-map-location-dot"></i> Buka Navigasi Maps
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {activeTab === 'tersedia' && (
                    <button onClick={() => handleTakeTask(order.order_id || order.id)} className="w-full bg-apx-dark hover:bg-black text-white font-extrabold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                      <i className="fa-solid fa-hand-holding-box"></i> Ambil Tugas Ini
                    </button>
                  )}
                  
                  {activeTab === 'saya' && (
                    <button onClick={() => handleCompleteTask(order.order_id || order.id)} className="w-full bg-apx-brand hover:bg-apx-brandDark text-apx-dark font-extrabold py-3.5 rounded-xl shadow-[0_10px_20px_-10px_rgba(0,208,132,0.5)] transition-all flex items-center justify-center gap-2">
                      <i className="fa-solid fa-check-double"></i> Selesaikan Pesanan
                    </button>
                  )}

                  {activeTab === 'riwayat' && (
                    <button disabled className="w-full bg-gray-100 text-gray-400 font-extrabold py-3.5 rounded-xl cursor-not-allowed flex items-center justify-center gap-2 border border-gray-200">
                      <i className="fa-solid fa-flag-checkered"></i> Pengiriman Selesai
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Courier;