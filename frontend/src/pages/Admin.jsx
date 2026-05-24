import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Admin() {
  const [activeTab, setActiveTab] = useState('products'); // Default ke products untuk testing
  
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // State untuk Data Form Teks
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    unit: '',
    price: '',
    stock: '',
    badge: '',
    image: '' // Gambar lama (string)
  });
  
  // State khusus untuk file gambar yang baru di-upload
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const navigate = useNavigate();
  const userStr = localStorage.getItem('siresep_user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Utility untuk mendapatkan URL Base Server (tanpa /api) untuk memuat gambar
  const serverBaseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

  // ==========================================
  // FETCH DATA
  // ==========================================
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders`);
      const result = await response.json();
      if (result.status === 'success') {
        setOrders(result.data);
      }
    } catch (error) {
      console.error('Gagal mengambil data pesanan:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products`);
      const result = await response.json();
      if (result.status === 'success') {
        setProducts(result.data);
      }
    } catch (error) {
      console.error('Gagal mengambil data produk:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  // ==========================================
  // HANDLERS UNTUK ORDERS
  // ==========================================
  const handleUpdateOrderStatus = async (orderId, currentStatus) => {
    if (!orderId) return;
    let nextStatus = '';
    if (currentStatus === 'Cek Resep') nextStatus = 'Sedang Diramu';
    else if (currentStatus === 'Sedang Diramu') nextStatus = 'Kurir Menuju Lokasi';
    else if (currentStatus === 'Kurir Menuju Lokasi') nextStatus = 'Pesanan Tiba';
    else return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) fetchOrders();
    } catch (err) {
      console.error('Gagal update status:', err);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!orderId || !window.confirm(`Batalkan pesanan (ID: ${orderId})?`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/${encodeURIComponent(orderId)}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchOrders();
    } catch (err) {
      console.error('Gagal menghapus pesanan:', err);
    }
  };

  // ==========================================
  // HANDLERS UNTUK PRODUCTS (GAMBAR)
  // ==========================================
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setProductForm({ id: '', name: '', unit: '', price: '', stock: '', badge: '', image: '' });
    setImageFile(null);
    setImagePreview(null);
    setShowProductModal(true);
  };

  const openEditModal = (product) => {
    setIsEditing(true);
    setProductForm({
      id: product.id,
      name: product.name,
      unit: product.unit,
      price: product.price,
      stock: product.stock,
      badge: product.badge || '',
      image: product.image || ''
    });
    setImageFile(null);
    // Tampilkan gambar lama jika ada
    setImagePreview(product.image ? `${serverBaseUrl}${product.image}` : null);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing 
      ? `${import.meta.env.VITE_API_BASE_URL}/products/${productForm.id}`
      : `${import.meta.env.VITE_API_BASE_URL}/products`;
    
    // Gunakan FormData karena kita mengirim file fisik
    const formData = new FormData();
    formData.append('name', productForm.name);
    formData.append('unit', productForm.unit);
    formData.append('price', productForm.price);
    formData.append('stock', productForm.stock);
    formData.append('badge', productForm.badge);
    
    // Jika ada file gambar baru, kirim.
    if (imageFile) {
      formData.append('image', imageFile);
    } else if (productForm.image) {
      // Jika tidak ada gambar baru, beritahu backend gambar lama masih dipakai
      formData.append('existing_image', productForm.image);
    }
    
    try {
      // Fetch otomatis mengatur header multipart/form-data saat menerima objek FormData
      const res = await fetch(url, {
        method,
        body: formData 
      });
      if (res.ok) {
        setShowProductModal(false);
        fetchProducts();
      } else {
        alert("Gagal menyimpan produk.");
      }
    } catch (err) {
      console.error('Gagal menyimpan produk:', err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Hapus produk ini dari inventori?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchProducts();
    } catch (err) {
      console.error('Gagal menghapus produk:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('siresep_token');
    localStorage.removeItem('siresep_user');
    navigate('/login');
  };

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
            <button 
              onClick={() => setActiveTab('orders')} 
              className={`w-full group flex items-center px-4 py-3 text-sm font-bold rounded-2xl transition-all ${activeTab === 'orders' ? 'bg-white/10 text-white border border-white/5 backdrop-blur-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <i className="fa-solid fa-shapes mr-3 text-lg text-apx-brand w-5 text-center"></i>
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('products')} 
              className={`w-full group flex items-center px-4 py-3 text-sm font-bold rounded-2xl transition-all ${activeTab === 'products' ? 'bg-white/10 text-white border border-white/5 backdrop-blur-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <i className="fa-solid fa-box-open mr-3 text-lg w-5 text-center"></i>
              Inventori
            </button>
            <button className="w-full text-gray-400 hover:text-white hover:bg-white/5 group flex items-center px-4 py-3 text-sm font-semibold rounded-2xl transition-all relative">
              <i className="fa-solid fa-file-prescription mr-3 text-lg w-5 text-center"></i>
              E-Resep
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
            <h1 className="text-2xl font-extrabold text-apx-dark tracking-tight">Selamat pagi, {user ? user.name.split(' ')[0] : 'Admin'}! 👋</h1>
            <p className="text-sm font-medium text-gray-500">Berikut adalah ringkasan apotek Anda hari ini.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogout}
              className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i> <span className="hidden sm:block">Keluar</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {activeTab === 'orders' ? (
            <>
              {/* === TAMPILAN OVERVIEW (SAMA SEPERTI SEBELUMNYA) === */}
              <div className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden p-2">
                <div className="px-6 py-5 flex justify-between items-center">
                  <h2 className="font-extrabold text-lg text-apx-dark">Antrean Pesanan</h2>
                  <button onClick={fetchOrders} className="text-sm font-bold text-apx-dark bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors">
                    <i className="fa-solid fa-rotate-right"></i> Refresh
                  </button>
                </div>
                
                {loadingOrders ? (
                  <div className="flex justify-center py-10"><i className="fa-solid fa-circle-notch fa-spin text-3xl text-apx-brand"></i></div>
                ) : (
                  <div className="overflow-x-auto px-4 pb-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                          <th className="px-4 py-3 pb-5">Order ID</th>
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
                                <td className="px-4 py-4 rounded-l-2xl">{finalOrderId}</td>
                                <td className="px-4 py-4 font-bold">{order.status}</td>
                                <td className="px-4 py-4 text-right rounded-r-2xl">
                                  <button onClick={() => handleUpdateOrderStatus(finalOrderId, order.status)} className="bg-apx-dark hover:bg-black text-white px-4 py-2 rounded-xl transition-colors text-xs font-bold mr-2">Validasi / Lanjut</button>
                                  <button onClick={() => handleDeleteOrder(finalOrderId)} className="bg-white border border-rose-200 text-rose-500 px-4 py-2 rounded-xl text-xs font-bold">Batal</button>
                                </td>
                              </tr>
                              {index !== orders.length - 1 && (<tr><td colSpan="3" className="h-2"></td></tr>)}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* === TABEL INVENTORI OBAT (DENGAN GAMBAR ASLI) === */}
              <div className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden p-2">
                <div className="px-6 py-5 flex justify-between items-center">
                  <h2 className="font-extrabold text-lg text-apx-dark">Inventori Obat & Produk</h2>
                  <button onClick={openAddModal} className="text-sm font-bold text-white bg-apx-brand hover:bg-apx-brandDark px-4 py-2 rounded-xl transition-colors shadow-md flex items-center gap-2">
                    <i className="fa-solid fa-plus"></i> Tambah Produk
                  </button>
                </div>
                
                {loadingProducts ? (
                  <div className="flex justify-center py-10">
                    <i className="fa-solid fa-circle-notch fa-spin text-3xl text-apx-brand"></i>
                  </div>
                ) : (
                  <div className="overflow-x-auto px-4 pb-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                          <th className="px-4 py-3 pb-5">Foto Produk</th>
                          <th className="px-4 py-3 pb-5">Item</th>
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
                                {/* TAMPILAN GAMBAR PRODUK */}
                                {product.image ? (
                                  <img 
                                    src={`${serverBaseUrl}${product.image}`} 
                                    alt={product.name} 
                                    className="w-14 h-14 rounded-xl object-cover border border-gray-200 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center text-xl border border-gray-200 border-dashed">
                                    <i className="fa-regular fa-image"></i>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <p className="font-bold">{product.name} {product.badge && <span className="ml-2 text-[10px] bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full uppercase">{product.badge}</span>}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{product.unit}</p>
                              </td>
                              <td className="px-4 py-4 font-bold">
                                Rp{Number(product.price).toLocaleString('id-ID')}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs ${product.stock > 10 ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                                  {product.stock} Tersedia
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right rounded-r-2xl">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => openEditModal(product)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-colors text-xs font-bold">
                                    <i className="fa-solid fa-pen"></i> Edit
                                  </button>
                                  <button onClick={() => handleDeleteProduct(product.id)} className="bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-colors text-xs font-bold">
                                    <i className="fa-solid fa-trash-can"></i> Hapus
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {index !== products.length - 1 && (<tr><td colSpan="5" className="h-2"></td></tr>)}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal Tambah/Edit Produk dengan Input Gambar */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-apx-dark/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowProductModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-rose-50 hover:text-rose-500 transition-colors">
              <i className="fa-solid fa-xmark"></i>
            </button>
            
            <h2 className="text-2xl font-extrabold text-apx-dark mb-6">
              {isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h2>
            
            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* UPLOAD GAMBAR AREA */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50 relative group">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-xl shadow-md" />
                    <label className="absolute -bottom-3 -right-3 bg-apx-dark text-white w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-black transition-colors">
                      <i className="fa-solid fa-pen text-sm"></i>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-28 cursor-pointer">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-apx-brand shadow-sm mb-2 group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-cloud-arrow-up text-xl"></i>
                    </div>
                    <span className="text-sm font-bold text-gray-500 group-hover:text-apx-brand transition-colors">Pilih Foto Produk</span>
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
                  <label className="block text-sm font-bold text-gray-700 mb-1">Harga (Rp)</label>
                  <input type="number" required value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-apx-dark rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Stok</label>
                  <input type="number" required value={productForm.stock} onChange={(e) => setProductForm({...productForm, stock: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-apx-dark rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Unit / Satuan</label>
                  <input type="text" required value={productForm.unit} onChange={(e) => setProductForm({...productForm, unit: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-apx-dark rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Badge (Opsional)</label>
                  <input type="text" value={productForm.badge} onChange={(e) => setProductForm({...productForm, badge: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-apx-dark rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand font-medium" />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-apx-brand hover:bg-apx-brandDark text-white py-3.5 rounded-xl font-extrabold shadow-lg transition-all flex items-center justify-center gap-2">
                  <i className="fa-solid fa-floppy-disk"></i> Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;