const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getCategories(req, res) {
  try {
    const categories = await prisma.category.findMany({
      include: { subcategories: true },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    console.error('getCategories error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getCategories };
