import React from 'react';
import { getCategoryPath } from "../utils/categoryTree";
import { getProductImageUrl } from "../utils/productImages";

function ProductCard({ product, categories, onAddToCart }) {
  const isOutOfStock = product.stock <= 0;

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl"
    >
      <div
        className="relative aspect-[3/4] w-full overflow-hidden bg-[#f2f4f7] p-3 sm:p-4"
      >
        <img
          src={getProductImageUrl(product.image)}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full rounded-xl object-contain transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getProductImageUrl("");
          }}
        />
        {isOutOfStock && (
          <div className="absolute right-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            Tugagan
          </div>
        )}
      </div>
      
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="mb-2 w-fit max-w-full truncate rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700 sm:text-[11px]">
          {getCategoryPath(categories, product.category || "Boshqa")}
        </p>
        <h3 className="mb-3 min-h-10 overflow-hidden text-sm font-semibold leading-5 text-slate-800 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] sm:text-base">
          {product.name}
        </h3>
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-lg font-extrabold tracking-tight text-violet-800 sm:text-xl">
            ${parseFloat(product.price).toFixed(2)}
          </span>
          <span className={`rounded-full px-2 py-1 text-[11px] font-medium sm:text-xs ${isOutOfStock ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
            {isOutOfStock ? "Tugagan" : `Omborda ${product.stock} ta`}
          </span>
        </div>
        
        <button
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock}
          className="mt-auto w-full rounded-xl bg-violet-700 py-2.5 text-xs font-semibold text-white shadow-sm transition duration-200 hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none sm:text-sm"
        >
          {isOutOfStock ? 'Tugagan' : 'Savatga qo\'shish'}
        </button>
      </div>
    </article>
  );
}

export default ProductCard;