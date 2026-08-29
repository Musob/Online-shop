import React from 'react';

function ProductCard({ product, onAddToCart }) {
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={product.image || 'https://via.placeholder.com/300x300?text=No+Image'}
          alt={product.name}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
          }}
        />
        {isOutOfStock && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded">
            Tugagan
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
        <div className="flex justify-between items-center mb-3">
          <span className="text-2xl font-bold text-blue-600">
            ${parseFloat(product.price).toFixed(2)}
          </span>
          <span className={`text-sm ${isOutOfStock ? 'text-red-500' : 'text-gray-600'}`}>
            Soni: {product.stock} ta
          </span>
        </div>
        
        <button
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock}
          className={`w-full py-2 rounded-lg font-medium transition-colors ${
            isOutOfStock
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isOutOfStock ? 'Tugagan' : 'Savatga qo\'shish'}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;