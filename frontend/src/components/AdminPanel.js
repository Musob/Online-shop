import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CategoryManager from "./CategoryManager";
import ProductImageInput from "./ProductImageInput";
import { getCategoryPath, getFlattenedCategories } from "../utils/categoryTree";
import { getProductImageUrl } from "../utils/productImages";

function AdminPanel({
  products,
  productStats,
  categories,
  onAddProduct,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onToggleVisibility,
  onDeleteProduct,
}) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Boshqa",
    price: "",
    image: "",
    stock: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [productError, setProductError] = useState("");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const categoryOptions = useMemo(
    () => getFlattenedCategories(categories),
    [categories],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsAddingProduct(true);
    setProductError("");
    try {
      await onAddProduct({
        name: formData.name.trim(),
        category: formData.category.trim() || "Boshqa",
        price: Number(formData.price),
        image: formData.image || "",
        imageFile,
        stock: Number(formData.stock),
      });
      setFormData({
        name: "",
        category: "Boshqa",
        price: "",
        image: "",
        stock: "",
      });
      setImageFile(null);
    } catch (error) {
      setProductError(
        error.response?.data?.message ||
          "Mahsulotni qo'shib bo'lmadi. Server va MySQL ulanishini tekshirib, qayta urinib ko'ring.",
      );
    } finally {
      setIsAddingProduct(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">
            Boshqaruv
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
            Admin panel
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Mahsulotlar, kategoriyalar va do'kondagi ko'rinishni boshqaring.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800"
        >
          Do'konga qaytish
        </Link>
      </div>

      <section aria-label="Umumiy ko'rsatkichlar" className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Jami mahsulot", productStats.total, "bg-violet-50 text-violet-800"],
          ["Do'konda ko'rinadi", productStats.visible, "bg-emerald-50 text-emerald-800"],
          ["Omborda mavjud", productStats.inStock, "bg-indigo-50 text-indigo-800"],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className={`mt-2 inline-flex min-w-10 items-center justify-center rounded-lg px-3 py-1 text-xl font-extrabold ${color}`}>
              {value}
            </p>
          </div>
        ))}
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="space-y-6">
          <CategoryManager
            categories={categories}
            onAddCategory={onAddCategory}
            onUpdateCategory={onUpdateCategory}
            onDeleteCategory={onDeleteCategory}
          />

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">
                Mahsulotlar
              </p>
              <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                Yangi mahsulot qo'shish
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Nomi</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Mahsulot nomi"
                  required
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Narxi ($)</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="99.99"
                    step="0.01"
                    min="0"
                    required
                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Ombordagi soni</span>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    placeholder="10"
                    min="0"
                    step="1"
                    required
                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Kategoriya</span>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                >
                  {!categoryOptions.some((category) => category.name === formData.category) && (
                    <option value={formData.category}>{formData.category}</option>
                  )}
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.name}>{category.path}</option>
                  ))}
                </select>
              </label>

              <ProductImageInput
                image={formData.image}
                imageFile={imageFile}
                onImageChange={(image) =>
                  setFormData((previous) => ({ ...previous, image }))
                }
                onFileChange={setImageFile}
              />

              {productError && (
                <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
                  {productError}
                </p>
              )}

              <button
                type="submit"
                disabled={isAddingProduct}
                className="min-h-12 w-full rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
              >
                {isAddingProduct ? "Saqlanmoqda..." : "Mahsulotni qo'shish"}
              </button>
            </form>
          </section>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">
                Inventar
              </p>
              <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                So'nggi {products.length} ta mahsulot
              </h2>
            </div>
            <Link
              to="/admin/products"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-50 px-3 text-sm font-bold text-violet-800 transition hover:bg-violet-100"
            >
              Mahsulotlar ro'yxati
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          {products.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="font-semibold text-slate-800">Hozircha mahsulot yo'q.</p>
              <p className="mt-1 text-sm text-slate-500">Birinchi mahsulotingizni qo'shish uchun formadan foydalaning.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Mahsulot</th>
                    <th className="px-4 py-3">Kategoriya</th>
                    <th className="px-4 py-3">Narxi</th>
                    <th className="px-4 py-3">Ombor</th>
                    <th className="px-4 py-3">Do'kon</th>
                    <th className="px-4 py-3 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => {
                    const isVisible = Boolean(product.is_visible);
                    const isInStock = Number(product.stock) > 0;
                    return (
                      <tr key={product.id} className="transition hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="flex min-w-[200px] items-center gap-3">
                            <img
                              src={getProductImageUrl(product.image)}
                              alt={product.name}
                              loading="lazy"
                              decoding="async"
                              className="h-14 w-11 shrink-0 rounded-lg bg-[#f2f4f7] p-1 object-contain"
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = getProductImageUrl("");
                              }}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900">{product.name}</p>
                              <p className="mt-0.5 text-xs text-slate-400">#{product.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{getCategoryPath(categories, product.category || "Boshqa")}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-slate-800">
                          ${Number(product.price).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isInStock ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                          }`}>
                            {isInStock ? `${product.stock} ta` : "Tugagan"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isVisible}
                            aria-label={isVisible
                              ? `${product.name}: do'kondan yashirish`
                              : `${product.name}: do'konda ko'rsatish`}
                            onClick={() => onToggleVisibility(product)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 ${
                              isVisible ? "bg-violet-700" : "bg-slate-300"
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                              isVisible ? "translate-x-6" : "translate-x-1"
                            }`} />
                          </button>
                          <span className="ml-2 text-xs text-slate-500">{isVisible ? "Ko'rinadi" : "Yashirin"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Link
                              to={`/admin/products/${product.id}`}
                              aria-label={`${product.name} ma'lumotlarini ko'rish`}
                              title="Ko'rish"
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-violet-50 hover:text-violet-800"
                            >
                              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </Link>
                            <Link
                              to={`/admin/products/${product.id}?edit=1`}
                              aria-label={`${product.name} ma'lumotlarini tahrirlash`}
                              title="Tahrirlash"
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-violet-50 hover:text-violet-800"
                            >
                              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                                <path d="m14 6 4 4M4 20l4.5-1 10-10a2.12 2.12 0 0 0-3-3l-10 10L4 20Z" />
                              </svg>
                            </Link>
                            <button
                              type="button"
                              onClick={() => onDeleteProduct(product.id)}
                              aria-label={`${product.name} mahsulotini o'chirish`}
                              title="O'chirish"
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                            >
                              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                                <path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default AdminPanel;
