const express = require('express');
const router = express.Router();
const { searchFreelancers } = require('../controllers/userController');

// Public freelancer search/browse
router.get('/', searchFreelancers);

module.exports = router;
