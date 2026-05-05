const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /gigs?category_id=&subcategory_id=
async function browseGigs(req, res) {
  try {
    const { category_id, subcategory_id } = req.query;

    const where = {};
    if (subcategory_id) {
      where.subcategory_id = parseInt(subcategory_id);
    } else if (category_id) {
      where.subcategory = { category_id: parseInt(category_id) };
    }

    const gigs = await prisma.gig.findMany({
      where,
      include: {
        freelancer: {
          include: { user: { select: { first_name: true, last_name: true } } },
        },
        subcategory: { include: { category: true } },
        packages: true,
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });

    res.json(gigs);
  } catch (err) {
    console.error('browseGigs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /gigs/:gigId
async function getGigById(req, res) {
  try {
    const gigId = parseInt(req.params.gigId);
    if (Number.isNaN(gigId)) return res.status(400).json({ error: 'Invalid gig id' });

    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      include: {
        freelancer: {
          include: { user: { select: { first_name: true, last_name: true, email: true } } },
        },
        subcategory: { include: { category: true } },
        packages: { orderBy: { price: 'asc' } },
      },
    });

    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    res.json(gig);
  } catch (err) {
    console.error('getGigById error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /gigs (Freelancers only)
async function createGig(req, res) {
  try {
    const { title, description, base_price, subcategory_id } = req.body;
    if (!title || !description || base_price === undefined || !subcategory_id) {
      return res.status(400).json({ error: 'title, description, base_price, and subcategory_id are required' });
    }

    // Make sure the user has a freelancer profile.
    const freelancer = await prisma.freelancer.findUnique({ where: { id: req.user.id } });
    if (!freelancer) {
      return res.status(403).json({ error: 'Only freelancers can create gigs. Please complete your freelancer profile first.' });
    }

    const gig = await prisma.gig.create({
      data: {
        freelancer_id: req.user.id,
        subcategory_id: parseInt(subcategory_id),
        title,
        description,
        base_price: parseFloat(base_price),
      },
      include: { packages: true },
    });

    res.status(201).json(gig);
  } catch (err) {
    console.error('createGig error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /gigs/:gigId/packages
async function createOrUpdatePackage(req, res) {
  try {
    const gigId = parseInt(req.params.gigId);
    const { tier, price, description, delivery_days } = req.body;

    if (!tier || price === undefined || !description || !delivery_days) {
      return res.status(400).json({ error: 'tier, price, description, and delivery_days are required' });
    }

    // Ownership check
    const gig = await prisma.gig.findUnique({ where: { id: gigId } });
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.freelancer_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not own this gig' });
    }

    // Upsert based on (gig_id, tier) unique constraint
    const pkg = await prisma.gigPackage.upsert({
      where: { gig_id_tier: { gig_id: gigId, tier } },
      update: { price: parseFloat(price), description, delivery_days: parseInt(delivery_days) },
      create: {
        gig_id: gigId,
        tier,
        price: parseFloat(price),
        description,
        delivery_days: parseInt(delivery_days),
      },
    });

    res.status(201).json(pkg);
  } catch (err) {
    console.error('createOrUpdatePackage error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE /gigs/:gigId
// Required for the project rubric: deletes a tuple from the GIG relation.
// Only the gig's owning freelancer can delete it.
async function deleteGig(req, res) {
  try {
    const gigId = parseInt(req.params.gigId);
    if (Number.isNaN(gigId)) return res.status(400).json({ error: 'Invalid gig id' });

    const gig = await prisma.gig.findUnique({ where: { id: gigId } });
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.freelancer_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not own this gig' });
    }

    await prisma.gig.delete({ where: { id: gigId } });
    res.json({ message: 'Gig deleted', id: gigId });
  } catch (err) {
    console.error('deleteGig error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { browseGigs, getGigById, createGig, createOrUpdatePackage, deleteGig };
