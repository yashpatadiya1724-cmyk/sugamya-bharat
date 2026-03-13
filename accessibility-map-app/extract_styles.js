const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/index.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Fix backdrop filter by adding -webkit- prefix before it
html = html.replace(/backdrop-filter:\s*blur\(10px\);/g, '-webkit-backdrop-filter: blur(10px);\n      backdrop-filter: blur(10px);');
html = html.replace(/backdrop-filter:\s*blur\(8px\);/g, '-webkit-backdrop-filter: blur(8px);\n      backdrop-filter: blur(8px);');

// 2. Add new CSS block just before </style>
const newStyles = `
    /* Extracted Inline Styles */
    .stat-icon { font-size: 1.5rem; }
    .stat-value { font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 1.1rem; }
    .stat-saffron { color: var(--saffron); }
    .stat-green { color: var(--green-light); }
    .stat-blue { color: var(--blue-light); }
    .stat-label { font-size: 0.72rem; color: var(--text-muted); }
    .mission-container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
    .mb-5rem { margin-bottom: 5rem; }
    .text-saffron { color: var(--saffron); }
    .feature-icon-saffron { background: rgba(255,153,51,0.1); }
    .feature-icon-green { background: rgba(19,136,8,0.1); }
    .feature-icon-blue { background: rgba(30,136,229,0.1); }
    .feature-icon-yellow { background: rgba(255,215,0,0.1); }
    .feature-icon-red { background: rgba(255,23,68,0.1); }
    .feature-icon-purple { background: rgba(138,43,226,0.1); }
    .vikshit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; position: relative; z-index: 1; }
    .mb-1rem { margin-bottom: 1rem; }
    .vikshit-heading { font-size: clamp(1.6rem, 2.5vw, 2.2rem); font-weight: 800; margin-bottom: 1.2rem; }
    .vikshit-p1 { color: var(--text-secondary); line-height: 1.8; margin-bottom: 1.5rem; font-size: 0.95rem; }
    .vikshit-p2 { color: var(--text-secondary); line-height: 1.8; font-size: 0.95rem; }
    .vikshit-actions { margin-top: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap; }
    .cta-icon { font-size: 3rem; margin-bottom: 1rem; }
    .cta-heading { font-size: 2rem; font-weight: 800; margin-bottom: 1rem; }
    .cta-p { color: var(--text-secondary); max-width: 500px; margin: 0 auto 2rem; line-height: 1.7; }
    .cta-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .mt-1rem { margin-top: 1rem; }
    .w-120px { width: 120px; }
`;
html = html.replace('  </style>', newStyles + '  </style>');

// 3. Replace inline styles in HTML
const replacements = {
  '<span style="font-size:1.5rem">': '<span class="stat-icon">',
  '<div style="font-family:\\\'Baloo 2\\\',sans-serif;font-weight:800;font-size:1.1rem;color:var(--saffron)"': '<div class="stat-value stat-saffron"',
  '<div style="font-size:0.72rem;color:var(--text-muted)">': '<div class="stat-label">',
  '<div style="font-family:\\\'Baloo 2\\\',sans-serif;font-weight:800;font-size:1.1rem;color:var(--green-light)"': '<div class="stat-value stat-green"',
  '<div style="font-family:\\\'Baloo 2\\\',sans-serif;font-weight:800;font-size:1.1rem;color:var(--blue-light)"': '<div class="stat-value stat-blue"',
  '<div style="max-width:1200px;margin:0 auto;padding:0 2rem">': '<div class="mission-container">',
  '<div class="tricolor-bar" style="margin-bottom:5rem">': '<div class="tricolor-bar mb-5rem">',
  '<span style="color:var(--saffron)">': '<span class="text-saffron">',
  '<div class="feature-icon" style="background:rgba(255,153,51,0.1)">': '<div class="feature-icon feature-icon-saffron">',
  '<div class="feature-icon" style="background:rgba(19,136,8,0.1)">': '<div class="feature-icon feature-icon-green">',
  '<div class="feature-icon" style="background:rgba(30,136,229,0.1)">': '<div class="feature-icon feature-icon-blue">',
  '<div class="feature-icon" style="background:rgba(255,215,0,0.1)">': '<div class="feature-icon feature-icon-yellow">',
  '<div class="feature-icon" style="background:rgba(255,23,68,0.1)">': '<div class="feature-icon feature-icon-red">',
  '<div class="feature-icon" style="background:rgba(138,43,226,0.1)">': '<div class="feature-icon feature-icon-purple">',
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center;position:relative;z-index:1">': '<div class="vikshit-grid">',
  '<div class="section-tag" style="margin-bottom:1rem">': '<div class="section-tag mb-1rem">',
  '<h2 style="font-size:clamp(1.6rem,2.5vw,2.2rem);font-weight:800;margin-bottom:1.2rem">': '<h2 class="vikshit-heading">',
  '<p style="color:var(--text-secondary);line-height:1.8;margin-bottom:1.5rem;font-size:0.95rem">': '<p class="vikshit-p1">',
  '<p style="color:var(--text-secondary);line-height:1.8;font-size:0.95rem">': '<p class="vikshit-p2">',
  '<strong style="color:var(--saffron)">': '<strong class="text-saffron">',
  '<div style="margin-top:1.5rem;display:flex;gap:1rem;flex-wrap:wrap">': '<div class="vikshit-actions">',
  '<div style="font-size:3rem;margin-bottom:1rem">': '<div class="cta-icon">',
  '<h2 style="font-size:2rem;font-weight:800;margin-bottom:1rem">': '<h2 class="cta-heading">',
  '<p style="color:var(--text-secondary);max-width:500px;margin:0 auto 2rem;line-height:1.7">': '<p class="cta-p">',
  '<div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">': '<div class="cta-actions">',
  '<div style="margin-top:1rem">': '<div class="mt-1rem">',
  '<div class="tricolor-bar" style="width:120px">': '<div class="tricolor-bar w-120px">'
};

for (const [key, val] of Object.entries(replacements)) {
  html = html.split(key.replace(/\\\\'/g, "\\'")).join(val);
}

fs.writeFileSync(filePath, html);
console.log('Styles extracted successfully!');
