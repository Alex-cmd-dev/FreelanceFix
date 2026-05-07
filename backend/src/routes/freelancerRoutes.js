const express = require('express');
const router = express.Router();
const { searchFreelancers, getFreelancerById } = require('../controllers/userController');

router.get('/', searchFreelancers);
router.get('/:id', getFreelancerById);

module.exports = router;
