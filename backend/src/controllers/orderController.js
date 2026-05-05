const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /orders
// Returns orders where the user is either client or the freelancer who owns the gig.
async function getOrders(req, res) {
  try {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { client_id: req.user.id },
          { gig_package: { gig: { freelancer_id: req.user.id } } },
        ],
      },
      include: {
        gig_package: { include: { gig: true } },
        payment: true,
        review: true,
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    console.error('getOrders error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /orders
async function createOrder(req, res) {
  try {
    const { gig_package_id } = req.body;
    if (!gig_package_id) return res.status(400).json({ error: 'gig_package_id is required' });

    // Make sure the user has a client profile
    const client = await prisma.client.findUnique({ where: { id: req.user.id } });
    if (!client) {
      return res.status(403).json({ error: 'Only clients can place orders. Please complete your client profile first.' });
    }

    const pkg = await prisma.gigPackage.findUnique({
      where: { id: parseInt(gig_package_id) },
      include: { gig: true },
    });
    if (!pkg) return res.status(404).json({ error: 'Gig package not found' });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + pkg.delivery_days);

    // Create the order plus the linked payment in a transaction.
    const createdOrder = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          client_id: req.user.id,
          gig_package_id: pkg.id,
          status: 'Pending',
          total_amount: pkg.price,
          due_date: dueDate,
        },
      });

      await tx.payment.create({
        data: {
          order_id: newOrder.id,
          amount: pkg.price,
          status: 'Escrow',
          payment_method: 'credit_card',
        },
      });

      return newOrder;
    });

    const order = await prisma.order.findUnique({
      where: { id: createdOrder.id },
      include: {
        gig_package: { include: { gig: true } },
        payment: true,
        review: true,
      },
    });

    res.status(201).json(order);
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// PATCH /orders/:orderId/status
async function updateOrderStatus(req, res) {
  try {
    const orderId = parseInt(req.params.orderId);
    const { status } = req.body;
    const validStatuses = ['Pending', 'In_Progress', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { gig_package: { include: { gig: true } } },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const isClient = order.client_id === req.user.id;
    const isFreelancer = order.gig_package.gig.freelancer_id === req.user.id;
    if (!isClient && !isFreelancer) {
      return res.status(403).json({ error: 'You are not part of this order' });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    // When completed, release the escrow payment.
    if (status === 'Completed') {
      await prisma.payment.updateMany({
        where: { order_id: orderId },
        data: { status: 'Released', processed_at: new Date() },
      });
    }

    const updated = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        gig_package: { include: { gig: true } },
        payment: true,
        review: true,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /orders/:orderId/reviews
async function postReview(req, res) {
  try {
    const orderId = parseInt(req.params.orderId);
    const { rating, comment } = req.body;
    const parsedRating = parseInt(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the client who placed the order can review it' });
    }
    if (order.status !== 'Completed') {
      return res.status(400).json({ error: 'You can only review completed orders' });
    }

    const review = await prisma.review.create({
      data: { order_id: orderId, rating: parsedRating, comment: comment || null },
    });

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'This order already has a review' });
    }
    console.error('postReview error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getOrders, createOrder, updateOrderStatus, postReview };
