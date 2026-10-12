import React from "react";
import { Link } from "react-router-dom";
import { getCategoryPath } from "../utils/categoryTree";
import { getProductImageUrl } from "../utils/productImages";

function Cart({
  cart,
  categories,
  onRemove,
  onUpdateQuantity,
  onCheckout,
  checkoutMessage,
  isCheckingOut,
}) {
  const totalAmount = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );

  if (cart.length === 0) {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-5xl items-center justify-center px-4 py-12 sm:px-6">
        <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm sm:px-10">
          {checkoutMessage?.type === "success" && (
            <p role="status" className="mb-6 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
              {checkoutMessage.text}
            </p>
          )}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-8 w-8">
              <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 8H6" />
              <circle cx="10" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Savatingiz hozircha bo'sh
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            O'zingizga yoqqan mahsulotlarni tanlang — ular shu yerda ko'rinadi.
          </p>
          <Link
            to="/"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
          >
            Xaridni davom ettirish
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">
          Xaridlaringiz
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
          Savatingiz
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {cart.reduce((sum, item) => sum + item.quantity, 0)} ta mahsulot
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-8">
        <section
          aria-label="Savatdagi mahsulotlar"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          {cart.map((item, index) => (
            <article
              key={item.id}
              className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6 lg:p-7 ${
                index < cart.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <img
                src={getProductImageUrl(item.image)}
                alt={item.name}
                loading="lazy"
                decoding="async"
                className="h-48 w-40 shrink-0 rounded-2xl bg-[#f2f4f7] p-3 object-contain sm:h-52 sm:w-44"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = getProductImageUrl("");
                }}
              />

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-violet-700">
                  {getCategoryPath(categories, item.category || "Boshqa")}
                </p>
                <h2 className="mt-1 truncate font-bold text-slate-900">
                  {item.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  ${Number(item.price).toFixed(2)} · Omborda {item.stock} ta
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end sm:gap-4">
                <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    aria-label={`${item.name} miqdorini kamaytirish`}
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="h-10 w-10 rounded-l-xl text-lg font-medium text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500"
                  >
                    −
                  </button>
                  <span
                    aria-live="polite"
                    className="min-w-9 text-center text-sm font-bold text-slate-900"
                  >
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`${item.name} miqdorini oshirish`}
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="h-10 w-10 rounded-r-xl text-lg font-medium text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    +
                  </button>
                </div>
                <p className="min-w-20 text-right font-bold text-slate-900">
                  ${(Number(item.price) * item.quantity).toFixed(2)}
                </p>
                <button
                  type="button"
                  aria-label={`${item.name} mahsulotini savatdan olib tashlash`}
                  onClick={() => onRemove(item.id)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
                  </svg>
                </button>
              </div>
            </article>
          ))}
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 xl:sticky xl:top-24">
          <h2 className="text-lg font-extrabold text-slate-900">Buyurtma xulosasi</h2>
          <div className="mt-5 flex justify-between text-sm text-slate-600">
            <span>Mahsulotlar ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          <div className="my-5 border-t border-slate-100" />
          <div className="flex items-end justify-between gap-3">
            <span className="font-semibold text-slate-800">Jami</span>
            <span className="text-2xl font-extrabold tracking-tight text-violet-800">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
          {checkoutMessage && (
            <p
              role="status"
              className={`mt-4 rounded-xl p-3 text-sm ${
                checkoutMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {checkoutMessage.text}
            </p>
          )}
          <button
            type="button"
            onClick={onCheckout}
            disabled={isCheckingOut}
            className="mt-6 min-h-12 w-full rounded-xl bg-violet-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 disabled:cursor-wait disabled:opacity-60"
          >
            {isCheckingOut ? "Buyurtma bajarilmoqda..." : "Xaridni tasdiqlash"}
          </button>
          <p className="mt-3 text-center text-xs leading-5 text-slate-500">
            Ombordagi mahsulotlar xarid tasdiqlangandan so'ng yangilanadi.
          </p>
          <Link
            to="/"
            className="mt-4 flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800"
          >
            Xaridni davom ettirish
          </Link>
        </aside>
      </div>
    </main>
  );
}

export default Cart;
