const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /messages
// Returns all messages where the user is sender or receiver, ordered chronologically.
async function getMessages(req, res) {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ sender_id: req.user.id }, { receiver_id: req.user.id }],
      },
      include: {
        sender: { select: { id: true, first_name: true, last_name: true } },
        receiver: { select: { id: true, first_name: true, last_name: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 200,
    });
    res.json(messages);
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /messages
async function sendMessage(req, res) {
  try {
    const { receiver_id, content } = req.body;
    if (!receiver_id || !content) {
      return res.status(400).json({ error: 'receiver_id and content are required' });
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiver_id } });
    if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

    const message = await prisma.message.create({
      data: {
        sender_id: req.user.id,
        receiver_id,
        content,
        is_read: false,
      },
    });

    res.status(201).json(message);
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getMessages, sendMessage };
