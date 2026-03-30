const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Create admin user (run only once)
router.post('/setup', async (req, res) => {
  try {
    const existingUser = await User.findOne({ username: 'admin' });
    if (existingUser) {
      return res.json({ message: "Admin user already exists" });
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = new User({ username: 'admin', password: hashedPassword });
    await user.save();

    res.json({ 
      message: "✅ Admin user created!",
      login: { username: "admin", password: "admin123" }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

  res.json({ token, username: user.username });
});

module.exports = router;