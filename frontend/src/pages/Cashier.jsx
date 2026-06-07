import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ──────────────────────────────────────────────
// MODAL: Konfirmasi Pembayaran COD Pickup
// ──────────────────────────────────────────────
function CodPaymentModal({ order, onClose, onConfirm }) {
  const [amountPaid, setAmountPaid] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const total = Number(order.total_amount);
  const paid = Number(amountPaid) || 0;
  const change = paid - total;
  const isValid = paid >= total;

  const QUICK_AMOUNTS = [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000,
  ].filter((v, i, arr) => arr.indexOf(v) === i && v >= total).slice(0, 4);

  const handleConfirm = async () => {
    if (!isValid) return;
    setIsProcessing(true);
    await onConfirm(order.order_id || order.id, paid);
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-apx-dark p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-apx-brand/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <span className="text-[10px] bg-apx-brand/20 text-apx-brand px-3 py-1 rounded-full font-extrabold uppercase tracking-widest">
              COD Pickup
            </span>
            <h2 className="text-white font-extrabold text-xl mt-3">Terima Pembayaran</h2>
            <p className="text-gray-400 text-sm font-medium mt-1">{order.order_id || `APTX-${order.id}`} • {order.customer_name}</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center border border-gray-100">
            <span className="text-sm font-bold text-gray-500">Total Tagihan</span>
            <span className="font-extrabold text-2xl text-apx-dark">
              Rp{total.toLocaleString('id-ID')}
            </span>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">
              Uang yang Diterima (Rp)
            </label>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="Masukkan nominal..."
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand font-extrabold text-xl text-apx-dark transition-all"
            />
          </div>

          <div>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">Nominal Cepat</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setAmountPaid(String(amount))}
                  className={`py-2.5 rounded-xl text-xs font-extrabold border transition-all ${
                    Number(amountPaid) === amount
                      ? 'bg-apx-dark text-apx-brand border-apx-dark'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-apx-dark'
                  }`}
                >
                  Rp{amount.toLocaleString('id-ID')}
                </button>
              ))}
            </div>
          </div>

          <div className={`rounded-2xl p-4 transition-all ${
            paid === 0 ? 'bg-gray-50 border border-gray-100' :
            isValid ? 'bg-apx-brand/10 border-2 border-apx-brand/30' :
            'bg-rose-50 border-2 border-rose-200'
          }`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm font-bold ${isValid && paid > 0 ? 'text-teal-700' : 'text-gray-400'}`}>
                {paid === 0 ? 'Kembalian' : isValid ? '✓ Kembalian' : '✗ Kurang'}
              </span>
              <span className={`font-extrabold text-2xl ${
                paid === 0 ? 'text-gray-300' :
                isValid ? 'text-apx-dark' : 'text-rose-600'
              }`}>
                {paid === 0 ? 'Rp0' : isValid
                  ? `Rp${change.toLocaleString('id-ID')}`
                  : `Rp${Math.abs(change).toLocaleString('id-ID')} kurang`
                }
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-extrabold py-3.5 rounded-xl transition-all border border-gray-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isValid || isProcessing}
              className="flex-1 bg-apx-brand hover:bg-apx-brandDark text-apx-dark font-extrabold py-3.5 rounded-xl transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing
                ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Memproses...</>
                : <><i className="fa-solid fa-check-circle"></i> Konfirmasi Lunas</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// KOMPONEN UTAMA KASIR
// ──────────────────────────────────────────────
function Cashier() {
  const [activeTab, setActiveTab] = useState('pos');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [shiftOrders, setShiftOrders] = useState([]);
  const [codPending, setCodPending] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [codSearchTerm, setCodSearchTerm] = useState(''); 
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loading, setLoading] = useState(true);
  const [receiptData, setReceiptData] = useState(null);
  const [codModal, setCodModal] = useState(null); 
  const [cashPaid, setCashPaid] = useState(''); 

  const navigate = useNavigate();
  const userStr = localStorage.getItem('siresep_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const serverBaseUrl = baseUrl.replace('/api', '');
  const categories = ['Semua', 'Obat Bebas', 'Obat Keras', 'Suplemen & Vitamin', 'Alat Kesehatan', 'Perawatan Tubuh'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, shiftRes, codRes] = await Promise.all([
        fetch(`${baseUrl}/products`),
        fetch(`${baseUrl}/cashier/shift-orders`),
        fetch(`${baseUrl}/cashier/cod-pending`),
      ]);
      const [prodData, shiftData, codData] = await Promise.all([
        prodRes.json(), shiftRes.json(), codRes.json()
      ]);

      if (prodData.status === 'success') setProducts(prodData.data);
      if (shiftData.status === 'success') setShiftOrders(shiftData.data);
      if (codData.status === 'success') setCodPending(codData.data);
    } catch (error) {
      console.error('Gagal mengambil data kasir:', error);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    if (!user || (user.role !== 'kasir' && user.role !== 'admin')) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user?.id, user?.role, navigate, fetchData]);

  const handleAddToCart = (product) => {
    if (product.stock <= 0) { alert('Stok produk habis!'); return; }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) { alert('Tidak bisa melebihi stok yang tersedia!'); return; }
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
      if (newQty > existing.stock) { alert('Stok tidak mencukupi!'); return; }
      setCart(cart.map(item => item.id === productId ? { ...item, quantity: newQty } : item));
    }
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) { alert('Keranjang belanja kosong!'); return; }

    const totalPrice = calculateTotal();
    const paidAmount = Number(cashPaid);

    if (paymentMethod === 'Cash' && paidAmount < totalPrice) {
      alert(`Uang yang diterima kurang! Total: Rp${totalPrice.toLocaleString('id-ID')}`);
      return;
    }

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
        const change = paymentMethod === 'Cash' ? paidAmount - totalPrice : 0;
        setReceiptData({
          order_id: result.data.order_id,
          customer_name: orderPayload.customer_name,
          payment_method: orderPayload.payment_method,
          total_price: totalPrice,
          amount_paid: paidAmount,
          change: change,
          items: cart,
          cashier_name: user.name,
          date: new Date().toLocaleString('id-ID')
        });
        setCart([]);
        setCustomerName('');
        setCashPaid('');
        fetchData();
      } else {
        alert('Gagal memproses transaksi.');
      }
    } catch (error) {
      alert('Terjadi kesalahan koneksi sistem.');
    }
  };

  const handleCodConfirm = async (orderId, amountPaid) => {
    try {
      const res = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}/pay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid_by: 'kasir', amount_paid: amountPaid })
      });
      const result = await res.json();
      if (result.status === 'success') {
        setCodModal(null);
        alert(`✅ Pembayaran COD untuk ${orderId} berhasil dikonfirmasi!`);
        fetchData();
      } else {
        alert('Gagal mengkonfirmasi: ' + result.message);
      }
    } catch {
      alert('Kesalahan koneksi saat konfirmasi pembayaran.');
    }
  };

  useEffect(() => {
    if (receiptData) {
      setTimeout(() => { window.print(); setReceiptData(null); }, 500);
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

  // LOGIKA PENCARIAN PINTAR YANG DIPERBAIKI (Toleransi Prefix APTX-)
  const filteredCodPending = codPending.filter(order => {
    const search = codSearchTerm.toLowerCase().trim();
    
    // Ambil ID murni dari database (misal: '6135')
    const dbId = String(order.order_id || order.id).toLowerCase();
    
    // Buat bentuk alternatif yang memiliki prefix (misal: 'aptx-6135')
    const formattedId = dbId.startsWith('aptx-') ? dbId : `aptx-${dbId}`;
    
    // Cocokkan jika kata kunci mengandung bagian dari dbId ATAU formattedId
    const orderIdMatch = dbId.includes(search) || formattedId.includes(search);
    const nameMatch = (order.customer_name || '').toLowerCase().includes(search);
    
    return orderIdMatch || nameMatch;
  });

  const posTotal = calculateTotal();
  const posChange = paymentMethod === 'Cash' && Number(cashPaid) >= posTotal
    ? Number(cashPaid) - posTotal : 0;
  const posIsValid = paymentMethod !== 'Cash' || Number(cashPaid) >= posTotal;

  return (
    <div className="text-slate-800 antialiased bg-[#F4F7F6] min-h-screen flex flex-col print:bg-white print:text-black">

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

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button onClick={() => setActiveTab('pos')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'pos' ? 'bg-apx-dark text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            <i className="fa-solid fa-grip mr-2"></i>Mesin POS
          </button>

          <button onClick={() => setActiveTab('cod')}
            className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'cod' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            <i className="fa-solid fa-hand-holding-dollar mr-2"></i>Tagihan COD
            {codPending.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center ring-2 ring-white">
                {codPending.length}
              </span>
            )}
          </button>

          <button onClick={() => setActiveTab('shift')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'shift' ? 'bg-apx-dark text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            <i className="fa-solid fa-clock-rotate-left mr-2"></i>Riwayat Shift
          </button>

          <button onClick={handleLogout} className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2 rounded-xl text-sm font-bold transition-all">
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
          </button>
        </div>
      </nav>

      <div className="flex-1 p-6 max-w-[1600px] w-full mx-auto print:p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <i className="fa-solid fa-circle-notch fa-spin text-4xl text-apx-brand mb-2"></i>
            <p className="text-sm font-bold text-gray-500">Memuat modul kasir...</p>
          </div>
        ) : activeTab === 'pos' ? (

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input type="text" placeholder="Cari nama produk obat..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand font-medium" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${selectedCategory === cat ? 'bg-apx-brand text-apx-dark shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
                {filteredProducts.map(product => (
                  <div key={product.id} onClick={() => handleAddToCart(product)}
                    className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-apx-brand transition-all shadow-sm cursor-pointer flex flex-col justify-between group">
                    <div className="space-y-2">
                      {product.image
                        ? <img src={`${serverBaseUrl}${product.image}`} alt={product.name} className="w-full h-28 object-cover rounded-xl border border-gray-100" />
                        : <div className="w-full h-28 bg-gray-50 text-gray-300 rounded-xl flex items-center justify-center text-3xl border border-dashed"><i className="fa-solid fa-pills"></i></div>
                      }
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

            <div className="lg:col-span-5">
              <form onSubmit={handleCheckout} className="bg-white rounded-3xl border border-gray-100 shadow-md p-6 flex flex-col max-h-[calc(100vh-140px)] sticky top-24">
                <h2 className="font-extrabold text-lg text-apx-dark mb-4 pb-2 border-b border-gray-100">
                  <i className="fa-solid fa-basket-shopping text-apx-brand mr-2"></i>Item Penjualan
                </h2>

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
                          <button type="button" onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="w-7 h-7 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold flex items-center justify-center">
                            <i className="fa-solid fa-minus"></i>
                          </button>
                          <span className="font-extrabold text-xs text-apx-dark w-6 text-center">{item.quantity}</span>
                          <button type="button" onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="w-7 h-7 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold flex items-center justify-center">
                            <i className="fa-solid fa-plus"></i>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <div>
                    <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1">Nama Pembeli (Opsional)</label>
                    <input type="text" placeholder="Pelanggan Umum" value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white focus:border-apx-brand font-medium text-sm" />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1">Metode Pembayaran</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setPaymentMethod('Cash')}
                        className={`py-2.5 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-2 ${paymentMethod === 'Cash' ? 'bg-apx-dark text-white border-apx-dark shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                        <i className="fa-solid fa-money-bill-wave"></i> Tunai / Cash
                      </button>
                      <button type="button" onClick={() => setPaymentMethod('Cashless')}
                        className={`py-2.5 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-2 ${paymentMethod === 'Cashless' ? 'bg-apx-dark text-white border-apx-dark shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                        <i className="fa-solid fa-credit-card"></i> Cashless / QRIS
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'Cash' && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1">Uang Diterima (Rp)</label>
                        <input type="number" placeholder="0"
                          value={cashPaid} onChange={(e) => setCashPaid(e.target.value)}
                          className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white focus:border-apx-brand font-extrabold text-base transition-all" />
                      </div>
                      {posTotal > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {[posTotal, Math.ceil(posTotal / 10000) * 10000, Math.ceil(posTotal / 50000) * 50000].filter((v, i, a) => a.indexOf(v) === i).map(amt => (
                            <button key={amt} type="button" onClick={() => setCashPaid(String(amt))}
                              className={`text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg border transition-all ${Number(cashPaid) === amt ? 'bg-apx-dark text-apx-brand border-apx-dark' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                              Rp{amt.toLocaleString('id-ID')}
                            </button>
                          ))}
                        </div>
                      )}
                      {Number(cashPaid) > 0 && (
                        <div className={`rounded-xl p-3 flex justify-between items-center text-sm font-extrabold border ${posIsValid ? 'bg-apx-brand/10 border-apx-brand/30 text-apx-dark' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                          <span>{posIsValid ? '✓ Kembalian' : '✗ Kurang'}</span>
                          <span>{posIsValid ? `Rp${posChange.toLocaleString('id-ID')}` : `Rp${(posTotal - Number(cashPaid)).toLocaleString('id-ID')}`}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100 my-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Pembayaran</span>
                    <span className="font-extrabold text-xl text-apx-brand">Rp{posTotal.toLocaleString('id-ID')}</span>
                  </div>

                  <button type="submit" disabled={cart.length === 0 || !posIsValid}
                    className="w-full bg-apx-brand hover:bg-opacity-90 text-apx-dark font-extrabold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <i className="fa-solid fa-print"></i> Selesaikan & Cetak Struk
                  </button>
                </div>
              </form>
            </div>
          </div>

        ) : activeTab === 'cod' ? (

          <div className="print:hidden space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 text-xl shrink-0">
                  <i className="fa-solid fa-hand-holding-dollar"></i>
                </div>
                <div>
                  <h2 className="font-extrabold text-orange-800 text-base">Tagihan COD Menunggu Pembayaran</h2>
                  <p className="text-sm text-orange-600 font-medium mt-0.5">
                    Gunakan pencarian untuk memindai Order ID (Barcode) dari aplikasi pelanggan.
                  </p>
                </div>
              </div>
              
              <div className="w-full md:w-80 relative">
                <i className="fa-solid fa-barcode absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input 
                  type="text" 
                  placeholder="Scan Barcode / Ketik Order ID..."
                  value={codSearchTerm}
                  onChange={(e) => setCodSearchTerm(e.target.value)}
                  className="w-full bg-white border border-orange-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 font-extrabold text-sm shadow-sm"
                  autoFocus 
                />
              </div>
            </div>

            {filteredCodPending.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-circle-check text-3xl text-green-400"></i>
                </div>
                <h3 className="font-extrabold text-lg mb-1 text-apx-dark">
                  {codSearchTerm ? 'Pesanan Tidak Ditemukan' : 'Semua Tagihan Lunas!'}
                </h3>
                <p className="text-sm text-gray-400 font-medium">
                  {codSearchTerm ? 'Pastikan Order ID atau Barcode yang dipindai sudah benar.' : 'Tidak ada pesanan COD yang menunggu pembayaran saat ini.'}
                </p>
                {!codSearchTerm && (
                  <button onClick={fetchData} className="mt-4 bg-gray-50 hover:bg-gray-100 px-5 py-2 rounded-xl text-sm font-bold border border-gray-200 text-gray-600">
                    <i className="fa-solid fa-rotate-right mr-1"></i> Refresh
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCodPending.map(order => {
                  let parsedItems = [];
                  try { parsedItems = JSON.parse(order.items || '[]'); } catch { parsedItems = []; }
                  const isPickupOrder = order.delivery_type === 'Pickup' || (order.delivery_address || '').toLowerCase().includes('ambil');

                  // Gunakan order.order_id jika ada, jika tidak format ID numeriknya dengan APTX-
                  const displayOrderId = order.order_id || `APTX-${order.id}`;

                  return (
                    <div key={order.order_id || order.id}
                      className={`bg-white rounded-3xl p-5 border-2 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md ${isPickupOrder ? 'border-orange-100 hover:border-orange-300' : 'border-blue-100 hover:border-blue-300'}`}>

                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest ${isPickupOrder ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                            <i className={`fa-solid ${isPickupOrder ? 'fa-store' : 'fa-motorcycle'} mr-1`}></i>
                            {isPickupOrder ? 'Pickup' : 'COD Delivery'}
                          </span>
                          <h3 className="font-extrabold text-apx-dark text-base mt-2">{order.customer_name}</h3>
                          <p className="text-xs text-gray-400 font-bold bg-gray-50 inline-block px-2 py-0.5 rounded mt-1 border border-gray-100">
                            {displayOrderId}
                          </p>
                        </div>
                        <span className="font-extrabold text-lg text-apx-dark">
                          Rp{Number(order.total_amount).toLocaleString('id-ID')}
                        </span>
                      </div>

                      {parsedItems.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                          {parsedItems.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs font-medium text-gray-600">
                              <span className="truncate max-w-[180px]">{item.qty || item.quantity}x {item.name}</span>
                              <span className="shrink-0 font-bold">Rp{Number(item.price).toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                          {parsedItems.length > 3 && (
                            <p className="text-[10px] text-apx-brand font-bold">+{parsedItems.length - 3} produk lainnya</p>
                          )}
                        </div>
                      )}

                      <div className="mt-auto">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold text-gray-400">Status Pesanan:</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            order.status === 'Pesanan Tiba' ? 'bg-green-100 text-green-700' :
                            order.status === 'Kurir Menuju Lokasi' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        {isPickupOrder ? (
                          <button
                            onClick={() => setCodModal(order)}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                            <i className="fa-solid fa-hand-holding-dollar"></i> Terima Pembayaran
                          </button>
                        ) : (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                            <p className="text-xs font-bold text-blue-600">
                              <i className="fa-solid fa-motorcycle mr-1"></i>
                              Menunggu kurir konfirmasi pembayaran
                            </p>
                            <p className="text-[10px] text-blue-400 font-medium mt-1">Kurir akan menandai lunas saat menerima uang di rumah customer</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        ) : (

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm print:hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-extrabold text-lg text-apx-dark">Riwayat Transaksi Shift Berjalan</h2>
                <p className="text-xs text-gray-400 font-medium">Rekapan transaksi penjualan offline khusus hari ini.</p>
              </div>
              <button onClick={fetchData} className="bg-gray-50 hover:bg-gray-100 text-xs font-bold text-apx-dark px-4 py-2 rounded-xl border border-gray-200 transition-colors">
                <i className="fa-solid fa-rotate-right mr-1"></i> Segarkan
              </button>
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
                      <tr key={order.order_id || order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4 font-extrabold text-xs text-slate-900">{order.order_id || `APTX-${order.id}`}</td>
                        <td className="px-4 py-4">{order.customer_name}</td>
                        <td className="px-4 py-4">
                          <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-bold">{order.payment_method || 'Cash'}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Lunas</span>
                        </td>
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

      {codModal && (
        <CodPaymentModal
          order={codModal}
          onClose={() => setCodModal(null)}
          onConfirm={handleCodConfirm}
        />
      )}

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
            {receiptData.payment_method === 'Cash' && (
              <>
                <div className="flex justify-between">
                  <span>Uang Diterima</span>
                  <span>Rp{Number(receiptData.amount_paid).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Kembalian</span>
                  <span>Rp{Number(receiptData.change).toLocaleString('id-ID')}</span>
                </div>
              </>
            )}
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