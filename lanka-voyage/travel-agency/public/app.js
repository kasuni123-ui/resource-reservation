'use strict';
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, props = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  kids.flat().forEach(c => { if (c != null && c !== false) e.append(c); });
  return e;
};
const money = n => '$' + Number(n).toLocaleString('en-US');
const tomorrow = () => new Date(Date.now() + 864e5).toISOString().slice(0, 10);

let user = null, cat = '', mode = 'login', toastTimer;

async function api(path, opt = {}) {
  const res = await fetch('/api' + path, {
    method: opt.method || 'GET',
    headers: opt.body ? { 'Content-Type': 'application/json' } : {},
    body: opt.body ? JSON.stringify(opt.body) : undefined,
    credentials: 'same-origin'
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* empty body */ }
  if (!res.ok) throw new Error((data && data.error) || 'Something went wrong. Please try again.');
  return data;
}

function toast(msg, isError) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'show' + (isError ? ' bad' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = ''; }, 3800);
}

/* ---------- Packages ---------- */
function card(p) {
  const a = el('article', { class: 'card' },
    el('div', { class: 'ban', 'aria-hidden': 'true' }, p.icon),
    el('div', { class: 'cb' },
      el('h3', {}, p.title),
      el('p', { class: 'meta' }, p.days + ' days in ' + p.destination),
      el('p', { class: 'sum' }, p.summary),
      el('div', { class: 'row' },
        el('strong', {}, 'From ' + money(p.price) + ' each'),
        el('span', { class: 'rate', 'aria-label': 'Rated ' + p.rating + ' out of 5' }, '★ ' + p.rating)),
      el('button', { class: 'btn ghost', onclick: () => openPackage(p.slug) }, 'View trip')));
  a.style.setProperty('--h', String(Number(p.hue) || 200));
  return a;
}

async function loadPackages() {
  const grid = $('#grid');
  const params = new URLSearchParams();
  const q = $('#q').value.trim(), mp = $('#maxPrice').value;
  if (q) params.set('q', q);
  if (cat) params.set('category', cat);
  if (mp) params.set('maxPrice', mp);
  params.set('sort', $('#sort').value);
  grid.setAttribute('aria-busy', 'true');
  try {
    const list = await api('/packages?' + params);
    grid.replaceChildren(...(list.length ? list.map(card)
      : [el('p', { class: 'empty' }, 'No trips match yet. Try another place or a higher budget.')]));
  } catch (e) {
    grid.replaceChildren(el('p', { class: 'empty' }, e.message));
  }
  grid.removeAttribute('aria-busy');
}

async function openPackage(slug) {
  try {
    const p = await api('/packages/' + encodeURIComponent(slug));
    const d = $('#pkgDlg');
    const date = el('input', { type: 'date', required: '', min: tomorrow() });
    const num = el('input', { type: 'number', min: '1', max: '20', value: '2', required: '' });
    const total = el('output', {}, money(p.price * 2));
    num.addEventListener('input', () => {
      const n = Math.min(20, Math.max(1, parseInt(num.value, 10) || 1));
      total.textContent = money(p.price * n);
    });
    const form = el('form', { class: 'form' },
      el('label', {}, 'Travel date', date),
      el('label', {}, 'Travellers', num),
      el('p', { class: 'tot' }, 'Total: ', total),
      el('button', { class: 'btn' }, user ? 'Confirm booking' : 'Log in to book'));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!user) { d.close(); openAuth(); return; }
      try {
        await api('/bookings', { method: 'POST', body: { slug: p.slug, date: date.value, travellers: parseInt(num.value, 10) } });
        d.close();
        toast('Booking received. Find it under My bookings.');
      } catch (err) { toast(err.message, true); }
    });
    d.replaceChildren(
      el('button', { class: 'x', 'data-close': '', 'aria-label': 'Close' }, '×'),
      el('h2', {}, p.title),
      el('p', { class: 'meta' }, p.days + ' days in ' + p.destination),
      el('p', {}, p.summary),
      el('h3', {}, 'Day by day'),
      el('ol', {}, p.itinerary.map(i => el('li', {}, i))),
      el('h3', {}, 'Included'),
      el('ul', {}, p.includes.map(i => el('li', {}, i))),
      el('h3', {}, 'Book this trip'),
      form);
    d.showModal();
  } catch (e) { toast(e.message, true); }
}

/* ---------- Auth ---------- */
function setMode(m) {
  mode = m;
  const login = m === 'login';
  $('#nameRow').hidden = login;
  $('#name').required = !login;
  $('#authTitle').textContent = login ? 'Log in' : 'Create account';
  $('#authSubmit').textContent = login ? 'Log in' : 'Create account';
  $('#authSwitch').textContent = login ? 'New here? Create an account' : 'Have an account? Log in';
  $('#password').autocomplete = login ? 'current-password' : 'new-password';
  $('#authErr').textContent = '';
}
function openAuth() { setMode('login'); $('#authDlg').showModal(); }
function syncAuth() {
  $('#authBtn').textContent = user ? 'Log out' : 'Log in';
  $('#bookingsBtn').hidden = !user;
}

$('#authSwitch').addEventListener('click', () => setMode(mode === 'login' ? 'register' : 'login'));
$('#authForm').addEventListener('submit', async e => {
  e.preventDefault();
  const body = { email: $('#email').value, password: $('#password').value };
  if (mode === 'register') body.name = $('#name').value;
  try {
    user = await api('/auth/' + mode, { method: 'POST', body });
    $('#authDlg').close();
    $('#authForm').reset();
    syncAuth();
    toast('Welcome, ' + user.name + '.');
  } catch (err) { $('#authErr').textContent = err.message; }
});
$('#authBtn').addEventListener('click', async () => {
  if (!user) return openAuth();
  try { await api('/auth/logout', { method: 'POST' }); } catch (e) { /* ignore */ }
  user = null; syncAuth(); toast('You are logged out.');
});

/* ---------- Bookings ---------- */
$('#bookingsBtn').addEventListener('click', async () => {
  const box = $('#bkList');
  try {
    const list = await api('/bookings/me');
    box.replaceChildren(...(list.length ? list.map(b => el('div', { class: 'bk' },
      el('strong', {}, b.title),
      el('p', { class: 'meta' }, new Date(b.date).toLocaleDateString('en-GB', { dateStyle: 'long' }) + ', ' + b.travellers + ' travellers'),
      el('p', {}, 'Total ' + money(b.total) + ', status: ' + b.status)))
      : [el('p', {}, 'No bookings yet. Pick a trip to get started.')]));
    $('#bkDlg').showModal();
  } catch (e) { toast(e.message, true); }
});

/* ---------- Forms and page behaviour ---------- */
$('#inqForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await api('/inquiries', { method: 'POST', body: { name: $('#iName').value, email: $('#iEmail').value, message: $('#iMsg').value } });
    e.target.reset();
    toast('Thanks. We will reply with a plan soon.');
  } catch (err) { toast(err.message, true); }
});

$('#searchForm').addEventListener('submit', e => {
  e.preventDefault();
  loadPackages();
  $('#packages').scrollIntoView();
});
$('#maxPrice').addEventListener('change', loadPackages);
$('#sort').addEventListener('change', loadPackages);
$('#chips').addEventListener('click', e => {
  const b = e.target.closest('button[data-cat]');
  if (!b) return;
  cat = b.dataset.cat;
  document.querySelectorAll('#chips button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  loadPackages();
});

document.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) e.target.closest('dialog').close();
  else if (e.target.tagName === 'DIALOG') e.target.close();
  if (e.target.closest('#nav a')) { $('#nav').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false'); }
});
$('#menuBtn').addEventListener('click', () => {
  const open = $('#nav').classList.toggle('open');
  $('#menuBtn').setAttribute('aria-expanded', String(open));
});
const onScroll = () => $('#top').classList.toggle('solid', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

api('/auth/me').then(u => { user = u; syncAuth(); }).catch(() => {});
loadPackages();
