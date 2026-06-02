import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const APOTEK_COORDS = { lat: -7.1677, lon: 112.7196 }; 
const TARIF_DASAR = 5000;  
const TARIF_PER_KM = 2500; 

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

function LocationMarker({ position, setPosition, setAddress, setDistanceKm }) {
  const map = useMapEvents({ click(e) { updateLocation(e.latlng.lat, e.latlng.lng, map); } });
  const updateLocation = async (lat, lng, mapInstance) => {
    setPosition([lat, lng]);
    mapInstance.flyTo([lat, lng], mapInstance.getZoom());
    setDistanceKm(calculateDistance(APOTEK_COORDS.lat, APOTEK_COORDS.lon, lat, lng));
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) setAddress(data.display_name);
    } catch (error) { console.error("Geocoding Error:", error); }
  };
  return position === null ? null : (
    <Marker position={position} icon={customMarkerIcon} draggable={true} eventHandlers={{ dragend: (e) => { const { lat, lng } = e.target.getLatLng(); updateLocation(lat, lng, map); } }} />
  );
}

function MapFlyTo({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, 16); }, [position, map]);
  return null;
}

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [deliveryType, setDeliveryType] = useState('Diantar');
  const [paymentMethod, setPaymentMethod] = useState('QRIS'); 
  const [address, setAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [distanceKm, setDistanceKm] = useState(null); 
  const [mapPosition, setMapPosition] = useState([APOTEK_COORDS.lat, APOTEK_COORDS.lon]); 
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const userStr = localStorage.getItem('siresep_user');
  const user = userStr ? JSON.parse(userStr) : { name: 'Pelanggan Guest', id: null };
  const serverBaseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

  useEffect(() => {
    const savedCart = localStorage.getItem('siresep_cart');
    if (savedCart && JSON.parse(savedCart).length > 0) setCartItems(JSON.parse(savedCart));
  }, []);

  const updateCart = (newCart) => {
    setCartItems(newCart);
    localStorage.setItem('siresep_cart', JSON.stringify(newCart));
  };

  const handleQtyChange = (id, change) => {
    updateCart(cartItems.map(item => {
      if (item.id === id) {
        const newQty = item.qty + change;
        return { ...item, qty: newQty > 0 ? newQty : 1 };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id) => updateCart(cartItems.filter(item => item.id !== id));

  const handlePrescriptionUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPrescriptionFile(file);
      setPrescriptionPreview(URL.createObjectURL(file));
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert("Browser tidak mendukung GPS.");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setMapPosition([lat, lon]);
        setDistanceKm(calculateDistance(APOTEK_COORDS.lat, APOTEK_COORDS.lon, lat, lon)); 
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data && data.display_name) setAddress(data.display_name);
        } catch (error) { setAddress(`Titik Koordinat: ${lat}, ${lon}`); } 
        finally { setIsLocating(false); }
      },
      (error) => { alert("Gagal mendapatkan lokasi. Pastikan izin GPS aktif."); setIsLocating(false); },
      { enableHighAccuracy: true }
    );
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  let serviceFee = 0;
  if (cartItems.length > 0) {
    if (deliveryType === 'Ambil Sendiri') serviceFee = 2000; 
    else if (deliveryType === 'Diantar') serviceFee = distanceKm !== null ? TARIF_DASAR + (Math.ceil(distanceKm) * TARIF_PER_KM) : 15000; 
  }
  const total = subtotal + serviceFee;

  // CEK APAKAH ADA OBAT KERAS (RESEP DOKTER) DI KERANJANG
  const needsPrescription = cartItems.some(item => item.requires_prescription === true || item.requires_prescription === 'true');

  const handleCheckout = async () => {
    if (cartItems.length === 0) return alert("Keranjang belanja Anda kosong!");
    if (deliveryType === 'Diantar' && !address.trim()) return alert("Mohon pilih alamat di peta!");
    
    // VALIDASI WAJIB UPLOAD RESEP
    if (needsPrescription && !prescriptionFile) {
      return alert("PERINGATAN: Keranjang Anda berisi Obat Keras. Anda wajib mengunggah foto resep dokter yang valid sebelum checkout!");
    }

    setIsSubmitting(true);
    const formData = new FormData();
    if (user.id) formData.append('user_id', user.id);
    formData.append('customer_name', user.name);
    
    let finalAddress = deliveryType === 'Diantar' && distanceKm !== null 
      ? `[Maps: ${mapPosition[0].toFixed(5)}, ${mapPosition[1].toFixed(5)}] [Jarak: ${distanceKm.toFixed(1)} Km] ${address} | Pembayaran: ${paymentMethod}` 
      : `Ambil di Tempat | Pembayaran: ${paymentMethod}`;
    
    formData.append('delivery_address', finalAddress);
    formData.append('delivery_type', deliveryType);
    formData.append('total_price', total);
    formData.append('items', JSON.stringify(cartItems));
    if (prescriptionFile) formData.append('prescription', prescriptionFile);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders`, { method: 'POST', body: formData });
      const result = await res.json();
      if (res.ok && result.status === 'success') {
        alert("Checkout Berhasil! Pesanan Anda telah tercatat.");
        localStorage.removeItem('siresep_cart');
        setCartItems([]);
        navigate('/track', { state: { orderId: result.data.order_id } });
      } else alert("Gagal checkout: " + result.message);
    } catch (err) { alert("Terjadi kesalahan koneksi server."); } 
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="text-apx-dark antialiased bg-[#F8FAFC] min-h-screen pb-20">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4 text-apx-dark hover:text-apx-brand transition-colors font-extrabold text-xl">
            <i className="fa-solid fa-arrow-left bg-gray-50 p-2 rounded-full text-sm"></i> Keranjang Belanja
          </Link>
          <div className="hidden sm:flex items-center gap-3 text-xs font-bold text-gray-400 tracking-widest uppercase">
            <span className="text-apx-brand"><i className="fa-solid fa-1"></i> Keranjang</span><i className="fa-solid fa-chevron-right text-[10px]"></i>
            <span className="text-apx-brand"><i className="fa-solid fa-2"></i> Pengiriman</span><i className="fa-solid fa-chevron-right text-[10px]"></i>
            <span><i className="fa-solid fa-3"></i> Pembayaran</span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {cartItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100 max-w-2xl mx-auto mt-10">
            <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6"><i className="fa-solid fa-cart-arrow-down text-5xl text-gray-300"></i></div>
            <h2 className="text-2xl font-extrabold text-apx-dark mb-2">Keranjang Anda Kosong</h2>
            <Link to="/" className="bg-apx-brand hover:bg-apx-brandDark text-apx-dark font-bold py-3 px-8 rounded-full transition-all inline-block mt-4">Mulai Belanja</Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-[65%] space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                <h2 className="font-extrabold text-lg mb-6 border-b border-gray-100 pb-4"><i className="fa-solid fa-box text-apx-brand mr-2"></i> Daftar Produk</h2>
                <div className="space-y-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 sm:gap-6 items-center">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gray-50 flex items-center justify-center text-4xl text-gray-300 border border-gray-100 overflow-hidden shrink-0 relative">
                         {item.image ? <img src={`${serverBaseUrl}${item.image}`} alt={item.name} className="w-full h-full object-cover" /> : <i className={`fa-solid ${item.icon_class || 'fa-pills'}`}></i>}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-apx-dark text-sm sm:text-base leading-tight mb-1">
                          {item.name}
                          {(item.requires_prescription === true || item.requires_prescription === 'true') && (
                             <span className="block w-fit mt-1 text-[9px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md font-extrabold border border-rose-200 uppercase tracking-widest"><i className="fa-solid fa-prescription"></i> Wajib Resep</span>
                          )}
                        </h3>
                        <p className="font-extrabold text-base sm:text-lg text-apx-brand">Rp{Number(item.price).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <button onClick={() => handleRemoveItem(item.id)} className="text-gray-300 hover:text-rose-500 transition-colors bg-white w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center shadow-sm"><i className="fa-solid fa-trash-can text-sm"></i></button>
                        <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 p-1">
                          <button onClick={() => handleQtyChange(item.id, -1)} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-white font-bold transition-all shadow-sm">−</button>
                          <input type="text" value={item.qty} className="w-8 text-center bg-transparent font-extrabold text-sm focus:outline-none" readOnly />
                          <button onClick={() => handleQtyChange(item.id, 1)} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-white font-bold transition-all shadow-sm">+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RENDER KONDISIONAL UNGGAH RESEP */}
              {needsPrescription && (
                <div className="bg-rose-50 rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-sm relative overflow-hidden ring-4 ring-rose-50 animate-pulse-slow">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-rose-100 rounded-bl-full opacity-50 pointer-events-none"></div>
                  <h2 className="font-extrabold text-lg mb-2 text-rose-800">
                    <i className="fa-solid fa-file-prescription mr-2"></i> Peringatan Obat Keras
                  </h2>
                  <p className="text-sm font-medium text-rose-600 mb-6">Keranjang Anda mengandung obat yang <strong>Wajib menggunakan Resep Dokter</strong>. Silakan unggah foto resep asli Anda di bawah ini agar pesanan dapat divalidasi oleh Apoteker.</p>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {prescriptionPreview ? (
                      <div className="relative w-full sm:w-32 h-32 rounded-2xl border-2 border-rose-600 overflow-hidden group">
                        <img src={prescriptionPreview} alt="Resep" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <label className="cursor-pointer text-white font-bold text-sm bg-rose-600 px-3 py-1 rounded-full"><i className="fa-solid fa-pen"></i> Ubah<input type="file" className="hidden" accept="image/*" onChange={handlePrescriptionUpload} /></label>
                        </div>
                      </div>
                    ) : (
                      <label className="w-full h-24 border-2 border-dashed border-rose-300 hover:border-rose-500 bg-white rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors group">
                        <i className="fa-solid fa-cloud-arrow-up text-2xl text-rose-400 group-hover:text-rose-600 mb-1 transition-colors"></i>
                        <span className="text-sm font-bold text-rose-500 group-hover:text-rose-700">Klik untuk unggah foto resep wajib</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handlePrescriptionUpload} />
                      </label>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                <h2 className="font-extrabold text-lg mb-4"><i className="fa-solid fa-truck-fast text-apx-brand mr-2"></i> Metode Pengambilan</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div onClick={() => setDeliveryType('Diantar')} className={`cursor-pointer rounded-2xl border-2 p-4 flex items-start gap-4 transition-all ${deliveryType === 'Diantar' ? 'border-apx-brand bg-teal-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 shrink-0 ${deliveryType === 'Diantar' ? 'border-apx-brand' : 'border-gray-300'}`}>
                      {deliveryType === 'Diantar' && <div className="w-3 h-3 bg-apx-brand rounded-full"></div>}
                    </div>
                    <div>
                      <h4 className="font-bold text-apx-dark mb-1">Diantar Kurir</h4>
                      <p className="text-xs font-medium text-gray-500">Obat diantar langsung ke rumah Anda dengan aman.</p>
                    </div>
                  </div>
                  <div onClick={() => setDeliveryType('Ambil Sendiri')} className={`cursor-pointer rounded-2xl border-2 p-4 flex items-start gap-4 transition-all ${deliveryType === 'Ambil Sendiri' ? 'border-apx-brand bg-teal-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 shrink-0 ${deliveryType === 'Ambil Sendiri' ? 'border-apx-brand' : 'border-gray-300'}`}>
                      {deliveryType === 'Ambil Sendiri' && <div className="w-3 h-3 bg-apx-brand rounded-full"></div>}
                    </div>
                    <div>
                      <h4 className="font-bold text-apx-dark mb-1">Ambil Mandiri (Pickup)</h4>
                      <p className="text-xs font-medium text-gray-500">Ambil pesanan Anda langsung di kasir Apotek Siresep.</p>
                    </div>
                  </div>
                </div>

                {deliveryType === 'Diantar' && (
                  <div className="animate-fade-in border-t border-gray-100 pt-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-apx-dark">Pilih Lokasi Tujuan</h3>
                      <button onClick={handleGetLocation} disabled={isLocating} className="text-xs font-bold text-apx-brand bg-teal-50 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors">
                        {isLocating ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-location-crosshairs"></i>} Gunakan GPS
                      </button>
                    </div>
                    <div className="h-[250px] w-full rounded-2xl overflow-hidden border-2 border-gray-100 mb-3 relative z-0">
                      <MapContainer center={mapPosition} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationMarker position={mapPosition} setPosition={setMapPosition} setAddress={setAddress} setDistanceKm={setDistanceKm} />
                        <MapFlyTo position={mapPosition} />
                      </MapContainer>
                    </div>
                    <textarea rows="2" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Geser pin peta atau tuliskan alamat detail rumah Anda..." className="w-full bg-gray-50 border border-gray-200 text-apx-dark rounded-xl px-4 py-3 focus:outline-none focus:border-apx-brand text-sm font-medium resize-none transition-all"></textarea>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                <h2 className="font-extrabold text-lg mb-4 border-b border-gray-100 pb-4"><i className="fa-solid fa-wallet text-apx-brand mr-2"></i> Metode Pembayaran</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div onClick={() => setPaymentMethod('QRIS')} className={`cursor-pointer rounded-2xl border-2 p-4 text-center transition-all ${paymentMethod === 'QRIS' ? 'border-apx-brand bg-teal-50/30 shadow-md' : 'border-gray-100 hover:border-gray-200'}`}>
                    <i className="fa-solid fa-qrcode text-3xl mb-2 text-apx-dark"></i><h4 className="font-extrabold text-apx-dark text-sm">QRIS</h4><p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Gopay, OVO, Dana</p>
                  </div>
                  <div onClick={() => setPaymentMethod('Transfer Bank')} className={`cursor-pointer rounded-2xl border-2 p-4 text-center transition-all ${paymentMethod === 'Transfer Bank' ? 'border-apx-brand bg-teal-50/30 shadow-md' : 'border-gray-100 hover:border-gray-200'}`}>
                    <i className="fa-solid fa-building-columns text-3xl mb-2 text-apx-dark"></i><h4 className="font-extrabold text-apx-dark text-sm">Virtual Account</h4><p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">BCA, Mandiri, BNI</p>
                  </div>
                  <div onClick={() => setPaymentMethod('COD')} className={`cursor-pointer rounded-2xl border-2 p-4 text-center transition-all ${paymentMethod === 'COD' ? 'border-apx-brand bg-teal-50/30 shadow-md' : 'border-gray-100 hover:border-gray-200'}`}>
                    <i className="fa-solid fa-hand-holding-dollar text-3xl mb-2 text-apx-dark"></i><h4 className="font-extrabold text-apx-dark text-sm">Bayar di Tempat</h4><p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Cash On Delivery</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[35%]">
              <div className="bg-apx-dark text-white rounded-3xl p-6 sm:p-8 sticky top-28 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-apx-brand/20 to-teal-400/0 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none"></div>
                <h2 className="font-extrabold text-xl mb-6 flex items-center gap-2"><i className="fa-solid fa-receipt text-apx-brand"></i> Ringkasan Belanja</h2>
                <div className="space-y-4 text-sm font-medium text-gray-300 mb-6 border-b border-white/10 pb-6 relative z-10">
                  <div className="flex justify-between items-center"><span>Total Harga ({cartItems.length} item)</span><span className="text-white font-bold">Rp{subtotal.toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between items-center"><span>{deliveryType === 'Diantar' ? 'Ongkos Kirim' : 'Biaya Layanan'}</span><span className="text-white font-bold">Rp{serviceFee.toLocaleString('id-ID')}</span></div>
                </div>
                <div className="flex justify-between items-end mb-8 relative z-10"><span className="font-bold text-gray-300">Total Tagihan</span><span className="font-extrabold text-3xl tracking-tight text-apx-brand">Rp{total.toLocaleString('id-ID')}</span></div>
                <button onClick={handleCheckout} disabled={isSubmitting || cartItems.length === 0} className="w-full bg-apx-brand hover:bg-white text-apx-dark disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-2xl font-extrabold text-lg transition-all flex items-center justify-center gap-2 relative z-10">
                  {isSubmitting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <>Bayar Pakai {paymentMethod} <i className="fa-solid fa-arrow-right"></i></>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;