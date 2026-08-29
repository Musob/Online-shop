import React from 'react';
import { Link } from 'react-router-dom';

function Cart({ cart, onRemove, onUpdateQuantity, onCheckout }) {
  const totalAmount = cart.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Savat bo'sh</h2>
        <p className="text-gray-600 mb-6">Mahsulotlar qo'shish uchun do'konga qayting</p>
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Mahsulotlarga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">Savatingiz</h2>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {cart.map(item => (
          <div key={item.id} className="border-b p-4 flex items-center">
            <img
              src={item.image || 'https://via.placeholder.com/100x100?text=No+Image'}
              alt={item.name}
              className="w-24 h-24 object-cover rounded mr-4"
            />
            
            <div className="flex-1">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-gray-600">${parseFloat(item.price).toFixed(2)}</p>
              <p className="text-sm text-gray-500">Omborda: {item.stock} ta</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
              >
                -
              </button>
              <span className="w-12 text-center">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
              >
                +
              </button>
              <button
                onClick={() => onRemove(item.id)}
                className="ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                O'chirish
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Jami:</span>
          <span className="text-2xl font-bold text-blue-600">
            ${totalAmount.toFixed(2)}
          </span>
        </div>
        
        <button
          onClick={onCheckout}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
        >
          Sotib olish
        </button>
      </div>
    </div>
  );
}

export default Cart;