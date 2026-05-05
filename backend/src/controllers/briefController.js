const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /briefs
async function listBriefs(req, res) {
  try {
    const briefs = await prisma.projectBrief.findMany({
      where: { status: 'Open' },
      include: {
        client: { include: { user: { select: { first_name: true, last_name: true } } } },
        offers: { select: { id: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(briefs);
  } catch (err) {
    console.error('listBriefs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /briefs (Clients only)
async function createBrief(req, res) {
  try {
    const { title, description, budget_min, budget_max } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'title and description are required' });
    }

    const client = await prisma.client.findUnique({ where: { id: req.user.id } });
    if (!client) {
      return res.status(403).json({ error: 'Only clients can post briefs. Please complete your client profile first.' });
    }

    const brief = await prisma.projectBrief.create({
      data: {
        client_id: req.user.id,
        title,
        description,
        budget_min: budget_min !== undefined ? parseFloat(budget_min) : null,
        budget_max: budget_max !== undefined ? parseFloat(budget_max) : null,
        status: 'Open',
      },
    });
    res.status(201).json(brief);
  } catch (err) {
    console.error('createBrief error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /briefs/:briefId/offers (Clients only - the brief owner)
async function listOffers(req, res) {
  try {
    const briefId = parseInt(req.params.briefId);
    const brief = await prisma.projectBrief.findUnique({ where: { id: briefId } });
    if (!brief) return res.status(404).json({ error: 'Brief not found' });
    if (brief.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the brief owner can view offers' });
    }

    const offers = await prisma.briefOffer.findMany({
      where: { project_brief_id: briefId },
      include: {
        freelancer: { include: { user: { select: { first_name: true, last_name: true } } } },
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(offers);
  } catch (err) {
    console.error('listOffers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /briefs/:briefId/offers (Freelancers only)
async function submitOffer(req, res) {
  try {
    const briefId = parseInt(req.params.briefId);
    const { offer_amount, description } = req.body;
    if (offer_amount === undefined || !description) {
      return res.status(400).json({ error: 'offer_amount and description are required' });
    }

    const brief = await prisma.projectBrief.findUnique({ where: { id: briefId } });
    if (!brief) return res.status(404).json({ error: 'Brief not found' });
    if (brief.status !== 'Open') return res.status(400).json({ error: 'This brief is no longer open' });

    const freelancer = await prisma.freelancer.findUnique({ where: { id: req.user.id } });
    if (!freelancer) {
      return res.status(403).json({ error: 'Only freelancers can submit offers' });
    }

    const offer = await prisma.briefOffer.create({
      data: {
        project_brief_id: briefId,
        freelancer_id: req.user.id,
        offer_amount: parseFloat(offer_amount),
        description,
        status: 'Pending',
      },
    });
    res.status(201).json(offer);
  } catch (err) {
    console.error('submitOffer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// PATCH /briefs/:briefId/offers/:offerId/status (Clients only - the brief owner)
async function updateOfferStatus(req, res) {
  try {
    const briefId = parseInt(req.params.briefId);
    const offerId = parseInt(req.params.offerId);
    const { status } = req.body;
    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'status must be Accepted or Rejected' });
    }

    const brief = await prisma.projectBrief.findUnique({ where: { id: briefId } });
    if (!brief) return res.status(404).json({ error: 'Brief not found' });
    if (brief.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the brief owner can update offers' });
    }

    const existingOffer = await prisma.briefOffer.findUnique({ where: { id: offerId } });
    if (!existingOffer) return res.status(404).json({ error: 'Offer not found' });
    if (existingOffer.project_brief_id !== briefId) {
      return res.status(404).json({ error: 'Offer not found on this brief' });
    }

    const offer = await prisma.briefOffer.update({
      where: { id: offerId },
      data: { status },
    });

    // When a client accepts, close the brief.
    if (status === 'Accepted') {
      await prisma.projectBrief.update({ where: { id: briefId }, data: { status: 'Closed' } });
    }

    res.json(offer);
  } catch (err) {
    console.error('updateOfferStatus error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { listBriefs, createBrief, listOffers, submitOffer, updateOfferStatus };
