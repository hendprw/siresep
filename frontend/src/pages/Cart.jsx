import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// ==========================================
// KONFIGURASI LOKASI & TARIF APOTEK
// ==========================================
// Ganti koordinat ini dengan lokasi asli apotek Anda (Contoh: Surabaya Pusat)
const APOTEK_COORDS = { lat: -7.1677, lon: 112.7196 }; 
const TARIF_DASAR = 5000;  // Biaya dasar layanan/pickup
const TARIF_PER_KM = 2500; // Tarif tambahan per kilometer

// Helper: Rumus Haversine untuk menghitung jarak 2 titik koordinat bumi (dalam Km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius bumi dalam Km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Hasil dalam Km
};

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [deliveryType, setDeliveryType] = useState('Diantar');
  const [address, setAddress] = useState('');
  
  // State untuk GPS & Ongkir
  const [isLocating, setIsLocating] = useState(false);
  const [distanceKm, setDistanceKm] = useState(null); // Menyimpan jarak dalam Km
  
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();

  const userStr = localStorage.getItem('siresep_user');
  const user = userStr ? JSON.parse(userStr) : { name: 'Pelanggan Guest' };
  const serverBaseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

  useEffect(() => {
    const savedCart = localStorage.getItem('siresep_cart');
    if (savedCart && JSON.parse(savedCart).length > 0) {
      setCartItems(JSON.parse(savedCart));
    } else {
      setCartItems([]);
    }
  }, []);

  const updateCart = (newCart) => {
    setCartItems(newCart);
    localStorage.setItem('siresep_cart', JSON.stringify(newCart));
  };

  const handleQtyChange = (id, change) => {
    const updated = cartItems.map(item => {
      if (item.id === id) {
        const newQty = item.qty + change;
        return { ...item, qty: newQty > 0 ? newQty : 1 };
      }
      return item;
    });
    updateCart(updated);
  };

  const handleRemoveItem = (id) => {
    const updated = cartItems.filter(item => item.id !== id);
    updateCart(updated);
  };

  const handlePrescriptionUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPrescriptionFile(file);
      setPrescriptionPreview(URL.createObjectURL(file));
    }
  };

  // ==========================================
  // FITUR GEOLOKASI (GPS AUTO-PICK & HITUNG JARAK)
  // ==========================================
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung fitur deteksi lokasi.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        // 1. Hitung Jarak ke Apotek
        const calculatedDist = calculateDistance(APOTEK_COORDS.lat, APOTEK_COORDS.lon, lat, lon);
        setDistanceKm(calculatedDist); // Simpan state jarak

        // 2. Reverse Geocoding untuk mendapatkan teks Alamat
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
          const data = await response.json();
          
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress(`Titik Koordinat: ${lat}, ${lon}`);
          }
        } catch (error) {
          console.error("Gagal melakukan reverse geocoding:", error);
          setAddress(`Titik Koordinat GPS: ${lat}, ${lon} \n(Gagal memuat nama jalan)`);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Error geolokasi:", error);
        alert("Gagal mendapatkan lokasi. Pastikan izin akses lokasi aktif.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // ==========================================
  // KALKULASI HARGA DINAMIS
  // ==========================================
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  
  let serviceFee = 0;
  if (cartItems.length > 0) {
    if (deliveryType === 'Ambil Sendiri') {
      serviceFee = 2000; // Biaya platform/layanan dasar saja
    } else if (deliveryType === 'Diantar') {
      if (distanceKm !== null) {
        // Ongkir Dinamis: Tarif Dasar + (Pembulatan Jarak * Tarif per KM)
        serviceFee = TARIF_DASAR + (Math.ceil(distanceKm) * TARIF_PER_KM);
      } else {
        // Ongkir Flat/Default jika user ketik manual (tidak pakai GPS)
        serviceFee = 15000; 
      }
    }
  }

  const total = subtotal + serviceFee;

  // ==========================================
  // PROSES CHECKOUT
  // ==========================================
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert("Keranjang belanja Anda kosong!");
      return;
    }
    if (deliveryType === 'Diantar' && !address.trim()) {
      alert("Mohon isi alamat pengiriman Anda!");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('customer_name', user.name);
    // Tambahkan info jarak ke string alamat agar kurir tau
    const finalAddress = distanceKm ? `[Jarak: ${distanceKm.toFixed(1)} Km] ${address}` : address;
    formData.append('delivery_address', finalAddress);
    formData.append('delivery_type', deliveryType);
    formData.append('total_price', total);
    formData.append('items', JSON.stringify(cartItems));

    if (prescriptionFile) {
      formData.append('prescription', prescriptionFile);
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders`, {
        method: 'POST',
        body: formData
      });
      
      const result = await res.json();
      
      if (res.ok) {
        alert("Checkout Berhasil! Pesanan Anda sedang diteruskan ke Apoteker.");
        localStorage.removeItem('siresep_cart');
        setCartItems([]);
        navigate('/'); 
      } else {
        alert("Gagal melakukan checkout: " + result.message);
      }
    } catch (err) {
      console.error("Error Checkout:", err);
      alert("Terjadi kesalahan pada server saat memproses checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="text-apx-dark antialiased bg-[#F2F7F5] min-h-screen">
      <nav className="bg-white border-b border-gray-100 py-5 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <span className="font-extrabold text-xl tracking-tight text-apx-dark">Keranjang Belanja</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 tracking-widest uppercase">
            <span className="text-apx-dark">Keranjang</span>
            <i className="fa-solid fa-chevron-right text-[10px] mx-1"></i>
            <span>Bayar</span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Panel */}
          <div className="w-full lg:w-[65%] space-y-6">
            
            <div className="relative bg-white rounded-[2rem] p-8 border border-gray-100 overflow-hidden group shadow-sm">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-teal-50 rounded-full opacity-50 pointer-events-none"></div>
              
              <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-apx-brand flex items-center justify-center text-white text-3xl shadow-lg shadow-apx-brand/30 flex-shrink-0 overflow-hidden">
                  {prescriptionPreview ? (
                     <img src={prescriptionPreview} alt="Resep" className="w-full h-full object-cover" />
                  ) : (
                     <i className="fa-solid fa-file-prescription"></i>
                  )}
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h3 className="font-extrabold text-xl mb-1">Tebus Resep Dokter</h3>
                  <p className="text-sm font-medium text-gray-500 mb-4">Unggah foto resep, tim apoteker kami akan memvalidasi dan menyiapkan obatnya.</p>
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-apx-dark hover:bg-gray-800 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-md">
                    <i className="fa-solid fa-camera"></i> {prescriptionPreview ? 'Ubah Foto' : 'Unggah Foto'}
                    <input type="file" className="hidden" accept="image/*" onChange={handlePrescriptionUpload} />
                  </label>
                </div>
              </div>
            </div>

            {deliveryType === 'Diantar' && cartItems.length > 0 && (
              <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                  <h2 className="font-extrabold text-lg flex items-center gap-2">
                    <i className="fa-solid fa-map-location-dot text-apx-brand"></i> Alamat Pengiriman
                  </h2>
                  <button 
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="bg-teal-50 text-teal-600 hover:bg-teal-100 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLocating ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-location-crosshairs"></i>}
                    {isLocating ? 'Mendeteksi Lokasi...' : 'Gunakan GPS Saat Ini'}
                  </button>
                </div>
                
                <textarea 
                  rows="4" 
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if(distanceKm) setDistanceKm(null); // Reset jarak jika alamat diubah manual total
                  }}
                  placeholder="Gunakan tombol GPS di atas agar ongkos kirim lebih akurat, atau ketik alamat lengkap Anda secara manual..."
                  className="w-full bg-gray-50 border border-gray-200 text-apx-dark rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-apx-brand font-medium resize-none transition-all shadow-inner"
                ></textarea>

                {distanceKm !== null && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold border border-green-100">
                    <i className="fa-solid fa-route"></i> Jarak ke Apotek: {distanceKm.toFixed(1)} km
                  </div>
                )}
                <p className="text-[10px] text-gray-400 font-semibold mt-2"><i className="fa-solid fa-circle-info"></i> Pastikan alamat sudah benar dan lengkap agar kurir mudah menemukan lokasi Anda.</p>
              </div>
            )}

            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
              <h2 className="font-extrabold text-lg mb-6 flex items-center gap-2">
                Item Anda <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-md">{cartItems.length} Produk</span>
              </h2>
              
              <div className="space-y-6">
                {cartItems.length === 0 ? (
                  <div className="text-center py-10">
                    <i className="fa-solid fa-cart-arrow-down text-4xl text-gray-300 mb-3"></i>
                    <p className="text-gray-400 font-bold">Keranjang belanja Anda masih kosong.</p>
                  </div>
                ) : (
                  cartItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <div className="flex gap-5 items-center group">
                        <div className="w-24 h-24 rounded-2xl bg-gray-50 flex items-center justify-center text-4xl text-gray-300 border border-gray-100 flex-shrink-0 overflow-hidden">
                           {item.image ? (
                             <img src={`${serverBaseUrl}${item.image}`} alt={item.name} className="w-full h-full object-cover" />
                           ) : (
                             <i className={`fa-solid ${item.icon_class || 'fa-pills'}`}></i>
                           )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-apx-dark text-base mb-1">{item.name}</h3>
                          <p className="font-extrabold text-lg text-apx-dark">Rp{Number(item.price).toLocaleString('id-ID')}</p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <button onClick={() => handleRemoveItem(item.id)} className="text-gray-300 hover:text-rose-500 transition-colors">
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                          <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 p-1">
                            <button onClick={() => handleQtyChange(item.id, -1)} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-white font-bold transition-all">−</button>
                            <input type="text" value={item.qty} className="w-8 text-center bg-transparent font-extrabold text-sm focus:outline-none" readOnly />
                            <button onClick={() => handleQtyChange(item.id, 1)} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-white font-bold transition-all">+</button>
                          </div>
                        </div>
                      </div>
                      {index !== cartItems.length - 1 && <hr className="border-gray-100" />}
                    </React.Fragment>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Floating Summary */}
          <div className="w-full lg:w-[35%]">
            <div className="bg-apx-dark text-white rounded-[2rem] p-8 sticky top-28 shadow-2xl shadow-apx-dark/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl"></div>
              
              <h2 className="font-extrabold text-xl mb-6">Ringkasan</h2>
              
              {/* Delivery Option Toggle */}
              <div className="bg-white/10 p-1 rounded-2xl flex mb-6 backdrop-blur-sm relative z-10">
                <button 
                  onClick={() => setDeliveryType('Diantar')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${deliveryType === 'Diantar' ? 'bg-white text-apx-dark shadow-sm' : 'text-white hover:bg-white/5'}`}>
                  Diantar
                </button>
                <button 
                  onClick={() => setDeliveryType('Ambil Sendiri')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${deliveryType === 'Ambil Sendiri' ? 'bg-white text-apx-dark shadow-sm' : 'text-white hover:bg-white/5'}`}>
                  Ambil Sendiri
                </button>
              </div>

              <div className="space-y-4 text-sm font-medium text-gray-300 mb-6 border-b border-white/10 pb-6">
                <div className="flex justify-between">
                  <span>Subtotal ({cartItems.length} item)</span>
                  <span className="text-white font-bold">Rp{subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    {deliveryType === 'Diantar' ? 'Biaya Ongkir ' : 'Biaya Layanan'}
                    {deliveryType === 'Diantar' && distanceKm && <span className="text-[10px] bg-apx-brand text-apx-dark px-1.5 py-0.5 rounded ml-1 font-bold">Dinamis</span>}
                    {deliveryType === 'Diantar' && !distanceKm && <span className="text-[10px] bg-gray-500 text-white px-1.5 py-0.5 rounded ml-1">Flat Rate</span>}
                  </span>
                  <span className="text-white font-bold">Rp{serviceFee.toLocaleString('id-ID')}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-end mb-8 relative z-10">
                <span className="font-bold text-gray-300">Total Bayar</span>
                <span className="font-extrabold text-3xl tracking-tight text-white">Rp{total.toLocaleString('id-ID')}</span>
              </div>

              <button 
                onClick={handleCheckout} 
                disabled={isSubmitting || cartItems.length === 0}
                className="w-full bg-apx-brand hover:bg-white text-apx-dark disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-full font-extrabold text-lg shadow-[0_10px_20px_-10px_rgba(0,208,132,0.5)] transition-all flex items-center justify-center gap-2">
                {isSubmitting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Checkout'} <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;