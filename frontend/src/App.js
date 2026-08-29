import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import ProductCard from "./components/ProductCard";
import Cart from "./components/Cart";
import AdminPanel from "./components/AdminPanel";

const API_URL = "http://localhost:5000/api";

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Mahsulotlarni yuklash
  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Mahsulotlarni yuklashda xatolik:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Savatga qo'shish
  const addToCart = (product) => {
    if (product.stock <= 0) return;

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          alert("Yetarli miqdor mavjud emas!");
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // Savatdan o'chirish
  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  // Miqdorni o'zgartirish
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (product && newQuantity > product.stock) {
      alert("Yetarli miqdor mavjud emas!");
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Savat bo'sh!");
      return;
    }

    try {
      const checkoutData = {
        items: cart.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
      };

      await axios.post(`${API_URL}/checkout`, checkoutData);

      alert("Xarid muvaffaqiyatli amalga oshirildi!");
      setCart([]);
      fetchProducts(); // Mahsulotlarni qayta yuklash (stock yangilandi)
    } catch (error) {
      console.error("Checkout xatosi:", error);
      alert(error.response?.data?.message || "Xarid amalga oshmadi");
    }
  };

  // Yangi mahsulot qo'shish
  const handleAddProduct = async (productData) => {
    try {
      await axios.post(`${API_URL}/products`, productData);
      await fetchProducts();
      alert("Mahsulot muvaffaqiyatli qo'shildi!");
    } catch (error) {
      console.error("Mahsulot qo'shishda xatolik:", error);
      alert(
        error.response?.data?.message ||
          "Backend serveriga ulanib bo'lmadi. Server va MySQL ishlayotganini tekshiring.",
      );
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">Online Do'kon</h1>
            <div className="flex space-x-4 items-center">
              <Link to="/" className="text-gray-700 hover:text-blue-600">
                Mahsulotlar
              </Link>
              <Link to="/admin" className="text-gray-700 hover:text-blue-600">
                Admin Panel
              </Link>
              <button
                onClick={() => navigate("/cart")}
                className="relative bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Savat ({cart.reduce((sum, item) => sum + item.quantity, 0)})
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route
          path="/"
          element={
            <div className="max-w-7xl mx-auto px-4 py-8">
              <h2 className="text-2xl font-semibold mb-6">
                Barcha Mahsulotlar
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            </div>
          }
        />
        <Route
          path="/cart"
          element={
            <Cart
              cart={cart}
              onRemove={removeFromCart}
              onUpdateQuantity={updateQuantity}
              onCheckout={handleCheckout}
            />
          }
        />
        <Route
          path="/admin"
          element={
            <AdminPanel products={products} onAddProduct={handleAddProduct} />
          }
        />
      </Routes>
    </div>
  );
}

export default App;
