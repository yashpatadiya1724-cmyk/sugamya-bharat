const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  latitude: {
    type: Number,
    required: [true, 'Latitude is required'],
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: [true, 'Longitude is required'],
    min: -180,
    max: 180
  },
  accessibilityType: {
    type: String,
    required: true,
    enum: [
      'wheelchair_ramp',
      'accessible_toilet',
      'low_floor_bus',
      'metro_station',
      'elevator',
      'accessible_parking',
      'hospital',
      'government_office',
      'public_transport',
      'other'
    ]
  },
  accessibilityScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  // Detailed scoring breakdown
  scoreBreakdown: {
    ramp: { type: Boolean, default: false },
    elevator: { type: Boolean, default: false },
    doorWidth: { type: Boolean, default: false },
    accessibleToilet: { type: Boolean, default: false },
    accessibleParking: { type: Boolean, default: false },
    brailleSignage: { type: Boolean, default: false },
    audioAnnouncement: { type: Boolean, default: false },
    tactilePath: { type: Boolean, default: false },
    wheelchairRental: { type: Boolean, default: false },
    staffAssistance: { type: Boolean, default: false }
  },
  photos: [{
    url: String,
    caption: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: { type: Date, default: Date.now }
  }],
  description: {
    type: String,
    maxlength: 1000
  },
  accessibilityStatus: {
    type: String,
    enum: ['fully_accessible', 'partially_accessible', 'not_accessible'],
    default: 'partially_accessible'
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationCount: {
    type: Number,
    default: 0
  },
  votes: {
    upvotes: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      votedAt: { type: Date, default: Date.now }
    }],
    downvotes: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      votedAt: { type: Date, default: Date.now }
    }]
  },
  verifications: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: String,
    confirmedAccessible: Boolean,
    verifiedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-calculate accessibility score from breakdown
locationSchema.methods.calculateScore = function () {
  const breakdown = this.scoreBreakdown;
  const features = Object.values(breakdown);
  const trueCount = features.filter(Boolean).length;
  this.accessibilityScore = Math.round((trueCount / features.length) * 10);

  if (this.accessibilityScore >= 7) {
    this.accessibilityStatus = 'fully_accessible';
  } else if (this.accessibilityScore >= 4) {
    this.accessibilityStatus = 'partially_accessible';
  } else {
    this.accessibilityStatus = 'not_accessible';
  }
};

// Auto-verify when 5+ verifications
locationSchema.pre('save', function (next) {
  if (this.verifications.length >= 5) {
    const positiveVerifications = this.verifications.filter(v => v.confirmedAccessible).length;
    if (positiveVerifications >= 3) {
      this.verified = true;
    }
  }
  this.verificationCount = this.verifications.length;
  this.updatedAt = Date.now();
  next();
});

// Indexes for geospatial queries
locationSchema.index({ latitude: 1, longitude: 1 });
locationSchema.index({ city: 1 });
locationSchema.index({ accessibilityType: 1 });
locationSchema.index({ accessibilityStatus: 1 });

module.exports = mongoose.model('Location', locationSchema);
