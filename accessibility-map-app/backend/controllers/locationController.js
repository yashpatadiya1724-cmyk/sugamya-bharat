const Location = require('../models/Location');
const User = require('../models/User');
const path = require('path');

// @route GET /api/locations
exports.getLocations = async (req, res) => {
  try {
    const {
      city,
      type,
      status,
      verified,
      lat,
      lng,
      radius = 10,
      page = 1,
      limit = 50
    } = req.query;

    const filter = { status: 'approved' };
    if (city) filter.city = new RegExp(city, 'i');
    if (type) filter.accessibilityType = type;
    if (status) filter.accessibilityStatus = status;
    if (verified === 'true') filter.verified = true;

    // Radius filter (simple bounding box)
    if (lat && lng) {
      const latN = parseFloat(lat);
      const lngN = parseFloat(lng);
      const R = parseFloat(radius);
      const latDelta = R / 111;
      const lngDelta = R / (111 * Math.cos(latN * Math.PI / 180));
      filter.latitude = { $gte: latN - latDelta, $lte: latN + latDelta };
      filter.longitude = { $gte: lngN - lngDelta, $lte: lngN + lngDelta };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const locations = await Location.find(filter)
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Location.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: locations.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      locations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/locations/:id
exports.getLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id)
      .populate('createdBy', 'name role city')
      .populate('verifications.user', 'name role')
      .populate('votes.upvotes.user', 'name')
      .populate('votes.downvotes.user', 'name');

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    res.status(200).json({ success: true, location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/locations
exports.addLocation = async (req, res) => {
  try {
    const {
      name, city, address, latitude, longitude,
      accessibilityType, description, scoreBreakdown
    } = req.body;

    const photos = req.files ? req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      caption: file.originalname,
      uploadedBy: req.user.id
    })) : [];

    const location = new Location({
      name, city, address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accessibilityType,
      description,
      photos,
      scoreBreakdown: scoreBreakdown ? JSON.parse(scoreBreakdown) : {},
      createdBy: req.user.id,
      status: req.user.role === 'admin' ? 'approved' : 'pending'
    });

    location.calculateScore();
    await location.save();

    // Update user contribution count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { contributionsCount: 1 }
    });

    // Check promotion
    const user = await User.findById(req.user.id);
    user.checkPromotion();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Location submitted successfully! It will be reviewed shortly.',
      location
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/locations/:id/verify
exports.verifyLocation = async (req, res) => {
  try {
    const { confirmedAccessible, comment } = req.body;
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    // Check if user already verified
    const alreadyVerified = location.verifications.find(
      v => v.user.toString() === req.user.id.toString()
    );

    if (alreadyVerified) {
      return res.status(400).json({
        success: false,
        message: 'You have already verified this location.'
      });
    }

    location.verifications.push({
      user: req.user.id,
      confirmedAccessible,
      comment
    });

    await location.save();

    // Update user verification count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { verificationsCount: 1 }
    });

    res.status(200).json({
      success: true,
      message: 'Verification submitted successfully!',
      verificationCount: location.verifications.length,
      verified: location.verified
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/locations/:id/vote
exports.voteLocation = async (req, res) => {
  try {
    const { voteType } = req.body; // 'upvote' or 'downvote'
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    // Remove existing votes
    location.votes.upvotes = location.votes.upvotes.filter(
      v => v.user.toString() !== req.user.id.toString()
    );
    location.votes.downvotes = location.votes.downvotes.filter(
      v => v.user.toString() !== req.user.id.toString()
    );

    if (voteType === 'upvote') {
      location.votes.upvotes.push({ user: req.user.id });
    } else {
      location.votes.downvotes.push({ user: req.user.id });
    }

    await location.save();
    res.status(200).json({
      success: true,
      upvotes: location.votes.upvotes.length,
      downvotes: location.votes.downvotes.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const totalLocations = await Location.countDocuments({ status: 'approved' });
    const verifiedLocations = await Location.countDocuments({ status: 'approved', verified: true });
    const pendingLocations = await Location.countDocuments({ status: 'pending' });
    const totalUsers = await User.countDocuments();

    // City-wise stats
    const cityStats = await Location.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$city',
          total: { $sum: 1 },
          fullyAccessible: {
            $sum: { $cond: [{ $eq: ['$accessibilityStatus', 'fully_accessible'] }, 1, 0] }
          },
          partiallyAccessible: {
            $sum: { $cond: [{ $eq: ['$accessibilityStatus', 'partially_accessible'] }, 1, 0] }
          },
          notAccessible: {
            $sum: { $cond: [{ $eq: ['$accessibilityStatus', 'not_accessible'] }, 1, 0] }
          },
          avgScore: { $avg: '$accessibilityScore' }
        }
      },
      { $sort: { avgScore: -1 } },
      { $limit: 10 }
    ]);

    // Type-wise stats
    const typeStats = await Location.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$accessibilityType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent locations
    const recentLocations = await Location.find({ status: 'approved' })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Top contributors
    const topContributors = await User.find({})
      .sort({ contributionsCount: -1 })
      .limit(5)
      .select('name city contributionsCount verificationsCount role');

    res.status(200).json({
      success: true,
      stats: {
        totalLocations,
        verifiedLocations,
        pendingLocations,
        totalUsers,
        verificationRate: totalLocations > 0
          ? Math.round((verifiedLocations / totalLocations) * 100)
          : 0
      },
      cityStats: cityStats.map(c => ({
        city: c._id,
        total: c.total,
        fullyAccessible: c.fullyAccessible,
        partiallyAccessible: c.partiallyAccessible,
        notAccessible: c.notAccessible,
        avgScore: Math.round(c.avgScore * 10) / 10,
        accessibilityPercent: Math.round((c.fullyAccessible / c.total) * 100)
      })),
      typeStats,
      recentLocations,
      topContributors
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/locations/pending (admin)
exports.getPendingLocations = async (req, res) => {
  try {
    const locations = await Location.find({ status: 'pending' })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: locations.length, locations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/locations/:id/status (admin)
exports.updateLocationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!location) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route DELETE /api/locations/:id (admin)
exports.deleteLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, message: 'Location deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
