// ===== AUTH.JS - Global Auth Handler =====

const API_BASE = '/api';

// Show toast notification
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = `${icons[type] || ''} ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Get current user from localStorage
function getCurrentUser() {
  try {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function getToken() {
  return localStorage.getItem('token');
}

function isLoggedIn() {
  return !!getToken();
}

// Save auth data
function saveAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

// Clear auth
function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// Logout
function logout() {
  clearAuth();
  showToast('Logged out successfully', 'info');
  setTimeout(() => window.location = 'index.html', 500);
}

// Fetch with auth
async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}

// Update navbar based on auth state
function updateNavbar() {
  const navAuth = document.getElementById('nav-auth');
  if (!navAuth) return;

  const user = getCurrentUser();

  if (user) {
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
    navAuth.innerHTML = `
      <div class="nav-user" id="nav-user-btn" onclick="toggleUserMenu()">
        <div class="avatar">${initials}</div>
        <span>${user.name?.split(' ')[0] || 'User'}</span>
        ${user.role === 'admin' ? '<span class="role-chip role-admin">Admin</span>' : user.role === 'contributor' ? '<span class="role-chip role-contributor">⭐</span>' : ''}
        <span>▾</span>
      </div>
      <div id="user-menu" style="display:none;position:absolute;top:65px;right:1rem;background:var(--navy-light);border:1px solid var(--border);border-radius:var(--radius);min-width:180px;padding:8px;z-index:9999;box-shadow:var(--shadow-card)">
        <a href="add-location.html" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:var(--text-secondary);text-decoration:none;border-radius:var(--radius-sm);font-size:0.85rem;transition:var(--transition)" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='none'">➕ Add Location</a>
        <a href="verify.html" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:var(--text-secondary);text-decoration:none;border-radius:var(--radius-sm);font-size:0.85rem;transition:var(--transition)" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='none'">✅ My Verifications</a>
        ${user.role === 'admin' ? '<a href="admin.html" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:var(--saffron);text-decoration:none;border-radius:var(--radius-sm);font-size:0.85rem" onmouseover="this.style.background=\'rgba(255,153,51,0.1)\'" onmouseout="this.style.background=\'none\'">⚙️ Admin Panel</a>' : ''}
        <div style="border-top:1px solid var(--border);margin:6px 0"></div>
        <button onclick="logout()" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:var(--not-accessible);background:none;border:none;cursor:pointer;width:100%;border-radius:var(--radius-sm);font-size:0.85rem;font-family:'Mukta',sans-serif" onmouseover="this.style.background='rgba(255,23,68,0.1)'" onmouseout="this.style.background='none'">🚪 Logout</button>
      </div>
    `;
  } else {
    navAuth.innerHTML = `
      <a href="login.html" class="btn btn-secondary btn-sm">Login</a>
      <a href="register.html" class="btn btn-primary btn-sm">Register</a>
    `;
  }
}

function toggleUserMenu() {
  const menu = document.getElementById('user-menu');
  if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// Close menu on outside click
document.addEventListener('click', (e) => {
  const menu = document.getElementById('user-menu');
  const btn = document.getElementById('nav-user-btn');
  if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)) {
    menu.style.display = 'none';
  }
});

// Redirect if not logged in (call on protected pages)
function requireAuth(redirectTo = 'login.html') {
  if (!isLoggedIn()) {
    showToast('Please login to continue', 'info');
    setTimeout(() => window.location = redirectTo, 500);
    return false;
  }
  return true;
}

// Require admin role
function requireAdmin() {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    showToast('Admin access required', 'error');
    setTimeout(() => window.location = 'index.html', 500);
    return false;
  }
  return true;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', updateNavbar);
