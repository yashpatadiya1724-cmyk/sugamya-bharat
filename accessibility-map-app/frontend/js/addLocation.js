// ===== ADD LOCATION JS =====
let pickMap, pickMarker;
let currentStep = 1;
let selectedFiles = [];

const FEATURES = ['ramp','elevator','doorWidth','accessibleToilet','accessibleParking','brailleSignage','audioAnnouncement','tactilePath','wheelchairRental','staffAssistance'];

// Init map picker
function initPickMap() {
  pickMap = L.map('pick-map', { center: [20.5937, 78.9629], zoom: 5 });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(pickMap);

  pickMap.on('click', (e) => {
    placePin(e.latlng.lat, e.latlng.lng);
  });
}

function placePin(lat, lng) {
  if (pickMarker) pickMap.removeLayer(pickMarker);
  pickMarker = L.marker([lat, lng]).addTo(pickMap);
  document.getElementById('loc-lat').value = lat.toFixed(6);
  document.getElementById('loc-lng').value = lng.toFixed(6);
  document.getElementById('coords-info').textContent = `📍 Pinned: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  reverseGeocode(lat, lng);
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await res.json();
    if (data.display_name) {
      const addr = document.getElementById('loc-address');
      if (!addr.value) addr.value = data.display_name.split(',').slice(0, 4).join(',').trim();
    }
  } catch (e) {}
}

async function geocodeAddress() {
  const addr = document.getElementById('loc-address').value || document.getElementById('loc-name').value;
  if (!addr) { showToast('Enter address first', 'info'); return; }
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr + ', India')}&limit=1`);
    const data = await res.json();
    if (data[0]) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      pickMap.setView([lat, lng], 16);
      placePin(lat, lng);
    } else {
      showToast('Address not found. Try clicking on map.', 'info');
    }
  } catch (e) {
    showToast('Geocoding failed', 'error');
  }
}

function useMyLocation() {
  if (!navigator.geolocation) { showToast('Geolocation not supported', 'error'); return; }
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      pickMap.setView([lat, lng], 16);
      placePin(lat, lng);
      showToast('📍 Location set!', 'success');
    },
    () => showToast('Location access denied', 'error')
  );
}

// Step Navigation
function goStep(n) {
  // Validate step 1
  if (n > 1) {
    if (!document.getElementById('loc-name').value.trim()) { showToast('Enter location name', 'error'); goStepUI(1); return; }
    if (!document.getElementById('loc-city').value) { showToast('Select a city', 'error'); goStepUI(1); return; }
    if (!document.getElementById('loc-type').value) { showToast('Select location type', 'error'); goStepUI(1); return; }
    if (!document.getElementById('loc-address').value.trim()) { showToast('Enter address', 'error'); goStepUI(1); return; }
  }
  // Validate step 2
  if (n > 2) {
    if (!document.getElementById('loc-lat').value || !document.getElementById('loc-lng').value) {
      showToast('Please pin a location on the map', 'error');
      goStepUI(2);
      return;
    }
  }
  if (n === 4) updateSummary();
  goStepUI(n);
}

function goStepUI(n) {
  currentStep = n;
  document.querySelectorAll('.section-panel').forEach((p, i) => {
    p.classList.toggle('active', i + 1 === n);
  });
  for (let i = 1; i <= 4; i++) {
    const num = document.getElementById(`snum-${i}`);
    const lbl = document.getElementById(`slbl-${i}`);
    if (i < n) { num.className = 'step-num done'; num.textContent = '✓'; }
    else if (i === n) { num.className = 'step-num active'; num.textContent = i; lbl.className = 'step-label active'; }
    else { num.className = 'step-num pending'; num.textContent = i; lbl.className = 'step-label'; }
    if (i < 4) document.getElementById(`sline-${i}`).className = 'step-line' + (i < n ? ' done' : '');
  }
  if (n === 2 && !pickMap) setTimeout(initPickMap, 100);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Checkbox interaction
FEATURES.forEach(f => {
  const cb = document.getElementById(`f-${f}`);
  if (cb) {
    cb.addEventListener('change', () => {
      document.getElementById(`si-${f}`).classList.toggle('checked', cb.checked);
      updateScore();
    });
  }
});

function updateScore() {
  const checked = FEATURES.filter(f => document.getElementById(`f-${f}`)?.checked).length;
  const score = Math.round((checked / FEATURES.length) * 10);
  const circle = document.getElementById('score-circle');
  const label = document.getElementById('score-label');
  const sub = document.getElementById('score-sub');
  const bar = document.getElementById('score-bar');
  let color, status, hint;
  if (score >= 7) { color = '#00C853'; status = '🟢 Fully Accessible'; hint = 'Excellent! This location is highly accessible.'; }
  else if (score >= 4) { color = '#FFD600'; status = '🟡 Partially Accessible'; hint = 'Add more features to improve the score.'; }
  else if (score > 0) { color = '#FF1744'; status = '🔴 Not Accessible'; hint = 'Very limited accessibility at this location.'; }
  else { color = 'var(--text-muted)'; status = 'Not Rated'; hint = 'Check features above'; }
  circle.textContent = score;
  circle.style.borderColor = color;
  circle.style.color = color;
  label.textContent = status;
  label.style.color = color;
  sub.textContent = hint;
  bar.style.width = (score / 10 * 100) + '%';
  bar.style.background = color;
}

// File handling
function handleFileSelect(files) {
  selectedFiles = Array.from(files);
  const preview = document.getElementById('photo-previews');
  preview.innerHTML = '';
  selectedFiles.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = e => {
      const div = document.createElement('div');
      div.style.cssText = 'position:relative;display:inline-block';
      div.innerHTML = `
        <img src="${e.target.result}" class="preview-img" title="${file.name}" />
        <button type="button" onclick="removeFile(${i})" style="position:absolute;top:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:var(--not-accessible);border:none;color:white;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

function removeFile(i) {
  selectedFiles.splice(i, 1);
  const dt = new DataTransfer();
  selectedFiles.forEach(f => dt.items.add(f));
  document.getElementById('photos-input').files = dt.files;
  handleFileSelect(dt.files);
}

// Drag & drop
const uploadArea = document.getElementById('upload-area');
uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.style.borderColor = 'var(--saffron)'; });
uploadArea.addEventListener('dragleave', () => { uploadArea.style.borderColor = 'var(--border)'; });
uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.style.borderColor = 'var(--border)';
  handleFileSelect(e.dataTransfer.files);
});

// AI Analysis
async function runAIAnalysis() {
  const btn = document.getElementById('ai-btn');
  const result = document.getElementById('ai-result');

  if (!selectedFiles.length) { showToast('Upload a photo first for AI analysis', 'info'); return; }

  btn.innerHTML = '<span class="loader"></span> Analyzing with Claude AI...';
  btn.disabled = true;
  result.innerHTML = '';

  try {
    const file = selectedFiles[0];
    const base64 = await fileToBase64(file);

    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: file.type, data: base64 }
            },
            {
              type: 'text',
              text: `You are an accessibility expert. Analyze this image for wheelchair accessibility features relevant to India's Sugamya Bharat initiative. 
              
              Look for and report on:
              1. Wheelchair ramps (presence, condition, angle)
              2. Elevator/lift availability
              3. Door width adequacy
              4. Accessible toilets visible
              5. Accessible parking
              6. Braille signage
              7. Tactile floor paths
              8. Audio systems
              9. Staff assistance indicators
              10. Overall accessibility rating (0-10)
              
              Format: Short bullet points. End with "Overall Score: X/10" and one improvement suggestion.`
            }
          ]
        }]
      })
    });

    const data = await apiRes.json();

    if (data.content && data.content[0]) {
      result.innerHTML = `<div class="ai-result">
        <div style="font-size:0.72rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#CE93D8;margin-bottom:8px">🤖 Claude AI Analysis</div>
        <div style="white-space:pre-line;font-size:0.83rem;color:var(--text-secondary)">${data.content[0].text}</div>
      </div>`;
    } else if (data.error) {
      throw new Error(data.error.message);
    }
  } catch (e) {
    result.innerHTML = `<div class="ai-result" style="border-color:rgba(255,153,51,0.3);background:rgba(255,153,51,0.05)">
      <div style="font-size:0.8rem;color:var(--saffron)">⚠️ AI analysis requires API key configuration. Please analyze manually using the checkboxes above.</div>
    </div>`;
  }

  btn.innerHTML = '🤖 Analyze with AI';
  btn.disabled = false;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function updateSummary() {
  const name = document.getElementById('loc-name').value;
  const city = document.getElementById('loc-city').value;
  const type = document.getElementById('loc-type').options[document.getElementById('loc-type').selectedIndex]?.text || '';
  const lat = document.getElementById('loc-lat').value;
  const lng = document.getElementById('loc-lng').value;
  const checked = FEATURES.filter(f => document.getElementById(`f-${f}`)?.checked).length;
  const score = Math.round((checked / FEATURES.length) * 10);

  document.getElementById('summary-content').innerHTML = `
    <div>📍 <strong>Name:</strong> ${name}</div>
    <div>🏙️ <strong>City:</strong> ${city}</div>
    <div>🏷️ <strong>Type:</strong> ${type}</div>
    <div>🗺️ <strong>Coordinates:</strong> ${lat}, ${lng}</div>
    <div>♿ <strong>Score:</strong> ${score}/10 (${checked}/${FEATURES.length} features)</div>
    <div>📸 <strong>Photos:</strong> ${selectedFiles.length} file(s)</div>
  `;
}

// Form submission
document.getElementById('add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!requireAuth()) return;

  const btn = document.getElementById('submit-btn');
  btn.innerHTML = '<span class="loader"></span> Submitting...';
  btn.disabled = true;

  const scoreBreakdown = {};
  FEATURES.forEach(f => {
    scoreBreakdown[f] = document.getElementById(`f-${f}`)?.checked || false;
  });

  const formData = new FormData();
  formData.append('name', document.getElementById('loc-name').value);
  formData.append('city', document.getElementById('loc-city').value);
  formData.append('address', document.getElementById('loc-address').value);
  formData.append('latitude', document.getElementById('loc-lat').value);
  formData.append('longitude', document.getElementById('loc-lng').value);
  formData.append('accessibilityType', document.getElementById('loc-type').value);
  formData.append('description', document.getElementById('loc-desc').value);
  formData.append('scoreBreakdown', JSON.stringify(scoreBreakdown));
  selectedFiles.forEach(file => formData.append('photos', file));

  try {
    const token = getToken();
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      showToast('✅ Location submitted! Under review.', 'success');
      setTimeout(() => window.location = 'map.html', 1500);
    } else {
      showToast(data.message || 'Submission failed', 'error');
      btn.innerHTML = '🚀 Submit Location Report';
      btn.disabled = false;
    }
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
    btn.innerHTML = '🚀 Submit Location Report';
    btn.disabled = false;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  updateScore();
});
