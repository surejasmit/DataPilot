const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const signup = async (req, res, pool) => {
  try {
    console.log('Signup request body:', JSON.stringify(req.body));
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      console.log('Missing fields:', { email, password: password ? 'provided' : 'missing', name });
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Signup error:', err);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
};

module.exports = signup;