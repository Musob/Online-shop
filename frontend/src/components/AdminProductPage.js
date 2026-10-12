import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import ProductImageInput from "./ProductImageInput";
import { getCategoryPath, getFlattenedCategories } from "../utils/categoryTree";
import { getProductImageUrl } from "../utils/productImages";

function AdminProductPage({
  categories,
  onGetProduct,
  onUpdateProduct,
  onDeleteProduct,
}) {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [formData, setFormData] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditing = searchParams.get("edit") === "1";
  const categoryOptions = getFlattenedCategories(categories);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError("");

    onGetProduct(productId)
      .then((data) => {
        if (!isCurrent) return;
        setProduct(data);
        setFormData({
          name: data.name,
          category: data.category || "Boshqa",
          price: data.price,
          image: data.image || "",
          stock: data.stock,
          is_visible: Boolean(data.is_visible),
        });
      })
      .catch((requestError) => {
        if (!isCurrent) return;
        setError(
          requestError.response?.data?.message ||
            "Mahsulot ma'lumotlarini yuklab bo'lmadi.",
        );
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [onGetProduct, productId]);

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const updatedProduct = await onUpdateProduct(productId, {
        name: formData.name.trim(),
        category: formData.category.trim(),
        price: Number(formData.price),
        image: formData.image,
        stock: Number(formData.stock),
        is_visible: formData.is_visible,
        imageFile,
      });
      setProduct(updatedProduct);
      setImageFile(null);
      setFormData({
        ...updatedProduct,
        is_visible: Boolean(updatedProduct.is_visible),
      });
      navigate(`/admin/products/${productId}`);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Mahsulot ma'lumotlarini saqlab bo'lmadi.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const wasDeleted = await onDeleteProduct(Number(productId));
    if (wasDeleted) navigate("/admin");
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p role="status" className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-medium text-slate-600">
          Mahsulot ma'lumotlari yuklanmoqda...
        </p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p role="alert" className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-700">{error}</p>
        <Link to="/admin" className="font-semibold text-violet-700 hover:text-violet-900">
          Admin panelga qaytish
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <Link to="/admin" className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-violet-700 transition hover:text-violet-900">
        <span aria-hidden="true">←</span> Admin panelga qaytish
      </Link>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">Mahsulot #{product.id}</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
              {isEditing ? "Mahsulotni tahrirlash" : product.name}
            </h2>
          </div>
          {!isEditing && (
            <div className="flex gap-2">
              <Link
                to={`/admin/products/${product.id}?edit=1`}
                className="inline-flex min-h-10 items-center rounded-xl bg-violet-700 px-4 text-sm font-bold text-white transition hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
              >
                Tahrirlash
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex min-h-10 items-center rounded-xl border border-rose-200 px-4 text-sm font-bold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
              >
                O'chirish
              </button>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mx-5 mt-5 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700 sm:mx-6">
            {error}
          </p>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Nomi
              </span>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Kategoriya
              </span>
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

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Narxi ($)
                </span>
                <input
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Ombordagi soni
                </span>
                <input
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  required
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />
              </label>
            </div>

            <ProductImageInput
              image={formData.image}
              imageFile={imageFile}
              onImageChange={(image) =>
                setFormData((previous) => ({ ...previous, image }))
              }
              onFileChange={setImageFile}
            />

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <input
                name="is_visible"
                type="checkbox"
                checked={formData.is_visible}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 accent-violet-700 focus:ring-violet-500"
              />
              <span className="text-sm font-medium text-slate-700">
                Mahsulotni do'konda ko'rsatish
              </span>
            </label>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="submit"
                disabled={isSaving}
                className="min-h-11 rounded-xl bg-violet-700 px-5 text-sm font-bold text-white transition hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 disabled:opacity-60"
              >
                {isSaving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
              <Link
                to={`/admin/products/${product.id}`}
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Bekor qilish
              </Link>
            </div>
          </form>
        ) : (
          <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:p-6">
            <img
              src={getProductImageUrl(product.image)}
              alt={product.name}
              className="aspect-[3/4] max-h-[32rem] w-full rounded-2xl bg-[#f2f4f7] p-4 object-contain"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = getProductImageUrl("");
              }}
            />
            <dl className="grid content-start gap-3 sm:py-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kategoriya</dt>
                <dd className="mt-1 font-semibold text-slate-900">{getCategoryPath(categories, product.category || "Boshqa")}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Narxi</dt>
                <dd className="mt-1 text-2xl font-extrabold text-violet-800">
                  ${parseFloat(product.price).toFixed(2)}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ombordagi soni</dt>
                <dd className="mt-1 font-semibold text-slate-900">{product.stock} ta</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Do'kondagi holati</dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {product.is_visible ? "Ko'rsatiladi" : "Vaqtincha yashirilgan"}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Yaratilgan vaqt</dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {product.created_at
                    ? new Date(product.created_at).toLocaleString()
                    : "Ma'lumot yo'q"}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminProductPage;
