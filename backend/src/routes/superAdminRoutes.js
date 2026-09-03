const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  getAuditLogs,
} = require('../controllers/superAdminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are strictly locked to SUPER_ADMIN
router.use(protect);
router.use(authorize('SUPER_ADMIN'));

router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
