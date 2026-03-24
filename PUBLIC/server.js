require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

// ============================
// DATABASE POOL
// ============================
const pool = mysql.createPool({
  host:'localhost',
  user:'root',
  password:'vtu24954',
  database:'skill_academy',
  waitForConnections: true,
  connectionLimit: 10,
});

// ============================
// INIT DATABASE
// ============================
async function initDB() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(100) NOT NULL,
        email       VARCHAR(150) NOT NULL UNIQUE,
        password    VARCHAR(255) NOT NULL,
        role        ENUM('student','instructor','admin') DEFAULT 'student',
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        title       VARCHAR(200) NOT NULL,
        instructor  VARCHAR(100),
        category    VARCHAR(50),
        price       DECIMAL(10,2) DEFAULT 0.00,
        level       VARCHAR(50),
        duration    VARCHAR(50),
        description TEXT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        user_id     INT NOT NULL,
        course_id   INT NOT NULL,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        progress    INT DEFAULT 0,
        UNIQUE KEY uq_enrollment (user_id, course_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        user_id     INT NOT NULL,
        course_id   INT NOT NULL,
        rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment     TEXT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Database tables ready');
  } finally {
    conn.release();
  }
}

// ============================
// MIDDLEWARE
// ============================
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'skillacademy_secret_2025');
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// ============================
// AUTH ROUTES
// ============================

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashed]
    );
    const user = { id: result.insertId, name, email, role: 'student' };
    const token = jwt.sign(user, process.env.JWT_SECRET || 'skillacademy_secret_2025', { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'skillacademy_secret_2025', { expiresIn: '7d' });
    res.json({ user: payload, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get profile
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id,name,email,role,created_at FROM users WHERE id=?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================
// COURSES ROUTES
// ============================
app.get('/api/courses', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM courses WHERE 1=1';
    const params = [];
    if (category && category !== 'all') { query += ' AND category = ?'; params.push(category); }
    if (search) { query += ' AND (title LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Course not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================
// ENROLLMENT ROUTES
// ============================
app.post('/api/enroll', authMiddleware, async (req, res) => {
  const { courseId } = req.body;
  try {
    await pool.query(
      'INSERT IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)',
      [req.user.id, courseId]
    );
    res.json({ message: 'Enrolled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Fallback enroll without auth (stores with userId from body)
app.post('/api/enroll', async (req, res) => {
  const { userId, courseId } = req.body;
  if (!userId || !courseId) return res.status(400).json({ message: 'userId and courseId required' });
  try {
    await pool.query(
      'INSERT IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)',
      [userId, courseId]
    );
    res.json({ message: 'Enrolled' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/enrollments', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, c.title, c.category, c.instructor, c.price, c.level, c.duration
       FROM enrollments e JOIN courses c ON e.course_id = c.id
       WHERE e.user_id = ? ORDER BY e.enrolled_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update progress
app.patch('/api/enrollments/:courseId/progress', authMiddleware, async (req, res) => {
  const { progress } = req.body;
  try {
    await pool.query(
      'UPDATE enrollments SET progress = ? WHERE user_id = ? AND course_id = ?',
      [Math.min(100, Math.max(0, progress || 0)), req.user.id, req.params.courseId]
    );
    res.json({ message: 'Progress updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================
// REVIEWS
// ============================
app.post('/api/reviews', authMiddleware, async (req, res) => {
  const { courseId, rating, comment } = req.body;
  if (!courseId || !rating) return res.status(400).json({ message: 'courseId and rating required' });
  try {
    await pool.query(
      'INSERT INTO reviews (user_id, course_id, rating, comment) VALUES (?, ?, ?, ?)',
      [req.user.id, courseId, rating, comment || '']
    );
    res.status(201).json({ message: 'Review submitted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/courses/:id/reviews', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.name as user_name FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.course_id = ? ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================
// ADMIN: STATS
// ============================
app.get('/api/admin/stats', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const [[{ users }]] = await pool.query('SELECT COUNT(*) as users FROM users');
    const [[{ courses }]] = await pool.query('SELECT COUNT(*) as courses FROM courses');
    const [[{ enrollments }]] = await pool.query('SELECT COUNT(*) as enrollments FROM enrollments');
    res.json({ users, courses, enrollments });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================
// START SERVER
// ============================
const PORT = process.env.PORT || 3000;
initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 SkillAcademy running at http://localhost:${PORT}`));
}).catch(err => {
  console.error('❌ DB init failed:', err.message);
  process.exit(1);
});