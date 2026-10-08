import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

function AdminProductPage({
  onGetProduct,
  onUpdateProduct,
  onDeleteProduct,
}) {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditing = searchParams.get("edit") === "1";

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
        price: Number(formData.price),
        image: formData.image,
        stock: Number(formData.stock),
        is_visible: formData.is_visible,
      });
      setProduct(updatedProduct);
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
    return <div className="mx-auto max-w-4xl px-4 py-10">Yuklanmoqda...</div>;
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <p className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>
        <Link to="/admin" className="text-blue-600 hover:underline">
          Admin panelga qaytish
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/admin" className="mb-6 inline-block text-blue-600 hover:underline">
        ← Admin panelga qaytish
      </Link>

      <section className="overflow-hidden rounded-lg bg-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-6">
          <div>
            <p className="text-sm text-gray-500">Mahsulot #{product.id}</p>
            <h2 className="text-2xl font-semibold">
              {isEditing ? "Mahsulotni tahrirlash" : product.name}
            </h2>
          </div>
          {!isEditing && (
            <div className="flex gap-2">
              <Link
                to={`/admin/products/${product.id}?edit=1`}
                className="rounded-lg bg-amber-500 px-4 py-2 text-white hover:bg-amber-600"
              >
                Tahrirlash
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                O'chirish
              </button>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mx-6 mt-5 rounded-lg bg-red-50 p-3 text-red-700">
            {error}
          </p>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Nomi
              </span>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Rasm havolasi
              </span>
              <input
                name="image"
                type="url"
                value={formData.image}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>

            <label className="flex items-center gap-3">
              <input
                name="is_visible"
                type="checkbox"
                checked={formData.is_visible}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">
                Mahsulotni do'konda ko'rsatish
              </span>
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isSaving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
              <Link
                to={`/admin/products/${product.id}`}
                className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-50"
              >
                Bekor qilish
              </Link>
            </div>
          </form>
        ) : (
          <div className="grid gap-6 p-6 sm:grid-cols-2">
            <img
              src={
                product.image ||
                "https://via.placeholder.com/400x300?text=No+Image"
              }
              alt={product.name}
              className="h-72 w-full rounded-lg bg-gray-100 object-contain"
              onError={(event) => {
                event.currentTarget.src =
                  "https://via.placeholder.com/400x300?text=No+Image";
              }}
            />
            <dl className="grid content-start gap-4">
              <div>
                <dt className="text-sm text-gray-500">Narxi</dt>
                <dd className="text-xl font-semibold text-blue-600">
                  ${parseFloat(product.price).toFixed(2)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Ombordagi soni</dt>
                <dd className="font-medium">{product.stock} ta</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Do'kondagi holati</dt>
                <dd className="font-medium">
                  {product.is_visible ? "Ko'rsatiladi" : "Vaqtincha yashirilgan"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Yaratilgan vaqt</dt>
                <dd className="font-medium">
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
