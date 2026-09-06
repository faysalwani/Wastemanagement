const express = require('express');
const router = express.Router();
const { getDriverDirectory } = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), getDriverDirectory);

module.exports = router;
