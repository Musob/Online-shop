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
  try {
    const connection = await pool.getConnection();
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(500),
        stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
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
    
    connection.release();
    console.log('Ma\'lumotlar bazasi tayyor');
  } catch (error) {
    console.error('Ma\'lumotlar bazasi xatosi:', error);
  }
}

// GET - Barcha mahsulotlarni olish
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error('Mahsulotlarni olishda xatolik:', error);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// POST - Yangi mahsulot qo'shish
app.post('/api/products', async (req, res) => {
  const { name, price, image, stock } = req.body;
  
  // Validatsiya
  if (!name || !price || stock === undefined) {
    return res.status(400).json({ message: 'Barcha maydonlar to\'ldirilishi shart' });
  }
  
  try {
    const [result] = await pool.query(
      'INSERT INTO products (name, price, image, stock) VALUES (?, ?, ?, ?)',
      [name, price, image || '', stock]
    );
    
    res.status(201).json({
      id: result.insertId,
      name,
      price,
      image,
      stock,
      message: 'Mahsulot muvaffaqiyatli qo\'shildi'
    });
  } catch (error) {
    console.error('Mahsulot qo\'shishda xatolik:', error);
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
        'SELECT stock FROM products WHERE id = ? FOR UPDATE',
        [item.id]
      );
      
      if (rows.length === 0) {
        throw new Error(`Mahsulot topilmadi (ID: ${item.id})`);
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

// Serverni ishga tushirish
app.listen(PORT, async () => {
  console.log(`Server ${PORT}-portda ishlamoqda`);
  await initializeDatabase();
});