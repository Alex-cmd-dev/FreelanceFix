const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getMessages, sendMessage } = require('../controllers/messageController');

router.get('/', requireAuth, getMessages);
router.post('/', requireAuth, sendMessage);

module.exports = router;
