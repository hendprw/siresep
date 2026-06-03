import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Cashier() {
  const [activeTab, setActiveTab] = useState('pos');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [shiftOrders, setShiftOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loading, setLoading] = useState(true);
  const [receiptData, setReceiptData] = useState(null);

  const navigate = useNavigate();
  
  // Parse user dari local storage
  const userStr = localStorage.getItem('siresep_user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const serverBaseUrl = baseUrl.replace('/api', '');

  const categories = ['Semua', 'Obat Bebas', 'Obat Keras', 'Suplemen & Vitamin', 'Alat Kesehatan', 'Perawatan Tubuh'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const prodRes = await fetch(`${baseUrl}/products`);
      const prodData = await prodRes.json();
      if (prodData.status === 'success') setProducts(prodData.data);

      const shiftRes = await fetch(`${baseUrl}/cashier/shift-orders`);
      const shiftData = await shiftRes.json();
      if (shiftData.status === 'success') setShiftOrders(shiftData.data);
    } catch (error) {
      console.error('Gagal mengambil data kasir:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // PERBAIKAN: Gunakan user?.id dan user?.role sebagai dependency, bukan objek user secara keseluruhan
    if (!user || (user.role !== 'kasir' && user.role !== 'admin')) {
      navigate('/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, navigate]);

  const handleAddToCart = (product) => {
    if (product.stock <= 0) {
      alert('Stok produk habis!');
      return;
    }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        alert('Tidak bisa melebihi stok yang tersedia!');
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (productId, amount) => {
    const existing = cart.find(item => item.id === productId);
    if (!existing) return;
    const newQty = existing.quantity + amount;
    if (newQty <= 0) {
      setCart(cart.filter(item => item.id !== productId));
    } else {
      if (newQty > existing.stock) {
        alert('Stok tidak mencukupi!');
        return;
      }
      setCart(cart.map(item => item.id === productId ? { ...item, quantity: newQty } : item));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Keranjang belanja kosong!');
      return;
    }

    const totalPrice = calculateTotal();
    const orderPayload = {
      cashier_id: user.id,
      customer_name: customerName || 'Pelanggan Offline',
      payment_method: paymentMethod,
      total_price: totalPrice,
      items: cart
    };

    try {
      const response = await fetch(`${baseUrl}/cashier/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const result = await response.json();

      if (result.status === 'success') {
        setReceiptData({
          order_id: result.data.order_id,
          customer_name: orderPayload.customer_name,
          payment_method: orderPayload.payment_method,
          total_price: totalPrice,
          items: cart,
          cashier_name: user.name,
          date: new Date().toLocaleString('id-ID')
        });

        alert('Transaksi berhasil disimpan! Membuka jendela cetak struk...');
        setCart([]);
        setCustomerName('');
        fetchData();
      } else {
        alert('Gagal memproses transaksi.');
      }
    } catch (error) {
      alert('Terjadi kesalahan koneksi sistem.');
    }
  };

  useEffect(() => {
    if (receiptData) {
      setTimeout(() => {
        window.print();
        setReceiptData(null);
      }, 500);
    }
  }, [receiptData]);

  const handleLogout = () => {
    localStorage.removeItem('siresep_token');
    localStorage.removeItem('siresep_user');
    navigate('/login');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="text-slate-800 antialiased bg-[#F4F7F6] min-h-screen flex flex-col print:bg-white print:text-black">
      {/* HEADER BAR - HIDDEN ON PRINT */}
      <nav className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-50 shadow-sm flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-apx-dark text-apx-brand w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-md">
            <i className="fa-solid fa-cash-register"></i>
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight">Siresep POS</h1>
            <p className="text-xs text-gray-400 font-bold">Kasir: {user?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setActiveTab('pos')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'pos' ? 'bg-apx-dark text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            <i className="fa-solid fa-grip mr-2"></i> Mesin POS
          </button>
          <button onClick={() => setActiveTab('shift')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'shift' ? 'bg-apx-dark text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            <i className="fa-solid fa-clock-rotate-left mr-2"></i> Riwayat Shift
          </button>
          <button onClick={handleLogout} className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2 rounded-xl text-sm font-bold transition-all">
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Keluar
          </button>
        </div>
      </nav>

      {/* CORE WORKSPACE */}
      <div className="flex-1 p-6 max-w-[1600px] w-full mx-auto print:p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <i className="fa-solid fa-circle-notch fa-spin text-4xl text-apx-brand mb-2"></i>
            <p className="text-sm font-bold text-gray-500">Memuat modul kasir...</p>
          </div>
        ) : activeTab === 'pos' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
            {/* LEFT COLUMN: PRODUCT SELECTION (7 COLS) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input type="text" placeholder="Cari nama produk obat..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand font-medium" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${selectedCategory === cat ? 'bg-apx-brand text-apx-dark shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
                {filteredProducts.map(product => (
                  <div key={product.id} onClick={() => handleAddToCart(product)} className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-apx-brand transition-all shadow-sm cursor-pointer flex flex-col justify-between group">
                    <div className="space-y-2">
                      {product.image ? (
                        <img src={`${serverBaseUrl}${product.image}`} alt={product.name} className="w-full h-28 object-cover rounded-xl border border-gray-100" />
                      ) : (
                        <div className="w-full h-28 bg-gray-50 text-gray-300 rounded-xl flex items-center justify-center text-3xl border border-dashed"><i className="fa-solid fa-pills"></i></div>
                      )}
                      <div>
                        <h3 className="font-extrabold text-sm text-apx-dark group-hover:text-apx-brand transition-colors line-clamp-1">{product.name}</h3>
                        <p className="text-[11px] text-gray-400 font-bold">{product.unit}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                      <span className="font-extrabold text-xs text-slate-900">Rp{Number(product.price).toLocaleString('id-ID')}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold ${product.stock > 5 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>Stok: {product.stock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: POS CHECKOUT CART (5 COLS) */}
            <div className="lg:col-span-5">
              <form onSubmit={handleCheckout} className="bg-white rounded-3xl border border-gray-100 shadow-md p-6 flex flex-col max-h-[calc(100vh-140px)] sticky top-24">
                <h2 className="font-extrabold text-lg text-apx-dark mb-4 pb-2 border-b border-gray-100"><i className="fa-solid fa-basket-shopping text-apx-brand mr-2"></i>Item Penjualan</h2>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 min-h-[180px]">
                  {cart.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 font-medium text-sm space-y-2">
                      <i className="fa-solid fa-cart-flatbed text-3xl text-gray-200 block"></i>
                      <p>Belum ada produk yang dipilih</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="bg-gray-50 p-3 rounded-xl flex items-center justify-between border border-gray-100">
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="font-bold text-xs text-apx-dark truncate">{item.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">Rp{Number(item.price).toLocaleString('id-ID')} / {item.unit}</p>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <button type="button" onClick={() => handleUpdateQuantity(item.id, -1)} className="w-7 h-7 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold flex items-center justify-center transition-colors"><i className="fa-solid fa-minus"></i></button>
                          <span className="font-extrabold text-xs text-apx-dark w-6 text-center">{item.quantity}</span>
                          <button type="button" onClick={() => handleUpdateQuantity(item.id, 1)} className="w-7 h-7 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold flex items-center justify-center transition-colors"><i className="fa-solid fa-plus"></i></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <div>
                    <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1">Nama Pembeli (Opsional)</label>
                    <input type="text" placeholder="Pelanggan Umum" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white focus:border-apx-brand font-medium text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1">Metode Pembayaran</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setPaymentMethod('Cash')} className={`py-2.5 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-2 ${paymentMethod === 'Cash' ? 'bg-apx-dark text-white border-apx-dark shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                        <i className="fa-solid fa-money-bill-wave"></i> Tunai / Cash
                      </button>
                      <button type="button" onClick={() => setPaymentMethod('Cashless')} className={`py-2.5 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-2 ${paymentMethod === 'Cashless' ? 'bg-apx-dark text-white border-apx-dark shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                        <i className="fa-solid fa-credit-card"></i> Cashless / QRIS
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100 my-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Pembayaran</span>
                    <span className="font-extrabold text-xl text-apx-brand">Rp{calculateTotal().toLocaleString('id-ID')}</span>
                  </div>

                  <button type="submit" disabled={cart.length === 0} className="w-full bg-apx-brand hover:bg-opacity-90 text-apx-dark font-extrabold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <i className="fa-solid fa-print"></i> Selesaikan & Cetak Struk
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* TAB RIWAYAT TRANSAKSI SHIFT BERJALAN - HIDDEN ON PRINT */
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm print:hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-extrabold text-lg text-apx-dark">Riwayat Transaksi Shift Berjalan</h2>
                <p className="text-xs text-gray-400 font-medium">Menampilkan rekapan transaksi penjualan offline khusus hari ini.</p>
              </div>
              <button onClick={fetchData} className="bg-gray-50 hover:bg-gray-100 text-xs font-bold text-apx-dark px-4 py-2 rounded-xl border border-gray-200 transition-colors"><i className="fa-solid fa-rotate-right mr-1"></i> Segarkan</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-widest font-bold border-b border-gray-100">
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Pelanggan</th>
                    <th className="px-4 py-3">Metode Pembayaran</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total Transaksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-semibold text-apx-dark">
                  {shiftOrders.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-10 text-gray-400 font-medium">Belum ada transaksi pada shift hari ini.</td>
                    </tr>
                  ) : (
                    shiftOrders.map(order => (
                      <tr key={order.order_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4 font-extrabold text-xs text-slate-900">{order.order_id}</td>
                        <td className="px-4 py-4">{order.customer_name}</td>
                        <td className="px-4 py-4"><span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-bold">{order.payment_method || 'Cash'}</span></td>
                        <td className="px-4 py-4"><span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Lunas</span></td>
                        <td className="px-4 py-4 text-right font-extrabold text-apx-brand">Rp{Number(order.total_amount).toLocaleString('id-ID')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* STRUK PRINT LAYOUT - KHUSUS UNTUK THERMAL RECEIPT PRINTER (80MM) */}
      {receiptData && (
        <div className="hidden print:block p-4 w-[76mm] text-xs font-mono bg-white text-black mx-auto">
          <div className="text-center space-y-1 border-b border-dashed border-black pb-3">
            <h2 className="font-bold text-sm uppercase">APOTEK SIRESEP PUSAT</h2>
            <p className="text-[10px]">Jl. Raya Farmasi No. 10, Surabaya</p>
            <p className="text-[10px]">Telp: 0812-3456-7890</p>
          </div>
          
          <div className="py-3 space-y-1 text-[10px] border-b border-dashed border-black">
            <p>ID Transaksi : {receiptData.order_id}</p>
            <p>Tanggal      : {receiptData.date}</p>
            <p>Pelanggan    : {receiptData.customer_name}</p>
            <p>Kasir        : {receiptData.cashier_name}</p>
          </div>

          <div className="py-3 border-b border-dashed border-black space-y-2">
            {receiptData.items.map((item, idx) => (
              <div key={idx} className="flex flex-col text-[10px]">
                <div className="flex justify-between font-bold">
                  <span>{item.name}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>{item.quantity} x Rp{Number(item.price).toLocaleString('id-ID')}</span>
                  <span>Rp{(item.quantity * Number(item.price)).toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="py-3 text-[10px] space-y-1">
            <div className="flex justify-between font-bold text-xs">
              <span>TOTAL</span>
              <span>Rp{receiptData.total_price.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Metode Bayar</span>
              <span className="uppercase">{receiptData.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span>LUNAS</span>
            </div>
          </div>

          <div className="text-center pt-4 border-t border-dashed border-black mt-4 text-[9px] space-y-0.5">
            <p className="font-bold uppercase">Terima Kasih Atas Kunjungan Anda</p>
            <p>Semoga Sehat Selalu</p>
            <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cashier;