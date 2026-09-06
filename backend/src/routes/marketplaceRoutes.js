const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/marketplaceController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Public Product Catalog
router.get('/products', getProducts);
router.get('/products/:id', getProductById);

// Citizen Order & Redemption Routes
router.post('/orders', protect, authorize('CITIZEN', 'ADMIN', 'SUPER_ADMIN'), placeOrder);
router.get('/orders/my', protect, getMyOrders);
router.get('/orders/:id', protect, getOrderById);
router.patch('/orders/:id/cancel', protect, cancelOrder);

// Admin Product & Inventory Management
router.post('/products', protect, authorize('ADMIN', 'SUPER_ADMIN'), createProduct);
router.patch('/products/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), updateProduct);
router.delete('/products/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), deleteProduct);

// Admin Order Management
router.get('/orders', protect, authorize('ADMIN', 'SUPER_ADMIN'), getAllOrders);
router.patch('/orders/:id/status', protect, authorize('ADMIN', 'SUPER_ADMIN'), updateOrderStatus);

module.exports = router;
