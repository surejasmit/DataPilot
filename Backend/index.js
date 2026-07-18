const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pg = require('pg');
const multer = require('multer');

const signup = require('./src/auth/Signup');
const login = require('./src/auth/Login');
const authMiddleware = require('./src/auth/authMiddleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: 'uploads/' });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.post('/api/auth/register', (req, res) => {
  console.log('Register endpoint hit, body:', req.body);
  signup(req, res, pool);
});
app.post('/api/auth/login', (req, res) => login(req, res, pool));
app.get('/api/users/me', (req, res, next) => authMiddleware(req, res, next, pool), (req, res) => {
  res.json(req.user);
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ filename: req.file.filename, path: req.file.path });
});

app.use((err, req, res, next) => {
  console.error('Global error handler:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;