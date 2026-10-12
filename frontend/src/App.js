import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import ProductCard from "./components/ProductCard";
import Cart from "./components/Cart";
import AdminPanel from "./components/AdminPanel";
import AdminProductsPage from "./components/AdminProductsPage";
import AdminProductPage from "./components/AdminProductPage";
import {
  getCategoryDescendantNames,
  getCategoryPath,
  getFlattenedCategories,
} from "./utils/categoryTree";

const API_URL = "http://localhost:5000/api";

const normalizeFilterText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ʻʼ’‘`´]/g, "")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const toProductPayload = ({ imageFile, ...productData }) => {
  if (!imageFile) return productData;

  const multipartData = new FormData();
  Object.entries(productData).forEach(([key, value]) => {
    multipartData.append(key, String(value));
  });
  multipartData.append("imageFile", imageFile);
  return multipartData;
};

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminProductStats, setAdminProductStats] = useState({
    total: 0,
    visible: 0,
    inStock: 0,
  });
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const requestedCategory = searchParams.get("category") || "";
  const requestedMinPrice = searchParams.get("minPrice") || "";
  const requestedMaxPrice = searchParams.get("maxPrice") || "";
  const minPrice =
    requestedMinPrice !== "" &&
    Number.isFinite(Number(requestedMinPrice)) &&
    Number(requestedMinPrice) >= 0
      ? requestedMinPrice
      : "";
  const maxPrice =
    requestedMaxPrice !== "" &&
    Number.isFinite(Number(requestedMaxPrice)) &&
    Number(requestedMaxPrice) >= 0
      ? requestedMaxPrice
      : "";
  const inStockOnly = searchParams.get("inStock") === "1";
  const sortBy = searchParams.get("sort") || "newest";

  // Mahsulotlarni yuklash
  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Mahsulotlarni yuklashda xatolik:", error);
      setLoading(false);
    }
  }, []);

  const fetchAdminProducts = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/products`, {
        params: { page: 1, limit: 5 },
      });
      setAdminProducts(response.data.products);
      setAdminProductStats({
        total: response.data.total,
        visible: response.data.visible,
        inStock: response.data.inStock,
      });
    } catch (error) {
      console.error("Admin mahsulotlarini yuklashda xatolik:", error);
    }
  }, []);

  const getAdminProducts = useCallback(async (page, limit) => {
    const response = await axios.get(`${API_URL}/admin/products`, {
      params: { page, limit },
    });
    return response.data;
  }, []);

  const fetchCategories = useCallback(async () => {
    const response = await axios.get(`${API_URL}/categories`);
    setCategories(response.data);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchAdminProducts();
    fetchCategories().catch((error) => {
      console.error("Kategoriyalarni yuklashda xatolik:", error);
    });
  }, [fetchProducts, fetchAdminProducts, fetchCategories]);

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
    if (cart.length === 0 || isCheckingOut) return;

    setIsCheckingOut(true);
    setCheckoutMessage(null);
    try {
      const checkoutData = {
        items: cart.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
      };

      await axios.post(`${API_URL}/checkout`, checkoutData);

      setCart([]);
      await fetchProducts();
      setCheckoutMessage({
        type: "success",
        text: "Xaridingiz muvaffaqiyatli amalga oshirildi.",
      });
    } catch (error) {
      console.error("Checkout xatosi:", error);
      setCheckoutMessage({
        type: "error",
        text: error.response?.data?.message || "Xarid amalga oshmadi. Qayta urinib ko'ring.",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Yangi mahsulot qo'shish
  const handleAddProduct = async (productData) => {
    try {
      await axios.post(`${API_URL}/products`, toProductPayload(productData));
      await Promise.all([fetchProducts(), fetchAdminProducts(), fetchCategories()]);
      alert("Mahsulot muvaffaqiyatli qo'shildi!");
    } catch (error) {
      console.error("Mahsulot qo'shishda xatolik:", error);
      throw error;
    }
  };

  const handleGetAdminProduct = useCallback(async (productId) => {
    const response = await axios.get(`${API_URL}/admin/products/${productId}`);
    return response.data;
  }, []);

  const handleUpdateProduct = useCallback(async (productId, productData) => {
    try {
      const response = await axios.put(
        `${API_URL}/admin/products/${productId}`,
        toProductPayload(productData),
      );
      await Promise.all([fetchProducts(), fetchAdminProducts(), fetchCategories()]);
      return response.data;
    } catch (error) {
      console.error("Mahsulotni tahrirlashda xatolik:", error);
      alert(error.response?.data?.message || "Mahsulotni saqlab bo'lmadi");
      throw error;
    }
  }, [fetchCategories, fetchProducts, fetchAdminProducts]);

  const handleAddCategory = async (name, parentId = null) => {
    try {
      const response = await axios.post(`${API_URL}/categories`, {
        name,
        parent_id: parentId,
      });
      await fetchCategories();
      return response.data;
    } catch (error) {
      console.error("Kategoriya qo'shishda xatolik:", error);
      throw error;
    }
  };

  const handleUpdateCategory = async (categoryId, categoryData) => {
    try {
      const response = await axios.put(
        `${API_URL}/categories/${categoryId}`,
        categoryData,
      );
      await Promise.all([fetchCategories(), fetchProducts(), fetchAdminProducts()]);
      return response.data;
    } catch (error) {
      console.error("Kategoriyani tahrirlashda xatolik:", error);
      throw error;
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await axios.delete(`${API_URL}/categories/${categoryId}`);
      await fetchCategories();
    } catch (error) {
      console.error("Kategoriyani o'chirishda xatolik:", error);
      throw error;
    }
  };

  const handleToggleProductVisibility = async (product) => {
    try {
      await axios.patch(
        `${API_URL}/admin/products/${product.id}/visibility`,
        { is_visible: !Boolean(product.is_visible) },
      );
      await Promise.all([fetchProducts(), fetchAdminProducts()]);
    } catch (error) {
      console.error("Mahsulot ko'rinishini o'zgartirishda xatolik:", error);
      alert(error.response?.data?.message || "Ko'rinish holatini o'zgartirib bo'lmadi");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Bu mahsulotni butunlay o'chirmoqchimisiz?")) return false;

    try {
      await axios.delete(`${API_URL}/admin/products/${productId}`);
      setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
      await Promise.all([fetchProducts(), fetchAdminProducts()]);
      return true;
    } catch (error) {
      console.error("Mahsulotni o'chirishda xatolik:", error);
      alert(error.response?.data?.message || "Mahsulotni o'chirib bo'lmadi");
      return false;
    }
  };

  const categoryNames = Array.from(
    new Map(
      [
        ...getFlattenedCategories(categories).map((category) => category.name),
        ...products.map((product) => product.category || "Boshqa"),
      ]
        .map((category) => [normalizeFilterText(category), String(category).trim()])
        .filter(([key, name]) => key && name),
    ).values(),
  );
  const selectedCategory =
    categoryNames.find(
      (category) =>
        normalizeFilterText(category) === normalizeFilterText(requestedCategory),
    ) || requestedCategory;
  const selectedCategoryPath = getCategoryPath(categories, selectedCategory);
  const categoryCounts = products.reduce((counts, product) => {
    const key = normalizeFilterText(product.category || "Boshqa");
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const selectedCategoryNames = getCategoryDescendantNames(
    categories,
    selectedCategory,
  );
  const getCategoryCount = (categoryName) => {
    const descendantNames = getCategoryDescendantNames(categories, categoryName);
    return Array.from(descendantNames).reduce(
      (count, name) => count + (categoryCounts[normalizeFilterText(name)] || 0),
      0,
    );
  };
  const searchTokens = normalizeFilterText(searchTerm).split(" ").filter(Boolean);
  const minimumPrice = minPrice === "" ? null : Number(minPrice);
  const maximumPrice = maxPrice === "" ? null : Number(maxPrice);
  const filteredProducts = products
    .filter((product) => {
      const searchableText = normalizeFilterText(
        [product.name, product.category, product.description].filter(Boolean).join(" "),
      );
      const matchesSearch = searchTokens.every((token) => searchableText.includes(token));
      const matchesCategory =
        !requestedCategory ||
        selectedCategoryNames.has(product.category || "Boshqa");
      const price = Number(product.price);
      const matchesMinimum = minimumPrice === null || price >= minimumPrice;
      const matchesMaximum = maximumPrice === null || price <= maximumPrice;
      const matchesStock = !inStockOnly || Number(product.stock) > 0;
      return (
        matchesSearch &&
        matchesCategory &&
        matchesMinimum &&
        matchesMaximum &&
        matchesStock
      );
    })
    .sort((first, second) => {
      if (sortBy === "price-asc") return Number(first.price) - Number(second.price);
      if (sortBy === "price-desc") return Number(second.price) - Number(first.price);
      if (sortBy === "name") return first.name.localeCompare(second.name, "uz");
      return Number(second.id) - Number(first.id);
    });
  const activeFilterCount =
    Number(Boolean(requestedCategory)) +
    Number(Boolean(minPrice)) +
    Number(Boolean(maxPrice)) +
    Number(inStockOnly) +
    Number(Boolean(searchTerm)) +
    Number(sortBy !== "newest");

  const updateProductFilters = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const selectCatalogCategory = (category) => {
    const nextParams = new URLSearchParams(searchParams);
    if (category) {
      nextParams.set("category", category);
    } else {
      nextParams.delete("category");
    }
    navigate({ pathname: "/", search: nextParams.toString() });
    setIsCatalogOpen(false);
  };

  const clearProductFilters = () => setSearchParams({}, { replace: true });
  const clearPriceFilters = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("minPrice");
    nextParams.delete("maxPrice");
    setSearchParams(nextParams, { replace: true });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7fb]">
      <nav className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-[0_2px_12px_rgba(28,25,50,0.04)] backdrop-blur">
        <div className="mx-auto grid max-w-[1440px] grid-cols-[1fr_auto] items-center gap-x-3 gap-y-3 px-4 py-3 sm:px-6 lg:flex lg:flex-nowrap lg:gap-5 lg:px-8">
          <Link
            to="/"
            aria-label="Online do'kon bosh sahifasi"
            className="order-1 shrink-0 text-xl font-extrabold tracking-tight text-violet-700 sm:text-2xl lg:order-none"
          >
            Online<span className="text-slate-900">Do'kon</span>
          </Link>

          <div className="relative order-3 col-start-1 row-start-2 w-auto shrink-0 lg:order-none lg:col-auto lg:row-auto">
            <button
              type="button"
              aria-expanded={isCatalogOpen}
              aria-haspopup="true"
              onClick={() => setIsCatalogOpen((open) => !open)}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                isCatalogOpen
                  ? "bg-violet-700 text-white"
                  : "bg-violet-50 text-violet-800 hover:bg-violet-100"
              }`}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Katalog
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 transition-transform ${isCatalogOpen ? "rotate-180" : ""}`}>
                <path fillRule="evenodd" d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>

            {isCatalogOpen && (
              <>
                <button
                  type="button"
                  aria-label="Katalog menyusini yopish"
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={() => setIsCatalogOpen(false)}
                />
                <div className="absolute left-0 top-full z-40 mt-2 max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_55px_rgba(31,24,61,0.18)]">
                  <div className="px-3 pb-2 pt-1">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      Bo'limlar
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectCatalogCategory("")}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                      !requestedCategory
                        ? "bg-violet-50 text-violet-800"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>Barcha mahsulotlar</span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500 shadow-sm">
                      {products.length}
                    </span>
                  </button>
                  {categoryNames.map((category) => (
                    <button
                      key={normalizeFilterText(category)}
                      type="button"
                      onClick={() => selectCatalogCategory(category)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                        normalizeFilterText(category) === normalizeFilterText(requestedCategory)
                          ? "bg-violet-50 text-violet-800"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{getCategoryPath(categories, category)}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                        {getCategoryCount(category)}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <label className="order-4 col-span-2 relative min-w-0 flex-1 lg:order-none lg:col-auto">
            <span className="sr-only">Mahsulotlarni qidirish</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => updateProductFilters("search", event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  navigate({ pathname: "/", search: searchParams.toString() });
                }
              }}
              placeholder="Mahsulot yoki kategoriya qidiring"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
            {searchTerm && (
              <button
                type="button"
                aria-label="Qidiruvni tozalash"
                onClick={() => updateProductFilters("search", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            )}
          </label>

          <div className="order-2 col-start-2 row-start-1 ml-auto flex shrink-0 items-center gap-2 lg:order-none lg:col-auto lg:row-auto lg:ml-0">
            <Link
              to="/admin"
              className="hidden rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-violet-700 sm:inline-flex"
            >
              Admin
            </Link>
            <button
              onClick={() => navigate("/cart")}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 sm:px-4"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 8H6" />
                <circle cx="10" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>
              Savat ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </button>
          </div>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route
          path="/"
          element={
            <main className="mx-auto max-w-[1440px] px-4 pb-14 pt-7 sm:px-6 lg:px-8">
              <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-[#4c1d95] via-violet-700 to-[#6d28d9] px-5 py-7 text-white shadow-lg shadow-violet-900/10 sm:px-8 sm:py-9">
                <div aria-hidden="true" className="absolute -right-10 -top-16 h-56 w-56 rounded-full border-[28px] border-white/10" />
                <div className="relative max-w-3xl">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
                    O'zingiz uchun toping
                  </p>
                  <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                    Xarid qilishni boshlang
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-violet-100 sm:text-base">
                    Katalogdan bo'lim tanlang, narx bo'yicha saralang yoki kerakli mahsulotni tezda qidiring.
                  </p>
                </div>
              </div>

              <div className="grid items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)] xl:gap-7">
                <aside className={`${mobileFiltersOpen ? "block" : "hidden"} rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:block`}>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-slate-900">Filtrlar</h3>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={clearProductFilters}
                        className="text-xs font-semibold text-violet-700 hover:text-violet-900"
                      >
                        Tozalash
                      </button>
                    )}
                  </div>

                  <fieldset>
                    <legend className="mb-2 text-sm font-bold text-slate-800">Kategoriyalar</legend>
                    <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
                      <button
                        type="button"
                        aria-pressed={!requestedCategory}
                        onClick={() => updateProductFilters("category", "")}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                          !requestedCategory
                            ? "bg-violet-50 font-bold text-violet-800"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span>Barchasi</span>
                        <span className="text-xs text-slate-400">{products.length}</span>
                      </button>
                      {categoryNames.map((category) => {
                        const active =
                          normalizeFilterText(category) ===
                          normalizeFilterText(requestedCategory);
                        return (
                          <button
                            key={normalizeFilterText(category)}
                            type="button"
                            aria-pressed={active}
                            onClick={() => updateProductFilters("category", active ? "" : category)}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                              active
                                ? "bg-violet-50 font-bold text-violet-800"
                                : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <span className="truncate">{category}</span>
                            <span className={`ml-2 text-xs ${active ? "text-violet-600" : "text-slate-400"}`}>
                              {getCategoryCount(category)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="my-5 border-t border-slate-100" />

                  <fieldset>
                    <legend className="mb-3 text-sm font-bold text-slate-800">Narx oralig'i ($)</legend>
                    <div className="grid grid-cols-2 gap-2">
                      <label>
                        <span className="mb-1 block text-xs text-slate-500">Dan</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={minPrice}
                          onChange={(event) => updateProductFilters("minPrice", event.target.value)}
                          placeholder="0"
                          aria-label="Eng kam narx"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-xs text-slate-500">Gacha</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={maxPrice}
                          onChange={(event) => updateProductFilters("maxPrice", event.target.value)}
                          placeholder="Istalgan"
                          aria-label="Eng ko'p narx"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                        />
                      </label>
                    </div>
                    {minimumPrice !== null &&
                      maximumPrice !== null &&
                      minimumPrice > maximumPrice && (
                        <p role="alert" className="mt-2 text-xs text-rose-600">
                          Eng kam narx eng ko'p narxdan oshmasligi kerak.
                        </p>
                      )}
                  </fieldset>

                  <div className="my-5 border-t border-slate-100" />

                  <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(event) =>
                        updateProductFilters("inStock", event.target.checked ? "1" : "")
                      }
                      className="h-4 w-4 rounded border-slate-300 text-violet-700 accent-violet-700 focus:ring-violet-500"
                    />
                    Faqat mavjud mahsulotlar
                  </label>
                </aside>

                <section aria-label="Mahsulotlar">
                  <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">
                        {requestedCategory ? selectedCategoryPath : "Barcha mahsulotlar"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {filteredProducts.length} ta mahsulot topildi
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        aria-expanded={mobileFiltersOpen}
                        onClick={() => setMobileFiltersOpen((open) => !open)}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 lg:hidden"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                          <path d="M4 6h16M7 12h10m-7 6h4" />
                        </svg>
                        Filtrlar{activeFilterCount ? ` (${activeFilterCount})` : ""}
                      </button>
                      <label className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
                        <span className="hidden shrink-0 font-medium sm:inline">Saralash:</span>
                        <select
                          value={sortBy}
                          onChange={(event) => updateProductFilters("sort", event.target.value === "newest" ? "" : event.target.value)}
                          aria-label="Mahsulotlarni saralash"
                          className="min-h-10 min-w-0 max-w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        >
                          <option value="newest">Yangilari avval</option>
                          <option value="price-asc">Narx: arzondan qimmatga</option>
                          <option value="price-desc">Narx: qimmatdan arzonga</option>
                          <option value="name">Nomi bo'yicha</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  {(requestedCategory || minPrice || maxPrice || inStockOnly || searchTerm) && (
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      {requestedCategory && (
                        <button
                          type="button"
                          onClick={() => updateProductFilters("category", "")}
                          className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-800"
                        >
                          {selectedCategory} <span aria-hidden="true">×</span>
                        </button>
                      )}
                      {(minPrice || maxPrice) && (
                        <button
                          type="button"
                          onClick={clearPriceFilters}
                          className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-800"
                        >
                          ${minPrice || "0"} – ${maxPrice || "∞"} <span aria-hidden="true">×</span>
                        </button>
                      )}
                      {inStockOnly && (
                        <button
                          type="button"
                          onClick={() => updateProductFilters("inStock", "")}
                          className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800"
                        >
                          Mavjud <span aria-hidden="true">×</span>
                        </button>
                      )}
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => updateProductFilters("search", "")}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          Qidiruv: {searchTerm} <span aria-hidden="true">×</span>
                        </button>
                      )}
                    </div>
                  )}

                  {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          categories={categories}
                          onAddToCart={addToCart}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
                          <circle cx="10.5" cy="10.5" r="6.5" />
                          <path d="m16 16 4 4" />
                        </svg>
                      </div>
                      <p className="text-lg font-bold text-slate-900">Mahsulot topilmadi</p>
                      <p className="mt-2 text-sm text-slate-500">
                        Qidiruv yoki filtrlarni o'zgartirib ko'ring.
                      </p>
                      <button
                        type="button"
                        onClick={clearProductFilters}
                        className="mt-5 rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800"
                      >
                        Barcha filtrlarni tozalash
                      </button>
                    </div>
                  )}
                </section>
              </div>
            </main>
          }
        />
        <Route
          path="/cart"
          element={
            <Cart
              cart={cart}
              categories={categories}
              onRemove={removeFromCart}
              onUpdateQuantity={updateQuantity}
              onCheckout={handleCheckout}
              checkoutMessage={checkoutMessage}
              isCheckingOut={isCheckingOut}
            />
          }
        />
        <Route
          path="/admin"
          element={
            <AdminPanel
              products={adminProducts}
              productStats={adminProductStats}
              categories={categories}
              onAddProduct={handleAddProduct}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onToggleVisibility={handleToggleProductVisibility}
              onDeleteProduct={handleDeleteProduct}
            />
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminProductsPage
              categories={categories}
              onGetProducts={getAdminProducts}
              onToggleVisibility={handleToggleProductVisibility}
              onDeleteProduct={handleDeleteProduct}
            />
          }
        />
        <Route
          path="/admin/products/:productId"
          element={
            <AdminProductPage
              categories={categories}
              onGetProduct={handleGetAdminProduct}
              onUpdateProduct={handleUpdateProduct}
              onToggleVisibility={handleToggleProductVisibility}
              onDeleteProduct={handleDeleteProduct}
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;
