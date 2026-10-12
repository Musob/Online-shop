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
    ProductImageInput.js  Rasm yuklash, havola va oldindan ko'rish
    Cart.js               Savat sahifasi
    AdminPanel.js         Kategoriya boshqaruvi va admin bosh sahifasi
    AdminProductsPage.js  20 tadan serverda sahifalangan mahsulotlar
    CategoryManager.js    Ichma-ich kategoriyalarni yaratish va tahrirlash
  src/utils/
    productImages.js      Yuklangan rasm manzili va fallback rasm
    categoryTree.js       Kategoriya yo'llari va ichki bo'limlar
  tailwind.config.js       Tailwind qaysi fayllarni tekshirishini belgilaydi

backend/
  server.js               Express API va MySQL bilan ishlash
  .env                    MySQL va server sozlamalari (Git'ga qo'shilmaydi)
  uploads/                Admin yuklagan mahsulot rasmlari (Git'ga qo'shilmaydi)
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

Mahsulot rasmini admin paneldan JPG yoki PNG fayl sifatida yuklash mumkin (5 MB gacha); fayllar `backend/uploads/` ichida saqlanadi va DB'da nisbiy manzili yoziladi. Bu papka Git'ga kiritilmaydi, shuning uchun production serverda uploads papkasini doimiy disk yoki alohida fayl saqlash xizmatiga ulash zarur.

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
- Katalog menyusidan mahsulot bo'limini tanlash; kategoriya ro'yxatida mahsulotlar soni ko'rsatiladi
- Mahsulot nomi va kategoriyasi bo'yicha so'zma-so'z qidirish (katta-kichik harf va o'zbek apostroflariga chidamli)
- Kategoriya, narx oralig'i va omborda mavjudligiga ko'ra filtrlash; narx, nom yoki yangiligi bo'yicha saralash
- Qidiruv va tanlangan filtrlarni ulashish mumkin bo'lishi uchun ularni URL'da saqlash
- Mahsulotni savatga qo'shish, miqdorini o'zgartirish va o'chirish
- Xaridni yakunlashda ombordagi qoldiqni kamaytirish
- Admin sahifasidan mahsulot qo'shish, ko'rish, tahrirlash va o'chirish
- Admin sahifasida kategoriyalarni qo'shish, nomi/ota kategoriyasini tahrirlash va bo'sh kategoriyalarni o'chirish
- Cheksiz ichma-ich kategoriya daraxti (masalan: Kiyimlar → Erkaklar kiyimi → Kuzgi kiyimlar); ota kategoriya filtri ichki kategoriyalardagi mahsulotlarni ham topadi
- Admin bosh sahifasida faqat oxirgi 5 mahsulot; to'liq ro'yxat 20 tadan server pagination orqali yuklanadi
- Mahsulotni do'konda vaqtincha ko'rsatish yoki yashirish
- Mahsulot rasmini JPG/PNG sifatida yuklash yoki havola kiritish; katalog rasmlari 3:4 nisbatda ko'rsatiladi

## API

| Method | Yo'l | Vazifasi |
| --- | --- | --- |
| `GET` | `/api/categories` | Barcha kategoriyalarni qaytaradi |
| `POST` | `/api/categories` | Kategoriya yaratadi (`{ "name": "Erkaklar kiyimi", "parent_id": 1 }`; `parent_id` ixtiyoriy) |
| `PUT` | `/api/categories/:id` | Kategoriya nomi yoki ota kategoriyasini o'zgartiradi |
| `DELETE` | `/api/categories/:id` | Ichki kategoriyasi va unga biriktirilgan mahsuloti bo'lmagan kategoriyani o'chiradi |
| `GET` | `/api/products` | Do'konda ko'rsatiladigan mahsulotlarni qaytaradi |
| `POST` | `/api/products` | Yangi mahsulot yaratadi |
| `GET` | `/api/admin/products?page=1&limit=20` | Mahsulotlarning sahifasini (ko'pi bilan 100 ta) va jami statistikani qaytaradi |
| `GET` | `/api/admin/products/:id` | Bitta mahsulot ma'lumotlarini qaytaradi |
| `PUT` | `/api/admin/products/:id` | Mahsulot ma'lumotlarini tahrirlaydi |
| `PATCH` | `/api/admin/products/:id/visibility` | Mahsulotni do'konda ko'rsatish holatini o'zgartiradi |
| `DELETE` | `/api/admin/products/:id` | Mahsulotni o'chiradi |
| `POST` | `/api/checkout` | Savatdagi mahsulotlar mavjudligini tekshiradi va ombor qoldig'ini kamaytiradi |

Mahsulot yaratish so'rovi misoli:

```json
{
  "name": "Mahsulot nomi",
  "category": "Aksessuarlar",
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
- `/admin` — boshqaruv, kategoriya daraxti, mahsulot qo'shish va oxirgi 5 mahsulot
- `/admin/products` — barcha mahsulotlarning 20 tadan sahifalangan ro'yxati
- `/admin/products/:id` — bitta mahsulot ma'lumotlarini ko'rish yoki tahrirlash

## Muhim eslatmalar

- Savat hozircha faqat brauzer xotirasida saqlanadi; sahifa yangilanganda bo'shaydi.
- `is_visible` ustuni mavjud bo'lmasa, backend ishga tushganda `products` jadvaliga avtomatik qo'shiladi. Mavjud mahsulotlar do'konda ko'rinadigan holatda qoladi.
- `category` ustuni mavjud bo'lmasa, backend uni `Boshqa` standart qiymati bilan qo'shadi; eski mahsulotlar shu kategoriyada qoladi.
- Backend `categories` jadvalini o'zi yaratadi va eski mahsulotlarning kategoriyalarini unga ko'chiradi. `parent_id` ustuni mavjud bazaga avtomatik qo'shiladi. Kategoriya boshqaruvida ichki kategoriya yarating, tahrirlang yoki bo'sh kategoriyani o'chiring; kategoriya nomi o'zgarganda shu nomga biriktirilgan mahsulotlar ham yangilanadi.
- Admin mahsulot API'si `page` va `limit` parametrlarini qabul qiladi. Boshqaruv sahifasi jami son/statistikani olish bilan birga faqat so'nggi 5 qatorni yuklaydi; to'liq ro'yxat har so'rovda 20 ta mahsulotni oladi.
- Admin sahifasida hozircha login yoki ruxsat tekshiruvi yo'q. Haqiqiy do'konda mahsulot yaratish endpointini autentifikatsiya va avtorizatsiya bilan himoyalash zarur.
- Frontend API manzili `frontend/src/App.js` ichida to'g'ridan-to'g'ri `http://localhost:5000/api` deb ko'rsatilgan. Boshqa serverda joylashtirganda API manzilini moslashtirish kerak.
