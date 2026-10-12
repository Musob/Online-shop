import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCategoryPath } from "../utils/categoryTree";
import { getProductImageUrl } from "../utils/productImages";

function ProductDetailPage({ categories, onGetProduct, onAddToCart }) {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError("");
    onGetProduct(productId)
      .then((data) => {
        if (isCurrent) setProduct(data);
      })
      .catch((requestError) => {
        if (isCurrent) {
          setError(
            requestError.response?.data?.message ||
              "Mahsulot ma'lumotlarini yuklab bo'lmadi.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [onGetProduct, productId]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p role="status" className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          Mahsulot yuklanmoqda...
        </p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p role="alert" className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-sm text-rose-700">
          {error || "Mahsulot topilmadi."}
        </p>
        <Link to="/" className="mt-4 inline-flex text-sm font-semibold text-violet-700 hover:text-violet-900">
          Do'konga qaytish
        </Link>
      </main>
    );
  }

  const isOutOfStock = Number(product.stock) <= 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <nav aria-label="Sahifa yo'li" className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
        <Link to="/" className="hover:text-violet-700">Do'kon</Link>
        <span aria-hidden="true">/</span>
        <Link
          to={`/?category=${encodeURIComponent(product.category || "Boshqa")}`}
          className="max-w-[70vw] truncate hover:text-violet-700"
        >
          {getCategoryPath(categories, product.category || "Boshqa")}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="max-w-[45vw] truncate text-slate-700">{product.name}</span>
      </nav>

      <section className="grid items-start gap-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:gap-8 sm:p-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:p-7">
        <div className="overflow-hidden rounded-xl bg-slate-100">
          <img
            src={getProductImageUrl(product.image)}
            alt={product.name}
            className="aspect-[4/3] max-h-[620px] w-full object-contain p-3 sm:aspect-[5/4] sm:p-6"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = getProductImageUrl("");
            }}
          />
        </div>

        <div className="flex flex-col px-1 py-1 sm:px-0 sm:py-2">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
            {getCategoryPath(categories, product.category || "Boshqa")}
          </p>
          <h1 className="mt-2 text-xl font-bold leading-snug text-slate-900 sm:text-2xl lg:text-3xl">
            {product.name}
          </h1>

          <div className="mt-5 border-y border-slate-100 py-4">
            <p className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {Number(product.price).toLocaleString("uz-UZ", {
                maximumFractionDigits: 2,
              })}{" "}
              $
            </p>
            <p className={`mt-2 text-sm font-medium ${isOutOfStock ? "text-rose-600" : "text-emerald-700"}`}>
              {isOutOfStock
                ? "Hozircha omborda yo'q"
                : `Omborda ${product.stock} ta mavjud`}
            </p>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <h2 className="text-sm font-bold text-slate-800">Mahsulot haqida</h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-500">Kategoriya</dt>
              <dd className="text-right font-medium text-slate-800">
                {getCategoryPath(categories, product.category || "Boshqa")}
              </dd>
              <dt className="text-slate-500">Mahsulot kodi</dt>
              <dd className="text-right font-medium text-slate-800">#{product.id}</dd>
            </dl>
            {product.description && (
              <p className="mt-4 whitespace-pre-line border-t border-slate-200 pt-3 text-sm leading-6 text-slate-600">
              {product.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              onAddToCart(product);
              setAdded(true);
            }}
            disabled={isOutOfStock}
            className="mt-5 min-h-12 w-full rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {isOutOfStock ? "Tugagan" : added ? "Savatga qo'shildi" : "Savatga qo'shish"}
          </button>
          {added && (
            <Link to="/cart" className="mt-3 text-center text-sm font-semibold text-violet-700 hover:text-violet-900">
              Savatga o'tish
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

export default ProductDetailPage;
