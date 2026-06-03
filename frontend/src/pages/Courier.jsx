import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Courier() {
  const [activeTab, setActiveTab] = useState('tersedia');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  // Modal konfirmasi COD
  const [codConfirmModal, setCodConfirmModal] = useState(null);
  const [isConfirmingCod, setIsConfirmingCod] = useState(false);

  const navigate = useNavigate();
  const userStr = localStorage.getItem('siresep_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/orders`);
      const result = await response.json();
      if (result.status === 'success') setOrders(result.data);
    } catch (error) {
      console.error('Gagal memuat pesanan:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'kurir') { navigate('/login'); return; }
    fetchOrders();
  }, [user, navigate]);

  const handleTakeTask = async (orderId) => {
    try {
      const response = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}/take-task`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_name: user.name, driver_vehicle: 'Motor Operasional Siresep' })
      });
      if (response.ok) { alert('Tugas berhasil diambil!'); fetchOrders(); setActiveTab('saya'); }
    } catch { alert('Terjadi kesalahan saat mengambil tugas.'); }
  };

  const handleCompleteTask = async (orderId) => {
    if (!window.confirm('Pastikan obat sudah diterima pelanggan. Selesaikan tugas ini?')) return;
    try {
      const response = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}/complete-task`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) { alert('Pesanan selesai. Terima kasih!'); fetchOrders(); setActiveTab('riwayat'); }
    } catch { alert('Terjadi kesalahan saat menyelesaikan tugas.'); }
  };

  // ── Konfirmasi Bayar COD Delivery (Kurir terima uang di rumah customer) ──
  const handleConfirmCodPayment = async (orderId) => {
    setIsConfirmingCod(true);
    try {
      const res = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}/pay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid_by: 'kurir' })
      });
      const result = await res.json();
      if (result.status === 'success') {
        setCodConfirmModal(null);
        alert('✅ Pembayaran COD dikonfirmasi! Serahkan uang ke kasir saat kembali ke apotek.');
        fetchOrders();
      } else {
        alert('Gagal: ' + result.message);
      }
    } catch { alert('Kesalahan koneksi saat konfirmasi.'); }
    finally { setIsConfirmingCod(false); }
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
    if (activeTab === 'tersedia') return order.delivery_type === 'Delivery' && order.status === 'Sedang Diramu';
    if (activeTab === 'saya') return order.status === 'Kurir Menuju Lokasi' && order.driver_name === user?.name;
    if (activeTab === 'riwayat') return order.status === 'Pesanan Tiba' && order.driver_name === user?.name;
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
      {/* ── NAVBAR ── */}
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
        {/* ── TABS ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-6 flex overflow-x-auto hide-scrollbar gap-2">
          {[
            { key: 'tersedia', label: 'Tugas Tersedia', icon: 'fa-list-check' },
            { key: 'saya', label: 'Tugas Saya', icon: 'fa-route' },
            { key: 'riwayat', label: 'Riwayat', icon: 'fa-clock-rotate-left' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-[120px] text-center py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === tab.key ? 'bg-apx-brand text-apx-dark shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
              <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
            </button>
          ))}
        </div>

        {/* ── BANNER INFO COD (hanya di tab Saya) ── */}
        {activeTab === 'saya' && filteredOrders.some(o => o.payment_status === 'Belum Dibayar') && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
              <i className="fa-solid fa-hand-holding-dollar"></i>
            </div>
            <div>
              <p className="text-sm font-extrabold text-orange-800">Ada pesanan COD!</p>
              <p className="text-xs text-orange-600 font-medium mt-0.5">
                Setelah customer membayar tunai, tap tombol <strong>"Konfirmasi Terima Bayaran"</strong> lalu selesaikan pengiriman.
              </p>
            </div>
          </div>
        )}

        {/* ── ORDER CARDS ── */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 mt-8">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className={`fa-solid ${activeTab === 'tersedia' ? 'fa-box-open' : activeTab === 'saya' ? 'fa-motorcycle' : 'fa-clipboard-check'} text-4xl text-gray-300`}></i>
            </div>
            <h2 className="text-xl font-extrabold mb-1">
              {activeTab === 'tersedia' ? 'Belum Ada Tugas' : activeTab === 'saya' ? 'Tidak Ada Pengiriman Aktif' : 'Belum Ada Riwayat'}
            </h2>
            <p className="text-sm font-medium text-gray-400 mb-6">
              {activeTab === 'tersedia' ? 'Saat ini belum ada antrean pengiriman.' : activeTab === 'saya' ? 'Ambil tugas di tab Tugas Tersedia.' : 'Belum ada pengiriman selesai hari ini.'}
            </p>
            <button onClick={fetchOrders} className="bg-gray-50 hover:bg-gray-100 text-apx-dark font-bold px-6 py-2.5 rounded-full text-sm transition-colors border border-gray-200 shadow-sm inline-flex items-center gap-2">
              <i className="fa-solid fa-rotate-right"></i> Refresh
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOrders.map(order => {
              const addressInfo = extractAddressInfo(order.delivery_address || '');
              const isCodUnpaid = order.payment_status === 'Belum Dibayar' && activeTab === 'saya';

              return (
                <div key={order.order_id}
                  className={`bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border flex flex-col h-full transition-colors ${isCodUnpaid ? 'border-orange-200 bg-orange-50/20' : 'border-gray-100 hover:border-apx-brand'}`}>

                  {/* COD Badge */}
                  {isCodUnpaid && (
                    <div className="mb-3 bg-orange-100 border border-orange-200 rounded-xl px-3 py-2 flex items-center gap-2">
                      <i className="fa-solid fa-hand-holding-dollar text-orange-600"></i>
                      <span className="text-xs font-extrabold text-orange-700">Pesanan COD — Belum Dibayar</span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                    <div>
                      <span className="text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-widest">{order.order_id}</span>
                      <h3 className="font-extrabold text-apx-dark text-lg mt-1">{order.customer_name}</h3>
                    </div>
                    <span className="font-extrabold text-apx-brand">Rp{Number(order.total_amount).toLocaleString('id-ID')}</span>
                  </div>

                  {/* Rute */}
                  <div className="flex-1 space-y-3 mb-5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 mt-0.5"><i className="fa-solid fa-store"></i></div>
                      <div>
                        <p className="text-xs font-bold text-gray-400">Titik Jemput</p>
                        <p className="text-sm font-semibold text-apx-dark">Apotek Siresep Pusat</p>
                      </div>
                    </div>
                    <div className="ml-4 border-l-2 border-dashed border-gray-200 h-4 my-1"></div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-apx-brand/20 text-apx-brand flex items-center justify-center shrink-0 mt-0.5"><i className="fa-solid fa-location-dot"></i></div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-400">Titik Antar</p>
                        <p className="text-sm font-semibold text-apx-dark leading-snug line-clamp-2">{addressInfo.text || '-'}</p>
                        {addressInfo.lat && addressInfo.lon && (
                          <a href={`https://www.google.com/maps?q=${addressInfo.lat},${addressInfo.lon}`} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded mt-2 uppercase">
                            <i className="fa-solid fa-map-location-dot"></i> Buka Navigasi Maps
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Aksi */}
                  {activeTab === 'tersedia' && (
                    <button onClick={() => handleTakeTask(order.order_id || order.id)}
                      className="w-full bg-apx-dark hover:bg-black text-white font-extrabold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                      <i className="fa-solid fa-hand-holding-box"></i> Ambil Tugas Ini
                    </button>
                  )}

                  {activeTab === 'saya' && (
                    <div className="space-y-2">
                      {/* Tombol COD — muncul jika belum bayar */}
                      {isCodUnpaid && (
                        <button onClick={() => setCodConfirmModal(order)}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md">
                          <i className="fa-solid fa-hand-holding-dollar"></i> Konfirmasi Terima Bayaran
                        </button>
                      )}
                      {/* Tombol selesai — disable jika COD belum bayar */}
                      <button onClick={() => handleCompleteTask(order.order_id || order.id)}
                        disabled={isCodUnpaid}
                        className="w-full bg-apx-brand hover:bg-apx-brandDark text-apx-dark font-extrabold py-3.5 rounded-xl shadow-[0_10px_20px_-10px_rgba(0,208,132,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                        <i className="fa-solid fa-check-double"></i>
                        {isCodUnpaid ? 'Konfirmasi bayaran dulu!' : 'Selesaikan Pesanan'}
                      </button>
                    </div>
                  )}

                  {activeTab === 'riwayat' && (
                    <div className="space-y-2">
                      <button disabled className="w-full bg-gray-100 text-gray-400 font-extrabold py-3.5 rounded-xl cursor-not-allowed flex items-center justify-center gap-2 border border-gray-200">
                        <i className="fa-solid fa-flag-checkered"></i> Pengiriman Selesai
                      </button>
                      {order.payment_status === 'Sudah Dibayar' && (
                        <p className="text-center text-[10px] text-green-600 font-bold">
                          <i className="fa-solid fa-circle-check mr-1"></i> COD Lunas
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL KONFIRMASI COD DELIVERY (Kurir) ── */}
      {codConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="bg-orange-500 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                <i className="fa-solid fa-hand-holding-dollar"></i>
              </div>
              <h2 className="font-extrabold text-xl">Konfirmasi Bayaran COD</h2>
              <p className="text-orange-100 text-sm mt-1">{codConfirmModal.order_id} • {codConfirmModal.customer_name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center">
                <p className="text-xs font-bold text-orange-500 mb-1">Total yang Diterima dari Customer</p>
                <p className="font-extrabold text-3xl text-apx-dark">
                  Rp{Number(codConfirmModal.total_amount).toLocaleString('id-ID')}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs font-medium text-amber-800 space-y-1">
                <p className="font-extrabold text-amber-700"><i className="fa-solid fa-triangle-exclamation mr-1"></i> Penting!</p>
                <p>Pastikan Anda sudah menerima uang tunai sejumlah di atas dari customer sebelum menekan konfirmasi.</p>
                <p>Serahkan uang ini ke kasir apotek saat kembali.</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setCodConfirmModal(null)}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-extrabold py-3 rounded-xl transition-all border border-gray-200">
                  Batal
                </button>
                <button onClick={() => handleConfirmCodPayment(codConfirmModal.order_id || codConfirmModal.id)}
                  disabled={isConfirmingCod}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-3 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                  {isConfirmingCod
                    ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Memproses...</>
                    : <><i className="fa-solid fa-check"></i> Uang Sudah Diterima</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Courier;