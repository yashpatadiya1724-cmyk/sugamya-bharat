// ===== MAP.JS - Sugamya Bharat Accessibility Map =====

const API = '/api';
let map, allLocations = [], activeFilter = 'all', markers = [];

const TYPE_ICONS = {
  wheelchair_ramp: '🛤️',
  accessible_toilet: '🚻',
  low_floor_bus: '🚌',
  metro_station: '🚇',
  elevator: '🛗',
  accessible_parking: '🅿️',
  hospital: '🏥',
  government_office: '🏛️',
  public_transport: '🚉',
  other: '📍'
};

const TYPE_LABELS = {
  wheelchair_ramp: 'Wheelchair Ramp',
  accessible_toilet: 'Accessible Toilet',
  low_floor_bus: 'Low-Floor Bus',
  metro_station: 'Metro Station',
  elevator: 'Elevator',
  accessible_parking: 'Accessible Parking',
  hospital: 'Hospital',
  government_office: 'Government Office',
  public_transport: 'Public Transport',
  other: 'Other'
};

const STATUS_COLORS = {
  fully_accessible: '#00C853',
  partially_accessible: '#FFD600',
  not_accessible: '#FF1744'
};

// Initialize map centered on India
function initMap() {
  map = L.map('leaflet-map', {
    center: [20.5937, 78.9629],
    zoom: 5,
    zoomControl: false
  });

  // Dark tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright" style="color:#9AAAC8">OpenStreetMap</a>',
    className: 'dark-tiles'
  }).addTo(map);

  L.control.zoom({ position: 'topright' }).addTo(map);

  // Check URL params
  const params = new URLSearchParams(window.location.search);
  const typeParam = params.get('type');
  if (typeParam) {
    setFilter(typeParam);
  }

  loadLocations();
  setupFilters();
  setupSearch();
  setupFABs();
}

function createMarkerIcon(status, type, verified) {
  const color = STATUS_COLORS[status] || '#9AAAC8';
  const icon = TYPE_ICONS[type] || '📍';
  const border = verified ? '3px solid #1E88E5' : '2px solid rgba(255,255,255,0.6)';
  const shadow = verified ? `0 0 12px ${color}80` : `0 4px 12px rgba(0,0,0,0.5)`;

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:38px;height:38px;border-radius:50%;
        background:${color}22;
        border:${border};
        display:flex;align-items:center;justify-content:center;
        font-size:16px;cursor:pointer;
        box-shadow:${shadow};
        transition:transform 0.2s;
        backdrop-filter:blur(4px);
      " class="marker-icon">
        ${icon}
        ${verified ? '<div style="position:absolute;top:-4px;right:-4px;width:14px;height:14px;background:#1E88E5;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;color:white;border:1px solid white">✓</div>' : ''}
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22]
  });
}

function createPopupContent(loc) {
  const color = STATUS_COLORS[loc.accessibilityStatus] || '#9AAAC8';
  const statusLabel = {
    fully_accessible: '🟢 Fully Accessible',
    partially_accessible: '🟡 Partially Accessible',
    not_accessible: '🔴 Not Accessible'
  }[loc.accessibilityStatus] || '';

  return `
    <div class="popup-content">
      <div class="popup-title">${loc.name}</div>
      <div class="popup-city">📍 ${loc.city}</div>
      <div class="popup-score-row">
        <span class="popup-score-num" style="color:${color}">${loc.accessibilityScore}/10</span>
        <span style="font-size:0.75rem;color:#9AAAC8">${statusLabel}</span>
      </div>
      ${loc.verified ? '<div style="font-size:0.75rem;color:#42A5F5;margin-bottom:6px">✅ Community Verified</div>' : ''}
      <div style="font-size:0.75rem;color:#9AAAC8;margin-bottom:8px">${TYPE_ICONS[loc.accessibilityType] || '📍'} ${TYPE_LABELS[loc.accessibilityType] || 'Other'}</div>
      <button class="popup-detail-btn" onclick="openSidebar('${loc._id}')">View Details & Verify →</button>
    </div>
  `;
}

async function loadLocations() {
  try {
    let url = `${API}/locations?limit=200`;
    if (activeFilter === 'verified') url += '&verified=true';
    else if (activeFilter !== 'all') url += `&type=${activeFilter}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      allLocations = data.locations;
      renderMarkers(allLocations);
    }
  } catch (e) {
    console.error('Failed to load locations:', e);
    // Load demo data if API fails
    renderDemoMarkers();
  }
}

function renderMarkers(locations) {
  // Clear old markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  locations.forEach(loc => {
    const marker = L.marker([loc.latitude, loc.longitude], {
      icon: createMarkerIcon(loc.accessibilityStatus, loc.accessibilityType, loc.verified)
    });

    marker.bindPopup(createPopupContent(loc), {
      maxWidth: 260,
      className: 'custom-popup'
    });

    marker.addTo(map);
    markers.push(marker);
  });
}

function renderDemoMarkers() {
  const demo = [
    { _id: 'd1', name: 'Ahmedabad Metro Station', city: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714, accessibilityType: 'metro_station', accessibilityStatus: 'fully_accessible', accessibilityScore: 9, verified: true },
    { _id: 'd2', name: 'AIIMS Delhi', city: 'New Delhi', latitude: 28.5672, longitude: 77.2100, accessibilityType: 'hospital', accessibilityStatus: 'fully_accessible', accessibilityScore: 9, verified: true },
    { _id: 'd3', name: 'Mumbai CST', city: 'Mumbai', latitude: 18.9402, longitude: 72.8352, accessibilityType: 'public_transport', accessibilityStatus: 'partially_accessible', accessibilityScore: 6, verified: true },
    { _id: 'd4', name: 'MG Road Metro Bangalore', city: 'Bangalore', latitude: 12.9752, longitude: 77.6138, accessibilityType: 'metro_station', accessibilityStatus: 'fully_accessible', accessibilityScore: 9, verified: true },
    { _id: 'd5', name: 'Hyderabad Cyber Towers', city: 'Hyderabad', latitude: 17.4435, longitude: 78.3772, accessibilityType: 'elevator', accessibilityStatus: 'fully_accessible', accessibilityScore: 9, verified: true },
    { _id: 'd6', name: 'Chennai Central', city: 'Chennai', latitude: 13.0826, longitude: 80.2750, accessibilityType: 'public_transport', accessibilityStatus: 'partially_accessible', accessibilityScore: 6, verified: true },
    { _id: 'd7', name: 'Pune Bus Stand', city: 'Pune', latitude: 18.5308, longitude: 73.8475, accessibilityType: 'low_floor_bus', accessibilityStatus: 'partially_accessible', accessibilityScore: 5, verified: false },
    { _id: 'd8', name: 'Kolkata Victoria Memorial', city: 'Kolkata', latitude: 22.5448, longitude: 88.3426, accessibilityType: 'wheelchair_ramp', accessibilityStatus: 'partially_accessible', accessibilityScore: 4, verified: false },
    { _id: 'd9', name: 'Sabarmati Riverfront', city: 'Ahmedabad', latitude: 23.0395, longitude: 72.5820, accessibilityType: 'wheelchair_ramp', accessibilityStatus: 'fully_accessible', accessibilityScore: 8, verified: true },
    { _id: 'd10', name: 'Delhi Secretariat', city: 'New Delhi', latitude: 28.6146, longitude: 77.2112, accessibilityType: 'government_office', accessibilityStatus: 'partially_accessible', accessibilityScore: 5, verified: false },
  ];
  allLocations = demo;
  renderMarkers(demo);
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  loadLocations();
}

function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });
}

function setupSearch() {
  const input = document.getElementById('search-input');
  let timeout;
  input.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const q = input.value.toLowerCase();
      if (!q) { renderMarkers(allLocations); return; }
      const filtered = allLocations.filter(l =>
        l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q)
      );
      renderMarkers(filtered);
      if (filtered.length === 1) {
        map.setView([filtered[0].latitude, filtered[0].longitude], 14);
      }
    }, 300);
  });
}

function setupFABs() {
  document.getElementById('location-btn').addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 14);
        L.circle([pos.coords.latitude, pos.coords.longitude], {
          radius: 200,
          color: '#1E88E5',
          fillColor: '#1E88E550',
          weight: 2
        }).addTo(map);
      }, () => showToast('Location access denied', 'error'));
    }
  });

  document.getElementById('zoom-india-btn').addEventListener('click', () => {
    map.setView([20.5937, 78.9629], 5);
  });
}

async function openSidebar(id) {
  const sidebar = document.getElementById('map-sidebar');
  sidebar.classList.add('open');

  document.getElementById('sidebar-body').innerHTML = `<div style="text-align:center;padding:2rem"><div class="loader"></div><p style="margin-top:1rem;color:var(--text-muted);font-size:0.9rem">Loading...</p></div>`;

  // Find in loaded data first
  let loc = allLocations.find(l => l._id === id);

  if (!loc) {
    try {
      const res = await fetch(`${API}/locations/${id}`);
      const data = await res.json();
      if (data.success) loc = data.location;
    } catch (e) {}
  }

  if (!loc) {
    document.getElementById('sidebar-body').innerHTML = '<p style="color:var(--not-accessible)">Failed to load location.</p>';
    return;
  }

  const color = STATUS_COLORS[loc.accessibilityStatus] || '#9AAAC8';
  const statusLabel = { fully_accessible: '🟢 Fully Accessible', partially_accessible: '🟡 Partially Accessible', not_accessible: '🔴 Not Accessible' }[loc.accessibilityStatus];

  document.getElementById('sidebar-title').textContent = loc.name;

  const badgesDiv = document.getElementById('sidebar-badges');
  badgesDiv.innerHTML = `
    <span class="badge ${loc.accessibilityStatus === 'fully_accessible' ? 'badge-green' : loc.accessibilityStatus === 'partially_accessible' ? 'badge-yellow' : 'badge-red'}">${statusLabel}</span>
    ${loc.verified ? '<span class="badge badge-verified">✅ Verified</span>' : ''}
    <span class="badge badge-blue">${TYPE_ICONS[loc.accessibilityType] || ''} ${TYPE_LABELS[loc.accessibilityType] || 'Other'}</span>
  `;

  const breakdown = loc.scoreBreakdown || {};
  const features = [
    ['ramp', '♿ Ramp Available'],
    ['elevator', '🛗 Elevator'],
    ['doorWidth', '🚪 Wide Door (90cm+)'],
    ['accessibleToilet', '🚻 Accessible Toilet'],
    ['accessibleParking', '🅿️ Accessible Parking'],
    ['brailleSignage', '⠿ Braille Signage'],
    ['audioAnnouncement', '🔊 Audio Announcements'],
    ['tactilePath', '👣 Tactile Path'],
    ['wheelchairRental', '♿ Wheelchair Available'],
    ['staffAssistance', '👤 Staff Assistance']
  ];

  const token = localStorage.getItem('token');

  document.getElementById('sidebar-body').innerHTML = `
    <div style="margin-bottom:1.5rem">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:1rem">
        <div style="width:64px;height:64px;border-radius:50%;border:3px solid ${color};display:flex;align-items:center;justify-content:center;font-family:'Baloo 2',sans-serif;font-size:1.5rem;font-weight:800;color:${color};flex-shrink:0">
          ${loc.accessibilityScore || 0}
        </div>
        <div>
          <div style="font-size:0.8rem;color:var(--text-muted)">Accessibility Score</div>
          <div style="font-size:0.75rem;color:var(--text-secondary)">${loc.verificationCount || 0} verification(s)</div>
        </div>
      </div>
      <div class="progress-bar" style="margin-bottom:1rem">
        <div class="progress-fill" style="width:${(loc.accessibilityScore/10)*100}%;background:${color}"></div>
      </div>
      <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.6;margin-bottom:1rem">${loc.description || 'No description available.'}</p>
      <p style="font-size:0.8rem;color:var(--text-muted)">📍 ${loc.address || loc.city}</p>
    </div>

    <div style="margin-bottom:1.5rem">
      <div style="font-size:0.75rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px">Accessibility Features</div>
      ${features.map(([key, label]) => `
        <div class="score-feature">
          <span style="font-size:0.82rem">${label}</span>
          <span class="${breakdown[key] ? 'check' : 'cross'}">${breakdown[key] ? '✓' : '✗'}</span>
        </div>
      `).join('')}
    </div>

    ${token ? `
    <div style="border-top:1px solid var(--border);padding-top:1rem">
      <div style="font-size:0.75rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px">Community Verification</div>
      <div class="verify-btn-group">
        <button onclick="voteOnLocation('${loc._id}','upvote')" class="btn btn-green btn-sm" style="flex:1">👍 Confirm</button>
        <button onclick="voteOnLocation('${loc._id}','downvote')" class="btn btn-secondary btn-sm" style="flex:1">👎 Dispute</button>
      </div>
      <button onclick="showVerifyForm('${loc._id}')" class="btn btn-primary btn-sm" style="width:100%;margin-top:8px">✅ Submit Full Verification</button>
      <a href="add-location.html" class="btn btn-secondary btn-sm" style="width:100%;margin-top:8px;display:block;text-align:center">📸 Add Photos</a>
    </div>
    ` : `
    <div style="border-top:1px solid var(--border);padding-top:1rem">
      <a href="login.html" class="btn btn-primary btn-sm" style="width:100%;display:block;text-align:center">Login to Verify</a>
    </div>
    `}
  `;
}

function closeSidebar() {
  document.getElementById('map-sidebar').classList.remove('open');
}

async function voteOnLocation(id, voteType) {
  const token = localStorage.getItem('token');
  if (!token) { window.location = 'login.html'; return; }

  try {
    const res = await fetch(`${API}/locations/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ voteType })
    });
    const data = await res.json();
    if (data.success) {
      showToast(voteType === 'upvote' ? '👍 Upvote recorded!' : '👎 Downvote recorded!', 'success');
    } else {
      showToast(data.message || 'Error', 'error');
    }
  } catch (e) {
    showToast('Network error', 'error');
  }
}

function showVerifyForm(id) {
  // Redirect to verify page with location id
  window.location = `verify.html?id=${id}`;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `${icons[type] || ''} ${message}`;
  const container = document.getElementById('toast-container');
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// Start
document.addEventListener('DOMContentLoaded', initMap);
