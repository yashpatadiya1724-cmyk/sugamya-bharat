const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  register,
  login,
  getMe,
  updateProfile,
  getAllUsers,
  updateUserRole
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.get('/users', protect, restrictTo('admin'), getAllUsers);
router.put('/users/:id', protect, restrictTo('admin'), updateUserRole);

module.exports = router;
