const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getOrders,
  createOrder,
  updateOrderStatus,
  postReview,
} = require('../controllers/orderController');

router.get('/', requireAuth, getOrders);
router.post('/', requireAuth, createOrder);
router.patch('/:orderId/status', requireAuth, updateOrderStatus);
router.post('/:orderId/reviews', requireAuth, postReview);

module.exports = router;
