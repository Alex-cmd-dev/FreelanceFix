const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  browseGigs,
  getGigById,
  createGig,
  createOrUpdatePackage,
  deleteGig,
} = require('../controllers/gigController');

router.get('/', browseGigs);
router.post('/', requireAuth, createGig);
router.get('/:gigId', getGigById);
router.delete('/:gigId', requireAuth, deleteGig);
router.post('/:gigId/packages', requireAuth, createOrUpdatePackage);

module.exports = router;
