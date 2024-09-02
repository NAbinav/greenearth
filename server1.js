const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure PostgreSQL Pool using environment variables for security
const pool = new Pool({
  user: "postgres",
  host: "Localhost",
  password: "Mukeshkhanna@2005",
  database: "world",
  port: 5432
});

// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, './views/index_1.html'));
});

// Serve registration page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, './views/index_3.html'));
});

// User login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM greenusers WHERE username = $1', [username]);

    if (result.rows.length > 0) {
      const user = result.rows[0];

      // Compare password with hashed password in the database
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        res.json({ token: 'dummy-jwt-token', message: 'Login successful!' });
      } else {
        res.status(400).json({ message: 'Invalid username or password' });
      }
    } else {
      res.status(400).json({ message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// User registration endpoint
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please provide a username, email, and password.' });
  }

  try {
    // Check if user already exists
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: 'Username or email already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    await pool.query(
      'INSERT INTO users (name, email, pwd) VALUES ($1, $2, $3)',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
