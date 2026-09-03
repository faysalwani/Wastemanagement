const express = require('express');
const router = express.Router();
const {
  updateVehicleLocation,
  getFleetLocations,
} = require('../controllers/trackingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/update', protect, authorize('DRIVER', 'ADMIN'), updateVehicleLocation);
router.get('/fleet', getFleetLocations);

module.exports = router;
