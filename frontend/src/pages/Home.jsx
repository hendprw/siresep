import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]); 
  const navigate = useNavigate();

  const userStr = localStorage.getItem('siresep_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const serverBaseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products`);
        const result = await response.json();
        if (result.status === 'success') {
          setProducts(result.data);
        }
      } catch (error) {
        console.error('Gagal mengambil data produk:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    const savedCart = localStorage.getItem('siresep_cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const handleAddToCart = (product) => {
    const savedCart = localStorage.getItem('siresep_cart');
    let currentCart = savedCart ? JSON.parse(savedCart) : [];

    const existingItemIndex = currentCart.findIndex(item => item.id === product.id);

    if (existingItemIndex > -1) {
      currentCart[existingItemIndex].qty += 1;
    } else {
      currentCart.push({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        qty: 1,
        unit: product.unit,
        icon_class: product.icon_class || 'fa-pills',
        image: product.image
      });
    }

    localStorage.setItem('siresep_cart', JSON.stringify(currentCart));
    setCartItems(currentCart);
    
    alert(`Berhasil menambahkan ${product.name} ke keranjang!`);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  const handleLogout = () => {
    localStorage.removeItem('siresep_token');
    localStorage.removeItem('siresep_user');
    navigate('/login');
  };

  return (
    <div className="text-apx-dark antialiased relative min-h-screen gradient-bg">
      {/* Floating Glass Navbar */}
      <div className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pointer-events-none">
        <nav className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-glass rounded-full px-6 py-3 flex items-center justify-between pointer-events-auto transition-all duration-300">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-apx-dark text-apx-brand w-10 h-10 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-md">
              <i className="fa-solid fa-notes-medical text-xl"></i>
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-apx-dark">Siresep.</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 font-semibold text-apx-text text-sm">
            <a href="#" className="hover:text-apx-dark transition-colors">Obat & Vitamin</a>
            <a href="#" className="hover:text-apx-dark transition-colors">Konsultasi</a>
            <a href="#" className="hover:text-apx-dark transition-colors">Promo</a>
          </div>

          <div className="flex items-center gap-4">
            {/* LOGIKA 1: Tombol Keranjang Hanya Muncul Jika Belum Login atau Rolenya Customer */}
            {(!user || user.role === 'customer') && (
              <Link to="/cart" className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 border border-gray-100 shadow-sm transition-colors text-apx-dark">
                <i className="fa-solid fa-bag-shopping"></i>
                {/* PERBAIKAN BADGE: Menggunakan totalCartCount dinamis, hanya muncul jika > 0 */}
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-white animate-bounce">
                    {totalCartCount}
                  </span>
                )}
              </Link>
            )}

            {/* LOGIKA 2: Tombol Dashboard Khusus Admin/Apoteker */}
            {user && (user.role === 'admin' || user.role === 'pharmacist') && (
              <Link to="/admin" className="hidden md:flex bg-teal-50 text-teal-600 hover:bg-teal-100 px-4 py-2 rounded-full text-sm font-bold transition-all items-center gap-2">
                <i className="fa-solid fa-gauge-high"></i> Dashboard
              </Link>
            )}

            {/* LOGIKA 3: Tombol Tugas Khusus Kurir */}
            {user && user.role === 'kurir' && (
              <Link to="/track" className="hidden md:flex bg-orange-50 text-orange-600 hover:bg-orange-100 px-4 py-2 rounded-full text-sm font-bold transition-all items-center gap-2">
                <i className="fa-solid fa-motorcycle"></i> Tugas Saya
              </Link>
            )}

            {/* LOGIKA 4: Profil User & Tombol Keluar / Masuk */}
            {user ? (
              <div className="hidden md:flex items-center gap-3 bg-white pl-2 pr-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
                <div className="w-7 h-7 bg-apx-brand text-white rounded-full flex items-center justify-center text-xs font-bold uppercase">
                  {user.name.substring(0, 1)}
                </div>
                <span className="text-sm font-bold text-apx-dark max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                <button onClick={handleLogout} className="text-rose-500 hover:text-rose-700 ml-2 transition-colors" title="Keluar">
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden md:block bg-apx-dark hover:bg-gray-800 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-md">
                Masuk
              </Link>
            )}

            {/* Hamburger Menu (Mobile) */}
            <button className="md:hidden text-apx-dark bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
              <i className="fa-solid fa-bars"></i>
            </button>
          </div>
        </nav>
      </div>

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Breakout Hero Section */}
        <div className="relative w-full rounded-[2.5rem] bg-apx-dark overflow-hidden shadow-2xl shadow-apx-dark/20 mb-16">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-apx-brand rounded-full mix-blend-screen filter blur-[100px] opacity-40 translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500 rounded-full mix-blend-screen filter blur-[80px] opacity-30 -translate-x-1/3 translate-y-1/3"></div>

          <div className="relative z-10 px-8 py-16 md:py-24 md:px-16 flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-3/5 text-center md:text-left">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6">
                Farmasi <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-apx-brand to-teal-300">Masa Depan.</span>
              </h1>
              <p className="text-gray-300 text-lg md:text-xl font-medium mb-10 max-w-lg mx-auto md:mx-0">
                Pesan obat, tebus resep, dan konsultasi apoteker tanpa perlu melangkah keluar rumah.
              </p>
              
              <div className="relative max-w-xl mx-auto md:mx-0 group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <i className="fa-solid fa-magnifying-glass text-gray-400 group-focus-within:text-apx-brand transition-colors text-lg"></i>
                </div>
                <input type="text" className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 rounded-full pl-14 pr-32 py-4 focus:outline-none focus:bg-white/20 focus:border-apx-brand focus:ring-1 focus:ring-apx-brand transition-all text-lg" placeholder="Cari obat atau keluhan..." />
                <button className="absolute right-2 top-2 bottom-2 bg-apx-brand hover:bg-apx-brandDark text-apx-dark font-bold px-6 rounded-full transition-colors shadow-lg">
                  Cari
                </button>
              </div>
            </div>
            
            <div className="hidden md:flex w-full md:w-2/5 justify-center relative">
              <div className="w-64 h-80 bg-white/10 backdrop-blur-lg border border-white/20 rounded-[2rem] rotate-6 absolute z-0"></div>
              <div className="w-64 h-80 bg-gradient-to-br from-apx-brand to-teal-400 rounded-[2rem] -rotate-3 relative z-10 p-6 flex flex-col justify-between shadow-floating">
                <div className="flex justify-between items-start">
                  <i className="fa-solid fa-capsules text-4xl text-apx-dark opacity-80"></i>
                  <div className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-apx-dark">Verified</div>
                </div>
                <div>
                  <h3 className="text-apx-dark font-extrabold text-2xl leading-none mb-2">Tebus Resep <br />Instant</h3>
                  <p className="text-apx-dark/80 text-sm font-medium"><i className="fa-solid fa-check text-xs"></i> Langsung diproses</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Product Grid */}
        <div>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-extrabold tracking-tight">Pilihan Hari Ini</h2>
            <a href="#" className="text-apx-brandDark font-bold text-sm hover:text-apx-dark transition-colors flex items-center gap-2">Lihat Semua <i className="fa-solid fa-arrow-right"></i></a>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-10">
              <i className="fa-solid fa-circle-notch fa-spin text-4xl text-apx-brand"></i>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-[2rem] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-50 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group relative flex flex-col h-full">
                  
                  {product.badge && (
                    <div className={`absolute top-4 left-4 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest z-10 ${
                      product.badge.toLowerCase().includes('diskon') ? 'bg-rose-50 text-rose-500' : 'bg-teal-50 text-teal-600'
                    }`}>
                      {product.badge}
                    </div>
                  )}
                  
                  <div className="h-48 w-full bg-gray-50 rounded-2xl mb-5 flex items-center justify-center group-hover:bg-teal-50/50 transition-colors relative overflow-hidden">
                    {product.image ? (
                      <img 
                        src={`${serverBaseUrl}${product.image}`} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <i className={`fa-solid ${product.icon_class || 'fa-image'} text-6xl text-gray-300 group-hover:text-apx-brand group-hover:scale-110 transition-all duration-500`}></i>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-apx-dark leading-snug mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-xs font-medium text-gray-400 mb-4">{product.unit}</p>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <span className="font-extrabold text-xl tracking-tight text-apx-dark">
                      Rp{Number(product.price).toLocaleString('id-ID')}
                    </span>
                    {/* IMPLEMENTASI TOMBOL "+" UNTUK ADD OBAT KE KERANJANG */}
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className="w-10 h-10 rounded-full bg-gray-50 text-apx-dark hover:bg-apx-dark hover:text-white flex items-center justify-center transition-colors active:scale-95"
                      title="Tambah ke Keranjang"
                    >
                      <i className="fa-solid fa-plus"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Home;