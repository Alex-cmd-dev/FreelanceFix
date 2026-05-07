const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /users/profile
// Returns the user record + their freelancer/client profile if it exists.
async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { freelancer: true, client: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { password_hash, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT /users/profile
// Updates the user's freelancer or client row. Creates the role row if it doesn't exist.
// Body can include: first_name, last_name, bio, portfolio_url, hourly_rate, company_name, role
async function updateProfile(req, res) {
  try {
    const { first_name, last_name, bio, portfolio_url, hourly_rate, company_name, role } = req.body;

    if (first_name !== undefined || last_name !== undefined) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(first_name !== undefined ? { first_name } : {}),
          ...(last_name !== undefined ? { last_name } : {}),
        },
      });
    }

    // Decide which role table to upsert based on either explicit `role` or which fields are present.
    const wantsFreelancer =
      role === 'freelancer' || bio !== undefined || portfolio_url !== undefined || hourly_rate !== undefined;
    const wantsClient = role === 'client' || company_name !== undefined;

    if (wantsFreelancer) {
      await prisma.freelancer.upsert({
        where: { id: req.user.id },
        update: {
          ...(bio !== undefined ? { bio } : {}),
          ...(portfolio_url !== undefined ? { portfolio_url } : {}),
          ...(hourly_rate !== undefined ? { hourly_rate } : {}),
        },
        create: {
          id: req.user.id,
          bio: bio || null,
          portfolio_url: portfolio_url || null,
          hourly_rate: hourly_rate || null,
        },
      });
    }

    if (wantsClient) {
      await prisma.client.upsert({
        where: { id: req.user.id },
        update: {
          ...(company_name !== undefined ? { company_name } : {}),
        },
        create: {
          id: req.user.id,
          company_name: company_name || null,
        },
      });
    }

    const updated = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { freelancer: true, client: true },
    });
    const { password_hash, ...safeUser } = updated;
    res.json(safeUser);
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /freelancers?query=&max_hourly_rate=
async function searchFreelancers(req, res) {
  try {
    const { query, max_hourly_rate } = req.query;

    const where = {};
    if (query) {
      where.OR = [
        { bio: { contains: query, mode: 'insensitive' } },
        { user: { first_name: { contains: query, mode: 'insensitive' } } },
        { user: { last_name: { contains: query, mode: 'insensitive' } } },
      ];
    }
    if (max_hourly_rate) {
      where.hourly_rate = { lte: parseFloat(max_hourly_rate) };
    }

    const freelancers = await prisma.freelancer.findMany({
      where,
      include: {
        user: { select: { id: true, first_name: true, last_name: true, email: true } },
      },
      take: 50,
    });

    res.json(freelancers);
  } catch (err) {
    console.error('searchFreelancers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /freelancers/:id
async function getFreelancerById(req, res) {
  try {
    const freelancer = await prisma.freelancer.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, first_name: true, last_name: true, email: true } },
      },
    });
    if (!freelancer) return res.status(404).json({ error: 'Freelancer not found' });
    res.json(freelancer);
  } catch (err) {
    console.error('getFreelancerById error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getProfile, updateProfile, searchFreelancers, getFreelancerById };
