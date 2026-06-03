import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Admin() {
  const [activeTab, setActiveTab] = useState('orders'); 
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  
  // FIX ADM 4 & ADM 5: State filter rentang transaksi harian
  const [filterDate, setFilterDate] = useState('');

  // FIX ADM 7: Tracker ID Pesanan untuk Otomasi Verifikasi
  const [selectedOrderIdForPrescription, setSelectedOrderIdForPrescription] = useState('');

  // FIX ADM 8: State penampung Laporan Keuangan
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const [productForm, setProductForm] = useState({
    id: '', name: '', unit: '', price: '', stock: '', badge: '', image: '', requires_prescription: false, category: 'Obat Bebas'
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const navigate = useNavigate();
  const userStr = localStorage.getItem('siresep_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const serverBaseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

  // Ditambahkan query string untuk memfilter riwayat harian
  const fetchOrders = async (dateParam = '') => {
    setLoadingOrders(true);
    try {
      let url = `${import.meta.env.VITE_API_BASE_URL}/orders`;
      if (dateParam) {
        url += `?date=${dateParam}`;
      }
      const response = await fetch(url);
      const result = await response.json();
      if (result.status === 'success') setOrders(result.data);
    } catch (error) { console.error('Gagal memuat pesanan:', error); } 
    finally { setLoadingOrders(false); }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products`);
      const result = await response.json();
      if (result.status === 'success') setProducts(result.data);
    } catch (error) { console.error('Gagal memuat produk:', error); } 
    finally { setLoadingProducts(false); }
  };

  // Mengambil rekapan data penjualan mutlak dari database
  const fetchReport = async () => {
    setLoadingReport(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/reports`);
      const result = await response.json();
      if (result.status === 'success') setReportData(result.data);
    } catch (error) { console.error('Gagal memuat laporan:', error); }
    finally { setLoadingReport(false); }
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'pharmacist')) {
      fetchOrders();
      fetchProducts();
    } else {
      navigate('/login');
    }
  }, []);

  const handleUpdateOrderStatus = async (orderId, currentStatus) => {
    if (!orderId) return;
    let nextStatus = '';
    if (currentStatus === 'Cek Resep') nextStatus = 'Sedang Diramu';
    else if (currentStatus === 'Sedang Diramu') nextStatus = 'Kurir Menuju Lokasi';
    else if (currentStatus === 'Kurir Menuju Lokasi') nextStatus = 'Pesanan Tiba';
    else return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) fetchOrders(filterDate);
    } catch (err) { console.error('Gagal update status:', err); }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!orderId || !window.confirm(`Batalkan pesanan (ID: ${orderId})?`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE' });
      if (res.ok) fetchOrders(filterDate);
    } catch (err) { console.error('Gagal menghapus pesanan:', err); }
  };

  const openPrescriptionViewer = (orderId, imageUrl) => {
    setSelectedOrderIdForPrescription(orderId);
    setSelectedPrescription(`${serverBaseUrl}${imageUrl}`);
    setShowPrescriptionModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setProductForm({ id: '', name: '', unit: '', price: '', stock: '', badge: '', image: '', requires_prescription: false, category: 'Obat Bebas' });
    setImageFile(null);
    setImagePreview(null);
    setShowProductModal(true);
  };

  const openEditModal = (product) => {
    setIsEditing(true);
    setProductForm({
      id: product.id, name: product.name, unit: product.unit, price: product.price,
      stock: product.stock, badge: product.badge || '', image: product.image || '',
      requires_prescription: product.requires_prescription || false,
      category: product.category || 'Obat Bebas'
    });
    setImageFile(null);
    setImagePreview(product.image ? `${serverBaseUrl}${product.image}` : null);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${import.meta.env.VITE_API_BASE_URL}/products/${productForm.id}` : `${import.meta.env.VITE_API_BASE_URL}/products`;
    
    const formData = new FormData();
    formData.append('name', productForm.name);
    formData.append('unit', productForm.unit);
    formData.append('price', productForm.price);
    formData.append('stock', productForm.stock);
    formData.append('badge', productForm.badge);
    formData.append('requires_prescription', productForm.requires_prescription);
    formData.append('category', productForm.category);
    
    if (imageFile) formData.append('image', imageFile);
    else if (productForm.image) formData.append('existing_image', productForm.image);
    
    try {
      const res = await fetch(url, { method, body: formData });
      if (res.ok) {
        setShowProductModal(false);
        fetchProducts();
      } else alert("Gagal menyimpan produk.");
    } catch (err) { console.error('Gagal menyimpan produk:', err); }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Hapus produk ini dari inventori?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products/${id}`, { method: 'DELETE' });
      if (res.ok) fetchProducts();
    } catch (err) { console.error('Gagal menghapus produk:', err); }
  };

  const handleLogout = () => {
    localStorage.removeItem('siresep_token');
    localStorage.removeItem('siresep_user');
    navigate('/login');
  };

  const KATEGORI_PILIHAN = [
    'Obat Bebas', 'Obat Keras', 'Suplemen & Vitamin', 'Alat Kesehatan', 'Perawatan Tubuh', 'Ibu & Anak', 'Lainnya'
  ];

  return (
    <div className="text-slate-800 antialiased flex h-screen overflow-hidden bg-[#F4F7F6]">
      <aside className="bg-apx-dark text-white w-64 flex-shrink-0 hidden md:flex flex-col z-20 m-4 rounded-[2rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-apx-brand/10 rounded-full blur-2xl"></div>
        <div className="h-24 flex items-center px-8 relative z-10">
          <div className="bg-apx-brand text-apx-dark p-2 rounded-xl mr-3 shadow-[0_0_15px_rgba(0,208,132,0.4)]">
            <i className="fa-solid fa-house-medical"></i>
          </div>
          <span className="font-extrabold text-2xl tracking-tight">Siresep<span className="text-apx-brand">.</span></span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-4 relative z-10">
          <nav className="space-y-2">
            <button onClick={() => setActiveTab('orders')} className={`w-full group flex items-center px-4 py-3 text-sm font-bold rounded-2xl transition-all ${activeTab === 'orders' ? 'bg-white/10 text-white border border-white/5 backdrop-blur-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <i className="fa-solid fa-shapes mr-3 text-lg text-apx-brand w-5 text-center"></i> Data Pesanan
            </button>
            <button onClick={() => setActiveTab('products')} className={`w-full group flex items-center px-4 py-3 text-sm font-bold rounded-2xl transition-all ${activeTab === 'products' ? 'bg-white/10 text-white border border-white/5 backdrop-blur-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <i className="fa-solid fa-box-open mr-3 text-lg w-5 text-center"></i> Inventori Produk
            </button>
            {/* Navigasi Tambahan untuk Mengakses Laporan Penjualan */}
            <button onClick={() => { setActiveTab('reports'); fetchReport(); }} className={`w-full group flex items-center px-4 py-3 text-sm font-bold rounded-2xl transition-all ${activeTab === 'reports' ? 'bg-white/10 text-white border border-white/5 backdrop-blur-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <i className="fa-solid fa-chart-line mr-3 text-lg w-5 text-center"></i> Laporan Penjualan
            </button>
          </nav>
        </div>

        <div className="p-6 relative z-10 border-t border-white/10">
          <div className="flex items-center gap-3">
            <img src={user?.avatar_url || "https://ui-avatars.com/api/?name=Admin&background=00D084&color=021B19&bold=true"} className="w-10 h-10 rounded-full border-2 border-white/20" alt="Avatar" />
            <div>
              <p className="text-sm font-bold leading-none">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase">{user?.role || 'Administrator'}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-24 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex flex-col">
            <h1 className="text-2xl font-extrabold text-apx-dark tracking-tight">Selamat bekerja, {user ? user.name.split(' ')[0] : 'Admin'}! 👋</h1>
            <p className="text-sm font-medium text-gray-500">Berikut adalah antrean dan data apotek Anda.</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleLogout} className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm">
              <i className="fa-solid fa-arrow-right-from-bracket"></i> <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {activeTab === 'orders' && (
            <div className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden p-2">
              <div className="px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="font-extrabold text-lg text-apx-dark">Antrean Pesanan Masuk</h2>
                {/* FIX ADM 4 & ADM 5: UI Komponen Datepicker untuk Filter Transaksi Harian */}
                <div className="flex items-center gap-3 flex-wrap">
                  <input 
                    type="date" 
                    value={filterDate} 
                    onChange={(e) => {
                      setFilterDate(e.target.value);
                      fetchOrders(e.target.value);
                    }}
                    className="bg-gray-50 border border-gray-200 text-sm font-semibold rounded-xl px-3 py-2 text-apx-dark focus:outline-none focus:border-apx-brand"
                  />
                  <button onClick={() => { setFilterDate(''); fetchOrders(''); }} className="text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors">Reset</button>
                  <button onClick={() => fetchOrders(filterDate)} className="text-sm font-bold text-apx-dark bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors"><i className="fa-solid fa-rotate-right"></i> Refresh</button>
                </div>
              </div>
              
              {loadingOrders ? (
                <div className="flex justify-center py-10"><i className="fa-solid fa-circle-notch fa-spin text-3xl text-apx-brand"></i></div>
              ) : (
                <div className="overflow-x-auto px-4 pb-4">
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                      <tr className="text-xs text-gray-400 uppercase tracking-widest font-bold border-b border-gray-100">
                        <th className="px-4 py-3 pb-5">Order ID</th>
                        <th className="px-4 py-3 pb-5">Pelanggan</th>
                        <th className="px-4 py-3 pb-5">Total Bayar</th>
                        <th className="px-4 py-3 pb-5">Status</th>
                        <th className="px-4 py-3 pb-5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-semibold text-apx-dark space-y-2">
                      {orders.map((order, index) => {
                        const finalOrderId = order.order_id || order.id;
                        return (
                          <React.Fragment key={finalOrderId || index}>
                            <tr className="group hover:bg-gray-50 transition-colors rounded-2xl">
                              <td className="px-4 py-4 rounded-l-2xl">
                                <span className="font-extrabold">{finalOrderId}</span><br/>
                                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md mt-1 inline-block uppercase">
                                  {order.delivery_type === 'Pickup' ? 'Ambil Sendiri' : 'Diantar'}
                                </span>
                              </td>
                              <td className="px-4 py-4">{order.customer_name}</td>
                              <td className="px-4 py-4 font-bold text-apx-brand">Rp{Number(order.total_amount).toLocaleString('id-ID')}</td>
                              <td className="px-4 py-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.status === 'Pesanan Tiba' ? 'bg-green-100 text-green-700' : order.status === 'Kurir Menuju Lokasi' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{order.status}</span>
                              </td>
                              <td className="px-4 py-4 text-right rounded-r-2xl">
                                <div className="flex items-center justify-end gap-2">
                                  {order.prescription_image ? (
                                    <button onClick={() => openPrescriptionViewer(finalOrderId, order.prescription_image)} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-bold"><i className="fa-solid fa-eye"></i> Cek Resep</button>
                                  ) : <span className="text-[10px] text-gray-400 font-medium italic mr-2">Tanpa Resep</span>}
                                  <button onClick={() => handleUpdateOrderStatus(finalOrderId, order.status)} disabled={order.status === 'Pesanan Tiba'} className="bg-apx-dark hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50">Ubah Status</button>
                                  <button onClick={() => handleDeleteOrder(finalOrderId)} className="bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 px-3 py-2 rounded-xl text-xs font-bold"><i className="fa-solid fa-trash-can"></i></button>
                                </div>
                              </td>
                            </tr>
                            {index !== orders.length - 1 && (<tr><td colSpan="5" className="h-2 border-b border-gray-50 border-dashed"></td></tr>)}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden p-2">
              <div className="px-6 py-5 flex justify-between items-center">
                <h2 className="font-extrabold text-lg text-apx-dark">Inventori Obat & Produk</h2>
                <button onClick={openAddModal} className="text-sm font-bold text-white bg-apx-brand hover:bg-apx-brandDark px-4 py-2 rounded-xl shadow-md"><i className="fa-solid fa-plus"></i> Tambah Produk</button>
              </div>
              
              {loadingProducts ? (
                <div className="flex justify-center py-10"><i className="fa-solid fa-circle-notch fa-spin text-3xl text-apx-brand"></i></div>
              ) : (
                <div className="overflow-x-auto px-4 pb-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                        <th className="px-4 py-3 pb-5">Foto Produk</th>
                        <th className="px-4 py-3 pb-5">Detail Item</th>
                        <th className="px-4 py-3 pb-5">Harga</th>
                        <th className="px-4 py-3 pb-5">Stok</th>
                        <th className="px-4 py-3 pb-5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-semibold text-apx-dark space-y-2">
                      {products.map((product, index) => (
                        <React.Fragment key={product.id}>
                          <tr className="group hover:bg-gray-50 transition-colors rounded-2xl">
                            <td className="px-4 py-4 rounded-l-2xl w-24">
                              {product.image ? (
                                <img src={`${serverBaseUrl}${product.image}`} alt={product.name} className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
                              ) : <div className="w-14 h-14 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center text-xl border border-gray-200 border-dashed"><i className="fa-regular fa-image"></i></div>}
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-bold flex items-center gap-2">
                                {product.name}
                                {product.requires_prescription && <span className="text-[9px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md font-extrabold border border-rose-200 uppercase shrink-0"><i className="fa-solid fa-prescription"></i> Obat Keras</span>}
                              </p>
                              <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1"><i className="fa-solid fa-tags"></i> {product.category || 'Umum'}</span>
                                • {product.unit} 
                                {product.badge && <span className="text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full uppercase">{product.badge}</span>}
                              </p>
                            </td>
                            <td className="px-4 py-4 font-bold">Rp{Number(product.price).toLocaleString('id-ID')}</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${product.stock > 10 ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>{product.stock} Pcs</span>
                            </td>
                            <td className="px-4 py-4 text-right rounded-r-2xl">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => openEditModal(product)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-xl text-xs font-bold"><i className="fa-solid fa-pen"></i> Edit</button>
                                <button onClick={() => handleDeleteProduct(product.id)} className="bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-xl text-xs font-bold"><i className="fa-solid fa-trash-can"></i> Hapus</button>
                              </div>
                            </td>
                          </tr>
                          {index !== products.length - 1 && (<tr><td colSpan="5" className="h-2 border-b border-gray-50 border-dashed"></td></tr>)}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* FIX ADM 8: Panel Dashboard Visual Analisis Laporan Keuangan */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden p-6">
              <h2 className="font-extrabold text-lg text-apx-dark mb-4">Laporan Analisis Penjualan</h2>
              {loadingReport || !reportData ? (
                <div className="flex justify-center py-10"><i className="fa-solid fa-circle-notch fa-spin text-3xl text-apx-brand"></i></div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl">
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Pendapatan (Lunas)</p>
                      <p className="text-3xl font-extrabold text-slate-900 mt-2">Rp{Number(reportData.summary.total_revenue).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Transaksi Berhasil</p>
                      <p className="text-3xl font-extrabold text-slate-900 mt-2">{reportData.summary.total_orders} Pesanan</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-3">Grafik Penjualan 7 Hari Terakhir</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-semibold text-gray-600">
                          <thead>
                            <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider">
                              <th className="pb-2">Tanggal</th>
                              <th className="pb-2">Jumlah Transaksi</th>
                              <th className="pb-2 text-right">Pendapatan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.daily.map((d, i) => (
                              <tr key={i} className="border-b border-gray-100 last:border-0">
                                <td className="py-2.5">{new Date(d.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                <td className="py-2.5">{d.count} Transaksi</td>
                                <td className="py-2.5 text-right font-bold text-emerald-600">Rp{Number(d.revenue).toLocaleString('id-ID')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal Resep */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-apx-dark/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-xl font-extrabold text-apx-dark flex items-center gap-2"><i className="fa-solid fa-file-prescription text-apx-brand"></i> Lampiran Resep Dokter</h2>
              <button onClick={() => setShowPrescriptionModal(false)} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-rose-50 hover:text-rose-500"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="bg-gray-100 rounded-2xl flex-1 overflow-auto flex items-center justify-center p-2 border border-gray-200">
              <img src={selectedPrescription} alt="Resep" className="max-w-full max-h-full object-contain rounded-xl" />
            </div>
            {/* FIX ADM 7: Tombol interaktif untuk memproses verifikasi resep dokter */}
            <div className="mt-4 flex justify-end gap-2 shrink-0">
              <button 
                onClick={async () => {
                  if (!selectedOrderIdForPrescription) return;
                  try {
                    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/${encodeURIComponent(selectedOrderIdForPrescription)}/verify-prescription`, {
                      method: 'PUT'
                    });
                    if (res.ok) {
                      alert('Resep berhasil diverifikasi! Status pesanan berubah menjadi Sedang Diramu.');
                      setShowPrescriptionModal(false);
                      fetchOrders(filterDate);
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-md"
              >
                <i className="fa-solid fa-circle-check mr-1"></i> Verifikasi Resep & Setujui
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah/Edit Produk */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-apx-dark/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowProductModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-rose-50 hover:text-rose-500"><i className="fa-solid fa-xmark"></i></button>
            <h2 className="text-2xl font-extrabold text-apx-dark mb-6">{isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
            
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50 relative group">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-xl shadow-md" />
                    <label className="absolute -bottom-3 -right-3 bg-apx-dark text-white w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-black"><i className="fa-solid fa-pen text-sm"></i><input type="file" accept="image/*" className="hidden" onChange={handleImageChange} /></label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-28 cursor-pointer">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-apx-brand shadow-sm mb-2 group-hover:scale-110 transition-transform"><i className="fa-solid fa-cloud-arrow-up text-xl"></i></div>
                    <span className="text-sm font-bold text-gray-500">Pilih Foto Produk</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} required={!isEditing} />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Produk</label>
                <input type="text" required value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-apx-dark rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand font-medium" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Kategori</label>
                  <select value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-apx-dark rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand font-medium cursor-pointer">
                    {KATEGORI_PILIHAN.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Unit / Satuan</label>
                  <input type="text" required value={productForm.unit} onChange={(e) => setProductForm({...productForm, unit: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-apx-dark rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Harga (Rp)</label>
                  <input type="number" required value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-apx-dark rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Stok</label>
                  <input type="number" required value={productForm.stock} onChange={(e) => setProductForm({...productForm, stock: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-apx-dark rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand font-medium" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Badge (Opsional)</label>
                <input type="text" placeholder="Misal: Diskon 20%" value={productForm.badge} onChange={(e) => setProductForm({...productForm, badge: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-apx-dark rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand font-medium" />
              </div>

              <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl mt-4 flex items-center justify-between">
                <div>
                  <label htmlFor="req_presc" className="text-sm font-extrabold text-rose-700 block cursor-pointer">Wajib Resep Dokter?</label>
                  <p className="text-[10px] text-rose-500 font-medium">Tandai jika ini adalah obat keras</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="req_presc" className="sr-only peer" checked={productForm.requires_prescription} onChange={(e) => setProductForm({...productForm, requires_prescription: e.target.checked})} />
                  <div className="w-11 h-6 bg-rose-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-apx-brand hover:bg-apx-brandDark text-white py-3.5 rounded-xl font-extrabold shadow-lg"><i className="fa-solid fa-floppy-disk"></i> Simpan Produk</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;