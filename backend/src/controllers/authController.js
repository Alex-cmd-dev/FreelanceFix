const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function register(req, res) {
  const { email, password, first_name, last_name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const password_hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password_hash, first_name, last_name },
  });

  res.status(201).json({ id: user.id, email: user.email });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  res.json({
    id: user.id,
    email: user.email,
    name: [user.first_name, user.last_name].filter(Boolean).join(' '),
  });
}

module.exports = { register, login };
