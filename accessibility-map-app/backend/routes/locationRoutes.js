const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, restrictTo, optionalAuth } = require('../middleware/authMiddleware');
const {
  getLocations,
  getLocation,
  addLocation,
  verifyLocation,
  voteLocation,
  getDashboard,
  getPendingLocations,
  updateLocationStatus,
  deleteLocation
} = require('../controllers/locationController');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|mp4|mov/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos allowed'));
    }
  }
});

router.get('/', optionalAuth, getLocations);
router.get('/pending', protect, restrictTo('admin'), getPendingLocations);
router.get('/dashboard', getDashboard);
router.get('/:id', optionalAuth, getLocation);
router.post('/', protect, upload.array('photos', 5), addLocation);
router.post('/:id/verify', protect, verifyLocation);
router.post('/:id/vote', protect, voteLocation);
router.put('/:id/status', protect, restrictTo('admin'), updateLocationStatus);
router.delete('/:id', protect, restrictTo('admin'), deleteLocation);

module.exports = router;
