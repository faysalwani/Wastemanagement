const express = require('express');
const router = express.Router();
const {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getVehicles);
router.post('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), createVehicle);
router.patch('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), updateVehicle);
router.delete('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), deleteVehicle);

module.exports = router;
