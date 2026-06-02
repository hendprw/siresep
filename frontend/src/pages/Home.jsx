import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

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
        console.error('Gagal memuat produk:', error);
      } finally { setLoading(false); }
    };
    fetchProducts();
    const savedCart = localStorage.getItem('siresep_cart');
    if (savedCart) setCartItems(JSON.parse(savedCart));
  }, []);

  const handleAddToCart = (product) => {
    const savedCart = localStorage.getItem('siresep_cart');
    let currentCart = savedCart ? JSON.parse(savedCart) : [];
    const existingItemIndex = currentCart.findIndex(item => item.id === product.id);

    if (existingItemIndex > -1) currentCart[existingItemIndex].qty += 1;
    else {
      currentCart.push({
        id: product.id, name: product.name, price: Number(product.price), qty: 1,
        unit: product.unit, icon_class: product.icon_class || 'fa-pills', image: product.image,
        requires_prescription: product.requires_prescription
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

  const dynamicCategories = useMemo(() => {
    const dbCategories = products.map(p => p.category).filter(c => c);
    return ['Semua', ...new Set(dbCategories)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      let matchesCategory = true;
      if (activeCategory !== 'Semua') {
        matchesCategory = product.category === activeCategory;
      }
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, activeCategory]);

  const groupedProducts = useMemo(() => {
    if (activeCategory !== 'Semua' || searchTerm !== '') return null;
    const groups = {};
    products.forEach(p => {
      const cat = p.category || 'Lainnya';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [products, activeCategory, searchTerm]);

  const scrollToCatalog = () => {
    const catalogSection = document.getElementById('katalog-section');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCategoryClick = (categoryName) => {
    setActiveCategory(categoryName);
    setSearchTerm('');
    scrollToCatalog();
  };

  const visualCategories = [
    { name: 'Ibu & Anak', icon: 'fa-baby', color: 'text-pink-500', bg: 'bg-pink-50', hover: 'hover:border-pink-200' },
    { name: 'Alat Kesehatan', icon: 'fa-stethoscope', color: 'text-indigo-500', bg: 'bg-indigo-50', hover: 'hover:border-indigo-200' },
    { name: 'Suplemen & Vitamin', icon: 'fa-leaf', color: 'text-green-500', bg: 'bg-green-50', hover: 'hover:border-green-200' },
    { name: 'Perawatan Tubuh', icon: 'fa-spa', color: 'text-teal-500', bg: 'bg-teal-50', hover: 'hover:border-teal-200' },
    { name: 'Obat Bebas', icon: 'fa-pills', color: 'text-blue-500', bg: 'bg-blue-50', hover: 'hover:border-blue-200' },
    { name: 'Obat Keras', icon: 'fa-prescription-bottle-medical', color: 'text-rose-500', bg: 'bg-rose-50', hover: 'hover:border-rose-200' }
  ];

  return (
    <div className="text-apx-dark antialiased relative min-h-screen gradient-bg flex flex-col">
      {/* NAVBAR */}
      <div className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pointer-events-none">
        <nav className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-glass rounded-full px-6 py-3 flex items-center justify-between pointer-events-auto transition-all duration-300">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-apx-dark text-apx-brand w-10 h-10 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform shadow-md">
              <i className="fa-solid fa-notes-medical text-xl"></i>
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-apx-dark">Siresep.</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 font-semibold text-apx-text text-sm">
            <button onClick={scrollToCatalog} className="hover:text-apx-dark transition-colors text-apx-brand">Katalog Obat</button>
            <a href="#kategori" className="hover:text-apx-dark transition-colors">Kategori</a>
            <a href="#promo" className="hover:text-apx-dark transition-colors">Promo</a>
          </div>

          <div className="flex items-center gap-4">
            {/* Tombol Keranjang */}
            {(!user || user.role === 'customer') && (
              <Link to="/cart" title="Keranjang Belanja" className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 border border-gray-100 shadow-sm transition-colors text-apx-dark">
                <i className="fa-solid fa-bag-shopping"></i>
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-white animate-bounce">
                    {totalCartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Tombol Pesanan Saya (Hanya untuk Customer yang Login) */}
            {user && user.role === 'customer' && (
              <Link to="/track" title="Pesanan Saya" className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 border border-gray-100 shadow-sm transition-colors text-apx-dark">
                <i className="fa-solid fa-clipboard-list text-lg"></i>
              </Link>
            )}

            {/* Tombol Dashboard Khusus Admin/Pharmacist */}
            {user && (user.role === 'admin' || user.role === 'pharmacist') && (
              <Link to="/admin" className="hidden md:flex bg-teal-50 text-teal-600 hover:bg-teal-100 px-4 py-2 rounded-full text-sm font-bold transition-all items-center gap-2">
                <i className="fa-solid fa-gauge-high"></i> Dashboard
              </Link>
            )}

            {/* Tombol Tugas Kurir */}
            {user && user.role === 'kurir' && (
              <Link to="/courier" className="hidden md:flex bg-orange-50 text-orange-600 hover:bg-orange-100 px-4 py-2 rounded-full text-sm font-bold transition-all items-center gap-2">
                <i className="fa-solid fa-motorcycle"></i> Tugas Saya
              </Link>
            )}

            {/* Profil & Logout */}
            {user ? (
              <div className="hidden md:flex items-center gap-3 bg-white pl-2 pr-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
                <div className="w-7 h-7 bg-apx-brand text-white rounded-full flex items-center justify-center text-xs font-bold uppercase">{user.name.substring(0, 1)}</div>
                <span className="text-sm font-bold text-apx-dark max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                <button onClick={handleLogout} className="text-rose-500 hover:text-rose-700 ml-2 transition-colors" title="Keluar">
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden md:block bg-apx-dark hover:bg-gray-800 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md">Masuk</Link>
            )}
          </div>
        </nav>
      </div>

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 w-full">
        
        {/* 1. HERO SECTION */}
        <div className="relative w-full rounded-[2.5rem] bg-apx-dark overflow-hidden shadow-2xl shadow-apx-dark/20 mb-12">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-apx-brand rounded-full mix-blend-screen filter blur-[100px] opacity-40 translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500 rounded-full mix-blend-screen filter blur-[80px] opacity-30 -translate-x-1/3 translate-y-1/3"></div>

          <div className="relative z-10 px-6 py-20 md:py-32 flex flex-col items-center justify-center">
            <div className="w-full max-w-3xl text-center">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6">
                Farmasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-apx-brand to-teal-300">Masa Depan.</span>
              </h1>
              <p className="text-gray-300 text-base md:text-xl font-medium mb-10 max-w-2xl mx-auto">
                Pesan obat, tebus resep, dan konsultasi apoteker tanpa perlu melangkah keluar rumah.
              </p>
              
              <div className="relative w-full max-w-2xl mx-auto group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <i className="fa-solid fa-magnifying-glass text-gray-400 group-focus-within:text-apx-brand text-lg"></i>
                </div>
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if(e.target.value !== '') scrollToCatalog();
                  }} 
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-300 rounded-full pl-14 pr-28 sm:pr-32 py-4 focus:outline-none focus:bg-white/20 focus:border-apx-brand focus:ring-1 focus:ring-apx-brand transition-all text-base sm:text-lg" 
                  placeholder="Ketik nama obat atau keluhan..." 
                />
                <button onClick={scrollToCatalog} className="absolute right-2 top-2 bottom-2 bg-apx-brand hover:bg-apx-brandDark text-apx-dark font-bold px-5 sm:px-8 rounded-full shadow-lg flex items-center gap-2 transition-colors">
                  <i className="fa-solid fa-search"></i> <span className="hidden sm:inline">Cari</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. SECTION JELAJAHI KATEGORI (VISUAL) */}
        <div id="kategori" className="mb-16">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-apx-dark mb-1">Jelajahi Kategori</h2>
              <p className="text-sm font-medium text-gray-500">Pilih kategori untuk menemukan produk dengan cepat.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {visualCategories.map((cat, idx) => (
              <div 
                key={idx} 
                onClick={() => handleCategoryClick(cat.name)}
                className={`bg-white rounded-3xl p-5 text-center cursor-pointer border border-transparent shadow-sm hover:shadow-md transition-all duration-300 ${cat.hover}`}
              >
                <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center text-2xl mb-3 ${cat.bg} ${cat.color}`}>
                  <i className={`fa-solid ${cat.icon}`}></i>
                </div>
                <h4 className="font-extrabold text-apx-dark text-xs sm:text-sm leading-tight">{cat.name}</h4>
              </div>
            ))}
          </div>
        </div>

        {/* 3. SECTION PROMO BANNER */}
        <div id="promo" className="bg-gradient-to-r from-[#021B19] to-teal-900 rounded-[2rem] p-8 md:p-12 mb-16 relative overflow-hidden shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute right-0 top-0 w-64 h-64 bg-apx-brand rounded-full mix-blend-overlay filter blur-[80px] opacity-40 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
          
          <div className="relative z-10">
            <span className="bg-rose-500 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block shadow-md">
              <i className="fa-solid fa-bolt mr-1"></i> Promo Terbatas
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Sehat Lebih Hemat!</h2>
            <p className="text-gray-300 font-medium max-w-md text-sm md:text-base leading-relaxed">
              Dapatkan diskon dan harga spesial untuk berbagai produk <strong>Suplemen & Vitamin</strong> khusus pemesanan minggu ini.
            </p>
          </div>
          
          <button 
            onClick={() => handleCategoryClick('Suplemen & Vitamin')} 
            className="relative z-10 w-full md:w-auto bg-apx-brand hover:bg-white text-apx-dark font-extrabold px-8 py-4 rounded-xl transition-all shadow-[0_10px_20px_-10px_rgba(0,208,132,0.5)] flex items-center justify-center gap-2"
          >
            Lihat Produk Promo <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>

        {/* 4. SECTION KATALOG PRODUK */}
        <div id="katalog-section" className="scroll-mt-32 min-h-[400px]">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-apx-dark mb-2">{searchTerm ? `Pencarian: "${searchTerm}"` : 'Katalog Apotek'}</h2>
              <p className="text-gray-500 font-medium">Koleksi lengkap produk kesehatan berkualitas.</p>
            </div>
            
            <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar items-center">
              <span className="text-sm font-bold text-gray-400 mr-2 flex-shrink-0"><i className="fa-solid fa-filter"></i> Filter Cepat:</span>
              {dynamicCategories.map((category) => (
                <button 
                  key={category} 
                  onClick={() => setActiveCategory(category)} 
                  className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm border ${activeCategory === category ? 'bg-apx-brand text-apx-dark border-apx-brand' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-apx-dark'}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-20 flex-col items-center gap-4"><i className="fa-solid fa-circle-notch fa-spin text-4xl text-apx-brand"></i></div>
          ) : (
            <>
              {/* TAMPILAN JIKA FILTER AKTIF / PENCARIAN AKTIF */}
              {(!groupedProducts) && (
                filteredProducts.length === 0 ? (
                  <div className="bg-white rounded-[2rem] p-16 text-center border border-gray-100 shadow-sm max-w-2xl mx-auto mt-10">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6"><i className="fa-solid fa-box-open text-4xl text-gray-300"></i></div>
                    <h3 className="text-xl font-extrabold text-apx-dark mb-2">Produk Tidak Ditemukan</h3>
                    <p className="text-gray-500 font-medium">Tidak ada produk untuk kata kunci <strong>"{searchTerm}"</strong> di kategori <strong>{activeCategory}</strong>.</p>
                    <button onClick={() => {setSearchTerm(''); setActiveCategory('Semua');}} className="mt-6 bg-apx-brand text-apx-dark px-6 py-2.5 rounded-full font-bold shadow-md hover:bg-apx-brandDark transition-colors">Reset Pencarian</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => renderProductCard(product, handleAddToCart, serverBaseUrl))}
                  </div>
                )
              )}

              {/* TAMPILAN SECTION PER KATEGORI (HANYA JIKA "SEMUA" & TIDAK ADA PENCARIAN) */}
              {groupedProducts && Object.entries(groupedProducts).map(([categoryName, items]) => (
                <div key={categoryName} className="mb-16">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-3">
                    <h3 className="text-2xl font-extrabold text-apx-dark flex items-center gap-3">
                      <span className="w-2 h-8 bg-apx-brand rounded-full inline-block"></span>
                      {categoryName}
                    </h3>
                    <button onClick={() => handleCategoryClick(categoryName)} className="text-apx-brandDark font-bold text-sm hover:text-apx-dark transition-colors flex items-center gap-1 bg-teal-50 px-4 py-2 rounded-lg">
                      Lihat Semua <i className="fa-solid fa-arrow-right"></i>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {items.slice(0, 4).map((product) => renderProductCard(product, handleAddToCart, serverBaseUrl))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* 5. SECTION KEUNGGULAN LENGKAP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pt-16 border-t border-gray-200">
          <div className="text-center md:text-left flex flex-col items-center md:items-start">
            <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center text-2xl mb-4">
              <i className="fa-solid fa-truck-fast"></i>
            </div>
            <h3 className="font-extrabold text-apx-dark text-lg mb-2">Pengiriman Kilat</h3>
            <p className="text-sm text-gray-500 font-medium">Pesanan diantar kurir internal dalam hitungan menit.</p>
          </div>
          <div className="text-center md:text-left flex flex-col items-center md:items-start">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-2xl mb-4">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <h3 className="font-extrabold text-apx-dark text-lg mb-2">100% Produk Asli</h3>
            <p className="text-sm text-gray-500 font-medium">Jaminan obat resmi langsung dari distributor terpercaya.</p>
          </div>
          <div className="text-center md:text-left flex flex-col items-center md:items-start">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center text-2xl mb-4">
              <i className="fa-solid fa-user-doctor"></i>
            </div>
            <h3 className="font-extrabold text-apx-dark text-lg mb-2">Apoteker Siaga</h3>
            <p className="text-sm text-gray-500 font-medium">Tim kami siap memvalidasi resep dan menjawab keluhan.</p>
          </div>
        </div>

      </main>

      {/* FOOTER SECTION */}
      <footer className="bg-white border-t border-gray-200 pt-16 pb-8 mt-auto w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-4">
                <div className="bg-apx-dark text-apx-brand w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                  <i className="fa-solid fa-notes-medical text-sm"></i>
                </div>
                <span className="font-extrabold text-xl tracking-tight text-apx-dark">Siresep.</span>
              </Link>
              <p className="text-gray-500 text-sm font-medium leading-relaxed mb-6">
                Platform farmasi digital terdepan. Menebus resep dan membeli kebutuhan kesehatan kini semudah dalam genggaman tangan.
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-apx-brand hover:text-apx-dark transition-colors"><i className="fa-brands fa-whatsapp text-lg"></i></a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-apx-brand hover:text-apx-dark transition-colors"><i className="fa-brands fa-instagram text-lg"></i></a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-apx-brand hover:text-apx-dark transition-colors"><i className="fa-brands fa-twitter text-lg"></i></a>
              </div>
            </div>

            <div>
              <h4 className="font-extrabold text-apx-dark mb-5 uppercase tracking-widest text-sm">Kategori Favorit</h4>
              <ul className="space-y-3 text-sm font-medium text-gray-500">
                <li><button onClick={() => handleCategoryClick('Ibu & Anak')} className="hover:text-apx-brand transition-colors">Ibu & Anak</button></li>
                <li><button onClick={() => handleCategoryClick('Alat Kesehatan')} className="hover:text-apx-brand transition-colors">Alat Medis</button></li>
                <li><button onClick={() => handleCategoryClick('Perawatan Tubuh')} className="hover:text-apx-brand transition-colors">Perawatan Tubuh</button></li>
                <li><button onClick={() => handleCategoryClick('Suplemen & Vitamin')} className="hover:text-apx-brand transition-colors">Vitamin & Suplemen</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-extrabold text-apx-dark mb-5 uppercase tracking-widest text-sm">Tautan Cepat</h4>
              <ul className="space-y-3 text-sm font-medium text-gray-500">
                <li><button onClick={scrollToCatalog} className="hover:text-apx-brand transition-colors">Katalog Obat</button></li>
                <li><Link to="/cart" className="hover:text-apx-brand transition-colors">Keranjang Belanja</Link></li>
                <li><Link to="/track" className="hover:text-apx-brand transition-colors">Lacak Pesanan</Link></li>
                <li><a href="#" className="hover:text-apx-brand transition-colors">Syarat & Ketentuan</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-extrabold text-apx-dark mb-5 uppercase tracking-widest text-sm">Hubungi Kami</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-500">
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-location-dot mt-1 text-apx-brand"></i>
                  <span>Jl. Raya Universitas Trunojoyo, Bangkalan, Jawa Timur.</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fa-solid fa-phone text-apx-brand"></i>
                  <span>+62 812 3456 7890</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fa-solid fa-envelope text-apx-brand"></i>
                  <span>halo@siresep.com</span>
                </li>
              </ul>
            </div>

          </div>
          
          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-gray-400">
            <p>&copy; {new Date().getFullYear()} Apotek Siresep. Hak Cipta Dilindungi.</p>
            <div className="flex items-center gap-2">
              <span>Dibuat dengan <i className="fa-solid fa-heart text-rose-500"></i> untuk kesehatan Anda.</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

function renderProductCard(product, handleAddToCart, serverBaseUrl) {
  return (
    <div key={product.id} className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group relative flex flex-col h-full overflow-hidden">
      {product.requires_prescription && (
         <div className="absolute top-0 right-0 bg-rose-600 text-white text-[9px] font-extrabold px-3 py-1.5 rounded-bl-2xl uppercase tracking-widest z-10 shadow-sm flex items-center gap-1">
           <i className="fa-solid fa-prescription"></i> Resep
         </div>
      )}
      {product.badge && (
        <div className={`absolute top-4 left-4 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest z-10 shadow-sm ${product.badge.toLowerCase().includes('diskon') ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-teal-50 text-teal-700 border border-teal-100'}`}>
          {product.badge}
        </div>
      )}
      
      <div className="h-40 sm:h-48 w-full bg-gray-50 rounded-2xl mb-5 flex items-center justify-center group-hover:bg-teal-50/50 transition-colors relative overflow-hidden">
        {product.image ? (
          <img src={`${serverBaseUrl}${product.image}`} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : <i className={`fa-solid ${product.icon_class || 'fa-image'} text-5xl sm:text-6xl text-gray-300 group-hover:text-apx-brand group-hover:scale-110 transition-all duration-500`}></i>}
      </div>
      
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{product.category}</p>
      <h3 className="font-bold text-apx-dark leading-snug mb-1 line-clamp-2 text-sm sm:text-base group-hover:text-apx-brandDark transition-colors">{product.name}</h3>
      <p className="text-xs font-medium text-gray-400 mb-4">{product.unit}</p>
      
      <div className="mt-auto flex items-center justify-between">
        <span className="font-extrabold text-lg sm:text-xl tracking-tight text-apx-dark">Rp{Number(product.price).toLocaleString('id-ID')}</span>
        <button onClick={() => handleAddToCart(product)} className="w-10 h-10 rounded-xl bg-gray-50 text-apx-dark hover:bg-apx-brand hover:text-apx-dark flex items-center justify-center transition-colors active:scale-95 border border-gray-100 hover:border-apx-brand shadow-sm">
          <i className="fa-solid fa-cart-plus"></i>
        </button>
      </div>
    </div>
  );
}

export default Home;