const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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
    
    // Test ma'lumotlar qo'shish (agar jadval bo'sh bo'lsa)
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM products');
    if (rows[0].count === 0) {
      const sampleProducts = [
        ['iPhone 13', 999.99, 'https://via.placeholder.com/300x300?text=iPhone+13', 10],
        ['Samsung Galaxy S21', 799.99, 'https://via.placeholder.com/300x300?text=Samsung+S21', 15],
        ['MacBook Pro', 1299.99, 'https://via.placeholder.com/300x300?text=MacBook+Pro', 5],
        ['Sony Headphones', 199.99, 'https://via.placeholder.com/300x300?text=Sony+Headphones', 20],
        ['Gaming Mouse', 49.99, 'https://via.placeholder.com/300x300?text=Gaming+Mouse', 30]
      ];
      
      const insertQuery = 'INSERT INTO products (name, price, image, stock) VALUES ?';
      await connection.query(insertQuery, [sampleProducts]);
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

// GET - Admin uchun barcha mahsulotlar
app.get('/api/admin/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(rows);
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
app.post('/api/products', async (req, res) => {
  const { name, price, image, stock, is_visible = true } = req.body;
  
  // Validatsiya
  if (!name || !Number.isFinite(Number(price)) || Number(price) < 0 ||
      !Number.isInteger(Number(stock)) || Number(stock) < 0) {
    return res.status(400).json({ message: 'Barcha maydonlar to\'ldirilishi shart' });
  }
  
  try {
    const [result] = await pool.query(
      'INSERT INTO products (name, price, image, stock, is_visible) VALUES (?, ?, ?, ?, ?)',
      [name, price, image || '', stock, is_visible ? 1 : 0]
    );
    
    res.status(201).json({
      id: result.insertId,
      name,
      price,
      image,
      stock,
      is_visible: Boolean(is_visible),
      message: 'Mahsulot muvaffaqiyatli qo\'shildi'
    });
  } catch (error) {
    console.error('Mahsulot qo\'shishda xatolik:', error);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// PUT - Mahsulot ma'lumotlarini tahrirlash
app.put('/api/admin/products/:id', async (req, res) => {
  const { name, price, image, stock, is_visible } = req.body;
  if (!name || !Number.isFinite(Number(price)) || Number(price) < 0 ||
      !Number.isInteger(Number(stock)) || Number(stock) < 0 ||
      typeof is_visible !== 'boolean') {
    return res.status(400).json({ message: 'Mahsulot ma\'lumotlari noto\'g\'ri' });
  }

  try {
    await pool.query(
      'UPDATE products SET name = ?, price = ?, image = ?, stock = ?, is_visible = ? WHERE id = ?',
      [name, price, image || '', stock, is_visible ? 1 : 0, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Mahsulot topilmadi' });
    }
    res.json(rows[0]);
  } catch (error) {
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
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Mahsulot topilmadi' });
    }
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