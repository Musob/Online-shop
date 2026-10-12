import React from "react";
import { Link } from "react-router-dom";
import { getCategoryPath } from "../utils/categoryTree";
import { getProductImageUrl } from "../utils/productImages";
import "./ProductCard.css";

const formatPrice = (price) =>
  Number(price).toLocaleString("uz-UZ", {
    maximumFractionDigits: 2,
  });

function ProductCard({ product, categories, onAddToCart }) {
  const isOutOfStock = Number(product.stock) <= 0;

  return (
    <article className="product-card">
      <Link
        to={`/products/${product.id}`}
        aria-label={`${product.name} mahsuloti haqida batafsil`}
        className="product-card__image-link"
      >
        <img
          src={getProductImageUrl(product.image)}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="product-card__image"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = getProductImageUrl("");
          }}
        />
        {isOutOfStock && (
          <span className="product-card__stock-badge">
            Tugagan
          </span>
        )}
      </Link>

      <div className="product-card__details">
        <p className="product-card__category">
          {getCategoryPath(categories, product.category || "Boshqa")}
        </p>
        <Link
          to={`/products/${product.id}`}
          className="product-card__name"
        >
          {product.name || "Mahsulot nomi ko'rsatilmagan"}
        </Link>
        <div className="product-card__purchase">
          <div className="product-card__price-row">
            <span className="product-card__price">
              {formatPrice(product.price)} $
            </span>
            <span
              className={`product-card__stock ${
                isOutOfStock ? "product-card__stock--empty" : ""
              }`}
            >
              {isOutOfStock ? "Tugagan" : `Omborda ${product.stock} ta`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className="product-card__button"
          >
            {isOutOfStock ? "Tugagan" : "Savatga qo'shish"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
