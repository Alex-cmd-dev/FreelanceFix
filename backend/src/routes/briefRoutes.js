const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  listBriefs,
  createBrief,
  listOffers,
  submitOffer,
  updateOfferStatus,
} = require('../controllers/briefController');

router.get('/', listBriefs);
router.post('/', requireAuth, createBrief);
router.get('/:briefId/offers', requireAuth, listOffers);
router.post('/:briefId/offers', requireAuth, submitOffer);
router.patch('/:briefId/offers/:offerId/status', requireAuth, updateOfferStatus);

module.exports = router;
