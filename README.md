# Online shop

React, Express va MySQL asosida yozilgan sodda internet-do'kon.

## Texnologiyalar

- **Frontend:** React 18, React Router, Axios va Tailwind CSS
- **Backend:** Node.js, Express va MySQL (`mysql2`)
- **Ma'lumotlar bazasi:** MySQL

## Loyiha tuzilishi

```text
frontend/
  public/index.html       React ilovasi ulanadigan HTML qobiq
  src/index.js            React ilovasini va router'ni ishga tushiradi
  src/App.js              Sahifalar, savat holati va backend so'rovlari
  src/index.css           Umumiy CSS va Tailwind direktivalari
  src/components/
    ProductCard.js        Bitta mahsulot kartasi
    Cart.js               Savat sahifasi
    AdminPanel.js         Mahsulot qo'shish formasi va ro'yxati
  tailwind.config.js       Tailwind qaysi fayllarni tekshirishini belgilaydi

backend/
  server.js               Express API va MySQL bilan ishlash
  .env                    MySQL va server sozlamalari (Git'ga qo'shilmaydi)
```

## Ishga tushirish

### Talablar

- Node.js va npm
- Ishlayotgan MySQL serveri
- MySQL'da oldindan yaratilgan ma'lumotlar bazasi

### 1. Backend sozlash

`backend/.env` faylini yarating va quyidagi qiymatlarni o'zingizning MySQL sozlamalaringizga moslang:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=online_shop
```

`DB_NAME` bilan ko'rsatilgan baza MySQL'da oldindan mavjud bo'lishi kerak. Server `products` jadvalini o'zi yaratadi. Jadval bo'sh bo'lsa, sinov uchun bir nechta mahsulot qo'shadi.

Backend bog'liqliklarini o'rnating va serverni ishga tushiring:

```bash
cd backend
npm install
npm run dev
```

`npm start` ham serverni ishga tushiradi; `npm run dev` esa kod o'zgarganda `nodemon` orqali qayta yuklaydi. Backend odatda `http://localhost:5000` manzilida ishlaydi.

### 2. Frontend ishga tushirish

Yangi terminalda:

```bash
cd frontend
npm install
npm start
```

Frontend odatda `http://localhost:3000` manzilida ochiladi. API manzili `frontend/src/App.js` ichida `http://localhost:5000/api` qilib belgilangan.

## Asosiy imkoniyatlar

- Mahsulotlarni ko'rish va ombordagi mavjud sonini tekshirish
- Mahsulotni savatga qo'shish, miqdorini o'zgartirish va o'chirish
- Xaridni yakunlashda ombordagi qoldiqni kamaytirish
- Admin sahifasidan mahsulot qo'shish, ko'rish, tahrirlash va o'chirish
- Mahsulotni do'konda vaqtincha ko'rsatish yoki yashirish

## API

| Method | Yo'l | Vazifasi |
| --- | --- | --- |
| `GET` | `/api/products` | Do'konda ko'rsatiladigan mahsulotlarni qaytaradi |
| `POST` | `/api/products` | Yangi mahsulot yaratadi |
| `GET` | `/api/admin/products` | Admin uchun barcha mahsulotlarni qaytaradi |
| `GET` | `/api/admin/products/:id` | Bitta mahsulot ma'lumotlarini qaytaradi |
| `PUT` | `/api/admin/products/:id` | Mahsulot ma'lumotlarini tahrirlaydi |
| `PATCH` | `/api/admin/products/:id/visibility` | Mahsulotni do'konda ko'rsatish holatini o'zgartiradi |
| `DELETE` | `/api/admin/products/:id` | Mahsulotni o'chiradi |
| `POST` | `/api/checkout` | Savatdagi mahsulotlar mavjudligini tekshiradi va ombor qoldig'ini kamaytiradi |

Mahsulot yaratish so'rovi misoli:

```json
{
  "name": "Mahsulot nomi",
  "price": 25.5,
  "image": "https://example.com/product.jpg",
  "stock": 8
}
```

Checkout so'rovi misoli:

```json
{
  "items": [
    { "id": 1, "quantity": 2 }
  ]
}
```

Checkout backendda MySQL tranzaksiyasi orqali bajariladi. Mahsulot topilmasa yoki omborda yetarli son bo'lmasa, o'zgarishlar bekor qilinadi.

## Sahifalar

- `/` — mahsulotlar
- `/cart` — savat
- `/admin` — mahsulot qo'shish va mavjud mahsulotlar ro'yxati
- `/admin/products/:id` — bitta mahsulot ma'lumotlarini ko'rish yoki tahrirlash

## Muhim eslatmalar

- Savat hozircha faqat brauzer xotirasida saqlanadi; sahifa yangilanganda bo'shaydi.
- `is_visible` ustuni mavjud bo'lmasa, backend ishga tushganda `products` jadvaliga avtomatik qo'shiladi. Mavjud mahsulotlar do'konda ko'rinadigan holatda qoladi.
- Admin sahifasida hozircha login yoki ruxsat tekshiruvi yo'q. Haqiqiy do'konda mahsulot yaratish endpointini autentifikatsiya va avtorizatsiya bilan himoyalash zarur.
- Frontend API manzili `frontend/src/App.js` ichida to'g'ridan-to'g'ri `http://localhost:5000/api` deb ko'rsatilgan. Boshqa serverda joylashtirganda API manzilini moslashtirish kerak.
