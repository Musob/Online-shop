import React, { useState } from "react";
import { Link } from "react-router-dom";

function AdminPanel({
  products,
  onAddProduct,
  onToggleVisibility,
  onDeleteProduct,
}) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    image: "",
    stock: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validatsiya
    if (!formData.name || !formData.price || !formData.stock) {
      alert("Nomi, narxi va soni kiritilishi shart!");
      return;
    }

    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      image: formData.image || "",
      stock: parseInt(formData.stock),
    };

    try {
      await onAddProduct(productData);
    } catch (error) {
      return;
    }

    // Formani tozalash
    setFormData({
      name: "",
      price: "",
      image: "",
      stock: "",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">Admin Panel</h2>

      {/* Yangi mahsulot qo'shish formasi */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4">Yangi Mahsulot Qo'shish</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomi
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mahsulot nomi"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Narxi ($)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="99.99"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rasm Linki
              </label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Soni (stock)
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10"
                min="0"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Qo'shish
          </button>
        </form>
      </div>

      {/* Mahsulotlar ro'yxati */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h3 className="text-xl font-semibold p-6 border-b">
          Mavjud Mahsulotlar
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rasm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nomi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Narxi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Soni
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Holat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Do'konda
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    Hozircha mahsulot yo'q.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isVisible = Boolean(product.is_visible);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{product.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={
                            product.image ||
                            "https://via.placeholder.com/50x50?text=No+Image"
                          }
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${parseFloat(product.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            product.stock > 0
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.stock > 0 ? "Mavjud" : "Tugagan"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isVisible}
                          aria-label={
                            isVisible
                              ? `${product.name}: do'kondan yashirish`
                              : `${product.name}: do'konda ko'rsatish`
                          }
                          onClick={() => onToggleVisibility(product)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isVisible ? "bg-green-600" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isVisible ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <span className="ml-2 text-sm text-gray-600">
                          {isVisible ? "Ko'rsatiladi" : "Yashirilgan"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/admin/products/${product.id}`}
                            aria-label={`${product.name} ma'lumotlarini ko'rish`}
                            title="Ko'rish"
                            className="rounded p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="h-5 w-5"
                            >
                              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </Link>
                          <Link
                            to={`/admin/products/${product.id}?edit=1`}
                            aria-label={`${product.name} ma'lumotlarini tahrirlash`}
                            title="Tahrirlash"
                            className="rounded p-2 text-amber-600 hover:bg-amber-50"
                          >
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="h-5 w-5"
                            >
                              <path d="m16 4 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" />
                            </svg>
                          </Link>
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(product.id)}
                            aria-label={`${product.name} mahsulotini o'chirish`}
                            title="O'chirish"
                            className="rounded p-2 text-red-600 hover:bg-red-50"
                          >
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="h-5 w-5"
                            >
                              <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
