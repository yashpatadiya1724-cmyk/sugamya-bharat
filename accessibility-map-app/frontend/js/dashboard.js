// ===== DASHBOARD.JS =====

const TYPE_ICONS = { wheelchair_ramp:'🛤️',accessible_toilet:'🚻',low_floor_bus:'🚌',metro_station:'🚇',elevator:'🛗',accessible_parking:'🅿️',hospital:'🏥',government_office:'🏛️',public_transport:'🚉',other:'📍' };
const TYPE_LABELS = { wheelchair_ramp:'Wheelchair Ramp',accessible_toilet:'Accessible Toilet',low_floor_bus:'Low-Floor Bus',metro_station:'Metro Station',elevator:'Elevator',accessible_parking:'Accessible Parking',hospital:'Hospital',government_office:'Govt. Office',public_transport:'Public Transport',other:'Other' };

let donutChart, barChart;

async function loadDashboard() {
  try {
    const res = await fetch('/api/locations/dashboard');
    const data = await res.json();
    if (data.success) {
      renderStats(data.stats);
      renderCityLeaderboard(data.cityStats || []);
      renderDonut(data.cityStats || []);
      renderTypeStats(data.typeStats || []);
      renderContributors(data.topContributors || []);
      renderRecentLocations(data.recentLocations || []);
      renderBarChart(data.cityStats || []);
    }
  } catch (e) {
    renderDemoData();
  }
}

function renderStats(stats) {
  animateCount('s-total', stats.totalLocations || 0);
  animateCount('s-verified', stats.verifiedLocations || 0);
  animateCount('s-users', stats.totalUsers || 0);
  document.getElementById('s-rate').textContent = (stats.verificationRate || 0) + '%';
  animateCount('s-pending', stats.pendingLocations || 0);
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  let current = 0;
  const step = target / 40;
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.round(current).toLocaleString('en-IN');
    if (current >= target) clearInterval(timer);
  }, 40);
}

function renderCityLeaderboard(cities) {
  const el = document.getElementById('city-leaderboard');
  if (!cities.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">No city data yet.</p>'; return; }

  const colors = ['#FFD700','#C0C0C0','#CD7F32','#FF9933','#1E88E5','#138808','#42A5F5','#69F0AE','#FF7043','#AB47BC'];
  el.innerHTML = cities.slice(0,10).map((c, i) => {
    const pct = c.accessibilityPercent || Math.round((c.fullyAccessible / c.total) * 100) || 0;
    const rankLabels = ['🥇','🥈','🥉'];
    return `
      <div class="city-item">
        <div style="font-size:1rem;width:24px;text-align:center">${rankLabels[i] || (i+1)}</div>
        <div class="city-name">${c.city}</div>
        <div class="city-progress">
          <div class="city-fill" style="width:0%;background:${colors[i]}" data-target="${pct}"></div>
        </div>
        <div class="city-pct" style="color:${colors[i]}">${pct}%</div>
        <div style="font-size:0.7rem;color:var(--text-muted);min-width:40px">${c.total} locs</div>
      </div>
    `;
  }).join('');

  // Animate after render
  setTimeout(() => {
    document.querySelectorAll('.city-fill').forEach(el => {
      el.style.width = el.dataset.target + '%';
    });
  }, 100);
}

function renderDonut(cities) {
  let fully = 0, partial = 0, none = 0;
  cities.forEach(c => { fully += c.fullyAccessible || 0; partial += c.partiallyAccessible || 0; none += c.notAccessible || 0; });
  if (!fully && !partial && !none) { fully = 45; partial = 35; none = 20; } // Demo

  const ctx = document.getElementById('donut-chart').getContext('2d');
  if (donutChart) donutChart.destroy();
  donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Fully Accessible', 'Partially Accessible', 'Not Accessible'],
      datasets: [{
        data: [fully, partial, none],
        backgroundColor: ['#00C853', '#FFD600', '#FF1744'],
        borderColor: ['#00C853', '#FFD600', '#FF1744'],
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10,22,40,0.95)',
          titleColor: '#F0F4FF',
          bodyColor: '#9AAAC8',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1
        }
      }
    }
  });
}

function renderBarChart(cities) {
  const ctx = document.getElementById('bar-chart').getContext('2d');
  if (barChart) barChart.destroy();
  const top8 = cities.slice(0, 8);
  if (!top8.length) return;

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top8.map(c => c.city),
      datasets: [{
        label: 'Avg Accessibility Score',
        data: top8.map(c => c.avgScore || 0),
        backgroundColor: top8.map((_, i) => `hsl(${20 + i*15}, 90%, 55%)`),
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: '#9AAAC8', font: { family: 'Mukta' } }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#9AAAC8' }, grid: { color: 'rgba(255,255,255,0.04)' }, min: 0, max: 10 }
      },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: 'rgba(10,22,40,0.95)', titleColor: '#F0F4FF', bodyColor: '#9AAAC8', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }
      }
    }
  });
}

function renderTypeStats(types) {
  const el = document.getElementById('type-stats');
  if (!types.length) { el.innerHTML = '<p style="color:var(--text-muted)">No data yet.</p>'; return; }
  const max = Math.max(...types.map(t => t.count));
  el.innerHTML = types.map(t => `
    <div class="type-stat">
      <span>${TYPE_ICONS[t._id] || '📍'} ${TYPE_LABELS[t._id] || t._id}</span>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:80px;height:6px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden">
          <div style="height:100%;background:var(--saffron);border-radius:3px;width:${(t.count/max)*100}%"></div>
        </div>
        <span style="color:var(--saffron);font-weight:700;min-width:24px;text-align:right">${t.count}</span>
      </div>
    </div>
  `).join('');
}

function renderContributors(contributors) {
  const el = document.getElementById('top-contributors');
  if (!contributors.length) { el.innerHTML = '<p style="color:var(--text-muted)">No contributors yet.</p>'; return; }
  el.innerHTML = contributors.map((u, i) => {
    const initials = u.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    const roleIcons = { admin:'⚙️', contributor:'⭐', user:'👤' };
    return `
      <div class="contribution-item">
        <div style="font-family:'Baloo 2',sans-serif;font-weight:800;font-size:0.9rem;width:20px;color:${i===0?'#FFD700':i===1?'#C0C0C0':i===2?'#CD7F32':'var(--text-muted)'}">${i+1}</div>
        <div class="contribution-avatar">${initials}</div>
        <div style="flex:1">
          <div style="font-size:0.88rem;font-weight:600">${u.name} ${roleIcons[u.role]||''}</div>
          <div style="font-size:0.72rem;color:var(--text-muted)">${u.city || 'India'} · ${u.contributionsCount} locations</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:'Baloo 2',sans-serif;font-size:1rem;font-weight:800;color:var(--saffron)">${u.contributionsCount}</div>
          <div style="font-size:0.65rem;color:var(--text-muted)">contributions</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderRecentLocations(locations) {
  const el = document.getElementById('recent-locations');
  if (!locations.length) { el.innerHTML = '<p style="color:var(--text-muted)">No locations yet.</p>'; return; }
  const statusColors = { fully_accessible:'#00C853',partially_accessible:'#FFD600',not_accessible:'#FF1744' };
  el.innerHTML = locations.map(loc => `
    <div class="recent-item">
      <div style="width:40px;height:40px;border-radius:50%;background:${statusColors[loc.accessibilityStatus] || '#9AAAC8'}22;border:2px solid ${statusColors[loc.accessibilityStatus]||'#9AAAC8'};display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">${TYPE_ICONS[loc.accessibilityType]||'📍'}</div>
      <div style="flex:1">
        <div style="font-size:0.88rem;font-weight:600;margin-bottom:2px">${loc.name}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">📍 ${loc.city} · ${new Date(loc.createdAt).toLocaleDateString('en-IN')}</div>
      </div>
      <div style="text-align:right">
        <div style="font-family:'Baloo 2',sans-serif;font-size:1rem;font-weight:800;color:${statusColors[loc.accessibilityStatus]||'#9AAAC8'}">${loc.accessibilityScore}/10</div>
        ${loc.verified ? '<div style="font-size:0.65rem;color:var(--blue-light)">✅ Verified</div>' : ''}
      </div>
    </div>
  `).join('');
}

function renderDemoData() {
  const demoStats = { totalLocations: 1240, verifiedLocations: 840, totalUsers: 4500, verificationRate: 68, pendingLocations: 156 };
  renderStats(demoStats);

  const demoCities = [
    { city:'Bangalore',fullyAccessible:38,partiallyAccessible:20,notAccessible:8,total:66,avgScore:8.1,accessibilityPercent:58},
    { city:'Ahmedabad',fullyAccessible:42,partiallyAccessible:28,notAccessible:12,total:82,avgScore:7.9,accessibilityPercent:51},
    { city:'Mumbai',fullyAccessible:35,partiallyAccessible:32,notAccessible:18,total:85,avgScore:7.2,accessibilityPercent:41},
    { city:'Hyderabad',fullyAccessible:29,partiallyAccessible:21,notAccessible:10,total:60,avgScore:7.0,accessibilityPercent:48},
    { city:'New Delhi',fullyAccessible:25,partiallyAccessible:30,notAccessible:20,total:75,avgScore:6.5,accessibilityPercent:33},
    { city:'Chennai',fullyAccessible:20,partiallyAccessible:25,notAccessible:15,total:60,avgScore:6.2,accessibilityPercent:33},
    { city:'Pune',fullyAccessible:18,partiallyAccessible:20,notAccessible:12,total:50,avgScore:5.8,accessibilityPercent:36},
    { city:'Kolkata',fullyAccessible:15,partiallyAccessible:22,notAccessible:18,total:55,avgScore:5.0,accessibilityPercent:27},
  ];
  renderCityLeaderboard(demoCities);
  renderDonut(demoCities);
  renderBarChart(demoCities);

  const demoTypes = [
    {_id:'metro_station',count:320},{_id:'hospital',count:210},{_id:'wheelchair_ramp',count:180},
    {_id:'public_transport',count:160},{_id:'elevator',count:140},{_id:'accessible_toilet',count:120},
    {_id:'government_office',count:80},{_id:'accessible_parking',count:70},{_id:'low_floor_bus',count:60}
  ];
  renderTypeStats(demoTypes);

  const demoContributors = [
    {name:'Priya Sharma',city:'Bangalore',role:'contributor',contributionsCount:142},
    {name:'Rahul Gupta',city:'Mumbai',role:'contributor',contributionsCount:98},
    {name:'Anjali Singh',city:'New Delhi',role:'contributor',contributionsCount:87},
    {name:'Mohammed Ali',city:'Hyderabad',role:'user',contributionsCount:64},
    {name:'Kavitha Nair',city:'Chennai',role:'user',contributionsCount:52},
  ];
  renderContributors(demoContributors);

  const demoRecent = [
    {name:'Indiranagar Metro',city:'Bangalore',accessibilityType:'metro_station',accessibilityStatus:'fully_accessible',accessibilityScore:9,verified:true,createdAt:new Date()},
    {name:'Saifabad Hospital',city:'Hyderabad',accessibilityType:'hospital',accessibilityStatus:'fully_accessible',accessibilityScore:8,verified:true,createdAt:new Date()},
    {name:'Andheri Bus Stop',city:'Mumbai',accessibilityType:'low_floor_bus',accessibilityStatus:'partially_accessible',accessibilityScore:5,verified:false,createdAt:new Date()},
  ];
  renderRecentLocations(demoRecent);
}

document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  loadDashboard();
});
