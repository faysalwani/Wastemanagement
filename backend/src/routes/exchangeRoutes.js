const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
  createListing,
  getListings,
  getListingById,
  claimListing,
  completeListing,
  cancelListing,
} = require('../controllers/exchangeController');

router.post('/listings', protect, upload.single('photo'), createListing);
router.get('/listings', getListings);
router.get('/listings/:id', getListingById);
router.post('/listings/:id/claim', protect, claimListing);
router.post('/listings/:id/complete', protect, completeListing);
router.patch('/listings/:id/cancel', protect, cancelListing);

module.exports = router;
