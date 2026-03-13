require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect DB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));

// Seed demo data route
app.post('/api/seed', async (req, res) => {
  try {
    const Location = require('./models/Location');
    const User = require('./models/User');

    // Check if already seeded
    const count = await Location.countDocuments();
    if (count > 0) {
      return res.json({ success: true, message: 'Already seeded', count });
    }

    // Create admin user
    let adminUser = await User.findOne({ email: 'admin@sugamyabharat.in' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@sugamyabharat.in',
        password: 'Admin@123',
        role: 'admin',
        city: 'New Delhi',
        contributionsCount: 50
      });
    }

    const demoLocations = [
      { name: 'Ahmedabad Metro - Vastral Gam Station', city: 'Ahmedabad', address: 'Vastral, Ahmedabad, Gujarat', latitude: 23.0225, longitude: 72.5714, accessibilityType: 'metro_station', accessibilityStatus: 'fully_accessible', accessibilityScore: 9, verified: true, verificationCount: 8, description: 'Fully accessible metro station with elevators, tactile paths, and audio announcements.', scoreBreakdown: { ramp: true, elevator: true, doorWidth: true, accessibleToilet: true, accessibleParking: true, brailleSignage: true, audioAnnouncement: true, tactilePath: true, wheelchairRental: false, staffAssistance: true } },
      { name: 'AIIMS Delhi - Main Building', city: 'New Delhi', address: 'Ansari Nagar, New Delhi', latitude: 28.5672, longitude: 77.2100, accessibilityType: 'hospital', accessibilityStatus: 'fully_accessible', accessibilityScore: 9, verified: true, verificationCount: 12, description: 'AIIMS has comprehensive accessibility features including ramps, elevators, and wheelchair rental.', scoreBreakdown: { ramp: true, elevator: true, doorWidth: true, accessibleToilet: true, accessibleParking: true, brailleSignage: true, audioAnnouncement: true, tactilePath: true, wheelchairRental: true, staffAssistance: true } },
      { name: 'Mumbai CST Railway Station', city: 'Mumbai', address: 'Chhatrapati Shivaji Terminus, Mumbai', latitude: 18.9402, longitude: 72.8352, accessibilityType: 'public_transport', accessibilityStatus: 'partially_accessible', accessibilityScore: 6, verified: true, verificationCount: 7, description: 'Some platforms have ramps but not all. Limited elevator access during peak hours.', scoreBreakdown: { ramp: true, elevator: true, doorWidth: true, accessibleToilet: false, accessibleParking: false, brailleSignage: true, audioAnnouncement: true, tactilePath: false, wheelchairRental: false, staffAssistance: true } },
      { name: 'Sabarmati Riverfront - North Gate', city: 'Ahmedabad', address: 'Sabarmati Riverfront, Ahmedabad', latitude: 23.0395, longitude: 72.5820, accessibilityType: 'wheelchair_ramp', accessibilityStatus: 'fully_accessible', accessibilityScore: 8, verified: true, verificationCount: 6, description: 'Well-maintained ramps and pathways for wheelchair users. Smooth surface throughout.', scoreBreakdown: { ramp: true, elevator: false, doorWidth: true, accessibleToilet: true, accessibleParking: true, brailleSignage: false, audioAnnouncement: false, tactilePath: true, wheelchairRental: false, staffAssistance: true } },
      { name: 'Bangalore MG Road Metro Station', city: 'Bangalore', address: 'MG Road, Bengaluru, Karnataka', latitude: 12.9752, longitude: 77.6138, accessibilityType: 'metro_station', accessibilityStatus: 'fully_accessible', accessibilityScore: 9, verified: true, verificationCount: 9, description: 'Namma Metro MG Road station - excellent accessibility with lifts, tactile tiles.', scoreBreakdown: { ramp: true, elevator: true, doorWidth: true, accessibleToilet: true, accessibleParking: false, brailleSignage: true, audioAnnouncement: true, tactilePath: true, wheelchairRental: false, staffAssistance: true } },
      { name: 'Delhi Government Office - Secretariat', city: 'New Delhi', address: 'Rajpath, New Delhi', latitude: 28.6146, longitude: 77.2112, accessibilityType: 'government_office', accessibilityStatus: 'partially_accessible', accessibilityScore: 5, verified: false, verificationCount: 3, description: 'Main entrance has ramp but other entry points are not accessible.', scoreBreakdown: { ramp: true, elevator: false, doorWidth: true, accessibleToilet: false, accessibleParking: true, brailleSignage: false, audioAnnouncement: false, tactilePath: false, wheelchairRental: false, staffAssistance: true } },
      { name: 'Pune Bus Stand - Shivajinagar', city: 'Pune', address: 'Shivajinagar Bus Stand, Pune', latitude: 18.5308, longitude: 73.8475, accessibilityType: 'low_floor_bus', accessibilityStatus: 'partially_accessible', accessibilityScore: 5, verified: false, verificationCount: 2, description: 'Some low-floor AC buses available but regular services lack accessibility features.', scoreBreakdown: { ramp: false, elevator: false, doorWidth: true, accessibleToilet: false, accessibleParking: false, brailleSignage: false, audioAnnouncement: true, tactilePath: false, wheelchairRental: false, staffAssistance: false } },
      { name: 'Hyderabad Cyber Towers', city: 'Hyderabad', address: 'Hitech City, Hyderabad, Telangana', latitude: 17.4435, longitude: 78.3772, accessibilityType: 'elevator', accessibilityStatus: 'fully_accessible', accessibilityScore: 9, verified: true, verificationCount: 5, description: 'Modern IT complex with excellent accessibility - multiple lifts, ramps, and accessible parking.', scoreBreakdown: { ramp: true, elevator: true, doorWidth: true, accessibleToilet: true, accessibilityParking: true, brailleSignage: true, audioAnnouncement: true, tactilePath: true, wheelchairRental: false, staffAssistance: true } },
      { name: 'Chennai Central Railway', city: 'Chennai', address: 'Park Town, Chennai, Tamil Nadu', latitude: 13.0826, longitude: 80.2750, accessibilityType: 'public_transport', accessibilityStatus: 'partially_accessible', accessibilityScore: 6, verified: true, verificationCount: 6, description: 'Platform 1 is accessible. Ramps available at main entrance. Assistance available on request.', scoreBreakdown: { ramp: true, elevator: true, doorWidth: true, accessibleToilet: false, accessibleParking: false, brailleSignage: true, audioAnnouncement: true, tactilePath: false, wheelchairRental: false, staffAssistance: true } },
      { name: 'Kolkata Victoria Memorial', city: 'Kolkata', address: 'Victoria Memorial Hall, Kolkata', latitude: 22.5448, longitude: 88.3426, accessibilityType: 'wheelchair_ramp', accessibilityStatus: 'partially_accessible', accessibilityScore: 4, verified: false, verificationCount: 2, description: 'Limited accessibility - some areas accessible but heritage structure limits modifications.', scoreBreakdown: { ramp: true, elevator: false, doorWidth: false, accessibleToilet: false, accessibleParking: true, brailleSignage: false, audioAnnouncement: false, tactilePath: false, wheelchairRental: false, staffAssistance: true } }
    ];

    for (const locData of demoLocations) {
      await Location.create({ ...locData, createdBy: adminUser._id, status: 'approved' });
    }

    res.json({ success: true, message: `Seeded ${demoLocations.length} demo locations`, adminEmail: 'admin@sugamyabharat.in', adminPassword: 'Admin@123' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`
🚀 Sugamya Bharat Server running on http://localhost:${PORT}
♿ Vikshit Bharat 2047 - Accessibility Mapping Platform
📊 API: http://localhost:${PORT}/api
🌐 Frontend: http://localhost:${PORT}
💾 Seed demo data: POST http://localhost:${PORT}/api/seed
  `);
});
