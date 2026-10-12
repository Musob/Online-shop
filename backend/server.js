const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const uploadDirectory = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${crypto.randomUUID()}${extension}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png'
    };
    if (allowedTypes[extension] !== file.mimetype) {
      const error = new Error('Faqat JPG, JPEG yoki PNG rasm yuklash mumkin');
      error.status = 400;
      return callback(error);
    }
    callback(null, true);
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDirectory, {
  dotfiles: 'deny',
  index: false,
  maxAge: '1d'
}));

function imagePathFromRequest(req) {
  return req.file ? `/uploads/${req.file.filename}` : (req.body.image || '');
}

async function removeUploadedFile(filename) {
  if (!filename) return;
  try {
    await fs.promises.unlink(path.join(uploadDirectory, path.basename(filename)));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Yuklangan rasmni tozalashda xatolik:', error);
    }
  }
}

async function removeStoredImage(image) {
  if (typeof image !== 'string' || !image.startsWith('/uploads/')) return;
  await removeUploadedFile(image.slice('/uploads/'.length));
}

async function hasValidImageSignature(file) {
  if (!file) return true;
  const imageFile = await fs.promises.open(file.path, 'r');
  try {
    const header = Buffer.alloc(8);
    const { bytesRead } = await imageFile.read(header, 0, header.length, 0);
    const isPng = bytesRead >= 8 &&
      header.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isJpeg = bytesRead >= 3 &&
      header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    return file.mimetype === 'image/png'
      ? isPng
      : file.mimetype === 'image/jpeg' && isJpeg;
  } finally {
    await imageFile.close();
  }
}

// Ma'lumotlar bazasiga ulanish
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Ma'lumotlar bazasi jadvalini yaratish
async function initializeDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'Boshqa',
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(500),
        stock INT DEFAULT 0,
        is_visible TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [columns] = await connection.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'products'
         AND COLUMN_NAME = 'is_visible'`
    );
    if (columns.length === 0) {
      await connection.query(
        'ALTER TABLE products ADD COLUMN is_visible TINYINT(1) NOT NULL DEFAULT 1'
      );
    }

    const [categoryColumns] = await connection.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'products'
         AND COLUMN_NAME = 'category'`
    );
    if (categoryColumns.length === 0) {
      await connection.query(
        "ALTER TABLE products ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'Boshqa'"
      );
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        parent_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const [parentColumns] = await connection.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'categories'
         AND COLUMN_NAME = 'parent_id'`
    );
    if (parentColumns.length === 0) {
      await connection.query(
        'ALTER TABLE categories ADD COLUMN parent_id INT NULL'
      );
    }
    await connection.query(`
      INSERT IGNORE INTO categories (name)
      SELECT DISTINCT COALESCE(NULLIF(TRIM(category), ''), 'Boshqa')
      FROM products
    `);
    await connection.query("INSERT IGNORE INTO categories (name) VALUES ('Boshqa')");
    
    // Test ma'lumotlar qo'shish (agar jadval bo'sh bo'lsa)
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM products');
    if (rows[0].count === 0) {
      const sampleProducts = [
        ['iPhone 13', 'Smartfonlar', 999.99, 'https://via.placeholder.com/300x300?text=iPhone+13', 10],
        ['Samsung Galaxy S21', 'Smartfonlar', 799.99, 'https://via.placeholder.com/300x300?text=Samsung+S21', 15],
        ['MacBook Pro', 'Noutbuklar', 1299.99, 'https://via.placeholder.com/300x300?text=MacBook+Pro', 5],
        ['Sony Headphones', 'Aksessuarlar', 199.99, 'https://via.placeholder.com/300x300?text=Sony+Headphones', 20],
        ['Gaming Mouse', 'Aksessuarlar', 49.99, 'https://via.placeholder.com/300x300?text=Gaming+Mouse', 30]
      ];
      
      const insertQuery = 'INSERT INTO products (name, category, price, image, stock) VALUES ?';
      await connection.query(insertQuery, [sampleProducts]);
      await connection.query(`
        INSERT IGNORE INTO categories (name)
        SELECT DISTINCT COALESCE(NULLIF(TRIM(category), ''), 'Boshqa')
        FROM products
      `);
      console.log('Test ma\'lumotlar qo\'shildi');
    }
    
    console.log('Ma\'lumotlar bazasi tayyor');
  } catch (error) {
    console.error('Ma\'lumotlar bazasi xatosi:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// GET - Barcha kategoriyalar
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, parent_id FROM categories ORDER BY name ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Kategoriyalarni olishda xatolik:', error);
    res.status(500).json({ message: 'Kategoriyalarni yuklab bo\'lmadi' });
  }
});

// POST - Yangi kategoriya yaratish
app.post('/api/categories', async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const rawParentId = req.body.parent_id;
  const parentId = rawParentId === undefined || rawParentId === null || rawParentId === ''
    ? null
    : Number(rawParentId);
  if (!name || name.length > 100 ||
      (parentId !== null && (!Number.isInteger(parentId) || parentId <= 0))) {
    return res.status(400).json({ message: 'Kategoriya nomi 1-100 belgi bo\'lishi kerak' });
  }

  try {
    if (parentId !== null) {
      const [parents] = await pool.query(
        'SELECT id FROM categories WHERE id = ?',
        [parentId]
      );
      if (parents.length === 0) {
        return res.status(400).json({ message: 'Tanlangan ota kategoriya topilmadi' });
      }
    }
    const [result] = await pool.query(
      'INSERT INTO categories (name, parent_id) VALUES (?, ?)',
      [name, parentId]
    );
    res.status(201).json({ id: result.insertId, name, parent_id: parentId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Bu kategoriya avval qo\'shilgan' });
    }
    console.error('Kategoriya qo\'shishda xatolik:', error);
    res.status(500).json({ message: 'Kategoriyani saqlab bo\'lmadi' });
  }
});

// PUT - Kategoriya nomi va ota kategoriyasini tahrirlash
app.put('/api/categories/:id', async (req, res) => {
  const categoryId = Number(req.params.id);
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const rawParentId = req.body.parent_id;
  const parentId = rawParentId === undefined || rawParentId === null || rawParentId === ''
    ? null
    : Number(rawParentId);
  if (!Number.isInteger(categoryId) || categoryId <= 0 ||
      !name || name.length > 100 ||
      (parentId !== null && (!Number.isInteger(parentId) || parentId <= 0))) {
    return res.status(400).json({ message: 'Kategoriya ma\'lumotlari noto\'g\'ri' });
  }
  if (parentId === categoryId) {
    return res.status(400).json({ message: 'Kategoriya o\'ziga ota bo\'la olmaydi' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [categoryRows] = await connection.query(
      'SELECT id, name, parent_id FROM categories FOR UPDATE'
    );
    const currentCategory = categoryRows.find((category) => category.id === categoryId);
    if (!currentCategory) {
      await connection.rollback();
      return res.status(404).json({ message: 'Kategoriya topilmadi' });
    }
    if (parentId !== null) {
      const parentCategory = categoryRows.find((category) => category.id === parentId);
      if (!parentCategory) {
        await connection.rollback();
        return res.status(400).json({ message: 'Tanlangan ota kategoriya topilmadi' });
      }
      let ancestor = parentCategory;
      const visitedAncestors = new Set();
      while (ancestor && !visitedAncestors.has(ancestor.id)) {
        visitedAncestors.add(ancestor.id);
        if (ancestor.id === categoryId) {
          await connection.rollback();
          return res.status(400).json({ message: 'Kategoriya o\'zining ichki kategoriyasiga ko\'chirilmaydi' });
        }
        if (ancestor.parent_id === null) break;
        ancestor = categoryRows.find((category) => category.id === ancestor.parent_id);
      }
    }

    await connection.query(
      'UPDATE categories SET name = ?, parent_id = ? WHERE id = ?',
      [name, parentId, categoryId]
    );
    if (currentCategory.name !== name) {
      await connection.query(
        'UPDATE products SET category = ? WHERE category = ?',
        [name, currentCategory.name]
      );
    }
    await connection.commit();
    res.json({ id: categoryId, name, parent_id: parentId });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Bu kategoriya nomi avval ishlatilgan' });
    }
    console.error('Kategoriyani tahrirlashda xatolik:', error);
    res.status(500).json({ message: 'Kategoriyani tahrirlab bo\'lmadi' });
  } finally {
    connection.release();
  }
});

// DELETE - Bo'sh kategoriya va uning alohida bo'lmagan bog'lanishlarini o'chirish
app.delete('/api/categories/:id', async (req, res) => {
  const categoryId = Number(req.params.id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return res.status(400).json({ message: 'Kategoriya identifikatori noto\'g\'ri' });
  }

  try {
    const [categories] = await pool.query(
      'SELECT id, name FROM categories WHERE id = ?',
      [categoryId]
    );
    if (categories.length === 0) {
      return res.status(404).json({ message: 'Kategoriya topilmadi' });
    }
    const [[childCount]] = await pool.query(
      'SELECT COUNT(*) AS count FROM categories WHERE parent_id = ?',
      [categoryId]
    );
    if (childCount.count > 0) {
      return res.status(409).json({ message: 'Avval ushbu kategoriyaning ichki kategoriyalarini ko\'chiring yoki o\'chiring' });
    }
    const [[productCount]] = await pool.query(
      'SELECT COUNT(*) AS count FROM products WHERE category = ?',
      [categories[0].name]
    );
    if (productCount.count > 0) {
      return res.status(409).json({ message: 'Bu kategoriyaga biriktirilgan mahsulotlar bor. Avval mahsulot kategoriyasini o\'zgartiring' });
    }
    await pool.query('DELETE FROM categories WHERE id = ?', [categoryId]);
    res.status(204).end();
  } catch (error) {
    console.error('Kategoriyani o\'chirishda xatolik:', error);
    res.status(500).json({ message: 'Kategoriyani o\'chirib bo\'lmadi' });
  }
});

// GET - Barcha mahsulotlarni olish
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE is_visible = 1 ORDER BY id DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Mahsulotlarni olishda xatolik:', error);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// GET - Do'konda ko'rinadigan bitta mahsulot
app.get('/api/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE id = ? AND is_visible = 1',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Mahsulot topilmadi' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Mahsulotni olishda xatolik:', error);
    res.status(500).json({ message: 'Mahsulotni yuklab bo\'lmadi' });
  }
});

// GET - Admin uchun barcha mahsulotlar
app.get('/api/admin/products', async (req, res) => {
  const requestedPage = Number.parseInt(req.query.page, 10);
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, 100)
    : 20;
  const offset = (page - 1) * limit;
  try {
    const [[stats]] = await pool.query(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(is_visible = 1), 0) AS visible,
              COALESCE(SUM(stock > 0), 0) AS in_stock
       FROM products`
    );
    const [rows] = await pool.query(
      'SELECT * FROM products ORDER BY id DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    res.json({
      products: rows,
      total: Number(stats.total),
      visible: Number(stats.visible),
      inStock: Number(stats.in_stock),
      page,
      limit
    });
  } catch (error) {
    console.error('Admin mahsulotlarini olishda xatolik:', error);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// GET - Admin uchun bitta mahsulot
app.get('/api/admin/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Mahsulot topilmadi' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Mahsulotni olishda xatolik:', error);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// POST - Yangi mahsulot qo'shish
app.post('/api/products', imageUpload.single('imageFile'), async (req, res) => {
  const { name, category = 'Boshqa', price, image, stock, is_visible = true } = req.body;

  if (!(await hasValidImageSignature(req.file))) {
    await removeUploadedFile(req.file.filename);
    return res.status(400).json({ message: 'Yuklangan fayl haqiqiy JPG yoki PNG rasm emas' });
  }
  
  // Validatsiya
  if (!name || typeof category !== 'string' || !category.trim() || category.trim().length > 100 ||
      !Number.isFinite(Number(price)) || Number(price) < 0 ||
      !Number.isInteger(Number(stock)) || Number(stock) < 0) {
    await removeUploadedFile(req.file?.filename);
    return res.status(400).json({ message: 'Barcha maydonlar to\'ldirilishi shart' });
  }
  
  const productImage = imagePathFromRequest(req);
  try {
    await pool.query('INSERT IGNORE INTO categories (name) VALUES (?)', [category.trim()]);
    const [result] = await pool.query(
      'INSERT INTO products (name, category, price, image, stock, is_visible) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category.trim(), price, productImage, stock, is_visible ? 1 : 0]
    );
    
    res.status(201).json({
      id: result.insertId,
      name,
      category: category.trim(),
      price,
      image: productImage,
      stock,
      is_visible: Boolean(is_visible),
      message: 'Mahsulot muvaffaqiyatli qo\'shildi'
    });
  } catch (error) {
    await removeUploadedFile(req.file?.filename);
    console.error('Mahsulot qo\'shishda xatolik:', error);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// PUT - Mahsulot ma'lumotlarini tahrirlash
app.put('/api/admin/products/:id', imageUpload.single('imageFile'), async (req, res) => {
  const { name, category = 'Boshqa', price, image, stock, is_visible } = req.body;
  const validVisibility = [true, false, 'true', 'false'].includes(is_visible);
  const productIsVisible = is_visible === true || is_visible === 'true';
  if (!(await hasValidImageSignature(req.file))) {
    await removeUploadedFile(req.file.filename);
    return res.status(400).json({ message: 'Yuklangan fayl haqiqiy JPG yoki PNG rasm emas' });
  }
  if (!name || typeof category !== 'string' || !category.trim() || category.trim().length > 100 ||
      !Number.isFinite(Number(price)) || Number(price) < 0 ||
      !Number.isInteger(Number(stock)) || Number(stock) < 0 ||
      !validVisibility) {
    await removeUploadedFile(req.file?.filename);
    return res.status(400).json({ message: 'Mahsulot ma\'lumotlari noto\'g\'ri' });
  }

  const productImage = imagePathFromRequest(req);
  try {
    await pool.query('INSERT IGNORE INTO categories (name) VALUES (?)', [category.trim()]);
    const [existingRows] = await pool.query(
      'SELECT image FROM products WHERE id = ?',
      [req.params.id]
    );
    if (existingRows.length === 0) {
      await removeUploadedFile(req.file?.filename);
      return res.status(404).json({ message: 'Mahsulot topilmadi' });
    }

    await pool.query(
      'UPDATE products SET name = ?, category = ?, price = ?, image = ?, stock = ?, is_visible = ? WHERE id = ?',
      [name, category.trim(), price, productImage, stock, productIsVisible ? 1 : 0, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      await removeUploadedFile(req.file?.filename);
      return res.status(404).json({ message: 'Mahsulot topilmadi' });
    }
    if (existingRows[0].image !== productImage) {
      await removeStoredImage(existingRows[0].image);
    }
    res.json(rows[0]);
  } catch (error) {
    await removeUploadedFile(req.file?.filename);
    console.error('Mahsulotni tahrirlashda xatolik:', error);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// PATCH - Do'konda ko'rinish holatini almashtirish
app.patch('/api/admin/products/:id/visibility', async (req, res) => {
  const { is_visible } = req.body;
  if (typeof is_visible !== 'boolean') {
    return res.status(400).json({ message: 'Ko\'rinish holati noto\'g\'ri' });
  }

  try {
    await pool.query(
      'UPDATE products SET is_visible = ? WHERE id = ?',
      [is_visible ? 1 : 0, req.params.id]
    );
    const [rows] = await pool.query('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Mahsulot topilmadi' });
    }
    res.json({ id: Number(req.params.id), is_visible });
  } catch (error) {
    console.error('Mahsulot ko\'rinishini o\'zgartirishda xatolik:', error);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// DELETE - Mahsulotni o'chirish
app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT image FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Mahsulot topilmadi' });
    }
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    await removeStoredImage(rows[0].image);
    res.status(204).end();
  } catch (error) {
    console.error('Mahsulotni o\'chirishda xatolik:', error);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// POST - Checkout (sotib olish)
app.post('/api/checkout', async (req, res) => {
  const { items } = req.body; // items: [{ id, quantity }]
  
  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Savat bo\'sh' });
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Har bir mahsulot uchun stockni tekshirish va yangilash
    for (const item of items) {
      const [rows] = await connection.query(
        'SELECT stock, is_visible FROM products WHERE id = ? FOR UPDATE',
        [item.id]
      );
      
      if (rows.length === 0) {
        throw new Error(`Mahsulot topilmadi (ID: ${item.id})`);
      }

      if (!rows[0].is_visible) {
        throw new Error(`Mahsulot hozir do'konda mavjud emas: ${item.id}`);
      }
      
      const currentStock = rows[0].stock;
      if (currentStock < item.quantity) {
        throw new Error(`Yetarli miqdor mavjud emas: ${item.id}`);
      }
      
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.id]
      );
    }
    
    await connection.commit();
    res.json({ message: 'Xarid muvaffaqiyatli amalga oshirildi' });
  } catch (error) {
    await connection.rollback();
    console.error('Checkout xatosi:', error);
    res.status(400).json({ message: error.message || 'Xarid amalga oshmadi' });
  } finally {
    connection.release();
  }
});

app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Rasm hajmi 5 MB dan oshmasligi kerak'
      : 'Rasmni yuklashda xatolik';
    return res.status(400).json({ message });
  }
  if (error.status === 400) {
    return res.status(400).json({ message: error.message });
  }
  console.error('So\'rovni bajarishda kutilmagan xatolik:', error);
  res.status(500).json({ message: 'Server xatosi' });
});

// Baza tayyor bo'lgandan keyin serverni tinglashni boshlash
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server ${PORT}-portda ishlamoqda`);
    });
  } catch (error) {
    console.error('Serverni ishga tushirib bo\'lmadi:', error);
    await pool.end();
    process.exitCode = 1;
  }
}

startServer();