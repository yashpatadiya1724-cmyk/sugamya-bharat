# ♿ Sugamya Bharat — Accessibility Mapping Platform
### Vikshit Bharat 2047 · Pillar 6: Social Inclusion & Justice (Nari Shakti & Sugamya Bharat)

![Sugamya Bharat](https://img.shields.io/badge/Vikshit%20Bharat-2047-FF9933?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-138808?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-1E88E5?style=for-the-badge&logo=mongodb)

---

## 🎯 Mission

India has **27 crore differently-abled citizens**. This platform crowdsources and verifies wheelchair-friendly public spaces and transportation across Indian cities — supporting the government's Sugamya Bharat Abhiyan under Vikshit Bharat 2047.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### Installation

```bash
# 1. Clone / extract the project
cd accessibility-map-app

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI

# 4. Start server
npm start
# or for development:
npm run dev

# 5. Open browser
open http://localhost:5000

# 6. Seed demo data (first time)
curl -X POST http://localhost:5000/api/seed
# or visit http://localhost:5000/admin.html
```

### Default Admin Credentials
```
Email: admin@sugamyabharat.in
Password: Admin@123
```

---

## 📁 Folder Structure

```
accessibility-map-app/
│
├── frontend/                    # Static HTML/CSS/JS frontend
│   ├── index.html               # Home page (3D globe, hero, features)
│   ├── map.html                 # Interactive Leaflet.js accessibility map
│   ├── add-location.html        # Multi-step form to add locations
│   ├── verify.html              # Community verification page
│   ├── dashboard.html           # Analytics & city leaderboard
│   ├── login.html               # JWT authentication
│   ├── register.html            # User registration
│   ├── admin.html               # Admin panel
│   │
│   ├── css/
│   │   └── style.css            # Full design system (Indian theme)
│   │
│   └── js/
│       ├── auth.js              # Global auth helper
│       ├── map.js               # Leaflet map controller
│       ├── addLocation.js       # Multi-step form + AI analysis
│       └── dashboard.js         # Chart.js dashboard
│
├── backend/
│   ├── server.js                # Express server entry point
│   │
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   │
│   ├── models/
│   │   ├── User.js              # User schema (roles, auth)
│   │   └── Location.js          # Accessibility location schema
│   │
│   ├── routes/
│   │   ├── authRoutes.js        # /api/auth/*
│   │   └── locationRoutes.js    # /api/locations/*
│   │
│   ├── controllers/
│   │   ├── authController.js    # Register, login, profile
│   │   └── locationController.js # CRUD + verify + vote
│   │
│   └── middleware/
│       └── authMiddleware.js    # JWT protect, role restrict
│
├── uploads/                     # User-uploaded photos/videos
├── package.json
├── .env                         # Environment variables
└── README.md
```

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/update-profile` | Update profile |
| GET | `/api/auth/users` | Admin: list all users |
| PUT | `/api/auth/users/:id` | Admin: update role/status |

### Locations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/locations` | Get all approved locations |
| POST | `/api/locations` | Add new location (auth) |
| GET | `/api/locations/:id` | Get single location |
| POST | `/api/locations/:id/verify` | Submit verification |
| POST | `/api/locations/:id/vote` | Upvote/downvote |
| GET | `/api/locations/dashboard` | Dashboard statistics |
| GET | `/api/locations/pending` | Admin: pending list |
| PUT | `/api/locations/:id/status` | Admin: approve/reject |
| DELETE | `/api/locations/:id` | Admin: delete |

### Query Parameters for GET /api/locations
- `city` — filter by city name
- `type` — accessibility type
- `status` — fully_accessible / partially_accessible / not_accessible
- `verified` — true/false
- `lat`, `lng`, `radius` — geospatial filter
- `page`, `limit` — pagination

---

## 🏛️ Database Schema

### User
```json
{
  "name": "String",
  "email": "String (unique)",
  "password": "String (hashed)",
  "role": "user | contributor | admin",
  "city": "String",
  "bio": "String",
  "contributionsCount": "Number",
  "verificationsCount": "Number",
  "isActive": "Boolean",
  "createdAt": "Date"
}
```

### Location
```json
{
  "name": "String",
  "city": "String",
  "address": "String",
  "latitude": "Number",
  "longitude": "Number",
  "accessibilityType": "wheelchair_ramp | metro_station | hospital | ...",
  "accessibilityScore": "0-10",
  "scoreBreakdown": {
    "ramp": "Boolean",
    "elevator": "Boolean",
    "doorWidth": "Boolean",
    "accessibleToilet": "Boolean",
    "accessibleParking": "Boolean",
    "brailleSignage": "Boolean",
    "audioAnnouncement": "Boolean",
    "tactilePath": "Boolean",
    "wheelchairRental": "Boolean",
    "staffAssistance": "Boolean"
  },
  "photos": "[{ url, caption, uploadedBy }]",
  "description": "String",
  "accessibilityStatus": "fully_accessible | partially_accessible | not_accessible",
  "verified": "Boolean (auto after 5 verifications)",
  "votes": "{ upvotes: [], downvotes: [] }",
  "verifications": "[{ user, confirmedAccessible, comment }]",
  "status": "pending | approved | rejected",
  "createdBy": "User ObjectId"
}
```

---

## 🎨 Design System

### Color Palette (Indian Tricolor)
- **Saffron** `#FF9933` — Primary, CTAs, highlights
- **White** `#FFFFFF` — Text, backgrounds
- **Green** `#138808` — Success, verified, confirmed
- **Blue** `#1E88E5` — Info, verified badges

### Map Markers
- 🟢 `#00C853` — Fully Accessible (score 7-10)
- 🟡 `#FFD600` — Partially Accessible (score 4-6)
- 🔴 `#FF1744` — Not Accessible (score 0-3)
- 🔵 Blue border — Community Verified

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🗺️ Interactive Map | Leaflet.js with OpenStreetMap, filterable markers |
| ♿ Accessibility Score | 10-point system across 10 features |
| ✅ Community Verification | 5-verification auto-verification system |
| 📸 Photo Evidence | Upload photos/videos as proof |
| 🤖 AI Analysis | Claude AI analyzes photos for accessibility features |
| 🏆 City Leaderboard | Rank cities by accessibility percentage |
| 👥 User Roles | User → Contributor (10+ locations) → Admin |
| 🌐 3D Globe | Three.js animated India globe on homepage |
| 📊 Charts | Chart.js donut and bar charts for analytics |
| 🔐 JWT Auth | Secure token-based authentication |

---

## 🇮🇳 About Vikshit Bharat 2047 — Pillar 6

**Social Inclusion & Justice** under the Vikshit Bharat 2047 vision encompasses:
- **Sugamya Bharat Abhiyan** — Universal accessibility in public spaces
- **Nari Shakti** — Women's safety and equal access to infrastructure
- **RPWD Act 2016** — Rights of Persons with Disabilities compliance
- **Universal Design** — Infrastructure that works for all citizens

This platform directly contributes to measurable accessibility progress tracking across India's cities and helps identify barriers that need government attention.

---

## 🤝 Contributing

1. Register at `/register.html`
2. Add accessible locations in your city
3. Verify others' reports
4. Reach 10 contributions → auto-promoted to Verified Contributor
5. Reach 50+ → apply for Champion badge

---

*Built with ❤️ for Vikshit Bharat 2047 Hackathon · Jai Hind 🇮🇳*
