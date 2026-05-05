const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { signToken } = require('../middleware/auth');
const prisma = new PrismaClient();

async function register(req, res) {
  try {
    const { email, password, first_name, last_name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password_hash, first_name, last_name },
    });

    const token = signToken(user);
    res.status(201).json({ id: user.id, email: user.email, token });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    res.json({
      id: user.id,
      email: user.email,
      name: [user.first_name, user.last_name].filter(Boolean).join(' '),
      token,
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { register, login };
