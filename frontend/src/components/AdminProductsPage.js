import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategoryPath } from "../utils/categoryTree";
import { getProductImageUrl } from "../utils/productImages";

const PAGE_SIZE = 20;

function AdminProductsPage({
  categories,
  onGetProducts,
  onToggleVisibility,
  onDeleteProduct,
}) {
  const [result, setResult] = useState(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError("");
    onGetProducts(page, PAGE_SIZE)
      .then((data) => {
        if (isCurrent) setResult(data);
      })
      .catch((requestError) => {
        if (isCurrent) {
          setError(
            requestError.response?.data?.message ||
              "Mahsulotlar ro'yxatini yuklab bo'lmadi.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [onGetProducts, page]);

  const pageCount = Math.max(1, Math.ceil((result?.total || 0) / PAGE_SIZE));
  const pageNumbers = pageCount <= 5
    ? Array.from({ length: pageCount }, (_value, index) => index + 1)
    : [
        1,
        ...(page > 3 ? ["start-gap"] : []),
        ...Array.from(
          { length: Math.min(pageCount - 1, page + 1) - Math.max(2, page - 1) + 1 },
          (_value, index) => Math.max(2, page - 1) + index,
        ),
        ...(page < pageCount - 2 ? ["end-gap"] : []),
        pageCount,
      ];

  const handleDelete = async (productId) => {
    if (await onDeleteProduct(productId)) {
      if (result?.products.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        try {
          setResult(await onGetProducts(page, PAGE_SIZE));
        } catch (requestError) {
          setError(
            requestError.response?.data?.message ||
              "Mahsulot o'chirildi, lekin ro'yxatni yangilab bo'lmadi.",
          );
        }
      }
    }
  };

  const handleToggleVisibility = async (product) => {
    await onToggleVisibility(product);
    try {
      setResult(await onGetProducts(page, PAGE_SIZE));
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Ko'rinish holati yangilandi, lekin ro'yxatni yuklab bo'lmadi.",
      );
    }
  };

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link to="/admin" className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900">
        <span aria-hidden="true">←</span> Admin panelga qaytish
      </Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Inventar</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
            Mahsulotlar ro'yxati
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Har sahifada {PAGE_SIZE} ta mahsulot ko'rsatiladi.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
          Jami: {result?.total ?? "—"}
        </span>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
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
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-14 text-center text-sm text-slate-500">
                    Mahsulotlar yuklanmoqda...
                  </td>
                </tr>
              ) : result?.products.length ? (
                result.products.map((product) => {
                  const isVisible = Boolean(product.is_visible);
                  const isInStock = Number(product.stock) > 0;
                  return (
                    <tr key={product.id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="flex min-w-[210px] items-center gap-3">
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
                          onClick={() => handleToggleVisibility(product)}
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
                            onClick={() => handleDelete(product.id)}
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
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-14 text-center text-sm text-slate-500">
                    Hozircha mahsulot yo'q.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-4 sm:px-6">
          <p className="text-sm text-slate-500">
            {result?.total
              ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, result.total)} / ${result.total}`
              : "0 ta mahsulot"}
          </p>
          <nav aria-label="Mahsulot sahifalari" className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={page <= 1 || isLoading}
              className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Oldingi
            </button>
            <div aria-live="polite" className="flex items-center gap-1">
              {pageNumbers.map((pageNumber) =>
                typeof pageNumber === "number" ? (
                  <button
                    key={pageNumber}
                    type="button"
                    aria-label={`${pageNumber}-sahifa`}
                    aria-current={pageNumber === page ? "page" : undefined}
                    onClick={() => setPage(pageNumber)}
                    disabled={isLoading}
                    className={`h-10 min-w-10 rounded-lg px-2 text-sm font-semibold transition ${
                      pageNumber === page
                        ? "bg-violet-700 text-white"
                        : "text-slate-600 hover:bg-violet-50 hover:text-violet-800"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ) : (
                  <span key={pageNumber} aria-hidden="true" className="px-1 text-slate-400">…</span>
                ),
              )}
            </div>
            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.min(pageCount, currentPage + 1))}
              disabled={page >= pageCount || isLoading}
              className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Keyingi
            </button>
          </nav>
        </div>
      </section>
    </main>
  );
}

export default AdminProductsPage;
