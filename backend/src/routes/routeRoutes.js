const express = require('express');
const router = express.Router();
const { getOptimizedRoute } = require('../controllers/routeController');

router.get('/optimize', getOptimizedRoute);

module.exports = router;
